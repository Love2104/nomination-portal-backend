import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const updateAdmin = async () => {
    try {
        await connectDB();

        const oldEmail = 'admin@iitk.ac.in';
        const newEmail = 'loveadmin@iitk.ac.in';
        const newPassword = 'loveadmin@123';

        console.log(`Looking for superadmin: ${oldEmail}...`);

        // Try to find by old email OR new email (in case run twice)
        let user = await User.findOne({
            where: {
                email: [oldEmail, newEmail]
            }
        });

        if (!user) {
            console.error('❌ Superadmin user not found!');
            process.exit(1);
        }

        console.log(`Found user: ${user.email}`);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user
        await user.update({
            email: newEmail,
            password: hashedPassword,
            name: 'Love Admin' // Updating name too just for fun/clarity
        });

        console.log('✅ Superadmin credentials updated successfully!');
        console.log(`📧 New Email: ${newEmail}`);
        console.log(`🔑 New Password: ${newPassword}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating admin:', error);
        process.exit(1);
    }
};

updateAdmin();
