import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db } from '../db';

const app = express();
const port = parseInt(process.env.PORT!) || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to Pet Shop API' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Internal Server Error',
  });
});

// 404 middleware
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: true,
    message: 'Not Found',
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});