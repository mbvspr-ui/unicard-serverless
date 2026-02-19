import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { insertOne, updateById, deleteById, findById, query } from '../utils/db-helpers.js';
import { studentSchema, studentUpdateSchema, StudentInput } from '../validators/student.js';
import { cache } from '../utils/cache.js';

/**
 * Create a new student
 */
export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    if (!schoolId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const validatedData = studentSchema.parse(req.body) as StudentInput;

    const student = await insertOne('students', {
      school_id: schoolId,
      ...validatedData,
    });

    // Clear count cache for this school when student is added
    cache.clear(`student_count_${schoolId}_all_all_none`);
    cache.clear(`student_count_${schoolId}_${validatedData.class}_all_none`);
    cache.clear(`student_count_${schoolId}_${validatedData.class}_${validatedData.section}_none`);

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors },
      });
      return;
    }

    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create student' },
    });
  }
};

/**
 * Get students with pagination, search, and filters
 */
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const classFilter = req.query.class as string;
    const sectionFilter = req.query.section as string;

    let sql = 'SELECT * FROM students WHERE school_id = $1';
    const params: any[] = [schoolId];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR father_name ILIKE $${paramIndex} OR roll_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add class filter
    if (classFilter) {
      sql += ` AND class = $${paramIndex}`;
      params.push(classFilter);
      paramIndex++;
    }

    // Add section filter
    if (sectionFilter) {
      sql += ` AND section = $${paramIndex}`;
      params.push(sectionFilter);
      paramIndex++;
    }

    // Get total count (with caching to improve performance)
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = `student_count_${schoolId}_${classFilter || 'all'}_${sectionFilter || 'all'}_${search || 'none'}`;
    
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
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch students' },
    });
  }
};

/**
 * Get a single student
 */
export const getStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const studentId = req.params.studentId;

    const student = await findById('students', studentId);

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
      });
      return;
    }

    // Verify student belongs to school
    if ((student as any).school_id !== schoolId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch student' },
    });
  }
};

/**
 * Update a student
 */
export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const studentId = req.params.studentId;

    // Verify student exists and belongs to school
    const existing = await findById('students', studentId);
    if (!existing || (existing as any).school_id !== schoolId) {
      res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
      });
      return;
    }

    const validatedData = studentUpdateSchema.parse(req.body);
    const updated = await updateById('students', studentId, validatedData);

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

    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update student' },
    });
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.userId;
    const studentId = req.params.studentId;

    // Verify student exists and belongs to school
    const existing = await findById('students', studentId);
    if (!existing || (existing as any).school_id !== schoolId) {
      res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
      });
      return;
    }

    await deleteById('students', studentId);

    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete student' },
    });
  }
};
