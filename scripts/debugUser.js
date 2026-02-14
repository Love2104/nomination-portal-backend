import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const debugUser = async () => {
    const logPath = 'e:/Web/Nomination portal/backend/debug_user.txt';
    let logBuffer = '';
    const log = (msg) => {
        console.log(msg);
        logBuffer += msg + '\n';
    };

    try {
        log('🚀 Starting Debug User Script...');
        await connectDB();
        log('✅ DB Connected');

        const email = 'student1@iitk.ac.in';
        const plainPassword = 'password123';

        // 1. Find User
        let user = await User.findOne({ where: { email } });

        if (!user) {
            log('❌ User student1 NOT found. Creating it now...');
            try {
                user = await User.create({
                    name: 'Student One',
                    email: email,
                    password: plainPassword,
                    rollNo: '100001',
                    department: 'CSE',
                    phone: '9000000001',
                    role: 'student',
                    isVerified: true
                });
                log('✅ User created successfully.');
            } catch (err) {
                log(`❌ Failed to create user: ${err.message}`);
                fs.writeFileSync(logPath, logBuffer);
                process.exit(1);
            }
        } else {
            log('✅ User student1 found.');
        }

        // 2. Force Update Password (to ensure hashing is correct)
        log('🔄 Updating password...');
        user.password = plainPassword; // Sequelize hook should hash this
        await user.save();
        log('✅ Password updated in DB.');

        // 3. Verify Login
        log('🔍 Verifying login...');

        // Reload user to get latest hash
        const refreshedUser = await User.findOne({ where: { email } });
        log(`🔹 Stored Hash: ${refreshedUser.password}`);

        const isMatch = await bcrypt.compare(plainPassword, refreshedUser.password);

        if (isMatch) {
            log('✅ LOGIN SUCCESS: Password matches hash.');
        } else {
            log('❌ LOGIN FAILED: Password does NOT match hash.');
        }

        fs.writeFileSync(logPath, logBuffer);
        process.exit(0);

    } catch (error) {
        log(`❌ Error: ${error.message}`);
        try { fs.writeFileSync(logPath, logBuffer); } catch { }
        process.exit(1);
    }
};

debugUser();
