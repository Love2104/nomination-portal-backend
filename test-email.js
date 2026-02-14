import dotenv from 'dotenv';
import transporter from './utils/emailService.js';

dotenv.config();

const testEmail = async () => {
    console.log('Testing email configuration...');
    console.log('----------------------------------------');
    console.log('Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('Port:', process.env.EMAIL_PORT || '587');
    console.log('Secure:', process.env.EMAIL_SECURE === 'true');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Password set:', process.env.EMAIL_PASSWORD ? 'Yes (masked)' : 'No');
    console.log('----------------------------------------');

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Render Debugger',
            text: 'If you see this, nodemailer is working correctly with your current configuration.'
        });
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        if (error.code === 'EAUTH') {
            console.error('👉 Check your EMAIL_USER and EMAIL_PASSWORD (App Password).');
        } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
            console.error('👉 Connection timed out. Check EMAIL_HOST and EMAIL_PORT.');
        }
    }
    process.exit(0);
};

testEmail();
