import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Phase 2B: Common Vehicle Issues Database Migration
 */

const migration = {
  name: 'Create vehicle_common_issues table',
  sql: `
    CREATE TABLE IF NOT EXISTS vehicle_common_issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      issue_category VARCHAR(100) NOT NULL,
      -- 'Engine', 'Transmission', 'Electrical', 'Suspension', 'Brakes', 'HVAC', 'Body', 'Other'
      issue_name VARCHAR(255) NOT NULL,
      issue_description TEXT NOT NULL,
      symptoms TEXT[],
      -- Array of symptoms
      severity VARCHAR(50) NOT NULL,
      -- 'Critical', 'Major', 'Minor'
      failure_mileage_range VARCHAR(100),
      -- e.g., '50k-80k miles', '100k+ miles'
      repair_cost_min INTEGER,
      -- Minimum repair cost in dollars
      repair_cost_max INTEGER,
      -- Maximum repair cost in dollars
      affected_percentage DECIMAL(5,2),
      -- What % of these vehicles have this issue (0.00 to 100.00)
      detection_method TEXT,
      -- How to check for it during inspection
      source VARCHAR(255),
      -- 'NHTSA TSB', 'Consumer Reports', 'Mechanic Forums', etc.
      source_url TEXT,
      -- Link to source
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT valid_years CHECK (year_start >= 1900 AND year_end >= year_start),
      CONSTRAINT valid_percentage CHECK (affected_percentage >= 0 AND affected_percentage <= 100)
    );

    CREATE INDEX IF NOT EXISTS idx_common_issues_make ON vehicle_common_issues(make);
    CREATE INDEX IF NOT EXISTS idx_common_issues_model ON vehicle_common_issues(model);
    CREATE INDEX IF NOT EXISTS idx_common_issues_years ON vehicle_common_issues(year_start, year_end);
    CREATE INDEX IF NOT EXISTS idx_common_issues_severity ON vehicle_common_issues(severity);
    CREATE INDEX IF NOT EXISTS idx_common_issues_category ON vehicle_common_issues(issue_category);

    -- Full text search index for issue names and descriptions
    CREATE INDEX IF NOT EXISTS idx_common_issues_search ON vehicle_common_issues
    USING gin(to_tsvector('english', issue_name || ' ' || issue_description));
  `
};

async function runMigration() {
  console.log('🚀 Starting Phase 2B database migration...\n');

  try {
    console.log(`📋 Running: ${migration.name}...`);
    await query(migration.sql);
    console.log(`✅ Completed: ${migration.name}\n`);

    console.log('✨ Phase 2B migration completed successfully!');
    console.log('\n📊 New table:');
    console.log('  - vehicle_common_issues (known problems by make/model/year)');
    console.log('\n🎉 Ready to populate with NHTSA data!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
