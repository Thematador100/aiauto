-- Migration: Add reseller/entrepreneur tier support
-- Entrepreneur plan ($3,997) can issue up to 5 sub-licenses

-- Add reseller fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reseller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_reseller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_sub_licenses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan VARCHAR(100);

-- Create sub_licenses table
CREATE TABLE IF NOT EXISTS sub_licenses (
  id SERIAL PRIMARY KEY,
  reseller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  licensee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- License details
  license_key VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, revoked
  -- Metadata
  issued_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_licenses_reseller ON sub_licenses(reseller_id);
CREATE INDEX IF NOT EXISTS idx_sub_licenses_licensee ON sub_licenses(licensee_id);
CREATE INDEX IF NOT EXISTS idx_sub_licenses_status ON sub_licenses(status);
CREATE INDEX IF NOT EXISTS idx_sub_licenses_key ON sub_licenses(license_key);

-- Update entrepreneur plan users
UPDATE users
SET is_reseller = true,
    max_sub_licenses = 5,
    plan = 'entrepreneur'
WHERE plan = 'entrepreneur' OR license_type = 'entrepreneur';
