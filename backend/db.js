const mysql = require('mysql2/promise');
const path = require('path');

// Load .env for local development (safe to omit in production)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Use environment variables for DB connection configuration.
// For local development, copy backend/.env.example to backend/.env and set your values.

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cyber_incidents',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
