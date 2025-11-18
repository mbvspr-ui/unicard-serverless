import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import { logActivity } from '../utils/activity-logger.js';
import { AuthRequest } from '../types/index.js';
import { Response } from 'express';

const router = Router();

// Debug endpoint to test activity logging
router.post('/test-activity', ...authenticateSchool, async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user?.userId;
    
    if (!schoolId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    console.log('🧪 DEBUG: Testing activity logging for school:', schoolId);

    await logActivity({
      schoolId,
      activityType: 'student_updated',
      entityType: 'student',
      description: 'DEBUG TEST: Manual activity test',
      metadata: { test: true, timestamp: new Date().toISOString() },
    });

    res.json({
      success: true,
      message: 'Activity logged successfully! Check your dashboard.',
    });
  } catch (error: any) {
    console.error('🔴 DEBUG: Activity logging failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
