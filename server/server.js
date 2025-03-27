const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import database connection
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Simple routes for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Pet Shop API' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});