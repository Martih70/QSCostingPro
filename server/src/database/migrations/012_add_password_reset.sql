-- Migration: Add password reset functionality
-- Adds support for password reset tokens with expiration

-- Add password reset token fields to users table
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME;

-- Create index for faster token lookups
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_users_reset_token_expires ON users(reset_token_expires_at);
