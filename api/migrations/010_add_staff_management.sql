-- Staff/Employee Management Feature
-- Migration: 010_add_staff_management
-- Description: Add staff table and transform submission_students to submission_members

-- ============================================================================
-- STAFF TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Personal Information
  name VARCHAR(255) NOT NULL,
  father_spouse_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', NULL)),
  phone_number VARCHAR(20),
  blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
  photo_url TEXT,
  
  -- Employment Information
  employee_id VARCHAR(50),
  staff_type VARCHAR(50) NOT NULL CHECK (staff_type IN ('Teaching', 'Non-Teaching', 'Administrative', 'Support')),
  designation VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  date_of_joining DATE,
  qualification VARCHAR(255),
  
  -- Address Information
  address TEXT,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_number VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for staff table
CREATE INDEX IF NOT EXISTS idx_staff_school_id ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_type ON staff(staff_type);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_created_at ON staff(created_at);

-- Apply updated_at trigger to staff table
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRANSFORM SUBMISSION_STUDENTS TO SUBMISSION_MEMBERS
-- ============================================================================

-- Step 1: Create new submission_members table
CREATE TABLE IF NOT EXISTS submission_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES batch_submissions(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('student', 'staff')),
  member_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure no duplicate members in same batch
  UNIQUE(submission_id, member_type, member_id)
);

-- Step 2: Migrate existing data from submission_students
INSERT INTO submission_members (submission_id, member_type, member_id, created_at)
SELECT 
  submission_id,
  'student' as member_type,
  student_id as member_id,
  CURRENT_TIMESTAMP as created_at
FROM submission_students
ON CONFLICT (submission_id, member_type, member_id) DO NOTHING;

-- Step 3: Create indexes for submission_members
CREATE INDEX IF NOT EXISTS idx_submission_members_submission_id ON submission_members(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_members_member_id ON submission_members(member_id);
CREATE INDEX IF NOT EXISTS idx_submission_members_lookup ON submission_members(submission_id, member_type, member_id);

-- Step 4: Drop old submission_students table
DROP TABLE IF EXISTS submission_students;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE staff IS 'Stores staff/employee records with personal and employment information';
COMMENT ON TABLE submission_members IS 'Junction table linking students and staff to batch submissions';

COMMENT ON COLUMN staff.staff_type IS 'Staff category: Teaching, Non-Teaching, Administrative, or Support';
COMMENT ON COLUMN staff.phone_number IS 'Indian mobile format: +91XXXXXXXXXX';
COMMENT ON COLUMN staff.pincode IS '6-digit Indian postal code';
COMMENT ON COLUMN submission_members.member_type IS 'Type of member: student or staff';
COMMENT ON COLUMN submission_members.member_id IS 'References either students.id or staff.id based on member_type';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration:
-- 1. CREATE TABLE submission_students (submission_id UUID, student_id UUID, PRIMARY KEY (submission_id, student_id));
-- 2. INSERT INTO submission_students SELECT submission_id, member_id FROM submission_members WHERE member_type = 'student';
-- 3. DROP TABLE submission_members;
-- 4. DROP TABLE staff;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Migration 010_add_staff_management completed successfully
