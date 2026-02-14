import dotenv from 'dotenv';
import { sendOTPEmail } from './utils/emailService.js';

dotenv.config();

const testEmail = async () => {
    console.log('Testing Email Service...');
    console.log('----------------------------------------');
    console.log('User:', process.env.EMAIL_USER);
    console.log('----------------------------------------');

    try {
        console.log('Attempting to send OTP email...');
        const otp = '123456';
        await sendOTPEmail(process.env.EMAIL_USER, otp, 'verification');
        console.log('✅ OTP Email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
    process.exit(0);
};

testEmail();
