const express = require('express');
const { pool } = require('../database');

const router = express.Router();

// Get all folders for user (with hierarchy)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, parent_id, created_at, updated_at FROM folders WHERE user_id = $1 ORDER BY name',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create new folder
router.post('/', async (req, res) => {
  const { name, parentId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    // Check if parent exists (if provided)
    if (parentId) {
      const parentCheck = await pool.query(
        'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
        [parentId, req.user.id]
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }

    // Check for duplicate names in same parent
    const duplicateCheck = await pool.query(
      'SELECT id FROM folders WHERE name = $1 AND parent_id = $2 AND user_id = $3',
      [name, parentId || null, req.user.id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Folder with this name already exists in the same location' });
    }

    const result = await pool.query(
      'INSERT INTO folders (name, parent_id, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, parentId || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, parentId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    // Check folder ownership
    const folderCheck = await pool.query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (folderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check for duplicate names in same parent (excluding current folder)
    const duplicateCheck = await pool.query(
      'SELECT id FROM folders WHERE name = $1 AND parent_id = $2 AND user_id = $3 AND id != $4',
      [name, parentId || null, req.user.id, id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Folder with this name already exists in the same location' });
    }

    const result = await pool.query(
      'UPDATE folders SET name = $1, parent_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, parentId || null, id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check folder ownership and ensure it's not the root folder
    const folderCheck = await pool.query(
      'SELECT id, name FROM folders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (folderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (folderCheck.rows[0].name === 'Root') {
      return res.status(403).json({ error: 'Cannot delete root folder' });
    }

    // Delete folder (cascade will handle subfolders and items)
    await pool.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

module.exports = router;