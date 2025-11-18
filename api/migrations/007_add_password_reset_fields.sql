-- Migration: 007_add_password_reset_fields
-- Description: Add password reset token fields to schools table

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_schools_reset_token ON schools(reset_token);

COMMENT ON COLUMN schools.reset_token IS 'UUID token for password reset';
COMMENT ON COLUMN schools.reset_token_expires IS 'Expiration timestamp for reset token';
