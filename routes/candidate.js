import express from 'express';
import { authenticate, isCandidate } from '../middleware/auth.js';
import {
    nominate,
    updateNominationDetails,
    getDashboard
} from '../controllers/candidateController.js';

const router = express.Router();

// All candidate routes require authenticated candidate
router.use(authenticate, isCandidate);

// POST /candidate/nominate
router.post('/nominate', nominate);

// PATCH /candidate/update
router.patch('/update', updateNominationDetails);

// GET /candidate/dashboard
router.get('/dashboard', getDashboard);

export default router;

