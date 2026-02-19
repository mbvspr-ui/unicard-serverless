import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { query, updateById } from '../utils/db-helpers.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Update school profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user?.userId;
    if (!schoolId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      principal_name
    } = req.body;

    // Validate required fields
    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: { message: 'All fields are required' }
      });
    }

    // Update school profile
    const updatedSchool = await updateById('schools', schoolId, {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      principal_name,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: updatedSchool,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user?.userId;
    if (!schoolId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password and new password are required' }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be at least 8 characters long' }
      });
    }

    // Get current school data
    const schoolResult = await query(
      'SELECT password_hash FROM schools WHERE id = $1',
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'School not found' }
      });
    }

    const school = schoolResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, school.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect' }
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear must_change_password flag
    await updateById('schools', schoolId, {
      password_hash: hashedNewPassword,
      must_change_password: false,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Forgot password - send reset email
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email is required' }
      });
    }

    // Check if school exists
    const schoolResult = await query(
      'SELECT id, name, email FROM schools WHERE email = $1',
      [email.toLowerCase()]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No account found with this email address' }
      });
    }

    const school = schoolResult.rows[0];

    // Generate temporary password
    const { generateTemporaryPassword } = await import('../services/email.js');
    const temporaryPassword = generateTemporaryPassword();
    
    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update password in database and set flag to force password change
    await updateById('schools', school.id, {
      password_hash: hashedPassword,
      must_change_password: true,
      updated_at: new Date()
    });

    // Send temporary password email
    try {
      const { sendTemporaryPasswordEmail } = await import('../services/email.js');
      await sendTemporaryPasswordEmail(school.email, school.name, temporaryPassword);
    } catch (emailError) {
      console.error('Failed to send temporary password email:', emailError);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to send email. Please try again.' }
      });
    }

    res.json({
      success: true,
      message: 'A temporary password has been sent to your email',
      // Return password in development for testing
      temporaryPassword: process.env.NODE_ENV === 'development' ? temporaryPassword : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token and new password are required' }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters long' }
      });
    }

    // Find school with valid reset token
    const schoolResult = await query(
      'SELECT id, email, name FROM schools WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired reset token' }
      });
    }

    const school = schoolResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await updateById('schools', school.id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};
