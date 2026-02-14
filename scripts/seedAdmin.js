import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@iitk.ac.in';
        const adminPassword = 'admin@123'; // Default password

        // Check if admin exists
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });
        if (existingAdmin) {
            console.log('Superadmin already exists.');
            console.log(`Email: ${adminEmail}`);
            // We can't show password as it's hashed
            process.exit(0);
        }

        await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: adminPassword,
            rollNo: '000000', // Dummy roll no
            department: 'ADMIN',
            phone: '9999999999',
            role: 'superadmin',
            isVerified: true
        });

        console.log('✅ Superadmin created successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
