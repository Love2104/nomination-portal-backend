import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const verifyAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@iitk.ac.in';
        const rawPassword = 'admin@123';

        console.log(`Checking user: ${adminEmail}`);

        const user = await User.findOne({ where: { email: adminEmail } });

        if (!user) {
            console.error('❌ Superadmin user NOT found in database.');
            process.exit(1);
        }

        console.log('✅ User found.');
        console.log(`Role: ${user.role}`);
        console.log(`Verified: ${user.isVerified}`);
        console.log(`Stored Hash: ${user.password}`);

        const isMatch = await bcrypt.compare(rawPassword, user.password);

        if (isMatch) {
            console.log('✅ Password comparison SUCCESSFUL.');
        } else {
            console.error('❌ Password comparison FAILED.');
            // Update password to be sure
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);
            await user.update({ password: hashedPassword });
            console.log('✅ Password has been RESET to default.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error verifying admin:', error);
        process.exit(1);
    }
};

verifyAdmin();
