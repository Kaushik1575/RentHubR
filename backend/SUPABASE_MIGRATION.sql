-- Add session_id column to users table for concurrent login control
ALTER TABLE users ADD COLUMN session_id TEXT;
