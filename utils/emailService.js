import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter - configurable via env variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  // Force IPv4 to avoid Docker/IPv6 timeouts
  family: 4,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
    console.log('⚠️  Please configure EMAIL_USER and EMAIL_PASSWORD in .env');
  } else {
    console.log('✅ Email service ready');
  }
});

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"IITK Election Commission" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for IITK Election Portal Registration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .note { font-size: 13px; color: #666; background: #fff; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗳️ IITK Election Commission</h1>
              <p>Nomination Portal Registration</p>
            </div>
            <div class="content">
              <h2>Verify Your Email</h2>
              <p>Hello,</p>
              <p>Thank you for registering with the IITK Election Commission Nomination Portal. Please use the following OTP to complete your registration:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</strong></p>
              <p>If you didn't request this OTP, please ignore this email.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} IITK Election Commission. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send Password Reset OTP email
export const sendPasswordResetEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"IITK Election Commission" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - IITK Election Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #555; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #ff9a9e; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; color: #ff6b6b; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { color: #d9534f; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for the IITK Election Commission Nomination Portal.</p>
              <p>Use the OTP below to set a new password:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</strong></p>
              <p class="warning">If you did not request a password reset, please ignore this email immediately. Your account remains secure.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} IITK Election Commission. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export default transporter;
