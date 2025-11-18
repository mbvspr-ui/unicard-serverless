import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import {
  uploadSchoolLogo,
  uploadSchoolSignature,
  uploadStudentPhoto as uploadStudentPhotoToR2,
  validateFileType,
  validateFileSize,
} from '../config/storage.js';
import { executeQueryOne } from '../utils/db-helpers.js';
import { logActivity } from '../utils/activity-logger.js';

/**
 * Upload school logo
 * POST /api/schools/upload-logo
 */
export const uploadLogo = async (
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

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_MISSING',
          message: 'No file uploaded',
        },
      });
      return;
    }

    // Validate file type and size
    if (!validateFileType(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Invalid file type. Only JPEG and PNG images are allowed.',
        },
      });
      return;
    }

    if (!validateFileSize(req.file.size)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit',
        },
      });
      return;
    }

    // Upload to R2
    const logoUrl = await uploadSchoolLogo(
      req.file.buffer,
      schoolId,
      req.file.mimetype
    );

    // Update school record in database
    const sql = `
      UPDATE schools
      SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, logo_url
    `;
    const school = await executeQueryOne(sql, [logoUrl, schoolId]);

    if (!school) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHOOL_NOT_FOUND',
          message: 'School not found',
        },
      });
      return;
    }

    // Log activity
    await logActivity({
      schoolId,
      activityType: 'logo_uploaded',
      entityType: 'school',
      description: 'Uploaded school logo',
      metadata: {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        logoUrl,
        school,
      },
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: 'Failed to upload logo',
      },
    });
  }
};

/**
 * Upload school signature
 * POST /api/schools/upload-signature
 */
export const uploadSignature = async (
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

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_MISSING',
          message: 'No file uploaded',
        },
      });
      return;
    }

    // Validate file type and size
    if (!validateFileType(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Invalid file type. Only JPEG and PNG images are allowed.',
        },
      });
      return;
    }

    if (!validateFileSize(req.file.size)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit',
        },
      });
      return;
    }

    // Upload to R2
    const signatureUrl = await uploadSchoolSignature(
      req.file.buffer,
      schoolId,
      req.file.mimetype
    );

    // Update school record in database
    const sql = `
      UPDATE schools
      SET signature_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, signature_url
    `;
    const school = await executeQueryOne(sql, [signatureUrl, schoolId]);

    if (!school) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHOOL_NOT_FOUND',
          message: 'School not found',
        },
      });
      return;
    }

    // Log activity
    await logActivity({
      schoolId,
      activityType: 'signature_uploaded',
      entityType: 'school',
      description: 'Uploaded principal signature',
      metadata: {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        signatureUrl,
        school,
      },
      message: 'Signature uploaded successfully',
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: 'Failed to upload signature',
      },
    });
  }
};

/**
 * Upload student photo
 * POST /api/students/:studentId/photo
 */
export const uploadStudentPhoto = async (
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

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_MISSING',
          message: 'No file uploaded',
        },
      });
      return;
    }

    // Validate file type and size
    if (!validateFileType(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Invalid file type. Only JPEG and PNG images are allowed.',
        },
      });
      return;
    }

    if (!validateFileSize(req.file.size)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit',
        },
      });
      return;
    }

    // Verify student belongs to this school
    const checkSql = `
      SELECT id, school_id FROM students
      WHERE id = $1 AND school_id = $2
    `;
    const student = await executeQueryOne(checkSql, [studentId, schoolId]);

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

    // Upload to R2
    const photoUrl = await uploadStudentPhotoToR2(
      req.file.buffer,
      schoolId,
      studentId,
      req.file.mimetype
    );

    // Update student record in database
    const updateSql = `
      UPDATE students
      SET photo_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, photo_url
    `;
    const updatedStudent = await executeQueryOne(updateSql, [photoUrl, studentId]);

    res.status(200).json({
      success: true,
      data: {
        photoUrl,
        student: updatedStudent,
      },
      message: 'Student photo uploaded successfully',
    });
  } catch (error) {
    console.error('Upload student photo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: 'Failed to upload student photo',
      },
    });
  }
};
