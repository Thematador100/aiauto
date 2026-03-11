-- Migration: License Management System
-- Adds fields for tracking licensees, territories, features, and sales

-- Add license management fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS license_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS license_type VARCHAR(50) DEFAULT 'independent',
ADD COLUMN IF NOT EXISTS territory VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS revenue_share_percentage INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"ev_module": false, "advanced_fraud": true, "ai_reports": true, "lead_bot": false}',
ADD COLUMN IF NOT EXISTS license_issued_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_platform_fee INTEGER DEFAULT 297,
ADD COLUMN IF NOT EXISTS upfront_fee_paid INTEGER DEFAULT 0;

-- Create index for license status queries
CREATE INDEX IF NOT EXISTS idx_users_license_status ON users(license_status);
CREATE INDEX IF NOT EXISTS idx_users_territory ON users(territory);

-- Create inspector_sales table for tracking sales and revenue share
CREATE TABLE IF NOT EXISTS inspector_sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspection_id INTEGER REFERENCES inspections(id) ON DELETE SET NULL,

  -- Sale details
  sale_amount INTEGER NOT NULL, -- Amount in cents (e.g., 15000 = $150)
  revenue_share_amount INTEGER NOT NULL, -- Platform's share in cents
  inspector_revenue INTEGER NOT NULL, -- Inspector's portion in cents

  -- Payment tracking
  payment_method VARCHAR(100) DEFAULT 'stripe_independent', -- stripe_independent, stripe_platform, cash, check, other
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_payment_id VARCHAR(255),

  -- Revenue share tracking
  revenue_share_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
  revenue_share_paid_at TIMESTAMP,

  -- Metadata
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for sales queries
CREATE INDEX IF NOT EXISTS idx_inspector_sales_user ON inspector_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_inspector_sales_created ON inspector_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_inspector_sales_payment_status ON inspector_sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_inspector_sales_revenue_share_status ON inspector_sales(revenue_share_status);

-- Create license_payments table for tracking platform fees
CREATE TABLE IF NOT EXISTS license_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Payment details
  payment_type VARCHAR(50) NOT NULL, -- upfront_fee, monthly_fee, revenue_share
  amount INTEGER NOT NULL, -- Amount in cents
  payment_method VARCHAR(100) DEFAULT 'stripe',
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_id VARCHAR(255),

  -- Period tracking (for monthly fees)
  period_start DATE,
  period_end DATE,

  -- Metadata
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Create indexes for license payments
CREATE INDEX IF NOT EXISTS idx_license_payments_user ON license_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_license_payments_type ON license_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_license_payments_status ON license_payments(payment_status);

-- Create territories table for geographic exclusivity management
CREATE TABLE IF NOT EXISTS territories (
  id SERIAL PRIMARY KEY,
  territory_name VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(100) DEFAULT 'USA',
  state VARCHAR(100),
  city VARCHAR(100),
  zip_codes TEXT[], -- Array of ZIP codes covered
  max_inspectors INTEGER DEFAULT 5, -- Max inspectors allowed in this territory
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for territories
CREATE INDEX IF NOT EXISTS idx_territories_name ON territories(territory_name);
CREATE INDEX IF NOT EXISTS idx_territories_state ON territories(state);

-- Update existing admin users to have active license
UPDATE users
SET license_status = 'active',
    license_issued_at = NOW(),
    onboarding_completed = true,
    features_enabled = '{"ev_module": true, "advanced_fraud": true, "ai_reports": true, "lead_bot": true}'
WHERE user_type = 'admin';

-- Update existing pro users to have trial license
UPDATE users
SET license_status = 'trial',
    license_type = 'independent',
    license_issued_at = NOW(),
    license_expires_at = NOW() + INTERVAL '14 days',
    features_enabled = '{"ev_module": false, "advanced_fraud": true, "ai_reports": true, "lead_bot": false}'
WHERE user_type = 'pro' AND license_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.license_status IS 'active, trial, suspended, cancelled, inactive';
COMMENT ON COLUMN users.license_type IS 'independent (own Stripe), lead_dependent (company provides leads)';
COMMENT ON COLUMN users.territory IS 'Geographic area for exclusivity (e.g., "Los Angeles Metro", "Dallas-Fort Worth")';
COMMENT ON COLUMN users.revenue_share_percentage IS 'Percentage of inspector sales owed to platform (default 20%)';
COMMENT ON COLUMN users.features_enabled IS 'JSON object of feature flags: ev_module, advanced_fraud, ai_reports, lead_bot';

COMMENT ON TABLE inspector_sales IS 'Tracks all sales made by inspectors for revenue share calculation';
COMMENT ON TABLE license_payments IS 'Tracks platform fees: $2997 upfront + $297/month';
COMMENT ON TABLE territories IS 'Geographic territories for licensee exclusivity management';
