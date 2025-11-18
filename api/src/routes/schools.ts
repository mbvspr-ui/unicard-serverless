import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import { updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/schools.js';

const router = Router();

// Protected routes (require authentication)
router.put('/profile', ...authenticateSchool, updateProfile);
router.post('/change-password', ...authenticateSchool, changePassword);

// Public routes (no authentication required)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
