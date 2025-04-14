const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const petsRoutes = require('./petsRoutes');
const productsRoutes = require('./productsRoutes');
const adoptionRoutes = require('./adoptionRoutes');
const reportsRoutes = require('./reportsRoutes');
const messagesRoutes = require('./messagesRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const uploadRoutes = require('./uploadRoutes');

// API routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve the static files from client build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all route to serve the React app (or our placeholder for now)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Start the integrated server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Integrated app is running on port ${PORT}`);
});