import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils/auth.js';
import { AuthRequest } from '../types/index.js';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_MISSING',
        message: 'Authentication token is required',
      },
    });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token',
      },
    });
    return;
  }

  // Attach user info to request
  (req as AuthRequest).user = decoded;
  next();
};

/**
 * Middleware to check if user is a school
 */
export const requireSchool = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthRequest).user;

  if (!user || user.role !== 'school') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. School role required.',
      },
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthRequest).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
      },
    });
    return;
  }

  next();
};

/**
 * Combined middleware: authenticate + require school
 */
export const authenticateSchool = [authenticate, requireSchool];

/**
 * Combined middleware: authenticate + require admin
 */
export const authenticateAdmin = [authenticate, requireAdmin];
