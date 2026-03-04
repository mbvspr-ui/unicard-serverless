import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne } from '../utils/db-helpers.js';
import {
  studentSchema,
  studentUpdateSchema,
  studentListQuerySchema,
  StudentInput,
  StudentUpdateInput,
} from '../validators/student.js';

/**
 * Create a new student
 * POST /api/students
 */
export const createStudent = async (
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
    const validation = studentSchema.safeParse(req.body);
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

    const data: StudentInput = validation.data;

    // Insert student into database
    const sql = `
      INSERT INTO students (
        school_id, name, father_name, mother_name, class, section,
        roll_number, student_id, date_of_birth, gender, phone_number,
        blood_group, address, state, district, city, pincode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      schoolId,
      data.name,
      data.father_name || null,
      data.mother_name || null,
      data.class,
      data.section || null,
      data.roll_number || null,
      data.student_id || null,
      data.date_of_birth || null,
      data.gender || null,
      data.phone_number || null,
      data.blood_group || null,
      data.address || null,
      data.state || null,
      data.district || null,
      data.city || null,
      data.pincode || null,
    ];

    const student = await executeQueryOne(sql, values);

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create student',
      },
    });
  }
};

/**
 * Get list of students with pagination and filters
 * GET /api/students
 */
export const getStudents = async (
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
    const validation = studentListQuerySchema.safeParse(req.query);
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

    const { page, limit, search, class: className, section } = validation.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = ['school_id = $1'];
    const values: any[] = [schoolId];
    let paramIndex = 2;

    if (search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR father_name ILIKE $${paramIndex} OR roll_number ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (className) {
      conditions.push(`class = $${paramIndex}`);
      values.push(className);
      paramIndex++;
    }

    if (section) {
      conditions.push(`section = $${paramIndex}`);
      values.push(section);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM students WHERE ${whereClause}`;
    const countResult = await executeQueryOne<{ count: string }>(
      countSql,
      values
    );
    const total = parseInt(countResult?.count || '0');

    // Get paginated data
    const dataSql = `
      SELECT * FROM students
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const students = await executeQuery(dataSql, [
      ...values,
      limitNum,
      offset,
    ]);

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
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch students',
      },
    });
  }
};

/**
 * Get a single student by ID
 * GET /api/students/:studentId
 */
export const getStudentById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { studentId } = req.params;

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

    if (!studentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STUDENT_ID_MISSING',
          message: 'Student ID is required',
        },
      });
      return;
    }

    // Get student and verify ownership
    const sql = `
      SELECT * FROM students
      WHERE id = $1 AND school_id = $2
    `;
    const student = await executeQueryOne(sql, [studentId, schoolId]);

    if (!student) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student not found or does not belong to your school',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch student',
      },
    });
  }
};

/**
 * Update a student
 * PUT /api/students/:studentId
 */
export const updateStudent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { studentId } = req.params;

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

    if (!studentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STUDENT_ID_MISSING',
          message: 'Student ID is required',
        },
      });
      return;
    }

    // Validate input
    const validation = studentUpdateSchema.safeParse(req.body);
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

    const data: StudentUpdateInput = validation.data;

    // Check if student exists and belongs to school
    const checkSql = `
      SELECT id FROM students
      WHERE id = $1 AND school_id = $2
    `;
    const existingStudent = await executeQueryOne(checkSql, [
      studentId,
      schoolId,
    ]);

    if (!existingStudent) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student not found or does not belong to your school',
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
    values.push(studentId, schoolId);

    const updateSql = `
      UPDATE students
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND school_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedStudent = await executeQueryOne(updateSql, values);

    res.status(200).json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update student',
      },
    });
  }
};

/**
 * Delete a student
 * DELETE /api/students/:studentId
 */
export const deleteStudent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const { studentId } = req.params;

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

    if (!studentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STUDENT_ID_MISSING',
          message: 'Student ID is required',
        },
      });
      return;
    }

    // Check if student exists and belongs to school
    const checkSql = `
      SELECT id FROM students
      WHERE id = $1 AND school_id = $2
    `;
    const existingStudent = await executeQueryOne(checkSql, [
      studentId,
      schoolId,
    ]);

    if (!existingStudent) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student not found or does not belong to your school',
        },
      });
      return;
    }

    // Delete student
    const deleteSql = `
      DELETE FROM students
      WHERE id = $1 AND school_id = $2
    `;
    await executeQuery(deleteSql, [studentId, schoolId]);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete student',
      },
    });
  }
};
