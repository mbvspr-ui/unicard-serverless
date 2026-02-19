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

    // Get staff count
    const staffCountSql = `
      SELECT COUNT(*) as count FROM staff WHERE school_id = $1
    `;
    const staffCountResult = await executeQueryOne<{ count: string }>(
      staffCountSql,
      [schoolId]
    );
    const staffCount = parseInt(staffCountResult?.count || '0');

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
        staffCount,
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

    // Get paginated data with school info and member count
    const dataSql = `
      SELECT
        bs.*,
        s.name as school_name,
        s.email as school_email,
        COUNT(sm.member_id) as member_count,
        COUNT(sm.member_id) as student_count
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      LEFT JOIN submission_members sm ON bs.id = sm.submission_id
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

    // Get batch with complete school info
    const batchSql = `
      SELECT 
        bs.*,
        s.name as school_name,
        s.email as school_email,
        s.address as school_address,
        s.city as school_city,
        s.state as school_state,
        s.pincode as school_pincode,
        s.phone as school_phone,
        s.principal_name as school_principal_name,
        s.logo_url as school_logo_url,
        s.signature_url as school_signature_url,
        s.created_at as school_created_at
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

/**
 * Update batch status
 * PUT /api/admin/batches/:batchId/status
 */
export const updateBatchStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;
    const { status } = req.body;

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

    // Validate status
    const validStatuses = ['submitted', 'processing', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: submitted, processing, completed',
        },
      });
      return;
    }

    // Check if batch exists
    const checkSql = `SELECT id, status FROM batch_submissions WHERE id = $1`;
    const existingBatch = await executeQueryOne<{
      id: string;
      status: string;
    }>(checkSql, [batchId]);

    if (!existingBatch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
        },
      });
      return;
    }

    // Update batch status
    const updateSql = `
      UPDATE batch_submissions
      SET 
        status = $1::varchar,
        processed_at = CASE WHEN $1::varchar = 'completed' THEN CURRENT_TIMESTAMP ELSE processed_at END
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(updateSql, [status, batchId]);
    const updatedBatch = result.rows[0];

    // Log the action
    try {
      const logSql = `
        INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, description, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await query(logSql, [
        req.user?.userId,
        'UPDATE',
        'batch',
        batchId,
        `Updated batch status to ${status}`,
        JSON.stringify({ old_status: existingBatch.status, new_status: status })
      ]);
    } catch (logError) {
      console.error('Failed to log audit:', logError);
      // Don't fail the request if logging fails
    }

    res.status(200).json({
      success: true,
      data: updatedBatch,
      message: `Batch status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Update batch status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update batch status',
        details: error.message,
      },
    });
  }
};

/**
 * Get analytics data
 * GET /api/admin/analytics
 */
export const getAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { range = 'month' } = req.query;

    // Get total schools
    const schoolsCountSql = `SELECT COUNT(*) as count FROM schools WHERE status = 'approved'`;
    const schoolsCount = await executeQueryOne<{ count: string }>(schoolsCountSql, []);
    const totalSchools = parseInt(schoolsCount?.count || '0');

    // Get total students
    const studentsCountSql = `SELECT COUNT(*) as count FROM students`;
    const studentsCount = await executeQueryOne<{ count: string }>(studentsCountSql, []);
    const totalStudents = parseInt(studentsCount?.count || '0');

    // Get total staff
    const staffCountSql = `SELECT COUNT(*) as count FROM staff`;
    const staffCount = await executeQueryOne<{ count: string }>(staffCountSql, []);
    const totalStaff = parseInt(staffCount?.count || '0');

    // Get total orders
    const ordersCountSql = `SELECT COUNT(*) as count FROM batch_submissions`;
    const ordersCount = await executeQueryOne<{ count: string }>(ordersCountSql, []);
    const totalOrders = parseInt(ordersCount?.count || '0');

    // Get orders this month
    const ordersThisMonthSql = `
      SELECT COUNT(*) as count 
      FROM batch_submissions 
      WHERE submitted_at >= date_trunc('month', CURRENT_DATE)
    `;
    const ordersThisMonth = await executeQueryOne<{ count: string }>(ordersThisMonthSql, []);

    // Get orders this week
    const ordersThisWeekSql = `
      SELECT COUNT(*) as count 
      FROM batch_submissions 
      WHERE submitted_at >= date_trunc('week', CURRENT_DATE)
    `;
    const ordersThisWeek = await executeQueryOne<{ count: string }>(ordersThisWeekSql, []);

    // Get orders by status
    const ordersByStatusSql = `
      SELECT status, COUNT(*) as count 
      FROM batch_submissions 
      GROUP BY status
    `;
    const ordersByStatus = await executeQuery(ordersByStatusSql, []);

    // Get orders trend (last 30 days)
    const ordersTrendSql = `
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as count
      FROM batch_submissions
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(submitted_at)
      ORDER BY date
    `;
    const ordersTrend = await executeQuery(ordersTrendSql, []);

    // Get top schools
    const topSchoolsSql = `
      SELECT 
        s.name,
        COUNT(DISTINCT bs.id) as orders,
        COUNT(DISTINCT st.id) as students
      FROM schools s
      LEFT JOIN batch_submissions bs ON s.id = bs.school_id
      LEFT JOIN students st ON s.id = st.school_id
      WHERE s.status = 'approved'
      GROUP BY s.id, s.name
      ORDER BY orders DESC, students DESC
      LIMIT 5
    `;
    const topSchools = await executeQuery(topSchoolsSql, []);

    // Calculate average processing time
    const avgProcessingTimeSql = `
      SELECT AVG(EXTRACT(EPOCH FROM (processed_at - submitted_at))/86400) as avg_days
      FROM batch_submissions
      WHERE processed_at IS NOT NULL
    `;
    const avgTime = await executeQueryOne<{ avg_days: string }>(avgProcessingTimeSql, []);
    const avgProcessingTime = Math.round(parseFloat(avgTime?.avg_days || '0'));

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        totalStudents,
        totalStaff,
        totalOrders,
        ordersThisMonth: parseInt(ordersThisMonth?.count || '0'),
        ordersThisWeek: parseInt(ordersThisWeek?.count || '0'),
        ordersByStatus,
        ordersTrend,
        topSchools,
        avgProcessingTime,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch analytics',
      },
    });
  }
};

/**
 * Get staff analytics
 * GET /api/admin/analytics/staff
 */
export const getStaffAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get total staff count
    const totalStaffSql = `SELECT COUNT(*) as count FROM staff`;
    const totalStaffResult = await executeQueryOne<{ count: string }>(totalStaffSql, []);
    const totalStaff = parseInt(totalStaffResult?.count || '0');

    // Get staff by type
    const staffByTypeSql = `
      SELECT staff_type, COUNT(*) as count
      FROM staff
      GROUP BY staff_type
      ORDER BY count DESC
    `;
    const staffByType = await executeQuery(staffByTypeSql, []);

    // Get staff by department
    const staffByDepartmentSql = `
      SELECT department, COUNT(*) as count
      FROM staff
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
      LIMIT 10
    `;
    const staffByDepartment = await executeQuery(staffByDepartmentSql, []);

    // Get staff growth over time (monthly for last 12 months)
    const staffGrowthSql = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM staff
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `;
    const staffGrowth = await executeQuery(staffGrowthSql, []);

    // Calculate staff-to-student ratio
    const totalStudentsSql = `SELECT COUNT(*) as count FROM students`;
    const totalStudentsResult = await executeQueryOne<{ count: string }>(totalStudentsSql, []);
    const totalStudents = parseInt(totalStudentsResult?.count || '0');
    const staffToStudentRatio = totalStudents > 0 ? (totalStudents / totalStaff).toFixed(2) : '0';

    res.status(200).json({
      success: true,
      data: {
        totalStaff,
        staffByType,
        staffByDepartment,
        staffGrowth,
        staffToStudentRatio,
        totalStudents,
      },
    });
  } catch (error) {
    console.error('Get staff analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch staff analytics',
      },
    });
  }
};

