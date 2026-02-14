import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ===============================
// Nodemailer Gmail Transporter
// ===============================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Keep pool and timeouts to be safe, but port 587 is key
  pool: true,
  maxConnections: 1,
  rateLimit: 5, // 5 emails/second max
});

// Optional debug (you can remove later)
transporter.verify()
  .then(() => console.log("✅ Gmail transporter ready"))
  .catch(err => console.log("❌ Gmail connection failed:", err));

// ===============================
// Generate 6-digit OTP
// ===============================
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===============================
// Send OTP Email
// ===============================
export const sendOTPEmail = async (to, otp, type = "verification") => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(`[Mock Email] To: ${to}, OTP: ${otp}`);
      return;
    }

    const subject =
      type === "reset"
        ? "Password Reset – IITK Nomination Portal"
        : "Email Verification – IITK Nomination Portal";

    const title =
      type === "reset" ? "Password Reset" : "Email Verification";

    const message =
      type === "reset"
        ? "Use the OTP below to reset your password."
        : "Use the OTP below to verify your email address.";

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;padding:20px">
        <h2>${title}</h2>
        <p>${message}</p>
        <h1 style="letter-spacing:6px;color:#1e3a8a">${otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <hr/>
        <p style="font-size:12px;color:#666">
          © ${new Date().getFullYear()} IITK Election Commission
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"IITK Nomination Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ OTP Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    return null; // don't crash API
  }
};
