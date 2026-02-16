import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne } from '../utils/db-helpers.js';
import { query } from '../config/database.js';
import {
  batchSubmissionSchema,
  batchListQuerySchema,
  BatchSubmissionInput,
} from '../validators/batch.js';
import { logActivity } from '../utils/activity-logger.js';

/**
 * Create a new batch submission
 * POST /api/batches
 */
export const createBatchSubmission = async (
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
    const validation = batchSubmissionSchema.safeParse(req.body);
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

    const { studentIds, staffIds }: BatchSubmissionInput = validation.data;

    // Ensure at least one member is selected
    const totalMembers = (studentIds?.length || 0) + (staffIds?.length || 0);
    if (totalMembers === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_MEMBERS_SELECTED',
          message: 'At least one student or staff member must be selected',
        },
      });
      return;
    }

    // Check if school has uploaded logo and signature
    const schoolCheckSql = `
      SELECT logo_url, signature_url FROM schools WHERE id = $1
    `;
    const school = await executeQueryOne<{ logo_url: string | null; signature_url: string | null }>(
      schoolCheckSql,
      [schoolId]
    );

    if (!school?.logo_url || !school?.signature_url) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SCHOOL_ASSETS',
          message: 'School logo and principal signature are required before submitting batches. Please upload them in your profile.',
          details: {
            missingLogo: !school?.logo_url,
            missingSignature: !school?.signature_url,
          },
        },
      });
      return;
    }

    // Verify all students belong to this school (if any)
    if (studentIds && studentIds.length > 0) {
      const checkSql = `
        SELECT id FROM students
        WHERE id = ANY($1::uuid[]) AND school_id = $2
      `;
      const validStudents = await executeQuery<{ id: string }>(checkSql, [
        studentIds,
        schoolId,
      ]);

      if (validStudents.length !== studentIds.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STUDENTS',
            message: 'Some students do not belong to your school or do not exist',
          },
        });
        return;
      }
    }

    // Verify all staff belong to this school (if any)
    if (staffIds && staffIds.length > 0) {
      const checkSql = `
        SELECT id FROM staff
        WHERE id = ANY($1::uuid[]) AND school_id = $2
      `;
      const validStaff = await executeQuery<{ id: string }>(checkSql, [
        staffIds,
        schoolId,
      ]);

      if (validStaff.length !== staffIds.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STAFF',
            message: 'Some staff members do not belong to your school or do not exist',
          },
        });
        return;
      }
    }

    // Check if any students are already in a pending/processing submission
    if (studentIds && studentIds.length > 0) {
      const duplicateCheckSql = `
        SELECT DISTINCT sm.member_id
        FROM submission_members sm
        JOIN batch_submissions bs ON sm.submission_id = bs.id
        WHERE sm.member_id = ANY($1::uuid[])
          AND sm.member_type = 'student'
          AND bs.school_id = $2
          AND bs.status IN ('submitted', 'processing')
      `;
      const duplicateStudents = await executeQuery<{ member_id: string }>(
        duplicateCheckSql,
        [studentIds, schoolId]
      );

      if (duplicateStudents.length > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'STUDENTS_ALREADY_SUBMITTED',
            message: 'Some students are already in a pending or processing submission',
            details: {
              duplicateStudentIds: duplicateStudents.map((s) => s.member_id),
            },
          },
        });
        return;
      }
    }

    // Check if any staff are already in a pending/processing submission
    if (staffIds && staffIds.length > 0) {
      const duplicateCheckSql = `
        SELECT DISTINCT sm.member_id
        FROM submission_members sm
        JOIN batch_submissions bs ON sm.submission_id = bs.id
        WHERE sm.member_id = ANY($1::uuid[])
          AND sm.member_type = 'staff'
          AND bs.school_id = $2
          AND bs.status IN ('submitted', 'processing')
      `;
      const duplicateStaff = await executeQuery<{ member_id: string }>(
        duplicateCheckSql,
        [staffIds, schoolId]
      );

      if (duplicateStaff.length > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'STAFF_ALREADY_SUBMITTED',
            message: 'Some staff members are already in a pending or processing submission',
            details: {
              duplicateStaffIds: duplicateStaff.map((s) => s.member_id),
            },
          },
        });
        return;
      }
    }

    // Create batch submission using a transaction
    const client = await query('BEGIN');

    try {
      // Insert batch submission
      const insertBatchSql = `
        INSERT INTO batch_submissions (school_id, status)
        VALUES ($1, 'submitted')
        RETURNING *
      `;
      const batchResult = await query(insertBatchSql, [schoolId]);
      const batch = batchResult.rows[0];

      // Insert submission_members records for students
      if (studentIds && studentIds.length > 0) {
        const insertStudentsSql = `
          INSERT INTO submission_members (submission_id, member_type, member_id)
          SELECT $1, 'student', unnest($2::uuid[])
        `;
        await query(insertStudentsSql, [batch.id, studentIds]);
      }

      // Insert submission_members records for staff
      if (staffIds && staffIds.length > 0) {
        const insertStaffSql = `
          INSERT INTO submission_members (submission_id, member_type, member_id)
          SELECT $1, 'staff', unnest($2::uuid[])
        `;
        await query(insertStaffSql, [batch.id, staffIds]);
      }

      // Commit transaction
      await query('COMMIT');

      // Log activity
      await logActivity({
        schoolId,
        activityType: 'batch_submitted',
        entityType: 'batch',
        entityId: batch.id,
        description: `Submitted batch with ${studentIds?.length || 0} student${(studentIds?.length || 0) !== 1 ? 's' : ''} and ${staffIds?.length || 0} staff member${(staffIds?.length || 0) !== 1 ? 's' : ''}`,
        metadata: {
          studentCount: studentIds?.length || 0,
          staffCount: staffIds?.length || 0,
          batchId: batch.id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: batch.id,
          submittedAt: batch.submitted_at,
          status: batch.status,
          studentCount: studentIds?.length || 0,
          staffCount: staffIds?.length || 0,
          totalCount: (studentIds?.length || 0) + (staffIds?.length || 0),
        },
        message: 'Batch submission created successfully',
      });
    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create batch submission error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create batch submission',
      },
    });
  }
};

