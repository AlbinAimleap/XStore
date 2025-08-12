const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types but sanitize
    const allowedMimes = [
      'text/', 'application/', 'image/', 'audio/', 'video/',
      'font/', 'model/', 'message/'
    ];
    
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime));
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folderId, encrypt } = req.body;

    // Verify folder ownership
    const folderCheck = await pool.query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, req.user.id]
    );

    if (folderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    let filePath = req.file.path;
    let encryptedContent = null;

    // Encrypt file if requested
    if (encrypt === 'true') {
      const fileBuffer = await fs.readFile(req.file.path);
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, req.user.encryptionKey);
      
      const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      // Store encrypted file
      const encryptedBuffer = Buffer.concat([iv, authTag, encrypted]);
      await fs.writeFile(req.file.path, encryptedBuffer);
      
      encryptedContent = 'encrypted';
    }

    // Create item record
    const result = await pool.query(
      `INSERT INTO items (name, type, encrypted_content, file_path, file_size, folder_id, user_id)
       VALUES ($1, 'file', $2, $3, $4, $5, $6) RETURNING *`,
      [req.file.originalname, encryptedContent, filePath, req.file.size, folderId, req.user.id]
    );

    res.status(201).json({
      ...result.rows[0],
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/download/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get file item
    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2 AND type = \'file\'',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const item = result.rows[0];

    if (!item.file_path || !await fs.access(item.file_path).then(() => true).catch(() => false)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Read file
    let fileBuffer = await fs.readFile(item.file_path);

    // Decrypt if necessary
    if (item.encrypted_content === 'encrypted') {
      try {
        const iv = fileBuffer.slice(0, 16);
        const authTag = fileBuffer.slice(16, 32);
        const encrypted = fileBuffer.slice(32);

        const decipher = crypto.createDecipher('aes-256-gcm', req.user.encryptionKey);
        decipher.setAuthTag(authTag);

        fileBuffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        return res.status(500).json({ error: 'Failed to decrypt file' });
      }
    }

    // Update access count
    await pool.query(
      'UPDATE items SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${item.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);

    res.send(fileBuffer);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get file item
    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2 AND type = \'file\'',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const item = result.rows[0];

    // Delete file from disk
    if (item.file_path) {
      try {
        await fs.unlink(item.file_path);
      } catch (fileError) {
        console.error('Error deleting file from disk:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;