import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5000',
        'https://nomination-portal-iitk.web.app',
        'https://nomination-portal-iitk.firebaseapp.com',
        'https://nomination-portal-backend-wec7.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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

export default app;
