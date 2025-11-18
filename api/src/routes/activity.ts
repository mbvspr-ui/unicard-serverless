import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import { getRecentActivities } from '../controllers/activity.js';

const router = Router();

// Get recent activities for authenticated school
router.get('/', ...authenticateSchool, getRecentActivities);

export default router;
