-- Migration 006: Usage tracking, last login, vehicle_type on inspections
-- Adds last_login_at to users, vehicle_type to inspections, pending license status

-- Add last_login_at to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add vehicle_type to inspections table for usage breakdown
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);

-- Add 'pending' as a valid license_status (for new signups awaiting admin approval)
-- (No constraint change needed — VARCHAR allows any value)

-- Update existing users: set last_login_at = created_at as baseline
UPDATE users SET last_login_at = created_at WHERE last_login_at IS NULL;

-- Index for fast expiry queries
CREATE INDEX IF NOT EXISTS idx_users_license_expires_at ON users (license_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_license_status ON users (license_status);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_type ON inspections (vehicle_type);
CREATE INDEX IF NOT EXISTS idx_inspections_user_created ON inspections (user_id, created_at);
