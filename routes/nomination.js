import express from 'express';
import {
    createNomination,
    updateNomination,
    submitNomination,
    getNomination,
    getMyNomination,
    getAllNominations
} from '../controllers/nominationController.js';
import { authenticate, isCandidate } from '../middleware/auth.js';
import { validateNomination, validateUUID } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getAllNominations);

// Protected routes (Candidate only) - MUST come before /:id
router.get('/my-nomination', authenticate, isCandidate, getMyNomination);
router.post('/', authenticate, isCandidate, validateNomination, createNomination);
router.put('/:id', authenticate, isCandidate, validateUUID, validateNomination, updateNomination);
router.post('/:id/submit', authenticate, isCandidate, validateUUID, submitNomination);

// Public parameterized route - MUST come last
router.get('/:id', validateUUID, getNomination);

export default router;
