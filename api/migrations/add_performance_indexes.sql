-- Add indexes to improve query performance
-- Run this migration to speed up slow queries

-- Index for students table
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Index for batch_submissions table
CREATE INDEX IF NOT EXISTS idx_batch_submissions_school_id ON batch_submissions(school_id);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_status ON batch_submissions(status);

-- Index for schools table
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_school_class_section ON students(school_id, class, section);

-- Add comments
COMMENT ON INDEX idx_students_school_id IS 'Speeds up student queries filtered by school';
COMMENT ON INDEX idx_students_class IS 'Speeds up student queries filtered by class';
COMMENT ON INDEX idx_students_section IS 'Speeds up student queries filtered by section';
COMMENT ON INDEX idx_students_created_at IS 'Speeds up student list ordering by creation date';
COMMENT ON INDEX idx_batch_submissions_school_id IS 'Speeds up batch submission queries by school';
COMMENT ON INDEX idx_schools_email IS 'Speeds up school login queries';
COMMENT ON INDEX idx_students_school_class_section IS 'Speeds up filtered student lists';
