import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import {
  createStaff,
  getStaffList,
  getStaff,
  updateStaff,
  deleteStaff,
} from '../controllers/staff.js';

const router = Router();

/**
 * @route   POST /api/staff
 * @desc    Create a new staff member
 * @access  Private (School)
 */
router.post('/', authenticateSchool, createStaff);

/**
 * @route   GET /api/staff
 * @desc    Get list of staff with pagination and filters
 * @access  Private (School)
 */
router.get('/', authenticateSchool, getStaffList);

/**
 * @route   GET /api/staff/:staffId
 * @desc    Get a single staff member by ID
 * @access  Private (School)
 */
router.get('/:staffId', authenticateSchool, getStaff);

/**
 * @route   PUT /api/staff/:staffId
 * @desc    Update a staff member
 * @access  Private (School)
 */
router.put('/:staffId', authenticateSchool, updateStaff);

/**
 * @route   DELETE /api/staff/:staffId
 * @desc    Delete a staff member
 * @access  Private (School)
 */
router.delete('/:staffId', authenticateSchool, deleteStaff);

export default router;
