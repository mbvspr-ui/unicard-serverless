import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne } from '../utils/db-helpers.js';
import {
  staffSchema,
  staffUpdateSchema,
  staffListQuerySchema,
  StaffInput,
  StaffUpdateInput,
} from '../validators/staff.js';

/**
 * Create a new staff member
 * POST /api/staff
 */
export const createStaff = async (
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

    // Validate input
    const validation = staffSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.errors,
        },
      });
      return;
    }

    const data: StaffInput = validation.data;

    // Insert staff into database
    const sql = `
      INSERT INTO staff (
        school_id, name, father_spouse_name, date_of_birth, gender, phone_number,
        blood_group, photo_url, employee_id, staff_type, designation, department,
        date_of_joining, qualification, address, state, district, city, pincode,
        emergency_contact_name, emergency_contact_number, emergency_contact_relationship
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      schoolId,
      data.name,
      data.father_spouse_name || null,
      data.date_of_birth || null,
      data.gender || null,
      data.phone_number || null,
      data.blood_group || null,
      data.photo_url || null,
      data.employee_id || null,
      data.staff_type,
      data.designation,
      data.department || null,
      data.date_of_joining || null,
      data.qualification || null,
      data.address || null,
      data.state,
      data.district,
      data.city,
      data.pincode,
      data.emergency_contact_name || null,
      data.emergency_contact_number || null,
      data.emergency_contact_relationship || null,
    ];

    const staff = await executeQueryOne(sql, values);

    res.status(201).json({
      success: true,
      data: staff,
      message: 'Staff member created successfully',
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create staff member',
      },
    });
  }
};

/**
 * Get list of staff with pagination and filters
 * GET /api/staff
 */
export const getStaffList = async (
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

    // Validate query parameters
    const validation = staffListQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validation.error.errors,
        },
      });
      return;
    }

    const { page, limit, search, staff_type, department } = validation.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = ['school_id = $1'];
    const values: any[] = [schoolId];
    let paramIndex = 2;

    if (search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR employee_id ILIKE $${paramIndex} OR department ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (staff_type) {
      conditions.push(`staff_type = $${paramIndex}`);
      values.push(staff_type);
      paramIndex++;
    }

    if (department) {
      conditions.push(`department = $${paramIndex}`);
      values.push(department);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM staff WHERE ${whereClause}`;
    const countResult = await executeQueryOne<{ count: string }>(
      countSql,
      values
    );
    const total = parseInt(countResult?.count || '0');

    // Get paginated data
    const dataSql = `
      SELECT * FROM staff
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const staff = await executeQuery(dataSql, [
      ...values,
      limitNum,
      offset,
    ]);

    res.status(200).json({
      success: true,
      data: staff,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch staff',
      },
    });
  }
};

/**
 * Get a single staff member by ID
 * GET /api/staff/:staffId
 */
export const getStaff = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { staffId } = req.params;

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

    if (!staffId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STAFF_ID_MISSING',
          message: 'Staff ID is required',
        },
      });
      return;
    }

    // Get staff and verify ownership
    const sql = `
      SELECT * FROM staff
      WHERE id = $1 AND school_id = $2
    `;
    const staff = await executeQueryOne(sql, [staffId, schoolId]);

    if (!staff) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to your school',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch staff member',
      },
    });
  }
};

/**
 * Update a staff member
 * PUT /api/staff/:staffId
 */
export const updateStaff = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { staffId } = req.params;

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

    if (!staffId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STAFF_ID_MISSING',
          message: 'Staff ID is required',
        },
      });
      return;
    }

    // Validate input
    const validation = staffUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.errors,
        },
      });
      return;
    }

    const data: StaffUpdateInput = validation.data;

    // Check if staff exists and belongs to school
    const checkSql = `
      SELECT id FROM staff
      WHERE id = $1 AND school_id = $2
    `;
    const existingStaff = await executeQueryOne(checkSql, [
      staffId,
      schoolId,
    ]);

    if (!existingStaff) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to your school',
        },
      });
      return;
    }

    // Build UPDATE query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATE_DATA',
          message: 'No data provided for update',
        },
      });
      return;
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    values.push(staffId, schoolId);

    const updateSql = `
      UPDATE staff
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND school_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedStaff = await executeQueryOne(updateSql, values);

    res.status(200).json({
      success: true,
      data: updatedStaff,
      message: 'Staff member updated successfully',
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update staff member',
      },
    });
  }
};

/**
 * Delete a staff member
 * DELETE /api/staff/:staffId
 */
export const deleteStaff = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { staffId } = req.params;

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

    if (!staffId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STAFF_ID_MISSING',
          message: 'Staff ID is required',
        },
      });
      return;
    }

    // Check if staff exists and belongs to school
    const checkSql = `
      SELECT id FROM staff
      WHERE id = $1 AND school_id = $2
    `;
    const existingStaff = await executeQueryOne(checkSql, [
      staffId,
      schoolId,
    ]);

    if (!existingStaff) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to your school',
        },
      });
      return;
    }

    // Check if staff is in any pending batches
    const batchCheckSql = `
      SELECT sm.id
      FROM submission_members sm
      JOIN batch_submissions bs ON sm.submission_id = bs.id
      WHERE sm.member_type = 'staff'
        AND sm.member_id = $1
        AND bs.status IN ('submitted', 'processing')
      LIMIT 1
    `;
    const inBatch = await executeQueryOne(batchCheckSql, [staffId]);

    if (inBatch) {
      res.status(409).json({
        success: false,
        error: {
          code: 'STAFF_IN_BATCH',
          message: 'Cannot delete staff member who is in a pending batch submission',
        },
      });
      return;
    }

    // Delete staff
    const deleteSql = `
      DELETE FROM staff
      WHERE id = $1 AND school_id = $2
    `;
    await executeQuery(deleteSql, [staffId, schoolId]);

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete staff member',
      },
    });
  }
};
