const jwt = require('jsonwebtoken');
const { pool } = require('../database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Verify user still exists
    const result = await pool.query(
      'SELECT id, email, encryption_key FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = {
      id: decoded.userId,
      email: result.rows[0].email,
      encryptionKey: result.rows[0].encryption_key
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };