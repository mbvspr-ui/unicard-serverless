-- Migration: 004_add_email_verification
-- Description: Add email verification fields to schools table

-- Add email verification columns to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;

-- Update existing schools to be verified (for backward compatibility)
UPDATE schools SET email_verified = TRUE WHERE status = 'approved';

-- Change status default to 'approved' since we're using email verification now
ALTER TABLE schools ALTER COLUMN status SET DEFAULT 'approved';

-- Add index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_schools_verification_otp ON schools(verification_otp);
CREATE INDEX IF NOT EXISTS idx_schools_email_verified ON schools(email_verified);

-- Comments
COMMENT ON COLUMN schools.email_verified IS 'Whether the school email has been verified via OTP';
COMMENT ON COLUMN schools.verification_otp IS 'Current OTP for email verification';
COMMENT ON COLUMN schools.otp_expires_at IS 'Expiration timestamp for the OTP';
COMMENT ON COLUMN schools.otp_attempts IS 'Number of failed OTP verification attempts';

