import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP Email using Nodemailer
 * @param {string} to - Recipient email
 * @param {string} otp - The OTP code
 * @param {string} type - 'verification' or 'reset'
 */
export const sendOTPEmail = async (to, otp, type = 'verification') => {
  // Check for credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASSWORD missing. Printing mock email.');
    console.log(`[Mock Email] To: ${to}, OTP: ${otp}`);
    return;
  }

  const subject = type === 'reset'
    ? 'Password Reset Request - IITK Election Portal'
    : 'Verify Your Email - IITK Election Portal';

  const title = type === 'reset' ? 'Password Reset' : 'Email Verification';
  const message = type === 'reset'
    ? 'Use the OTP below to reset your password. If you did not request this, please ignore this email.'
    : 'Thank you for registering. Use the OTP below to verify your email address.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px; text-align: center; color: #333333; }
            .otp-code { background-color: #f0f4f8; border: 2px dashed #1e3c72; color: #1e3c72; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; margin: 30px 0; display: inline-block; border-radius: 8px; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>${message}</p>
                <div class="otp-code">${otp}</div>
                <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} IITK Election Commission. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  try {
    const info = await transporter.sendMail({
      from: `"IITK Election Portal" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    });

    console.log(`📧 OTP Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    // Don't crash the server, just log the error
  }
};
