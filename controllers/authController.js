import { User, OTP } from '../models/index.js';
import { generateOTP, sendOTPEmail, sendPasswordResetEmail } from '../utils/emailService.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Register user - Send OTP
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

        // Save OTP to database
        await OTP.create({
            email,
            otp,
            expiresAt
        });

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            expiresIn: process.env.OTP_EXPIRE_MINUTES || 10
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

        // Find OTP record
        const otpRecord = await OTP.findOne({
            where: { email, otp },
            order: [['createdAt', 'DESC']]
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is valid
        if (!otpRecord.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired or already been used'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already registered'
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            rollNo,
            department,
            phone,
            isVerified: true
        });

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Verify OTP error:', error);

        // Handle unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
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
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

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
            user: user.toJSON()
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
        res.status(200).json({
            success: true,
            user: req.user.toJSON()
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
        await req.user.update({
            ...(name && { name }),
            ...(department && { department }),
            ...(phone && { phone })
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: req.user.toJSON()
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
        if (req.user.role === 'candidate') {
            return res.status(400).json({
                success: false,
                message: 'You are already a candidate'
            });
        }

        // Update role to candidate
        await req.user.update({ role: 'candidate' });

        res.status(200).json({
            success: true,
            message: 'You are now a candidate',
            user: req.user.toJSON()
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
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // For security, do not reveal if email exists or not, but for UX we might need to.
            // Let's return 404 for now to be helpful to the user (since it's an internal portal).
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

        // Save OTP to database
        await OTP.create({
            email,
            otp,
            expiresAt
        });

        // Send OTP email
        await sendPasswordResetEmail(email, otp);

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to your emai.',
            expiresIn: process.env.OTP_EXPIRE_MINUTES || 10
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

        // Find OTP record
        const otpRecord = await OTP.findOne({
            where: { email, otp },
            order: [['createdAt', 'DESC']]
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is valid
        if (!otpRecord.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired or already been used'
            });
        }

        // Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update password (hashing handled by User model hook)
        user.password = newPassword;
        await user.save();

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

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
