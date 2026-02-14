import dotenv from 'dotenv';
import transporter from './utils/emailService.js';

dotenv.config();

const testEmail = async () => {
    console.log('Testing email configuration...');
    console.log('----------------------------------------');
    console.log('Service: Gmail');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Password set:', process.env.EMAIL_PASSWORD ? 'Yes (masked)' : 'No');
    console.log('----------------------------------------');

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Render Debugger (Simple)',
            text: 'If you see this, using service: "gmail" is working correctly.'
        });
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
    process.exit(0);
};

testEmail();
