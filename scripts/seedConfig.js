console.log('Script started...');
import dotenv from 'dotenv';
console.log('dotenv imported');
import { connectDB } from '../config/database.js';
console.log('connectDB imported');
import { SystemConfig } from '../models/index.js';
console.log('SystemConfig imported');

dotenv.config();

const seedConfig = async () => {
    console.log('Starting seed function...');
    try {
        await connectDB();
        console.log('Database connected.');

        // Check if config exists
        const existingConfig = await SystemConfig.findOne();
        if (existingConfig) {
            console.log('✅ System configuration already exists.');
            process.exit(0);
        }

        console.log('Creating default config...');
        // Create default config
        await SystemConfig.create({
            nominationStartDate: new Date(),
            nominationEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        });

        console.log('✅ System configuration created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding config:', error);
        process.exit(1);
    }
};

seedConfig();
