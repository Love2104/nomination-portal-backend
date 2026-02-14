import express from 'express';
import {
    requestSupporterRole,
    acceptSupporterRequest,
    rejectSupporterRequest,
    getCandidateSupporters,
    getMyRequests
} from '../controllers/supporterController.js';
import { authenticate, isCandidate } from '../middleware/auth.js';
import { validateSupporterRequest, validateUUID, validateCandidateParam } from '../middleware/validation.js';

const router = express.Router();

// Student routes
router.post('/request', authenticate, validateSupporterRequest, requestSupporterRole);
router.get('/my-requests', authenticate, getMyRequests);

// Candidate routes
router.put('/:id/accept', authenticate, isCandidate, validateUUID, acceptSupporterRequest);
router.put('/:id/reject', authenticate, isCandidate, validateUUID, rejectSupporterRequest);

// Public routes
router.get('/candidate/:candidateId', validateCandidateParam, getCandidateSupporters);

export default router;
