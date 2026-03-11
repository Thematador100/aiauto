import { query } from '../config/database.js';

/**
 * Complete migration runner — runs all schema creation and alterations
 * in the correct order on every startup (all statements are idempotent).
 */
export async function runMigrations() {
  console.log('🔄 Running database migrations...');

  const steps = [
    // ── 001: Core tables ────────────────────────────────────────────────────
    {
      name: 'Create users table',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          user_type VARCHAR(50) DEFAULT 'user',
          plan VARCHAR(50) DEFAULT 'basic',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          subscription_expires_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
      `
    },
    {
      name: 'Create inspections table',
      sql: `
        CREATE TABLE IF NOT EXISTS inspections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          vehicle_vin VARCHAR(17),
          vehicle_make VARCHAR(100) NOT NULL,
          vehicle_model VARCHAR(100) NOT NULL,
          vehicle_year INTEGER NOT NULL,
          vehicle_type VARCHAR(50) DEFAULT 'Standard',
          odometer INTEGER,
          overall_notes TEXT,
          checklist_data JSONB,
          ai_summary TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
        CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_inspections_vin ON inspections(vehicle_vin);
      `
    },
    {
      name: 'Create photos table',
      sql: `
        CREATE TABLE IF NOT EXISTS photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
          category VARCHAR(100),
          cloudinary_url TEXT NOT NULL,
          cloudinary_public_id VARCHAR(255) UNIQUE NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);
      `
    },
    {
      name: 'Create audio_notes table',
      sql: `
        CREATE TABLE IF NOT EXISTS audio_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
          category VARCHAR(100),
          cloudinary_url TEXT NOT NULL,
          cloudinary_public_id VARCHAR(255) UNIQUE NOT NULL,
          transcription TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_audio_notes_inspection_id ON audio_notes(inspection_id);
      `
    },

    // ── 003: License management columns ────────────────────────────────────
    {
      name: 'Add license management columns to users',
      sql: `
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS license_status VARCHAR(50) DEFAULT 'inactive',
          ADD COLUMN IF NOT EXISTS license_type VARCHAR(50) DEFAULT 'independent',
          ADD COLUMN IF NOT EXISTS territory VARCHAR(255),
          ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS revenue_share_percentage INTEGER DEFAULT 20,
          ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"ev_module": false, "advanced_fraud": true, "ai_reports": true, "lead_bot": false}',
          ADD COLUMN IF NOT EXISTS license_issued_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS monthly_platform_fee INTEGER DEFAULT 297,
          ADD COLUMN IF NOT EXISTS upfront_fee_paid INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_users_license_status ON users(license_status);
        CREATE INDEX IF NOT EXISTS idx_users_territory ON users(territory);
      `
    },
    {
      name: 'Create inspector_sales table',
      sql: `
        CREATE TABLE IF NOT EXISTS inspector_sales (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
          sale_amount INTEGER NOT NULL,
          revenue_share_amount INTEGER NOT NULL,
          inspector_revenue INTEGER NOT NULL,
          payment_method VARCHAR(100) DEFAULT 'stripe_independent',
          payment_status VARCHAR(50) DEFAULT 'pending',
          stripe_payment_id VARCHAR(255),
          revenue_share_status VARCHAR(50) DEFAULT 'pending',
          revenue_share_paid_at TIMESTAMPTZ,
          customer_name VARCHAR(255),
          customer_email VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_inspector_sales_user ON inspector_sales(user_id);
        CREATE INDEX IF NOT EXISTS idx_inspector_sales_created ON inspector_sales(created_at);
      `
    },
    {
      name: 'Create license_payments table',
      sql: `
        CREATE TABLE IF NOT EXISTS license_payments (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          payment_type VARCHAR(50) NOT NULL,
          amount INTEGER NOT NULL,
          payment_method VARCHAR(100) DEFAULT 'stripe',
          payment_status VARCHAR(50) DEFAULT 'pending',
          stripe_payment_id VARCHAR(255),
          period_start DATE,
          period_end DATE,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          paid_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_license_payments_user ON license_payments(user_id);
      `
    },
    {
      name: 'Create territories table',
      sql: `
        CREATE TABLE IF NOT EXISTS territories (
          id SERIAL PRIMARY KEY,
          territory_name VARCHAR(255) NOT NULL UNIQUE,
          country VARCHAR(100) DEFAULT 'USA',
          state VARCHAR(100),
          city VARCHAR(100),
          zip_codes TEXT[],
          max_inspectors INTEGER DEFAULT 5,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_territories_state ON territories(state);
      `
    },

    // ── 004: Additional user columns ────────────────────────────────────────
    {
      name: 'Add company_name, phone, subscription_status to users',
      sql: `
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
          ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
      `
    },

    // ── 005: Password reset ─────────────────────────────────────────────────
    {
      name: 'Add password reset columns to users',
      sql: `
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10),
          ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMPTZ;
      `
    },

    // ── 006: Usage tracking ─────────────────────────────────────────────────
    {
      name: 'Add usage tracking columns',
      sql: `
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_users_license_expires_at ON users(license_expires_at);
        CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_type ON inspections(vehicle_type);
        CREATE INDEX IF NOT EXISTS idx_inspections_user_created ON inspections(user_id, created_at);
      `
    },

    // ── 007: Referral system ────────────────────────────────────────────────
    {
      name: 'Add ref_code column to users',
      sql: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_code TEXT;
      `
    },
    {
      name: 'Create referrals table',
      sql: `
        CREATE TABLE IF NOT EXISTS referrals (
          id                  SERIAL PRIMARY KEY,
          user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          referral_code       TEXT NOT NULL UNIQUE,
          total_referrals     INTEGER NOT NULL DEFAULT 0,
          pending_credit      NUMERIC(10,2) NOT NULL DEFAULT 0,
          paid_credit         NUMERIC(10,2) NOT NULL DEFAULT 0,
          pending_expires_at  TIMESTAMPTZ,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(user_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
      `
    },
    {
      name: 'Create referral_conversions table',
      sql: `
        CREATE TABLE IF NOT EXISTS referral_conversions (
          id                  SERIAL PRIMARY KEY,
          referrer_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referred_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referral_code       TEXT NOT NULL,
          reward_amount       NUMERIC(10,2) NOT NULL DEFAULT 100,
          bonus_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
          status              TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','reversed')),
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_conversions_referrer ON referral_conversions(referrer_user_id);
        CREATE INDEX IF NOT EXISTS idx_conversions_referred ON referral_conversions(referred_user_id);
      `
    },
    {
      name: 'Create referral_clicks table',
      sql: `
        CREATE TABLE IF NOT EXISTS referral_clicks (
          id                  SERIAL PRIMARY KEY,
          referral_code       TEXT NOT NULL,
          visitor_id          TEXT,
          clicked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(referral_code, visitor_id)
        );
      `
    },
  ];

  for (const step of steps) {
    try {
      await query(step.sql);
      console.log(`  ✅ ${step.name}`);
    } catch (err) {
      console.error(`  ❌ ${step.name}: ${err.message}`);
      // Non-fatal: log and continue so the server still starts
    }
  }

  console.log('✅ All migrations completed');
}