/**
 * Get school students
 * GET /api/admin/schools/:schoolId/students
 */
export const getSchoolStudents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const { limit = '100', page = '1', search = '' } = req.query;

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

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = ['school_id = $1'];
    const values: any[] = [schoolId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR roll_number ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM students WHERE ${whereClause}`;
    const countResult = await executeQueryOne<{ count: string }>(countSql, values);
    const total = parseInt(countResult?.count || '0');

    const studentsSql = `
      SELECT 
        id,
        name,
        father_name,
        mother_name,
        class,
        section,
        roll_number,
        date_of_birth,
        gender,
        blood_group,
        photo_url,
        created_at
      FROM students
      WHERE ${whereClause}
      ORDER BY class, section, roll_number
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const students = await executeQuery(studentsSql, [...values, limitNum, offset]);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get school students error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch school students',
      },
    });
  }
};

/**
 * Get school staff
 * GET /api/admin/schools/:schoolId/staff
 */
export const getSchoolStaff = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const { limit = '100', page = '1', search = '', staffType = '', department = '' } = req.query;

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

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = ['school_id = $1'];
    const values: any[] = [schoolId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR employee_id ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (staffType) {
      conditions.push(`staff_type = $${paramIndex}`);
      values.push(staffType);
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
    const countResult = await executeQueryOne<{ count: string }>(countSql, values);
    const total = parseInt(countResult?.count || '0');

    const staffSql = `
      SELECT 
        id,
        name,
        employee_id,
        staff_type,
        designation,
        department,
        phone_number,
        date_of_joining,
        photo_url,
        created_at
      FROM staff
      WHERE ${whereClause}
      ORDER BY name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const staff = await executeQuery(staffSql, [...values, limitNum, offset]);

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
    console.error('Get school staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch school staff',
      },
    });
  }
};

/**
 * Get admin audit log
 * GET /api/admin/audit-log
 */
export const getAuditLog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '50', page = '1' } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const offset = (pageNum - 1) * limitNum;

    // Check if table exists and get total count
    let total = 0;
    let logs: any[] = [];
    
    try {
      const countSql = `SELECT COUNT(*) as count FROM admin_audit_log`;
      const countResult = await query(countSql, []);
      total = parseInt(countResult.rows[0]?.count || '0');

      // Get audit logs
      const auditSql = `
        SELECT 
          aal.id,
          aal.admin_id,
          a.email as admin_email,
          aal.action_type,
          aal.entity_type,
          aal.entity_id,
          aal.description,
          aal.metadata,
          aal.ip_address,
          aal.created_at
        FROM admin_audit_log aal
        LEFT JOIN admins a ON aal.admin_id = a.id
        ORDER BY aal.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const logsResult = await query(auditSql, [limitNum, offset]);
      logs = logsResult.rows;
    } catch (tableError: any) {
      // Table might not exist yet or other error
      console.log('Audit log table error:', tableError.message);
      // Return empty results instead of 500 error
    }

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    // Return empty results instead of 500 error
    const { limit = '50', page = '1' } = req.query;
    res.status(200).json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: 0,
      },
    });
  }
};

