/**
 * Change admin password script
 * Run with: DATABASE_URL=your_railway_db_url node change-admin-password.js
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import readline from 'readline';

const { Client } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('Usage: DATABASE_URL=postgresql://... node change-admin-password.js');
  process.exit(1);
}

async function changeAdminPassword() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Get admin email
    const email = await question('Enter admin email (default: admin@test.com): ');
    const adminEmail = email.trim() || 'admin@test.com';

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    );

    if (userCheck.rows.length === 0) {
      console.error(`❌ User with email ${adminEmail} not found`);
      process.exit(1);
    }

    console.log(`\n✓ Found user: ${userCheck.rows[0].email}`);

    // Get new password
    const newPassword = await question('\nEnter new password (min 8 characters): ');
    
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');
    
    if (newPassword !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await client.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, adminEmail]
    );

    console.log('\n✅ Password changed successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: [your new password]`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    rl.close();
  }
}

changeAdminPassword();
