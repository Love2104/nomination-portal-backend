import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Gmail SMTP Configuration
// ---------------------------------------------------------------------------
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

console.log('📧 Email config loaded (Gmail SMTP):');
console.log(`   HOST     = smtp.gmail.com`);
console.log(`   PORT     = 587 (STARTTLS)`);
console.log(`   USER     = ${EMAIL_USER || '⚠️  NOT SET'}`);
console.log(`   PASSWORD = ${EMAIL_PASSWORD ? '••••••••' : '⚠️  NOT SET'}`);

// ---------------------------------------------------------------------------
// Lazy transporter — created on first send
// ---------------------------------------------------------------------------
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    family: 4,
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
    },
  });

  console.log('✅ Nodemailer transporter created (Gmail SMTP, port 587)');
  return _transporter;
}

// ---------------------------------------------------------------------------
// sendOTPEmail
// ---------------------------------------------------------------------------
export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.error('❌ EMAIL_USER or EMAIL_PASSWORD is missing in env');
    throw new Error('Email service not configured – missing EMAIL_USER / EMAIL_PASSWORD');
  }

  const isReset = purpose === 'reset';
  const subject = isReset ? 'Password Reset OTP' : 'Your Election Portal OTP';

  const mailOptions = {
    from: `"IITK Election Commission" <${EMAIL_USER}>`,
    to: email,
    subject,
    text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${isReset ? 'Password Reset' : 'Email Verification'}</h2>
        <p>Your OTP is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  console.log(`📤 Sending ${purpose} OTP email to ${email} via Gmail SMTP …`);

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`   messageId : ${info.messageId}`);
    console.log(`   response  : ${info.response}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}`);
    console.error(`   Error name    : ${error.name}`);
    console.error(`   Error message : ${error.message}`);
    if (error.code) console.error(`   Error code    : ${error.code}`);
    if (error.response) console.error(`   SMTP response : ${error.response}`);
    throw error;
  }
};
