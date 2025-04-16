import express, { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import petRoutes from './routes/petRoutes';
import productsRoutes from './routes/productRoutes';
import adoptionRoutes from './routes/adoptionRoutes';
import reportsRoutes from './routes/reportRoutes';
import messagesRoutes from './routes/messagesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import uploadRoutes from './routes/uploadRoutes';
// Import database connection
import { pool } from './db/connection';
// Initialize environment variables
dotenv.config();

// Create Express application
const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5001;

// Test database connection
async function testDbConnection() {
  try {
    // Test the connection by executing a simple query
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/report', reportsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);
// API health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection as part of health check
    const dbConnected = await testDbConnection();
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : (error as Error).message
    });
  }
});

// Serve the static files from client build directory
// app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all route to serve the React app (or our placeholder for now)
// app.get('*', (req: Request, res: Response) => {
//   res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
// });

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
// Start the server only if database connection is successful
async function startServer() {
  const dbConnected = await testDbConnection();
  
  if (!dbConnected) {
    console.error('Failed to connect to the database. Server will not start.');
    process.exit(1);
  }
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
      console.log('HTTP server closed');
      await pool.end();
      console.log('Database pool has ended');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(async () => {
      console.log('HTTP server closed');
      await pool.end();
      console.log('Database pool has ended');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
