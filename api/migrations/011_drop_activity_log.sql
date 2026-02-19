-- Migration 011: Drop activity_log table
-- This migration removes the activity logging feature

-- Drop the activity_log table
DROP TABLE IF EXISTS activity_log;

-- Note: This migration is irreversible. Activity log data will be permanently deleted.
