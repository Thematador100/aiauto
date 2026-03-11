import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Phase 2 Database Migrations
 * - Multi-tier user system (admin/pro/diy)
 * - Companies & team management
 * - Fraud detection indicators
 */

const migrations = [
  {
    name: 'Add user types and credits',
    sql: `
      -- Add user_type column
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'pro';
      -- 'admin', 'pro', 'diy'

      -- Add inspection credits for B2C users
      ALTER TABLE users ADD COLUMN IF NOT EXISTS inspection_credits INTEGER DEFAULT 0;

      -- Add subscription status
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
      -- 'active', 'cancelled', 'expired', 'trial'

      -- Add company reference
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;

      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
    `
  },
  {
    name: 'Create companies table',
    sql: `
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        business_email VARCHAR(255),
        business_phone VARCHAR(50),
        subscription_tier VARCHAR(50) DEFAULT 'individual',
        -- 'individual', 'team', 'enterprise'
        max_team_members INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_user_id);
    `
  },
  {
    name: 'Create company_members table',
    sql: `
      CREATE TABLE IF NOT EXISTS company_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'inspector',
        -- 'owner', 'admin', 'inspector'
        can_manage_team BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(company_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
      CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
    `
  },
  {
    name: 'Update inspections for multi-tier',
    sql: `
      -- Add user_type to track inspection origin
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'pro';

      -- Add company_id for B2B inspections
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

      -- Add assignment for team members
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES users(id);

      -- Add overall score for DIY users
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS overall_score INTEGER;
      -- 1-10 score

      -- Add recommendation
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS should_buy_recommendation VARCHAR(50);
      -- 'yes', 'no', 'maybe', 'caution'

      -- Add estimated repair costs
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS estimated_annual_repair_cost INTEGER;

      CREATE INDEX IF NOT EXISTS idx_inspections_user_type ON inspections(user_type);
      CREATE INDEX IF NOT EXISTS idx_inspections_company ON inspections(company_id);
      CREATE INDEX IF NOT EXISTS idx_inspections_assigned_to ON inspections(assigned_to_user_id);
    `
  },
  {
    name: 'Create odometer_fraud_indicators table',
    sql: `
      CREATE TABLE IF NOT EXISTS odometer_fraud_indicators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
        claimed_mileage INTEGER,
        pedal_wear_severity VARCHAR(50),
        -- 'light', 'moderate', 'severe', 'extreme'
        steering_wear_severity VARCHAR(50),
        seat_wear_severity VARCHAR(50),
        pedal_photo_url TEXT,
        steering_photo_url TEXT,
        seat_photo_url TEXT,
        carfax_last_mileage INTEGER,
        carfax_last_date DATE,
        mileage_discrepancy INTEGER,
        -- Difference: estimated miles - claimed miles
        fraud_probability DECIMAL(3,2),
        -- 0.00 to 1.00
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_odometer_fraud_inspection ON odometer_fraud_indicators(inspection_id);
    `
  },
  {
    name: 'Create flood_damage_indicators table',
    sql: `
      CREATE TABLE IF NOT EXISTS flood_damage_indicators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
        musty_smell_detected BOOLEAN DEFAULT false,
        water_stains_found BOOLEAN DEFAULT false,
        water_stain_locations TEXT[],
        rust_in_unusual_places BOOLEAN DEFAULT false,
        foggy_lights BOOLEAN DEFAULT false,
        carpet_replaced BOOLEAN DEFAULT false,
        electrical_corrosion BOOLEAN DEFAULT false,
        nicb_flood_record BOOLEAN DEFAULT false,
        vin_title_state_changes INTEGER,
        flood_probability DECIMAL(3,2),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_flood_damage_inspection ON flood_damage_indicators(inspection_id);
    `
  },
  {
    name: 'Create accident_concealment_indicators table',
    sql: `
      CREATE TABLE IF NOT EXISTS accident_concealment_indicators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
        paint_thickness_readings JSONB,
        -- {"hood": 150, "door_left": 200, ...}
        panel_gaps_uneven BOOLEAN DEFAULT false,
        overspray_detected BOOLEAN DEFAULT false,
        overspray_locations TEXT[],
        paint_mismatch BOOLEAN DEFAULT false,
        frame_welding_visible BOOLEAN DEFAULT false,
        bolt_replacement_detected BOOLEAN DEFAULT false,
        replaced_parts TEXT[],
        carfax_accident_reported BOOLEAN,
        carfax_structural_damage BOOLEAN,
        concealment_probability DECIMAL(3,2),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_accident_concealment_inspection ON accident_concealment_indicators(inspection_id);
    `
  }
];

async function runMigrations() {
  console.log('🚀 Starting Phase 2 database migrations...\n');

  try {
    for (const migration of migrations) {
      console.log(`📋 Running: ${migration.name}...`);
      await query(migration.sql);
      console.log(`✅ Completed: ${migration.name}\n`);
    }

    console.log('✨ All Phase 2 migrations completed successfully!');
    console.log('\n📊 New database schema:');
    console.log('  - Multi-tier users (admin/pro/diy)');
    console.log('  - companies (B2B team management)');
    console.log('  - company_members (team assignments)');
    console.log('  - odometer_fraud_indicators (fraud detection)');
    console.log('  - flood_damage_indicators (fraud detection)');
    console.log('  - accident_concealment_indicators (fraud detection)');
    console.log('\n🎉 Database is ready for Phase 2 features!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
