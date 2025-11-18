-- Migration: 006_add_school_location_fields
-- Description: Add city, state, pincode, and principal_name columns to schools table
-- Date: 2025-11-18

-- Add missing columns to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(6),
ADD COLUMN IF NOT EXISTS principal_name VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_state ON schools(state);
CREATE INDEX IF NOT EXISTS idx_schools_pincode ON schools(pincode);

-- Add comments for documentation
COMMENT ON COLUMN schools.city IS 'City where the school is located';
COMMENT ON COLUMN schools.state IS 'State where the school is located';
COMMENT ON COLUMN schools.pincode IS '6-digit Indian postal code for school location';
COMMENT ON COLUMN schools.principal_name IS 'Name of the school principal';

-- Migration complete
