import express, { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Create Express application
const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes (mix of CommonJS modules and TypeScript modules)
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
// Using the TypeScript pet routes
import petRoutes from './src/routes/petRoutes';
const productsRoutes = require('./productsRoutes');
const adoptionRoutes = require('./adoptionRoutes');
const reportsRoutes = require('./reportsRoutes');
const messagesRoutes = require('./messagesRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const uploadRoutes = require('./uploadRoutes');

// API routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);
// API health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve the static files from client build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all route to serve the React app (or our placeholder for now)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;