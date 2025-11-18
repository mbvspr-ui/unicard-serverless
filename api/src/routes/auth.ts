import { Router } from 'express';
import {
  registerSchool,
  loginSchool,
  loginAdmin,
  verifyTokenEndpoint,
  verifyEmail,
  resendOTP,
  getCurrentUser,
} from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// School authentication routes
router.post('/school/register', registerSchool);
router.post('/school/login', loginSchool);
router.post('/school/verify-email', verifyEmail);
router.post('/school/resend-otp', resendOTP);

// Admin authentication routes
router.post('/admin/login', loginAdmin);

// Token verification
router.get('/verify', authenticate, verifyTokenEndpoint);

// Get current user data
router.get('/me', authenticate, getCurrentUser);

export default router;
