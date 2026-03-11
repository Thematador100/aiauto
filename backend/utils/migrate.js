import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database migration script
 * Creates all necessary tables for the AI Auto Inspection platform
 * Run with: npm run migrate
 */

const migrations = [
  {
    name: 'Create users table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT NOW(),
        subscription_expires_at TIMESTAMP,
        CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$')
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
        vehicle_type VARCHAR(50) DEFAULT 'standard',
        odometer INTEGER,
        overall_notes TEXT,
        checklist_data JSONB,
        ai_summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT valid_year CHECK (vehicle_year >= 1900 AND vehicle_year <= 2100),
        CONSTRAINT valid_odometer CHECK (odometer >= 0)
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
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
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
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audio_notes_inspection_id ON audio_notes(inspection_id);
    `
  }
];

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  try {
    for (const migration of migrations) {
      console.log(`📋 Running: ${migration.name}...`);
      await query(migration.sql);
      console.log(`✅ Completed: ${migration.name}\n`);
    }

    console.log('✨ All migrations completed successfully!');
    console.log('\n📊 Database schema:');
    console.log('  - users (authentication)');
    console.log('  - inspections (vehicle inspection reports)');
    console.log('  - photos (inspection photos)');
    console.log('  - audio_notes (audio recordings)');
    console.log('\n🎉 Database is ready for use!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
