import express from 'express';
import {
    register,
    verifyOTP,
    login,
    getProfile,
    updateProfile,
    becomeCandidate,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
    validateRegistration,
    validateOTPVerification,
    validateLogin
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/verify-otp', validateOTPVerification, verifyOTP);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/become-candidate', authenticate, becomeCandidate);

export default router;
