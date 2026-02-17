import express from 'express';
import {
    getConfig,
    updateDeadlines,
    updateLimits,
    updateReviewerCredentials,
    updateConfig,
    getAllCandidates,
    getStatistics,
    exportData,
    getSubmittedNominations,
    verifyNomination,
    createAdmin,
    getAllUsers
} from '../controllers/superadminController.js';
import { authenticate, isSuperadmin, isAdminOrSuperadmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ─── Superadmin-only routes ─────────────────────────────
// Configuration routes
router.get('/config', isSuperadmin, getConfig);
router.put('/config/deadlines', isSuperadmin, updateDeadlines);
router.put('/config/limits', isSuperadmin, updateLimits);
router.put('/config/reviewers', isSuperadmin, updateReviewerCredentials);
// New unified config route per spec (PATCH /superadmin/config)
router.patch('/config', isSuperadmin, updateConfig);

// Admin management
router.post('/create-admin', isSuperadmin, createAdmin);
router.get('/users', isSuperadmin, getAllUsers);

// Data routes (superadmin only)
router.get('/statistics', isSuperadmin, getStatistics);
// New spec route: GET /superadmin/export?type=...
router.get('/export', isSuperadmin, (req, res, next) => {
    if (!req.query.type) {
        return res.status(400).json({
            success: false,
            message: 'Query parameter "type" is required (candidates|supporters|manifestos|comments)'
        });
    }
    // Map query param to existing controller param
    req.params.type = req.query.type;
    return exportData(req, res, next);
});
// Existing CSV export with path parameter
router.get('/export/:type', isSuperadmin, exportData);

// ─── Admin OR Superadmin routes ─────────────────────────
// Nomination Management
router.get('/nominations', isAdminOrSuperadmin, getSubmittedNominations);
router.put('/nominations/:id/verify', isAdminOrSuperadmin, verifyNomination);

// Candidate listing
router.get('/candidates', isAdminOrSuperadmin, getAllCandidates);

export default router;
