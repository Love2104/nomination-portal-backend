import express from 'express';
import {
    register,
    verifyOTP,
    login,
    getProfile,
    updateProfile,
    becomeCandidate,
    forgotPassword,
    resetPassword,
    registerWithToken,
    checkEmail,
    resetPasswordWithToken
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
    validateRegistration,
    validateOTPVerification,
    validateLogin
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/send-otp', validateRegistration, register);
// Backwards-compatible alias
router.post('/register', validateRegistration, register);
router.post('/verify-otp', validateOTPVerification, verifyOTP);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Firebase token-based routes (no SMTP needed)
router.post('/register-with-token', registerWithToken);
router.post('/check-email', checkEmail);
router.post('/reset-password-with-token', resetPasswordWithToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/become-candidate', authenticate, becomeCandidate);

export default router;

