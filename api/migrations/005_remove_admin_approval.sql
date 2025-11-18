-- Remove Admin Approval Requirement
-- Auto-approve all schools

-- Set default status to approved for new schools
ALTER TABLE schools 
ALTER COLUMN status SET DEFAULT 'approved';

-- Update all existing pending schools to approved
UPDATE schools 
SET status = 'approved' 
WHERE status = 'pending' OR status IS NULL;

-- Add comment
COMMENT ON COLUMN schools.status IS 'School status - always approved (no admin approval needed)';
