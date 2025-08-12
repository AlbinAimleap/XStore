const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'xstore_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'xstore_db',
  password: process.env.DB_PASSWORD || 'xstore_password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Initialize database schema
const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        encryption_key VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create folders table with hierarchy support
    await client.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, parent_id, user_id)
      )
    `);

    // Create items table for storing encrypted content
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'secret', 'api_key', 'code', 'file')),
        encrypted_content TEXT,
        file_path VARCHAR(500),
        file_size BIGINT DEFAULT 0,
        language VARCHAR(50),
        tags TEXT[],
        folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMP,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create item versions table for version history
    await client.query(`
      CREATE TABLE IF NOT EXISTS item_versions (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        encrypted_content TEXT,
        version_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_folder_id ON items(folder_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_access_count ON items(access_count DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING GIN(tags);
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };