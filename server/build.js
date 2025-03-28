const { execSync, spawnSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize database connection
async function initializeDatabase() {
  console.log('Checking database connection...');
  try {
    const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    // Push schema to database
    console.log('Pushing database schema...');
    try {
      execSync('npx drizzle-kit push', { stdio: 'inherit' });
      console.log('Schema pushed successfully');
    } catch (error) {
      console.error('Error pushing schema:', error);
      // Continue anyway, as tables might already exist
    }
    
    await pool.end();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    console.log('Starting server without database connection...');
  }
}

// Start the server
async function startServer() {
  await initializeDatabase();

  const app = express();
  const port = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Pet Shop API' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
    });
  });

  // 404 middleware
  app.use((req, res) => {
    res.status(404).json({
      error: true,
      message: 'Not Found',
    });
  });

  // Start server
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Run the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});