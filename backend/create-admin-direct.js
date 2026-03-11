/**
 * Create admin user directly in Railway database
 * Run this with: DATABASE_URL=your_railway_db_url node create-admin-direct.js
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('Usage: DATABASE_URL=postgresql://... node create-admin-direct.js');
  process.exit(1);
}

async function createAdmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if admin exists
    const checkResult = await client.query('SELECT id FROM users WHERE email = $1', ['admin@test.com']);

    if (checkResult.rows.length > 0) {
      console.log('✅ Admin user already exists');
      console.log('\nLogin credentials:');
      console.log('Email: admin@test.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create admin
    await client.query(
      `INSERT INTO users (
        email,
        password_hash,
        user_type,
        plan,
        inspection_credits,
        subscription_status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      ['admin@test.com', passwordHash, 'admin', 'admin', -1, 'active']
    );

    console.log('✅ Admin user created!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');

    // Create inspector
    const inspectorHash = await bcrypt.hash('inspector123', 10);
    await client.query(
      `INSERT INTO users (
        email,
        password_hash,
        user_type,
        plan,
        inspection_credits,
        subscription_status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      ['inspector@test.com', inspectorHash, 'pro', 'pro-basic', -1, 'active']
    );

    console.log('\n✅ Inspector user created!');
    console.log('Email: inspector@test.com');
    console.log('Password: inspector123');

    // Create DIY user
    const buyerHash = await bcrypt.hash('buyer123', 10);
    await client.query(
      `INSERT INTO users (
        email,
        password_hash,
        user_type,
        plan,
        inspection_credits,
        subscription_status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      ['buyer@test.com', buyerHash, 'diy', 'diy-5pack', 5, 'pay_per_use']
    );

    console.log('\n✅ DIY buyer user created!');
    console.log('Email: buyer@test.com');
    console.log('Password: buyer123');

    console.log('\n🎉 All test users created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdmin();
