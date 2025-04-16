"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const petRoutes_1 = __importDefault(require("./routes/petRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const adoptionRoutes_1 = __importDefault(require("./routes/adoptionRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const messagesRoutes_1 = __importDefault(require("./routes/messagesRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
// Import database connection
const connection_1 = require("./db/connection");
// Initialize environment variables
dotenv_1.default.config();
// Create Express application
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5001;
// Test database connection
async function testDbConnection() {
    try {
        // Test the connection by executing a simple query
        const client = await connection_1.pool.connect();
        console.log('Database connection successful');
        client.release();
        return true;
    }
    catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API routes
app.use('/api/users', userRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/pets', petRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/adoptions', adoptionRoutes_1.default);
app.use('/api/report', reportRoutes_1.default);
app.use('/api/messages', messagesRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/uploads', uploadRoutes_1.default);
// API health check
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection as part of health check
        const dbConnected = await testDbConnection();
        res.status(200).json({
            status: 'ok',
            message: 'Server is running',
            database: dbConnected ? 'connected' : 'disconnected'
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message
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
            await connection_1.pool.end();
            console.log('Database pool has ended');
            process.exit(0);
        });
    });
    process.on('SIGINT', () => {
        console.log('SIGINT signal received: closing HTTP server');
        server.close(async () => {
            console.log('HTTP server closed');
            await connection_1.pool.end();
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
exports.default = app;
