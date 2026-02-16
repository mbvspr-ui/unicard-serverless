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
  must_change_password: boolean;
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

// Student type
export interface Student {
  id: string;
  school_id: string;
  name: string;
  father_name: string | null;
  mother_name: string;
  class: string;
  section: string | null;
  roll_number: string | null;
  student_id: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  phone_number: string | null;
  blood_group: string | null;
  address: string | null;
  state: string;
  district: string;
  city: string;
  pincode: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

// Staff type
export interface Staff {
  id: string;
  school_id: string;
  
  // Personal Information
  name: string;
  father_spouse_name: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  phone_number: string | null;
  blood_group: string | null;
  photo_url: string | null;
  
  // Employment Information
  employee_id: string | null;
  staff_type: 'Teaching' | 'Non-Teaching' | 'Administrative' | 'Support';
  designation: string;
  department: string | null;
  date_of_joining: string | null;
  qualification: string | null;
  
  // Address Information
  address: string | null;
  state: string;
  district: string;
  city: string;
  pincode: string;
  
  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  emergency_contact_relationship: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Batch submission types
export interface BatchSubmission {
  id: string;
  school_id: string;
  status: 'submitted' | 'processing' | 'completed';
  submitted_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

export interface SubmissionMember {
  id: string;
  submission_id: string;
  member_type: 'student' | 'staff';
  member_id: string;
  created_at: string;
}

export interface BatchWithMembers {
  batch: BatchSubmission;
  students: Student[];
  staff: Staff[];
  studentCount: number;
  staffCount: number;
}

// Request with authenticated user
export interface AuthRequest extends Request {
  user?: TokenPayload;
  school?: School;
}
