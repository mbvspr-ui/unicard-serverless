import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { insertOne, updateById, deleteById, findById, query } from '../utils/db-helpers.js';
import { staffSchema, staffUpdateSchema, StaffInput } from '../validators/staff.js';
import { cache } from '../utils/cache.js';

/**
 * Create a new staff member
 */
export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    if (!schoolId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const validatedData = staffSchema.parse(req.body) as StaffInput;

    const staff = await insertOne('staff', {
      school_id: schoolId,
      ...validatedData,
    });

    // Clear count cache for this school when staff is added
    cache.clear(`staff_count_${schoolId}_all_all_none`);
    cache.clear(`staff_count_${schoolId}_${validatedData.staff_type}_all_none`);
    if (validatedData.department) {
      cache.clear(`staff_count_${schoolId}_${validatedData.staff_type}_${validatedData.department}_none`);
    }

    res.status(201).json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors },
      });
      return;
    }

    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create staff' },
    });
  }
};

/**
 * Get staff list with pagination, search, and filters
 */
export const getStaffList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    if (!schoolId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const staffTypeFilter = req.query.staff_type as string;
    const departmentFilter = req.query.department as string;

    let sql = 'SELECT * FROM staff WHERE school_id = $1';
    const params: any[] = [schoolId];
    let paramIndex = 2;

    // Add search filter (name, employee_id, department)
    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR employee_id ILIKE $${paramIndex} OR department ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add staff_type filter
    if (staffTypeFilter) {
      sql += ` AND staff_type = $${paramIndex}`;
      params.push(staffTypeFilter);
      paramIndex++;
    }

    // Add department filter
    if (departmentFilter) {
      sql += ` AND department = $${paramIndex}`;
      params.push(departmentFilter);
      paramIndex++;
    }

    // Get total count (with caching to improve performance)
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = `staff_count_${schoolId}_${staffTypeFilter || 'all'}_${departmentFilter || 'all'}_${search || 'none'}`;
    
    let total: number;
    if (!forceRefresh) {
      const cachedCount = cache.get(cacheKey);
      if (cachedCount !== null) {
        total = cachedCount;
      } else {
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await query(countSql, params);
        total = parseInt(countResult.rows[0].count, 10);
        cache.set(cacheKey, total);
      }
    } else {
      // Force refresh - skip cache
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await query(countSql, params);
      total = parseInt(countResult.rows[0].count, 10);
      cache.set(cacheKey, total);
    }

    // Get paginated data
    const offset = (page - 1) * limit;
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get staff list error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch staff' },
    });
  }
};

/**
 * Get a single staff member with ownership verification
 */
export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const staffId = req.params.staffId;

    const staff = await findById('staff', staffId);

    if (!staff) {
      res.status(404).json({
        success: false,
        error: { code: 'STAFF_NOT_FOUND', message: 'Staff member not found' },
      });
      return;
    }

    // Verify staff belongs to school
    if ((staff as any).school_id !== schoolId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch staff' },
    });
  }
};

/**
 * Update a staff member with validation
 */
export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const staffId = req.params.staffId;

    // Verify staff exists and belongs to school
    const existing = await findById('staff', staffId);
    if (!existing || (existing as any).school_id !== schoolId) {
      res.status(404).json({
        success: false,
        error: { code: 'STAFF_NOT_FOUND', message: 'Staff member not found' },
      });
      return;
    }

    const validatedData = staffUpdateSchema.parse(req.body);
    const updated = await updateById('staff', staffId, validatedData);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors },
      });
      return;
    }

    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update staff' },
    });
  }
};

/**
 * Delete a staff member with batch membership check
 */
export const deleteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const staffId = req.params.staffId;

    // Verify staff exists and belongs to school
    const existing = await findById('staff', staffId);
    if (!existing || (existing as any).school_id !== schoolId) {
      res.status(404).json({
        success: false,
        error: { code: 'STAFF_NOT_FOUND', message: 'Staff member not found' },
      });
      return;
    }

    // Check if staff is in any pending or processing batch
    const batchCheckSql = `
      SELECT DISTINCT sm.submission_id
      FROM submission_members sm
      JOIN batch_submissions bs ON sm.submission_id = bs.id
      WHERE sm.member_id = $1
        AND sm.member_type = 'staff'
        AND bs.school_id = $2
        AND bs.status IN ('submitted', 'processing')
    `;
    const batchResult = await query(batchCheckSql, [staffId, schoolId]);

    if (batchResult.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: {
          code: 'STAFF_IN_BATCH',
          message: 'Cannot delete staff member who is in a pending or processing batch',
        },
      });
      return;
    }

    // Clear count cache for this school
    cache.clear(`staff_count_${schoolId}_all_all_none`);
    cache.clear(`staff_count_${schoolId}_${(existing as any).staff_type}_all_none`);
    if ((existing as any).department) {
      cache.clear(`staff_count_${schoolId}_${(existing as any).staff_type}_${(existing as any).department}_none`);
    }

    await deleteById('staff', staffId);

    res.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete staff' },
    });
  }
};
