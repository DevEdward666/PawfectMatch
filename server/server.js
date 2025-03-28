const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create Express app
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Import database connection
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

// Connect to the database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL + '?sslmode=require'+ '?sslmode=require'
});

// Import routes
const userRoutes = require('./userRoutes');
const petsRoutes = require('./petsRoutes');
const productsRoutes = require('./productsRoutes');
const adoptionRoutes = require('./adoptionRoutes');
const reportsRoutes = require('./reportsRoutes');
const messagesRoutes = require('./messagesRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const uploadRoutes = require('./uploadRoutes');

// API routes
app.use('/api/users', userRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);

// Simple routes for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Pet Shop API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});