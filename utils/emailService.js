import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Configuration – read once, log at import time so we know what's loaded
// ---------------------------------------------------------------------------
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 465);
const EMAIL_SECURE =
  typeof process.env.EMAIL_SECURE === 'string'
    ? process.env.EMAIL_SECURE.toLowerCase() === 'true'
    : EMAIL_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

console.log('📧 Email config loaded:');
console.log(`   HOST     = ${EMAIL_HOST}`);
console.log(`   PORT     = ${EMAIL_PORT}`);
console.log(`   SECURE   = ${EMAIL_SECURE}`);
console.log(`   USER     = ${EMAIL_USER ? EMAIL_USER : '⚠️  NOT SET'}`);
console.log(`   PASSWORD = ${EMAIL_PASSWORD ? '••••••••' : '⚠️  NOT SET'}`);

// ---------------------------------------------------------------------------
// Lazy transporter – created on first send so env vars are guaranteed loaded
// ---------------------------------------------------------------------------
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth:
      EMAIL_USER && EMAIL_PASSWORD
        ? { user: EMAIL_USER, pass: EMAIL_PASSWORD }
        : undefined,
    // ── Generous timeouts (Render cold-starts can be slow) ──
    connectionTimeout: 30_000,   // 30 s to open TCP socket
    greetingTimeout: 30_000,     // 30 s for SMTP banner
    socketTimeout: 60_000,       // 60 s for any subsequent response
    // ── Connection pooling ──
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    // ── Network ──
    family: 4,                   // force IPv4
    tls: { rejectUnauthorized: false }, // tolerate self-signed certs
  });

  console.log('✅ Nodemailer transporter created (pooled, generous timeouts)');
  return _transporter;
}

// ---------------------------------------------------------------------------
// sendOTPEmail – the only public export
// ---------------------------------------------------------------------------
export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  // ── Guard: credentials must be present ──
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.error('❌ EMAIL_USER or EMAIL_PASSWORD is missing in env');
    throw new Error('Email service is not configured – missing EMAIL_USER / EMAIL_PASSWORD');
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

  console.log(`📤 Sending ${purpose} OTP email to ${email} …`);

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
    // Re-throw so the controller returns { success: false }
    throw error;
  }
};
