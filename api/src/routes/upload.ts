import { Router } from 'express';
import { authenticateSchool } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  uploadLogo,
  uploadSignature,
  uploadStudentPhoto,
  uploadStaffPhoto,
} from '../controllers/upload.js';

const router = Router();

/**
 * @route   POST /api/upload/logo
 * @desc    Upload school logo
 * @access  Private (School)
 */
router.post(
  '/upload/logo',
  ...authenticateSchool,
  uploadSingle('logo'),
  uploadLogo
);

/**
 * @route   POST /api/upload/signature
 * @desc    Upload school signature
 * @access  Private (School)
 */
router.post(
  '/upload/signature',
  ...authenticateSchool,
  uploadSingle('signature'),
  uploadSignature
);

/**
 * @route   POST /api/students/:studentId/photo
 * @desc    Upload student photo
 * @access  Private (School)
 */
router.post(
  '/students/:studentId/photo',
  ...authenticateSchool,
  uploadSingle('photo'),
  uploadStudentPhoto
);

export default router;

/**
 * @route   POST /api/staff/:staffId/photo
 * @desc    Upload staff photo
 * @access  Private (School)
 */
router.post(
  '/staff/:staffId/photo',
  ...authenticateSchool,
  uploadSingle('photo'),
  uploadStaffPhoto
);
