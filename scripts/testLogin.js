import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const testLogin = async () => {
    try {
        await connectDB();
        const email = 'student1@iitk.ac.in';
        const password = 'password123';

        const user = await User.findOne({ where: { email } });
        let output = '';

        if (!user) {
            output = 'User not found';
        } else {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                output = '✅ Login Successful: Password is correct';
            } else {
                output = `❌ Login Failed: Password incorrect. Stored Hash: ${user.password}`;
            }
        }

        fs.writeFileSync(path.resolve('test_login_result.txt'), output);
        process.exit(0);

    } catch (error) {
        fs.writeFileSync(path.resolve('test_login_result.txt'), `Error: ${error}`);
        process.exit(1);
    }
};

testLogin();