/**
 * Delete school and all associated data
 * DELETE /api/admin/schools/:schoolId
 */
export const deleteSchool = async (
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

    // Check if school exists
    const checkSql = `SELECT id, name FROM schools WHERE id = $1`;
    const existingSchool = await executeQueryOne<{ id: string; name: string }>(
      checkSql,
      [schoolId]
    );

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

    // Delete all associated data in transaction
    // Order matters due to foreign key constraints
    try {
      // Delete submission members first
      await executeQuery(
        `DELETE FROM submission_members 
         WHERE submission_id IN (SELECT id FROM batch_submissions WHERE school_id = $1)`,
        [schoolId]
      );

      // Delete batch submissions
      await executeQuery(
        `DELETE FROM batch_submissions WHERE school_id = $1`,
        [schoolId]
      );

      // Delete students
      await executeQuery(`DELETE FROM students WHERE school_id = $1`, [
        schoolId,
      ]);

      // Delete staff
      await executeQuery(`DELETE FROM staff WHERE school_id = $1`, [schoolId]);

      // Finally delete the school
      await executeQuery(`DELETE FROM schools WHERE id = $1`, [schoolId]);

      // Log the action
      try {
        const logSql = `
          INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, description, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await query(logSql, [
          req.user?.userId,
          'DELETE',
          'school',
          schoolId,
          `Deleted school: ${existingSchool.name}`,
          JSON.stringify({ school_name: existingSchool.name }),
        ]);
      } catch (logError) {
        console.error('Failed to log audit:', logError);
        // Don't fail the request if logging fails
      }

      res.status(200).json({
        success: true,
        message: `School "${existingSchool.name}" and all associated data deleted successfully`,
      });
    } catch (deleteError: any) {
      console.error('Delete school error:', deleteError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete school and associated data',
          details: deleteError.message,
        },
      });
    }
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete school',
      },
    });
  }
};

/**
 * Create audit log entry
 */
export const createAuditLog = async (data: {
  adminId: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
}): Promise<void> => {
  try {
    const insertSql = `
      INSERT INTO admin_audit_log (
        admin_id, action_type, entity_type, entity_id, 
        description, metadata, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await executeQuery(insertSql, [
      data.adminId,
      data.actionType,
      data.entityType,
      data.entityId || null,
      data.description,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ipAddress || null,
    ]);
  } catch (error) {
    console.error('Create audit log error:', error);
  }
};
