/**
 * Migration: License Management System
 * Adds fields and tables for managing licensees, territories, and sales tracking
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/003-license-management.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running license management migration...');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ License management migration completed successfully!');
    console.log('');
    console.log('Added features:');
    console.log('  • License status tracking (active, trial, suspended, cancelled)');
    console.log('  • License types (independent vs lead-dependent)');
    console.log('  • Geographic territory management');
    console.log('  • Feature flags (EV module, lead bot, etc.)');
    console.log('  • Inspector sales tracking table');
    console.log('  • License payments table ($2997 + $297/month)');
    console.log('  • Territories table for exclusivity');
    console.log('');
    console.log('Ready to manage licensees! 🚀');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
