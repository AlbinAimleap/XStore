-- Initialize database on first run
CREATE DATABASE xstore_db;
\c xstore_db;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';