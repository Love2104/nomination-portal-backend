import { generateOTP, sendOTPEmail } from './utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

const main = async () => {
    console.log('--- Testing Email Service ---');

    const otp = generateOTP();
    console.log(`Generated OTP: ${otp}`);

    // Test Case 1: Mock Email (if creds missing) or Real Email (if creds present)
    // We can't easily force missing creds without messing with process.env, 
    // but we can trust the logic if we see the output.

    // NOTE: To test mock email, you can temporarily rename .env file or comment out EMAIL_USER in it.
    // For now I will just run it and see what happens based on current env.

    console.log('Sending verification email...');
    await sendOTPEmail('test@example.com', otp, 'verification');

    console.log('Sending reset email...');
    await sendOTPEmail('test@example.com', otp, 'reset');

    console.log('--- Test Complete ---');
};

main();
