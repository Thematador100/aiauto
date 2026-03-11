import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

/**
 * Create or Reset test admin user
 * Email: admin@test.com
 * Password: admin123
 */

async function createTestAdmin() {
  try {
    console.log('🔐 Checking admin user status...');

    const email = 'admin@test.com';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      // CRITICAL FIX: Force reset the password to ensure you can login
      await query(
        `UPDATE users 
         SET password_hash = $1, user_type = 'admin', plan = 'admin' 
         WHERE email = $2`, 
        [passwordHash, email]
      );
      console.log('✅ Admin exists - Password RESET to: admin123');
      console.log('✅ Admin permissions enforced');
    } else {
      // Create admin user if missing
      await query(
        `INSERT INTO users (
          email, password_hash, user_type, plan, inspection_credits, 
          subscription_status, created_at
        ) VALUES ($1, $2, 'admin', 'admin', -1, 'active', NOW())`,
        [email, passwordHash]
      );
      console.log('✅ New Admin user created!');
    }

    console.log('------------------------------------------------');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Error managing test users:', error);
  } finally {
    process.exit(0);
  }
}

createTestAdmin();
