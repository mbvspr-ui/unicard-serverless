-- Migration: 008_add_must_change_password
-- Description: Add flag to force password change after temporary password

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN schools.must_change_password IS 'Flag to force password change on next login (set when temporary password is issued)';
