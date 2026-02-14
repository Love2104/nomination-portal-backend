console.log('Starting server.js execution...');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import './config/cloudinary.js'; // Initialize Cloudinary

// Import routes
import authRoutes from './routes/auth.js';
import nominationRoutes from './routes/nomination.js';
import supporterRoutes from './routes/supporter.js';
import manifestoRoutes from './routes/manifesto.js';
import reviewerRoutes from './routes/reviewer.js';
import superadminRoutes from './routes/superadmin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'IITK Election Commission API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/nominations', nominationRoutes);
app.use('/api/supporters', supporterRoutes);
app.use('/api/manifestos', manifestoRoutes);
app.use('/api/reviewers', reviewerRoutes);
app.use('/api/superadmin', superadminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize database and Firebase, then start server
const startServer = async () => {
    try {
        console.log('Attempting to connect to database...');
        await connectDB();
        console.log('Database connected successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📍 API: http://localhost:${PORT}`);
            console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
