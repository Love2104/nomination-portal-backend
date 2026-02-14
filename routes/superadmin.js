import express from 'express';
import {
    getConfig,
    updateDeadlines,
    updateLimits,
    updateReviewerCredentials,
    getAllCandidates,
    getStatistics,
    exportData,
    getSubmittedNominations,
    verifyNomination
} from '../controllers/superadminController.js';
import { authenticate, isSuperadmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require superadmin authentication
router.use(authenticate, isSuperadmin);

// Configuration routes
router.get('/config', getConfig);
router.put('/config/deadlines', updateDeadlines);
router.put('/config/limits', updateLimits);
router.put('/config/reviewers', updateReviewerCredentials);

// Nomination Management
router.get('/nominations', getSubmittedNominations);
router.put('/nominations/:id/verify', verifyNomination);

// Data routes
router.get('/candidates', getAllCandidates);
router.get('/statistics', getStatistics);
router.get('/export/:type', exportData);

export default router;
