-- Migration 007: Neuroscience-Based Viral Referral System

CREATE TABLE IF NOT EXISTS referrals (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code       TEXT NOT NULL UNIQUE,
  total_referrals     INTEGER NOT NULL DEFAULT 0,
  pending_credit      NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_credit         NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_expires_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id                  SERIAL PRIMARY KEY,
  referrer_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code       TEXT NOT NULL,
  reward_amount       NUMERIC(10,2) NOT NULL DEFAULT 100,
  bonus_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','reversed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_clicks (
  id                  SERIAL PRIMARY KEY,
  referral_code       TEXT NOT NULL,
  visitor_id          TEXT,
  clicked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referral_code, visitor_id)
);

-- Track which referral brought each user in
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN ref_code TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_conversions_referrer ON referral_conversions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_referred ON referral_conversions(referred_user_id);
