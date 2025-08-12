const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../database');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and generate encryption key
    const passwordHash = await bcrypt.hash(password, 12);
    const encryptionKey = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, encryption_key) VALUES ($1, $2, $3) RETURNING id, email',
      [email.toLowerCase(), passwordHash, encryptionKey]
    );

    const user = result.rows[0];

    // Create root folder for user
    await pool.query(
      'INSERT INTO folders (name, parent_id, user_id) VALUES ($1, NULL, $2)',
      ['Root', user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email },
      token,
      encryptionKey
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, encryption_key FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email },
      token,
      encryptionKey: user.encryption_key
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Get user details
    const result = await pool.query(
      'SELECT id, email, encryption_key FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    res.json({
      valid: true,
      user: { id: user.id, email: user.email },
      encryptionKey: user.encryption_key
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

module.exports = router;