-- Staff/Employee Management Feature - ROLLBACK
-- Migration: 010_rollback_staff_management
-- Description: Rollback staff table and restore submission_students table

-- ============================================================================
-- ROLLBACK SUBMISSION_MEMBERS TO SUBMISSION_STUDENTS
-- ============================================================================

-- Step 1: Create submission_students table
CREATE TABLE IF NOT EXISTS submission_students (
  submission_id UUID NOT NULL REFERENCES batch_submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (submission_id, student_id)
);

-- Step 2: Migrate student data back from submission_members
INSERT INTO submission_students (submission_id, student_id)
SELECT 
  submission_id,
  member_id as student_id
FROM submission_members
WHERE member_type = 'student'
ON CONFLICT (submission_id, student_id) DO NOTHING;

-- Step 3: Create indexes for submission_students
CREATE INDEX IF NOT EXISTS idx_submission_students_submission_id ON submission_students(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_students_student_id ON submission_students(student_id);

-- Step 4: Drop submission_members table
DROP TABLE IF EXISTS submission_members;

-- ============================================================================
-- DROP STAFF TABLE
-- ============================================================================

-- Drop staff table and all its dependencies
DROP TABLE IF EXISTS staff CASCADE;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE submission_students IS 'Junction table linking students to batch submissions (restored from rollback)';

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- Migration 010_rollback_staff_management completed successfully
-- Note: Any staff data that was created will be permanently deleted

