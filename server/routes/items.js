const express = require('express');
const { pool } = require('../database');

const router = express.Router();

// Get all items for user
router.get('/', async (req, res) => {
  try {
    const { folder_id, type, search, tags } = req.query;
    
    let query = `
      SELECT i.*, f.name as folder_name
      FROM items i
      JOIN folders f ON i.folder_id = f.id
      WHERE i.user_id = $1
    `;
    let params = [req.user.id];
    let paramIndex = 2;

    if (folder_id) {
      query += ` AND i.folder_id = $${paramIndex}`;
      params.push(folder_id);
      paramIndex++;
    }

    if (type) {
      query += ` AND i.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (i.name ILIKE $${paramIndex} OR i.encrypted_content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      query += ` AND i.tags && $${paramIndex}`;
      params.push(tagsArray);
      paramIndex++;
    }

    query += ' ORDER BY i.updated_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get frequently used items
router.get('/frequent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, f.name as folder_name
       FROM items i
       JOIN folders f ON i.folder_id = f.id
       WHERE i.user_id = $1 AND (i.access_count > 0 OR i.is_pinned = true)
       ORDER BY i.is_pinned DESC, i.access_count DESC, i.last_accessed DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching frequent items:', error);
    res.status(500).json({ error: 'Failed to fetch frequent items' });
  }
});

// Get single item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT i.*, f.name as folder_name
       FROM items i
       JOIN folders f ON i.folder_id = f.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Increment access count and update last accessed
    await pool.query(
      'UPDATE items SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/', async (req, res) => {
  const { name, type, encryptedContent, folderId, language, tags } = req.body;

  if (!name || !type || !folderId) {
    return res.status(400).json({ error: 'Name, type, and folder ID are required' });
  }

  const validTypes = ['text', 'secret', 'api_key', 'code', 'file'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid item type' });
  }

  try {
    // Verify folder ownership
    const folderCheck = await pool.query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, req.user.id]
    );

    if (folderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const result = await pool.query(
      `INSERT INTO items (name, type, encrypted_content, folder_id, user_id, language, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, encryptedContent, folderId, req.user.id, language, tags || []]
    );

    // Create initial version
    await pool.query(
      'INSERT INTO item_versions (item_id, encrypted_content, version_number) VALUES ($1, $2, 1)',
      [result.rows[0].id, encryptedContent]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, encryptedContent, folderId, language, tags } = req.body;

  try {
    // Check item ownership
    const itemCheck = await pool.query(
      'SELECT id, encrypted_content FROM items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // If folder is being changed, verify new folder ownership
    if (folderId) {
      const folderCheck = await pool.query(
        'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
        [folderId, req.user.id]
      );

      if (folderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Target folder not found' });
      }
    }

    // Get current version number
    const versionResult = await pool.query(
      'SELECT MAX(version_number) as max_version FROM item_versions WHERE item_id = $1',
      [id]
    );

    const nextVersion = (versionResult.rows[0].max_version || 0) + 1;

    // Update item
    const result = await pool.query(
      `UPDATE items SET 
        name = COALESCE($1, name),
        encrypted_content = COALESCE($2, encrypted_content),
        folder_id = COALESCE($3, folder_id),
        language = COALESCE($4, language),
        tags = COALESCE($5, tags),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, encryptedContent, folderId, language, tags, id, req.user.id]
    );

    // Create new version if content changed
    if (encryptedContent && encryptedContent !== itemCheck.rows[0].encrypted_content) {
      await pool.query(
        'INSERT INTO item_versions (item_id, encrypted_content, version_number) VALUES ($1, $2, $3)',
        [id, encryptedContent, nextVersion]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Toggle pin status
router.put('/:id/pin', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE items SET is_pinned = NOT is_pinned WHERE id = $1 AND user_id = $2 RETURNING is_pinned',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ pinned: result.rows[0].is_pinned });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

// Get item versions
router.get('/:id/versions', async (req, res) => {
  const { id } = req.params;

  try {
    // Verify item ownership
    const itemCheck = await pool.query(
      'SELECT id FROM items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = await pool.query(
      'SELECT * FROM item_versions WHERE item_id = $1 ORDER BY version_number DESC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;