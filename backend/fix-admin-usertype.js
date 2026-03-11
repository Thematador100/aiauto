/**
 * Fix admin user's user_type in database AND set secure password
 * This will make the admin dashboard appear when you login
 *
 * Run on Railway: railway run node backend/fix-admin-usertype.js
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  console.log('Run with: railway run node backend/fix-admin-usertype.js');
  process.exit(1);
}

// Generate secure random password
function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function fixAdmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Generate new secure password
    const newPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update admin user with correct user_type AND new secure password
    const result = await client.query(
      `UPDATE users
       SET user_type = 'admin', plan = 'admin', password_hash = $1
       WHERE email = 'admin@test.com'
       RETURNING email, user_type, plan`,
      [passwordHash]
    );

    if (result.rows.length > 0) {
      console.log('✅ Fixed admin user!');
      console.log('\n🔐 NEW LOGIN CREDENTIALS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:', result.rows[0].email);
      console.log('Password:', newPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  SAVE THIS PASSWORD - it won\'t be shown again!');
      console.log('\n🎉 Now login and you\'ll see the Admin Dashboard!');
    } else {
      console.log('⚠️  No admin user found with email admin@test.com');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixAdmin();
