-- Unicard Serverless Database Schema
-- Migration: 001_initial_schema
-- Description: Create initial database schema for schools, students, batches, and admins

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SCHOOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  logo_url TEXT,
  signature_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for schools table
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at);

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255),
  mother_name VARCHAR(255) NOT NULL,
  class VARCHAR(50) NOT NULL,
  section VARCHAR(10),
  roll_number VARCHAR(50),
  student_id VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', NULL)),
  phone_number VARCHAR(20), -- Format: +91XXXXXXXXXX
  blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
  address TEXT,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for students table
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

-- ============================================================================
-- BATCH SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'completed')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  admin_notes TEXT
);

-- Indexes for batch_submissions table
CREATE INDEX IF NOT EXISTS idx_batch_submissions_school_id ON batch_submissions(school_id);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_status ON batch_submissions(status);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_submitted_at ON batch_submissions(submitted_at);

-- ============================================================================
-- SUBMISSION STUDENTS JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS submission_students (
  submission_id UUID NOT NULL REFERENCES batch_submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (submission_id, student_id)
);

-- Indexes for submission_students table
CREATE INDEX IF NOT EXISTS idx_submission_students_submission_id ON submission_students(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_students_student_id ON submission_students(student_id);

-- ============================================================================
-- ADMINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admins table
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- ============================================================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE schools IS 'Stores school information and authentication credentials';
COMMENT ON TABLE students IS 'Stores student records with personal and academic information';
COMMENT ON TABLE batch_submissions IS 'Tracks batch submissions for ID card printing';
COMMENT ON TABLE submission_students IS 'Junction table linking students to batch submissions';
COMMENT ON TABLE admins IS 'Stores admin user credentials and roles';

COMMENT ON COLUMN schools.status IS 'School approval status: pending, approved, or rejected';
COMMENT ON COLUMN students.phone_number IS 'Indian mobile format: +91XXXXXXXXXX';
COMMENT ON COLUMN students.pincode IS '6-digit Indian postal code';
COMMENT ON COLUMN batch_submissions.status IS 'Submission status: submitted, processing, or completed';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Migration 001_initial_schema completed successfully
