import { Router } from 'express';
import { getPublicSystemOptions } from '../controllers/systemOptions.js';

const router = Router();

/**
 * @route   GET /api/system-options
 * @desc    Get active system options for portal forms
 * @access  Public
 */
router.get('/', getPublicSystemOptions);

export default router;
