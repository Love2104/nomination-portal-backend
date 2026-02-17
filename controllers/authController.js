import prisma from '../prisma/client.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

// @desc    Register user - Send OTP
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        await prisma.oTP.create({
            data: {
                email,
                otpHash,
                expiresAt
            }
        });

        // Send OTP email via GSMTP (Gmail SMTP)
        await sendOTPEmail(email, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            expiresIn: 10
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: error.message
        });
    }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp, password, name, rollNo, department, phone } = req.body;

        // Find latest OTP record for this email
        const otpRecord = await prisma.oTP.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP request'
            });
        }

        // Verify OTP against stored hash
        const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isValidOtp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }

        // Check if user already exists (double check)
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                rollNo,
                department,
                contact: phone, // mapped to contact in schema
                role: 'STUDENT'
            }
        });

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: { ...user, password: undefined }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);

        // Handle unique constraint errors (Prisma code P2002)
        if (error.code === 'P2002') {
            const field = error.meta.target[0];
            return res.status(400).json({
                success: false,
                message: `${field === 'rollNo' ? 'Roll number' : 'Email'} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { ...user, password: undefined }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: error.message
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        res.status(200).json({
            success: true,
            user: { ...user, password: undefined }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const { name, department, phone } = req.body;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(department && { department }),
                ...(phone && { contact: phone }) // Schema uses 'contact'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: { ...updatedUser, password: undefined }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// @desc    Upgrade to candidate role
// @route   POST /api/auth/become-candidate
// @access  Private
export const becomeCandidate = async (req, res) => {
    try {
        if (req.user.role === 'CANDIDATE') {
            return res.status(400).json({
                success: false,
                message: 'You are already a candidate'
            });
        }

        // Update role to candidate
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { role: 'CANDIDATE' }
        });

        res.status(200).json({
            success: true,
            message: 'You are now a candidate',
            user: { ...updatedUser, password: undefined }
        });
    } catch (error) {
        console.error('Become candidate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upgrade to candidate',
            error: error.message
        });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Save OTP
        await prisma.oTP.create({
            data: {
                email,
                otpHash,
                expiresAt
            }
        });

        // Send OTP email via GSMTP (Gmail SMTP)
        await sendOTPEmail(email, otp, 'reset');

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to your email.',
            expiresIn: 10
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
};

// @desc    Reset Password - Verify OTP and Update Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find latest OTP record
        const otpRecord = await prisma.oTP.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP request'
            });
        }

        // Verify OTP against stored hash
        const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isValidOtp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
};
