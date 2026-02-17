import express from 'express';
import {
    uploadManifesto,
    getManifesto,
    getNominationManifestos,
    getCandidateManifestos,
    deleteManifesto,
    proxyManifestoPdf
} from '../controllers/manifestoController.js';
import { authenticate, isCandidate } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { validateUUID } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/view/:id', proxyManifestoPdf); // PDF proxy - must come before parameterized routes

// New spec route: GET /manifesto/:candidateId
router.get('/:candidateId', getCandidateManifestos);

// Existing routes for backwards compatibility
router.get('/:nominationId/:phase', getManifesto);
router.get('/nomination/:nominationId', validateUUID, getNominationManifestos);

// Protected routes (Candidate only)
router.post(
    '/upload',
    authenticate,
    isCandidate,
    upload.single('manifesto'),
    handleUploadError,
    uploadManifesto
);

router.delete('/:id', authenticate, isCandidate, validateUUID, deleteManifesto);

export default router;
