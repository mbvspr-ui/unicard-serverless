import { Request, Response } from 'express';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { insertOne, findWhere, exists, updateWhere } from '../utils/db-helpers.js';
import {
  schoolRegisterSchema,
  schoolLoginSchema,
  adminLoginSchema,
  SchoolRegisterInput,
  SchoolLoginInput,
  AdminLoginInput,
} from '../validators/auth.js';
import { School, Admin, AuthRequest } from '../types/index.js';
import { generateOTP, sendVerificationOTP, sendWelcomeEmail } from '../services/email.js';

/**
 * Register a new school
 */
export const registerSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = schoolRegisterSchema.parse(req.body) as SchoolRegisterInput;

    // Check if email already exists
    const emailExists = await exists('schools', { email: validatedData.email });
    if (emailExists) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'A school with this email already exists',
        },
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create school - auto-approved and verified (no OTP needed)
    const school = await insertOne<School>('schools', {
      name: validatedData.name,
      email: validatedData.email,
      password_hash: passwordHash,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      pincode: validatedData.pincode,
      phone: validatedData.phone,
      principal_name: validatedData.principal_name || null,
      status: 'approved', // Auto-approved
      email_verified: true, // Auto-verified (no OTP needed)
      verification_otp: null,
      otp_expires_at: null,
      otp_attempts: 0,
    });

    res.status(201).json({
      success: true,
      message: 'School registered successfully! You can now login.',
      data: {
        schoolId: school.id,
        name: school.name,
        email: school.email,
        emailVerified: true,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      });
      return;
    }

    console.error('Register school error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register school',
      },
    });
  }
};

/**
 * Login a school
 */
export const loginSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = schoolLoginSchema.parse(req.body) as SchoolLoginInput;

    // Find school by email
    const schools = await findWhere<School>('schools', { email: validatedData.email });
    const school = schools[0];

    if (!school) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      school.password_hash as any
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // No approval or verification needed - instant access

    // Generate JWT token
    const token = generateToken({
      userId: school.id,
      role: 'school',
      email: school.email,
    });

    res.json({
      success: true,
      token,
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        status: school.status,
        logo_url: school.logo_url,
        signature_url: school.signature_url,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      });
      return;
    }

    console.error('Login school error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login',
      },
    });
  }
};

/**
 * Login an admin
 */
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = adminLoginSchema.parse(req.body) as AdminLoginInput;

    // Find admin by email
    const admins = await findWhere<Admin>('admins', { email: validatedData.email });
    const admin = admins[0];

    if (!admin) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      admin.password_hash as any
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: admin.id,
      role: 'admin',
      email: admin.email,
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      });
      return;
    }

    console.error('Login admin error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login',
      },
    });
  }
};

/**
 * Verify token and return user info
 */
export const verifyTokenEndpoint = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
    });
    return;
  }

  res.json({
    success: true,
    user: {
      userId: user.userId,
      role: user.role,
      email: user.email,
    },
  });
};

/**
 * Verify email with OTP
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and OTP are required',
        },
      });
      return;
    }

    // Find school by email
    const schools = await findWhere<School>('schools', { email });
    const school = schools[0];

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

    // Check if already verified
    if (school.email_verified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified',
        },
      });
      return;
    }

    // Check OTP attempts
    if (school.otp_attempts >= 5) {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many failed attempts. Please request a new OTP.',
        },
      });
      return;
    }

    // Check if OTP expired
    const now = new Date();
    const expiryDate = new Date(school.otp_expires_at as any);
    
    console.log('OTP Expiry Check:', {
      now: now.toISOString(),
      expiry: expiryDate.toISOString(),
      expired: now > expiryDate,
      nowTime: now.getTime(),
      expiryTime: expiryDate.getTime(),
      diff: (expiryDate.getTime() - now.getTime()) / 1000 / 60, // minutes
    });
    
    if (now > expiryDate) {
      res.status(400).json({
        success: false,
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.',
        },
      });
      return;
    }

    // Verify OTP
    if (school.verification_otp !== otp) {
      // Increment attempts
      await updateWhere(
        'schools',
        { email },
        { otp_attempts: school.otp_attempts + 1 }
      );

      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP. Please try again.',
        },
      });
      return;
    }

    // Mark email as verified
    await updateWhere(
      'schools',
      { email },
      {
        email_verified: true,
        verification_otp: null,
        otp_expires_at: null,
        otp_attempts: 0,
      }
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(school.email, school.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify email',
      },
    });
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required',
        },
      });
      return;
    }

    // Find school by email
    const schools = await findWhere<School>('schools', { email });
    const school = schools[0];

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

    // Check if already verified
    if (school.email_verified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified',
        },
      });
      return;
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes (increased for testing)

    // Update school with new OTP
    await updateWhere(
      'schools',
      { email },
      {
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
        otp_attempts: 0,
      }
    );

    // Send OTP email
    await sendVerificationOTP(school.email, school.name, otp);

    res.json({
      success: true,
      message: 'New OTP sent to your email',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resend OTP',
      },
    });
  }
};

/**
 * Get current authenticated user's data
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
      return;
    }

    // If it's a school, fetch full school data
    if (user.role === 'school') {
      const schools = await findWhere<School>('schools', { id: user.userId });
      const school = schools[0];

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

      // Return school data without password
      const { password_hash, verification_otp, reset_token, ...schoolData } = school as any;

      res.json({
        success: true,
        data: schoolData,
      });
      return;
    }

    // If it's an admin, fetch admin data
    if (user.role === 'admin') {
      const admins = await findWhere<Admin>('admins', { id: user.userId });
      const admin = admins[0];

      if (!admin) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ADMIN_NOT_FOUND',
            message: 'Admin not found',
          },
        });
        return;
      }

      // Return admin data without password
      const { password_hash, ...adminData } = admin as any;

      res.json({
        success: true,
        data: adminData,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: 'Invalid user role',
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user data',
      },
    });
  }
};
