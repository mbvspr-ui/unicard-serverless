import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne } from '../utils/db-helpers.js';
import { query } from '../config/database.js';
import {
  schoolStatusUpdateSchema,
  schoolListQuerySchema,
  adminBatchListQuerySchema,
  SchoolStatusUpdate,
} from '../validators/admin.js';
import { createWriteStream } from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import archiver from 'archiver';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * Get list of all schools with filters
 * GET /api/admin/schools
 */
export const getAllSchools = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate query parameters
    const validation = schoolListQuerySchema.safeParse(req.query);
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

    const { page, limit, status, search } = validation.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM schools ${whereClause}`;
    const countResult = await executeQueryOne<{ count: string }>(
      countSql,
      values
    );
    const total = parseInt(countResult?.count || '0');

    // Get paginated data
    const dataSql = `
      SELECT 
        id, name, email, address, phone, logo_url, signature_url,
        status, rejection_reason, created_at, updated_at
      FROM schools
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const schools = await executeQuery(dataSql, [...values, limitNum, offset]);

    res.status(200).json({
      success: true,
      data: schools,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all schools error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch schools',
      },
    });
  }
};

/**
 * Get school details by ID
 * GET /api/admin/schools/:schoolId
 */
export const getSchoolById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SCHOOL_ID_MISSING',
          message: 'School ID is required',
        },
      });
      return;
    }

    // Get school details
    const schoolSql = `
      SELECT 
        id, name, email, address, phone, logo_url, signature_url,
        status, rejection_reason, created_at, updated_at
      FROM schools
      WHERE id = $1
    `;
    const school = await executeQueryOne(schoolSql, [schoolId]);

    if (!school) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHOOL_NOT_FOUND',
          message: 'School not found',
        },
      });
      return;
    }

    // Get student count
    const countSql = `
      SELECT COUNT(*) as count FROM students WHERE school_id = $1
    `;
    const countResult = await executeQueryOne<{ count: string }>(countSql, [
      schoolId,
    ]);
    const studentCount = parseInt(countResult?.count || '0');

    // Get batch submission count
    const batchCountSql = `
      SELECT COUNT(*) as count FROM batch_submissions WHERE school_id = $1
    `;
    const batchCountResult = await executeQueryOne<{ count: string }>(
      batchCountSql,
      [schoolId]
    );
    const batchCount = parseInt(batchCountResult?.count || '0');

    res.status(200).json({
      success: true,
      data: {
        ...school,
        studentCount,
        batchCount,
      },
    });
  } catch (error) {
    console.error('Get school by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch school details',
      },
    });
  }
};

/**
 * Update school status (approve/reject)
 * PUT /api/admin/schools/:schoolId/status
 */
export const updateSchoolStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SCHOOL_ID_MISSING',
          message: 'School ID is required',
        },
      });
      return;
    }

    // Validate input
    const validation = schoolStatusUpdateSchema.safeParse(req.body);
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

    const { status, reason }: SchoolStatusUpdate = validation.data;

    // Check if school exists
    const checkSql = `SELECT id, status FROM schools WHERE id = $1`;
    const existingSchool = await executeQueryOne<{
      id: string;
      status: string;
    }>(checkSql, [schoolId]);

    if (!existingSchool) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHOOL_NOT_FOUND',
          message: 'School not found',
        },
      });
      return;
    }

    // Update school status
    const updateSql = `
      UPDATE schools
      SET 
        status = $1,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING 
        id, name, email, address, phone, logo_url, signature_url,
        status, rejection_reason, created_at, updated_at
    `;
    const updatedSchool = await executeQueryOne(updateSql, [
      status,
      status === 'rejected' ? reason || null : null,
      schoolId,
    ]);

    // TODO: Send email notification to school (optional)
    // if (status === 'approved') {
    //   await sendApprovalEmail(updatedSchool.email);
    // }

    res.status(200).json({
      success: true,
      data: updatedSchool,
      message: `School ${status} successfully`,
    });
  } catch (error) {
    console.error('Update school status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update school status',
      },
    });
  }
};

/**
 * Get list of all batch submissions (admin)
 * GET /api/admin/batches
 */
export const getAllBatches = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate query parameters
    const validation = adminBatchListQuerySchema.safeParse(req.query);
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

    const { page, limit, schoolId, status, startDate, endDate } =
      validation.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (schoolId) {
      conditions.push(`bs.school_id = $${paramIndex}`);
      values.push(schoolId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`bs.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`bs.submitted_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`bs.submitted_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count
      FROM batch_submissions bs
      ${whereClause}
    `;
    const countResult = await executeQueryOne<{ count: string }>(
      countSql,
      values
    );
    const total = parseInt(countResult?.count || '0');

    // Get paginated data with school info and student count
    const dataSql = `
      SELECT 
        bs.*,
        s.name as school_name,
        s.email as school_email,
        COUNT(ss.student_id) as student_count
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      LEFT JOIN submission_students ss ON bs.id = ss.submission_id
      ${whereClause}
      GROUP BY bs.id, s.name, s.email
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
    console.error('Get all batches error:', error);
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
 * Get batch details by ID (admin)
 * GET /api/admin/batches/:batchId
 */
export const getAdminBatchDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

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

    // Get batch with school info
    const batchSql = `
      SELECT 
        bs.*,
        s.name as school_name,
        s.email as school_email,
        s.address as school_address,
        s.phone as school_phone,
        s.logo_url as school_logo_url,
        s.signature_url as school_signature_url
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      WHERE bs.id = $1
    `;
    const batch = await executeQueryOne(batchSql, [batchId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
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
    console.error('Get admin batch details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch batch details',
      },
    });
  }
};
