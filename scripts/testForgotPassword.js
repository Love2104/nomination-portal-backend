import { connectDB } from '../config/database.js';
import { User, OTP } from '../models/index.js';
import { forgotPassword, resetPassword } from '../controllers/authController.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Mock Request/Response
const mockReq = (body) => ({ body });
const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.data = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const testFlow = async () => {
    let logBuffer = '';
    const log = (msg) => {
        console.log(msg);
        logBuffer += msg + '\n';
    };

    // Use absolute path for safety
    const logPath = 'e:/Web/Nomination portal/backend/test_forgot_final.txt';

    log('🚀 Starting Test Flow...');

    try {
        await connectDB();
        log('✅ DB Connected');

        const email = 'student1@iitk.ac.in';
        log(`🔹 Testing Forgot Password for ${email}...`);

        // Check user exists
        const userExists = await User.findOne({ where: { email } });
        if (!userExists) {
            log('❌ User not found in DB!');
            fs.writeFileSync(logPath, logBuffer);
            process.exit(1);
        }
        log('✅ User found');

        // 1. Request OTP
        const req1 = mockReq({ email });
        const res1 = mockRes();

        log('🔹 Calling forgotPassword controller...');
        try {
            await forgotPassword(req1, res1);
            log(`🔹 Controller response: ${res1.statusCode} - ${JSON.stringify(res1.data)}`);
        } catch (e) {
            log(`⚠️ Controller threw error (expected if email fails): ${e.message}`);
        }

        // 2. Retrieve OTP from DB
        const otpRecord = await OTP.findOne({
            where: { email },
            order: [['createdAt', 'DESC']]
        });

        if (!otpRecord) {
            log('❌ OTP not generated in DB');
            fs.writeFileSync(logPath, logBuffer);
            process.exit(1);
        }
        log(`✅ OTP Generated: ${otpRecord.otp}`);

        // 3. Reset Password
        const newPassword = 'newpassword123';
        const req2 = mockReq({ email, otp: otpRecord.otp, newPassword });
        const res2 = mockRes();

        log('🔹 Calling resetPassword controller...');
        await resetPassword(req2, res2);

        if (res2.statusCode === 200) {
            log('✅ Password reset response success');
        } else {
            log(`❌ Password reset failed: ${res2.statusCode} ${JSON.stringify(res2.data)}`);
            fs.writeFileSync(logPath, logBuffer);
            process.exit(1);
        }

        // 4. Verify new password login
        const user = await User.findOne({ where: { email } });
        const isMatch = await bcrypt.compare(newPassword, user.password);

        if (isMatch) {
            log('✅ verification: New password works!');
        } else {
            log('❌ verification: New password does NOT work');
            fs.writeFileSync(logPath, logBuffer);
            process.exit(1);
        }

        log('🎉 Test Completed Successfully');
        fs.writeFileSync(logPath, logBuffer);
        process.exit(0);

    } catch (error) {
        log(`❌ Test Error: ${error.message}`);
        fs.writeFileSync(logPath, logBuffer);
        process.exit(1);
    }
};

testFlow();
