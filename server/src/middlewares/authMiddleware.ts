import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema  from '../db/schema'
import { Request, Response, NextFunction } from 'express';
// Database connection
const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
const db = drizzle(pool);

// Get schema
const { users } = schema;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'pet-shop-secret-key';

// Authentication middleware
export const authenticate = async (req: Request, res: Response,next: NextFunction) => {

  try {
    
    // Get token from header
    let token = req.header('Authorization');

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }
    
    // Remove Bearer prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    
    // Verify token
    const decoded:any = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, decoded.id));
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist'
      });
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error:any) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
};

// Admin role check middleware
export const isAdmin = (req: Request, res: Response,next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }
    
    next();
  } catch (error:any) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin verification',
      error: error.message
    });
  }
};