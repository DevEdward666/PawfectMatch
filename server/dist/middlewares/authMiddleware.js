"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("../db/schema"));
// Database connection
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });
const db = (0, node_postgres_1.drizzle)(pool);
// Get schema
const { users } = schema;
// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'pet-shop-secret-key';
// Authentication middleware
const authenticate = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if user still exists
        const [user] = await db.select({
            id: users.id,
            email: users.email,
            role: users.role
        })
            .from(users)
            .where((0, drizzle_orm_1.eq)(users.id, decoded.id));
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User does not exist'
            });
        }
        // Add user to request
        req.user = user;
        next();
    }
    catch (error) {
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
exports.authenticate = authenticate;
// Admin role check middleware
const isAdmin = (req, res, next) => {
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
    }
    catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin verification',
            error: error.message
        });
    }
};
exports.isAdmin = isAdmin;
