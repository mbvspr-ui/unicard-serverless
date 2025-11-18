import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/student.js';

const router = Router();

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Private (School)
 */
router.post('/', authenticateSchool, createStudent);

/**
 * @route   GET /api/students
 * @desc    Get list of students with pagination and filters
 * @access  Private (School)
 */
router.get('/', authenticateSchool, getStudents);

/**
 * @route   GET /api/students/:studentId
 * @desc    Get a single student by ID
 * @access  Private (School)
 */
router.get('/:studentId', authenticateSchool, getStudentById);

/**
 * @route   PUT /api/students/:studentId
 * @desc    Update a student
 * @access  Private (School)
 */
router.put('/:studentId', authenticateSchool, updateStudent);

/**
 * @route   DELETE /api/students/:studentId
 * @desc    Delete a student
 * @access  Private (School)
 */
router.delete('/:studentId', authenticateSchool, deleteStudent);

export default router;
