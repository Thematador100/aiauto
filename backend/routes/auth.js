import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create a new user account (Phase 2C: Multi-tier users)
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      email,
      password,
      userType = 'diy',
      fullName,
      companyName,
      phone,
      plan
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate user type
    if (!['pro', 'diy', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Pro users need company name
    if (userType === 'pro' && !companyName) {
      return res.status(400).json({ error: 'Company name is required for professional accounts' });
    }

    // DIY users need full name
    if (userType === 'diy' && !fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine initial credits and subscription status based on plan
    let inspectionCredits = 0;
    let subscriptionStatus = 'inactive';
    let subscriptionExpiresAt = null;

    if (userType === 'pro') {
      // Pro users get unlimited inspections via active subscription
      inspectionCredits = -1; // -1 means unlimited
      subscriptionStatus = 'trial'; // Start with trial, will be 'active' after payment
      subscriptionExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial
    } else if (userType === 'diy') {
      // DIY users get credits based on plan
      if (plan === 'diy-single') {
        inspectionCredits = 1;
      } else if (plan === 'diy-5pack') {
        inspectionCredits = 5;
      } else if (plan === 'diy-premium') {
        inspectionCredits = 1; // Premium includes extras
      }
      subscriptionStatus = 'pay_per_use';
    }

    // Determine initial license status and features
    // New self-signups start as 'inactive' — admin must approve before they can log in
    const initialLicenseStatus = userType === 'admin' ? 'active' : 'inactive';
    const initialFeatures = {
      ai_reports: true,
      advanced_fraud: true,
      ev_module: false,
      lead_bot: false,
    };

    // Create user
    const result = await query(
      `INSERT INTO users (
        email,
        password_hash,
        user_type,
        company_name,
        phone,
        plan,
        inspection_credits,
        subscription_status,
        subscription_expires_at,
        license_status,
        features_enabled,
        created_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING id, email, user_type, company_name, plan, inspection_credits, subscription_status, license_status, features_enabled, created_at`,
      [
        email.toLowerCase(),
        passwordHash,
        userType,
        userType === 'pro' ? companyName : fullName,
        phone || null,
        plan,
        inspectionCredits,
        subscriptionStatus,
        subscriptionExpiresAt,
        initialLicenseStatus,
        JSON.stringify(initialFeatures)
      ]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.plan, userType);

    console.log(`[Auth] New ${userType} user registered: ${user.email}`);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        companyName: user.company_name,
        plan: user.plan,
        inspectionCredits: user.inspection_credits,
        subscriptionStatus: user.subscription_status,
        licenseStatus: user.license_status,
        featuresEnabled: user.features_enabled || {}
      },
      token
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token (Phase 2C: Multi-tier users)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with Phase 2 fields + license data
    const result = await query(
      `SELECT id, email, password_hash, user_type, company_name, plan,
              inspection_credits, subscription_status, subscription_expires_at,
              license_status, license_expires_at, features_enabled
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check subscription status
    const isSubscriptionActive = user.subscription_expires_at
      ? new Date(user.subscription_expires_at) > new Date()
      : false;

    // Generate JWT token

    console.log(`[Auth] ${user.user_type} user logged in: ${user.email}`);

    // Record last login timestamp
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]).catch(() => {});

    // Determine userType from user_type or infer from plan
    let userType = user.user_type;
    if (!userType) {
      // Fallback: infer from plan if user_type is null
      if (user.plan === 'admin') userType = 'admin';
      else if (user.plan && user.plan.startsWith('pro')) userType = 'pro';
      else userType = 'diy';
    }

        // Generate JWT token
        const token = generateToken(user.id, user.email, user.plan, userType);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        userType: userType,
        companyName: user.company_name || null,
        plan: user.plan,
        inspectionCredits: user.inspection_credits !== null ? user.inspection_credits : 0,
        subscriptionStatus: user.subscription_status || 'inactive',
        subscriptionActive: isSubscriptionActive,
        subscriptionExpiresAt: user.subscription_expires_at || null,
        licenseStatus: user.license_status || 'active',
        licenseExpiresAt: user.license_expires_at || null,
        featuresEnabled: user.features_enabled || {}
      },
      token
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Import here to avoid circular dependency
    const { authenticateToken } = await import('../middleware/auth.js');

    // Use middleware function manually
    authenticateToken(req, res, async () => {
      const result = await query(
        'SELECT id, email, plan, created_at, subscription_expires_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      const isSubscriptionActive = new Date(user.subscription_expires_at) > new Date();

      res.json({
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          subscriptionActive: isSubscriptionActive,
          subscriptionExpiresAt: user.subscription_expires_at,
          createdAt: user.created_at
        }
      });
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * GET /api/auth/license-status
 * Check current license status (for frontend license gate)
 */
router.get('/license-status', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { authenticateToken } = await import('../middleware/auth.js');

    authenticateToken(req, res, async () => {
      const result = await query(
        `SELECT license_status, license_expires_at, features_enabled, user_type
         FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Check if license has expired
      let effectiveStatus = user.license_status || 'active';
      if (user.license_expires_at && new Date(user.license_expires_at) < new Date()) {
        effectiveStatus = 'expired';
      }

      res.json({
        licenseStatus: effectiveStatus,
        licenseExpiresAt: user.license_expires_at,
        featuresEnabled: user.features_enabled || {},
        userType: user.user_type
      });
    });
  } catch (error) {
    console.error('[Auth] License status check error:', error);
    res.status(500).json({ error: 'Failed to check license status' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Generate a temporary reset code for password recovery
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset code has been generated.' });
    }

    // Generate a 6-digit reset code and store it with expiry
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
      `UPDATE users SET reset_code = $1, reset_code_expires_at = $2 WHERE id = $3`,
      [resetCode, expiresAt, result.rows[0].id]
    );

    console.log(`[Auth] Password reset code generated for ${email}: ${resetCode}`);

    // In production, send this code via email. For now, return it (admin can see it in logs)
    res.json({
      message: 'If that email exists, a reset code has been generated.',
      // Remove the code from the response in production and send via email instead
      resetCode
    });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using the code from forgot-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const result = await query(
      `SELECT id, reset_code, reset_code_expires_at FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or reset code' });
    }

    const user = result.rows[0];

    if (!user.reset_code || user.reset_code !== resetCode) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date(user.reset_code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE users SET password_hash = $1, reset_code = NULL, reset_code_expires_at = NULL WHERE id = $2`,
      [passwordHash, user.id]
    );

    console.log(`[Auth] Password reset successful for ${email}`);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { authenticateToken } = await import('../middleware/auth.js');

    authenticateToken(req, res, async () => {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const result = await query(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);

      console.log(`[Auth] Password changed for user ${req.user.email}`);
      res.json({ message: 'Password changed successfully' });
    });
  } catch (error) {
    console.error('[Auth] Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
