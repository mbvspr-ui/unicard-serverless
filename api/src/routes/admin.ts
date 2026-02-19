import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import {
  getAllSchools,
  getSchoolById,
  updateSchoolStatus,
  deleteSchool,
  getAllBatches,
  getAdminBatchDetails,
  updateBatchStatus,
  getAnalytics,
  getStaffAnalytics,
  getSchoolStudents,
  getSchoolStaff,
  getAuditLog,
} from '../controllers/admin.js';
import {
  downloadBatchCSV,
  downloadBatchPhotos,
  downloadStaffCSV,
} from '../controllers/export.js';

const router = Router();

/**
 * @route   GET /api/admin/schools
 * @desc    Get list of all schools with filters
 * @access  Private (Admin)
 */
router.get('/schools', authenticateAdmin, getAllSchools);

/**
 * @route   GET /api/admin/schools/:schoolId
 * @desc    Get school details by ID
 * @access  Private (Admin)
 */
router.get('/schools/:schoolId', authenticateAdmin, getSchoolById);

/**
 * @route   PUT /api/admin/schools/:schoolId/status
 * @desc    Update school status (approve/reject)
 * @access  Private (Admin)
 */
router.put('/schools/:schoolId/status', authenticateAdmin, updateSchoolStatus);

/**
 * @route   DELETE /api/admin/schools/:schoolId
 * @desc    Delete school and all associated data
 * @access  Private (Admin)
 */
router.delete('/schools/:schoolId', authenticateAdmin, deleteSchool);

/**
 * @route   GET /api/admin/batches
 * @desc    Get list of all batch submissions
 * @access  Private (Admin)
 */
router.get('/batches', authenticateAdmin, getAllBatches);

/**
 * @route   GET /api/admin/batches/:batchId
 * @desc    Get batch details by ID
 * @access  Private (Admin)
 */
router.get('/batches/:batchId', authenticateAdmin, getAdminBatchDetails);

/**
 * @route   GET /api/admin/batches/:batchId/csv
 * @desc    Download batch data as CSV
 * @access  Private (Admin)
 */
router.get('/batches/:batchId/csv', authenticateAdmin, downloadBatchCSV);

/**
 * @route   GET /api/admin/batches/:batchId/staff-csv
 * @desc    Download staff data as CSV
 * @access  Private (Admin)
 */
router.get('/batches/:batchId/staff-csv', authenticateAdmin, downloadStaffCSV);

/**
 * @route   GET /api/admin/batches/:batchId/photos
 * @desc    Download batch photos as ZIP
 * @access  Private (Admin)
 */
router.get('/batches/:batchId/photos', authenticateAdmin, downloadBatchPhotos);

/**
 * @route   PUT /api/admin/batches/:batchId/status
 * @desc    Update batch status
 * @access  Private (Admin)
 */
router.put('/batches/:batchId/status', authenticateAdmin, updateBatchStatus);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data
 * @access  Private (Admin)
 */
router.get('/analytics', authenticateAdmin, getAnalytics);

/**
 * @route   GET /api/admin/analytics/staff
 * @desc    Get staff analytics data
 * @access  Private (Admin)
 */
router.get('/analytics/staff', authenticateAdmin, getStaffAnalytics);

/**
 * @route   GET /api/admin/schools/:schoolId/students
 * @desc    Get school students
 * @access  Private (Admin)
 */
router.get('/schools/:schoolId/students', authenticateAdmin, getSchoolStudents);

/**
 * @route   GET /api/admin/schools/:schoolId/staff
 * @desc    Get school staff
 * @access  Private (Admin)
 */
router.get('/schools/:schoolId/staff', authenticateAdmin, getSchoolStaff);

/**
 * @route   GET /api/admin/audit-log
 * @desc    Get admin audit log
 * @access  Private (Admin)
 */
router.get('/audit-log', authenticateAdmin, getAuditLog);

export default router;
