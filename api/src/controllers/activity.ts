import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery } from '../utils/db-helpers.js';

/**
 * Get recent activities for a school
 * GET /api/activities
 */
export const getRecentActivities = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;

    if (!schoolId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Get limit from query params (default 10, max 50)
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Fetch recent activities
    const sql = `
      SELECT 
        id,
        activity_type,
        entity_type,
        entity_id,
        description,
        metadata,
        created_at
      FROM activity_log
      WHERE school_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const activities = await executeQuery(sql, [schoolId, limit]);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch activities',
      },
    });
  }
};
