import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import {
  getAllSchools,
  getSchoolById,
  updateSchoolStatus,
  getAllBatches,
  getAdminBatchDetails,
} from '../controllers/admin.js';
import {
  downloadBatchCSV,
  downloadBatchPhotos,
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
 * @route   GET /api/admin/batches/:batchId/photos
 * @desc    Download batch photos as ZIP
 * @access  Private (Admin)
 */
router.get('/batches/:batchId/photos', authenticateAdmin, downloadBatchPhotos);

export default router;
