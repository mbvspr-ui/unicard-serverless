import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import {
  createBatchSubmission,
  getSchoolBatches,
  getBatchDetails,
} from '../controllers/batch.js';

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

export default router;
