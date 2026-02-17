import express from 'express';
import { authenticate, isAdminOrSuperadmin } from '../middleware/auth.js';
import { updateNominationStatus } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require admin or superadmin
router.use(authenticate, isAdminOrSuperadmin);

// PATCH /admin/nomination-status
router.patch('/nomination-status', updateNominationStatus);

export default router;

