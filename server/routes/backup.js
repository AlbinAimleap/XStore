const express = require('express');
const crypto = require('crypto');
const { pool } = require('../database');
const fs = require('fs').promises;

const router = express.Router();

// Export user data as encrypted JSON
router.get('/export', async (req, res) => {
  try {
    const client = await pool.connect();

    // Get all user data
    const [folders, items] = await Promise.all([
      client.query('SELECT * FROM folders WHERE user_id = $1 ORDER BY id', [req.user.id]),
      client.query('SELECT * FROM items WHERE user_id = $1 ORDER BY id', [req.user.id])
    ]);

    // Create backup structure
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      user: {
        email: req.user.email
      },
      folders: folders.rows,
      items: items.rows.map(item => ({
        ...item,
        // Don't include file paths in backup for security
        file_path: item.type === 'file' ? '[FILE_DATA_NOT_INCLUDED]' : item.file_path
      }))
    };

    // Encrypt backup data
    const backupJson = JSON.stringify(backupData, null, 2);
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, req.user.encryptionKey);

    const encrypted = Buffer.concat([
      cipher.update(backupJson, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();
    const encryptedBackup = Buffer.concat([iv, authTag, encrypted]).toString('base64');

    client.release();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="xstore-backup-${Date.now()}.json"`);

    res.json({
      version: '1.0.0',
      encrypted: true,
      data: encryptedBackup
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Import user data from encrypted JSON
router.post('/import', async (req, res) => {
  try {
    const { backupData, clearExisting } = req.body;

    if (!backupData || !backupData.data) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }

    // Decrypt backup data
    const encryptedBuffer = Buffer.from(backupData.data, 'base64');
    const iv = encryptedBuffer.slice(0, 16);
    const authTag = encryptedBuffer.slice(16, 32);
    const encrypted = encryptedBuffer.slice(32);

    const decipher = crypto.createDecipher('aes-256-gcm', req.user.encryptionKey);
    decipher.setAuthTag(authTag);

    const decryptedData = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');

    const backup = JSON.parse(decryptedData);

    // Validate backup structure
    if (!backup.folders || !backup.items) {
      return res.status(400).json({ error: 'Invalid backup structure' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Clear existing data if requested
      if (clearExisting) {
        await client.query('DELETE FROM items WHERE user_id = $1', [req.user.id]);
        await client.query('DELETE FROM folders WHERE user_id = $1', [req.user.id]);
      }

      // Create folder mapping for ID translation
      const folderMapping = new Map();
      
      // Import folders (preserve hierarchy)
      for (const folder of backup.folders) {
        if (folder.name === 'Root' && !clearExisting) {
          // Skip root folder if not clearing existing data
          const existingRoot = await client.query(
            'SELECT id FROM folders WHERE name = $1 AND parent_id IS NULL AND user_id = $2',
            ['Root', req.user.id]
          );
          if (existingRoot.rows.length > 0) {
            folderMapping.set(folder.id, existingRoot.rows[0].id);
            continue;
          }
        }

        const parentId = folder.parent_id ? folderMapping.get(folder.parent_id) : null;
        
        const result = await client.query(
          'INSERT INTO folders (name, parent_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
          [folder.name, parentId, req.user.id]
        );

        if (result.rows.length > 0) {
          folderMapping.set(folder.id, result.rows[0].id);
        }
      }

      // Import items
      let importedItems = 0;
      for (const item of backup.items) {
        if (item.type === 'file') {
          // Skip file items as we don't restore actual files
          continue;
        }

        const newFolderId = folderMapping.get(item.folder_id);
        if (!newFolderId) {
          continue; // Skip if folder mapping not found
        }

        await client.query(
          `INSERT INTO items (name, type, encrypted_content, folder_id, user_id, language, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.name, item.type, item.encrypted_content, newFolderId, req.user.id, item.language, item.tags || []]
        );

        importedItems++;
      }

      await client.query('COMMIT');

      res.json({
        message: 'Data imported successfully',
        imported: {
          folders: backup.folders.length,
          items: importedItems
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

module.exports = router;