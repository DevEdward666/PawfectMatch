const express = require('express');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./userRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', userRoutes);

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