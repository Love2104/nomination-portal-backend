import app from './app.js';
import prisma from './prisma/client.js';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize database and start server
const startServer = async () => {
    try {
        console.log('Attempting to connect to database...');
        await prisma.$connect();
        console.log('✅ Database connected successfully (Prisma)');

        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📍 API: http://localhost:${PORT}`);
            console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();
