import { Request } from 'express';

// User types
export interface School {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  principal_name: string | null;
  logo_url: string | null;
  signature_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  email_verified: boolean;
  verification_otp: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  reset_token: string | null;
  reset_token_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  email: string;
  password_hash?: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

// JWT Token Payload
export interface TokenPayload {
  userId: string;
  role: 'school' | 'admin';
  email: string;
  iat?: number;
  exp?: number;
}

// Request with authenticated user
export interface AuthRequest extends Request {
  user?: TokenPayload;
  school?: School;
}
