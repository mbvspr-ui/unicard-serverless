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

    const { studentIds }: BatchSubmissionInput = validation.data;

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

    // Verify all students belong to this school
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

    // Check if any students are already in a pending/processing submission
    const duplicateCheckSql = `
      SELECT DISTINCT ss.student_id
      FROM submission_students ss
      JOIN batch_submissions bs ON ss.submission_id = bs.id
      WHERE ss.student_id = ANY($1::uuid[])
        AND bs.school_id = $2
        AND bs.status IN ('submitted', 'processing')
    `;
    const duplicateStudents = await executeQuery<{ student_id: string }>(
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
            duplicateStudentIds: duplicateStudents.map((s) => s.student_id),
          },
        },
      });
      return;
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

      // Insert submission_students records
      const insertStudentsSql = `
        INSERT INTO submission_students (submission_id, student_id)
        SELECT $1, unnest($2::uuid[])
      `;
      await query(insertStudentsSql, [batch.id, studentIds]);

      // Commit transaction
      await query('COMMIT');

      // Log activity
      await logActivity({
        schoolId,
        activityType: 'batch_submitted',
        entityType: 'batch',
        entityId: batch.id,
        description: `Submitted batch with ${studentIds.length} student${studentIds.length > 1 ? 's' : ''}`,
        metadata: {
          studentCount: studentIds.length,
          batchId: batch.id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: batch.id,
          submittedAt: batch.submitted_at,
          status: batch.status,
          studentCount: studentIds.length,
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

    // Get paginated data with student count
    const dataSql = `
      SELECT 
        bs.*,
        COUNT(ss.student_id) as student_count
      FROM batch_submissions bs
      LEFT JOIN submission_students ss ON bs.id = ss.submission_id
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
      JOIN submission_students ss ON s.id = ss.student_id
      WHERE ss.submission_id = $1
      ORDER BY s.name
    `;
    const students = await executeQuery(studentsSql, [batchId]);

    res.status(200).json({
      success: true,
      data: {
        batch,
        students,
        studentCount: students.length,
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