/**
 * Get list of school's batch submissions
 * GET /api/batches
 */
export const getSchoolBatches = async (
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
    const validation = batchListQuerySchema.safeParse(req.query);
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

    const { page, limit, status } = validation.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = ['bs.school_id = $1'];
    const values: any[] = [schoolId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`bs.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count
      FROM batch_submissions bs
      WHERE ${whereClause}
    `;
    const countResult = await executeQueryOne<{ count: string }>(
      countSql,
      values
    );
    const total = parseInt(countResult?.count || '0');

    // Get paginated data with student and staff count
    const dataSql = `
      SELECT 
        bs.*,
        COUNT(CASE WHEN sm.member_type = 'student' THEN 1 END) as student_count,
        COUNT(CASE WHEN sm.member_type = 'staff' THEN 1 END) as staff_count
      FROM batch_submissions bs
      LEFT JOIN submission_members sm ON bs.id = sm.submission_id
      WHERE ${whereClause}
      GROUP BY bs.id
      ORDER BY bs.submitted_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const batches = await executeQuery(dataSql, [...values, limitNum, offset]);

    res.status(200).json({
      success: true,
      data: batches,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get school batches error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch batch submissions',
      },
    });
  }
};

/**
 * Get batch submission details
 * GET /api/batches/:batchId
 */
export const getBatchDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { batchId } = req.params;

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

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_ID_MISSING',
          message: 'Batch ID is required',
        },
      });
      return;
    }

    // Get batch and verify ownership
    const batchSql = `
      SELECT * FROM batch_submissions
      WHERE id = $1 AND school_id = $2
    `;
    const batch = await executeQueryOne(batchSql, [batchId, schoolId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found or does not belong to your school',
        },
      });
      return;
    }

    // Get students in this batch
    const studentsSql = `
      SELECT s.*
      FROM students s
      JOIN submission_members sm ON s.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'student'
      ORDER BY s.name
    `;
    const students = await executeQuery(studentsSql, [batchId]);

    // Get staff in this batch
    const staffSql = `
      SELECT st.*
      FROM staff st
      JOIN submission_members sm ON st.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
      ORDER BY st.name
    `;
    const staff = await executeQuery(staffSql, [batchId]);

    res.status(200).json({
      success: true,
      data: {
        batch,
        students,
        staff,
        studentCount: students.length,
        staffCount: staff.length,
      },
    });
  } catch (error) {
    console.error('Get batch details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch batch details',
      },
    });
  }
};
