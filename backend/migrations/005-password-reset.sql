-- Migration 005: Password reset support
-- Adds reset_code and reset_code_expires_at columns for forgot-password flow

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMP;

COMMENT ON COLUMN users.reset_code IS 'Temporary 6-digit code for password reset';
COMMENT ON COLUMN users.reset_code_expires_at IS 'When the reset code expires (15 min)';
