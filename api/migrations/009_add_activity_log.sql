-- Migration: Add activity log table for tracking school activities
-- This table tracks all important activities performed by schools

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'student_added', 'student_updated', 'student_deleted', 'batch_submitted', 'profile_updated', 'logo_uploaded', 'signature_uploaded'
  entity_type VARCHAR(50), -- 'student', 'batch', 'profile', 'school'
  entity_id UUID, -- ID of the related entity (student_id, batch_id, etc.)
  description TEXT NOT NULL, -- Human-readable description of the activity
  metadata JSONB, -- Additional data about the activity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_school_id ON activity_log(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON activity_log(activity_type);

-- Add comment
COMMENT ON TABLE activity_log IS 'Tracks all activities performed by schools for dashboard recent activity feed';
COMMENT ON COLUMN activity_log.activity_type IS 'Type of activity: student_added, student_updated, student_deleted, batch_submitted, profile_updated, logo_uploaded, signature_uploaded';
COMMENT ON COLUMN activity_log.entity_type IS 'Type of entity affected: student, batch, profile, school';
COMMENT ON COLUMN activity_log.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN activity_log.description IS 'Human-readable description shown in activity feed';
COMMENT ON COLUMN activity_log.metadata IS 'Additional JSON data about the activity (student name, batch count, etc.)';
