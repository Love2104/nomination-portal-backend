import express from 'express';
import {
    reviewerLogin,
    verifyReviewer,
    getManifestosForReview,
    addComment,
    getManifestoComments
} from '../controllers/reviewerController.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Reviewer login validation
const validateReviewerLogin = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('phase')
        .isIn(['phase1', 'phase2', 'final'])
        .withMessage('Invalid phase'),
    handleValidationErrors
];

// Comment validation
const validateComment = [
    body('manifestoId').isUUID().withMessage('Invalid manifesto ID'),
    body('comment').notEmpty().withMessage('Comment is required'),
    handleValidationErrors
];

// Public routes
router.post('/login', validateReviewerLogin, reviewerLogin);
router.get('/comments/:manifestoId', getManifestoComments);

// Protected routes (Reviewer only)
router.get('/manifestos', verifyReviewer, getManifestosForReview);
// New spec route alias: POST /reviewer/comment
router.post('/comment', verifyReviewer, validateComment, addComment);
// Backwards-compatible plural route
router.post('/comments', verifyReviewer, validateComment, addComment);

export default router;
