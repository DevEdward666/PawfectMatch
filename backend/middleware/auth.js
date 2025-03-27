const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Environment variable for JWT secret (should be set in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to authenticate the token 
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists
    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'User not found, authentication failed' });
    }

    // Add user info to request
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token, authentication failed' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin rights required' });
  }

  next();
};

// Generate authentication token
exports.generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
