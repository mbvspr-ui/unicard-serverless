import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import {
  createBatchSubmission,
  getSchoolBatches,
  getBatchDetails,
} from '../controllers/batch.js';
import {
  downloadBatchExcel,
  downloadBatchCSV,
  downloadBatchPhotos,
  downloadStaffCSV,
} from '../controllers/export.js';

const router = Router();

/**
 * @route   POST /api/batches
 * @desc    Create a new batch submission
 * @access  Private (School)
 */
router.post('/', authenticateSchool, createBatchSubmission);

/**
 * @route   GET /api/batches
 * @desc    Get list of school's batch submissions
 * @access  Private (School)
 */
router.get('/', authenticateSchool, getSchoolBatches);

/**
 * @route   GET /api/batches/:batchId
 * @desc    Get batch submission details
 * @access  Private (School)
 */
router.get('/:batchId', authenticateSchool, getBatchDetails);

/**
 * @route   GET /api/batches/:batchId/excel
 * @desc    Download batch data as Excel
 * @access  Private (School)
 */
router.get('/:batchId/excel', authenticateSchool, downloadBatchExcel);

/**
 * @route   GET /api/batches/:batchId/csv
 * @desc    Download batch data as CSV
 * @access  Private (School)
 */
router.get('/:batchId/csv', authenticateSchool, downloadBatchCSV);

/**
 * @route   GET /api/batches/:batchId/photos
 * @desc    Download batch photos as ZIP
 * @access  Private (School)
 */
router.get('/:batchId/photos', authenticateSchool, downloadBatchPhotos);

/**
 * @route   GET /api/batches/:batchId/staff-csv
 * @desc    Download staff data as CSV
 * @access  Private (School)
 */
router.get('/:batchId/staff-csv', authenticateSchool, downloadStaffCSV);

export default router;
