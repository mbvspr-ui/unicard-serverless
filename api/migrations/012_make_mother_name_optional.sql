-- Migration 012: Make mother_name optional for students
-- This migration removes the NOT NULL constraint from the mother_name column

ALTER TABLE students 
ALTER COLUMN mother_name DROP NOT NULL;
