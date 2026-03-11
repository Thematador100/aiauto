import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (result.rows[0].user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('[Admin] Authorization error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * GET /api/admin/stats
 * Get platform statistics (admin only)
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total users by type
    const usersResult = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN user_type = 'pro' THEN 1 END) as pro_users,
        COUNT(CASE WHEN user_type = 'diy' THEN 1 END) as diy_users
      FROM users
    `);

    // Total inspections
    const inspectionsResult = await query('SELECT COUNT(*) FROM inspections');

    // Active subscriptions (pro users with active or trial status)
    const subscriptionsResult = await query(`
      SELECT COUNT(*) FROM users
      WHERE user_type = 'pro'
      AND subscription_status IN ('active', 'trial')
    `);

    // Estimate revenue (simplified calculation)
    // Pro Basic: $99, Pro Team: $299, DIY varies
    const revenueResult = await query(`
      SELECT
        COUNT(CASE WHEN plan = 'pro-basic' AND subscription_status IN ('active', 'trial') THEN 1 END) * 99 +
        COUNT(CASE WHEN plan = 'pro-team' AND subscription_status IN ('active', 'trial') THEN 1 END) * 299 +
        COUNT(CASE WHEN plan = 'diy-single' THEN 1 END) * 50 +
        COUNT(CASE WHEN plan = 'diy-5pack' THEN 1 END) * 200 +
        COUNT(CASE WHEN plan = 'diy-premium' THEN 1 END) * 150
        as estimated_revenue
      FROM users
    `);

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total_users),
        proUsers: parseInt(usersResult.rows[0].pro_users),
        diyUsers: parseInt(usersResult.rows[0].diy_users),
        totalInspections: parseInt(inspectionsResult.rows[0].count),
        activeSubscriptions: parseInt(subscriptionsResult.rows[0].count),
        totalRevenue: parseInt(revenueResult.rows[0].estimated_revenue || 0),
      },
    });
  } catch (error) {
    console.error('[Admin] Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

/**
 * GET /api/admin/users
 * Get all users (admin only) - Enhanced with license fields
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type = 'all', licenseStatus } = req.query;

    let queryText = `
      SELECT id, email, user_type, company_name, phone, plan,
             inspection_credits, subscription_status, created_at,
             license_status, license_type, territory, revenue_share_percentage,
             features_enabled, license_issued_at, license_expires_at,
             monthly_platform_fee, upfront_fee_paid, onboarding_completed,
             stripe_account_id
      FROM users
    `;

    const params = [];
    const conditions = [];

    if (type === 'pro') {
      conditions.push(`user_type = $${params.length + 1}`);
      params.push('pro');
    } else if (type === 'diy') {
      conditions.push(`user_type = $${params.length + 1}`);
      params.push('diy');
    }

    if (licenseStatus) {
      conditions.push(`license_status = $${params.length + 1}`);
      params.push(licenseStatus);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ` + conditions.join(' AND ');
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, params);

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error('[Admin] Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get specific user details (admin only)
 */
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, email, user_type, company_name, phone, plan,
              inspection_credits, subscription_status, subscription_expires_at,
              created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[Admin] Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details (admin only) - Enhanced with license fields
 */
router.patch('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      inspectionCredits,
      subscriptionStatus,
      plan,
      licenseStatus,
      licenseType,
      territory,
      revenueSharePercentage,
      monthlyPlatformFee,
      upfrontFeePaid,
      featuresEnabled,
      stripeAccountId,
      licenseExpiresAt
    } = req.body;

    const updates = [];
    const params = [id];
    let paramCount = 2;

    if (inspectionCredits !== undefined) {
      updates.push(`inspection_credits = $${paramCount}`);
      params.push(inspectionCredits);
      paramCount++;
    }

    if (subscriptionStatus) {
      updates.push(`subscription_status = $${paramCount}`);
      params.push(subscriptionStatus);
      paramCount++;
    }

    if (plan) {
      updates.push(`plan = $${paramCount}`);
      params.push(plan);
      paramCount++;
    }

    if (licenseStatus) {
      updates.push(`license_status = $${paramCount}`);
      params.push(licenseStatus);
      paramCount++;
    }

    if (licenseType) {
      updates.push(`license_type = $${paramCount}`);
      params.push(licenseType);
      paramCount++;
    }

    if (territory !== undefined) {
      updates.push(`territory = $${paramCount}`);
      params.push(territory);
      paramCount++;
    }

    if (revenueSharePercentage !== undefined) {
      updates.push(`revenue_share_percentage = $${paramCount}`);
      params.push(revenueSharePercentage);
      paramCount++;
    }

    if (monthlyPlatformFee !== undefined) {
      updates.push(`monthly_platform_fee = $${paramCount}`);
      params.push(monthlyPlatformFee);
      paramCount++;
    }

    if (upfrontFeePaid !== undefined) {
      updates.push(`upfront_fee_paid = $${paramCount}`);
      params.push(upfrontFeePaid);
      paramCount++;
    }

    if (featuresEnabled) {
      updates.push(`features_enabled = $${paramCount}`);
      params.push(JSON.stringify(featuresEnabled));
      paramCount++;
    }

    if (stripeAccountId !== undefined) {
      updates.push(`stripe_account_id = $${paramCount}`);
      params.push(stripeAccountId);
      paramCount++;
    }

    if (licenseExpiresAt !== undefined) {
      updates.push(`license_expires_at = $${paramCount}`);
      params.push(licenseExpiresAt); // ISO date string or null to clear
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const queryText = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, email, user_type, company_name, plan, inspection_credits, subscription_status,
                license_status, license_type, territory, revenue_share_percentage, features_enabled, license_expires_at
    `;

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[Admin] Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user (admin only)
 */
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userResult = await query('SELECT email FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's inspections first (cascade)
    await query('DELETE FROM inspections WHERE user_id = $1', [id]);

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [id]);

    console.log(`[Admin] Deleted user: ${userResult.rows[0].email}`);

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('[Admin] Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/inspections
 * Get all inspections across platform (admin only)
 */
router.get('/inspections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT i.*, u.email, u.company_name
       FROM inspections i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      inspections: result.rows,
    });
  } catch (error) {
    console.error('[Admin] Get inspections error:', error);
    res.status(500).json({ error: 'Failed to retrieve inspections' });
  }
});

/**
 * LICENSE MANAGEMENT ENDPOINTS
 */

/**
 * POST /api/admin/licenses/issue
 * Issue a new license to a user (admin only)
 */
router.post('/licenses/issue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      licenseType = 'independent',
      territory,
      revenueSharePercentage = 20,
      monthlyPlatformFee = 297,
      upfrontFeePaid = 0,
      featuresEnabled = {
        ev_module: false,
        advanced_fraud: true,
        ai_reports: true,
        lead_bot: false
      },
      licenseExpiresAt,
      licenseDurationMonths = 12 // Default 1-year license
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Calculate expiry: use explicit date, or default to licenseDurationMonths from now
    const expiryDate = licenseExpiresAt
      ? new Date(licenseExpiresAt)
      : new Date(Date.now() + licenseDurationMonths * 30 * 24 * 60 * 60 * 1000);

    // Update user with license details
    const result = await query(
      `UPDATE users
       SET license_status = 'active',
           license_type = $2,
           territory = $3,
           revenue_share_percentage = $4,
           monthly_platform_fee = $5,
           upfront_fee_paid = $6,
           features_enabled = $7,
           license_issued_at = NOW(),
           license_expires_at = $8
       WHERE id = $1
       RETURNING id, email, company_name, license_status, territory, license_expires_at`,
      [userId, licenseType, territory, revenueSharePercentage, monthlyPlatformFee, upfrontFeePaid, JSON.stringify(featuresEnabled), expiryDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] License issued to user: ${result.rows[0].email}`);

    res.json({
      message: 'License issued successfully',
      license: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Issue license error:', error);
    res.status(500).json({ error: 'Failed to issue license' });
  }
});

/**
 * PATCH /api/admin/licenses/:userId/status
 * Update license status (activate, suspend, cancel)
 */
router.patch('/licenses/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, licenseExpiresAt, licenseDurationMonths } = req.body;

    if (!['active', 'suspended', 'cancelled', 'trial'].includes(status)) {
      return res.status(400).json({ error: 'Invalid license status' });
    }

    // When activating, set expiry if provided or default to 1 year
    let expiryClause = '';
    const params = [userId, status];

    if (status === 'active' || status === 'trial') {
      if (licenseExpiresAt) {
        expiryClause = `, license_expires_at = $3`;
        params.push(new Date(licenseExpiresAt));
      } else if (licenseDurationMonths) {
        expiryClause = `, license_expires_at = $3`;
        params.push(new Date(Date.now() + licenseDurationMonths * 30 * 24 * 60 * 60 * 1000));
      }
      // If neither provided when activating, keep existing expiry
    } else if (status === 'cancelled') {
      // When cancelling, clear the expiry
      expiryClause = `, license_expires_at = NULL`;
    }

    const result = await query(
      `UPDATE users
       SET license_status = $2${expiryClause}
       WHERE id = $1
       RETURNING id, email, license_status, license_expires_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] License ${status} for user: ${result.rows[0].email}`);

    res.json({
      message: `License ${status} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Update license status error:', error);
    res.status(500).json({ error: 'Failed to update license status' });
  }
});

/**
 * PATCH /api/admin/licenses/:userId/features
 * Update feature flags for a license
 */
router.patch('/licenses/:userId/features', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { features } = req.body;

    if (!features || typeof features !== 'object') {
      return res.status(400).json({ error: 'Features object is required' });
    }

    const result = await query(
      `UPDATE users
       SET features_enabled = $2
       WHERE id = $1
       RETURNING id, email, features_enabled`,
      [userId, JSON.stringify(features)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Features updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Update features error:', error);
    res.status(500).json({ error: 'Failed to update features' });
  }
});

/**
 * PATCH /api/admin/licenses/:userId/expiry
 * Set or renew license expiry date
 */
router.patch('/licenses/:userId/expiry', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { licenseExpiresAt, licenseDurationMonths } = req.body;

    let expiryDate;
    if (licenseExpiresAt) {
      expiryDate = new Date(licenseExpiresAt);
    } else if (licenseDurationMonths) {
      expiryDate = new Date(Date.now() + licenseDurationMonths * 30 * 24 * 60 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'Provide licenseExpiresAt (ISO date) or licenseDurationMonths' });
    }

    const result = await query(
      `UPDATE users
       SET license_expires_at = $2
       WHERE id = $1
       RETURNING id, email, license_status, license_expires_at`,
      [userId, expiryDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] License expiry set for ${result.rows[0].email}: ${expiryDate.toISOString()}`);

    res.json({
      message: 'License expiry updated',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Update license expiry error:', error);
    res.status(500).json({ error: 'Failed to update license expiry' });
  }
});

/**
 * SALES TRACKING ENDPOINTS
 */

/**
 * POST /api/admin/sales
 * Record a sale for revenue share tracking
 */
router.post('/sales', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      inspectionId,
      saleAmount,
      paymentMethod = 'stripe_independent',
      customerName,
      customerEmail,
      notes
    } = req.body;

    if (!userId || !saleAmount) {
      return res.status(400).json({ error: 'User ID and sale amount are required' });
    }

    // Get user's revenue share percentage
    const userResult = await query(
      'SELECT revenue_share_percentage FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const revenueSharePercentage = userResult.rows[0].revenue_share_percentage || 20;
    const revenueShareAmount = Math.floor((saleAmount * revenueSharePercentage) / 100);
    const inspectorRevenue = saleAmount - revenueShareAmount;

    // Record sale
    const result = await query(
      `INSERT INTO inspector_sales (
        user_id, inspection_id, sale_amount, revenue_share_amount,
        inspector_revenue, payment_method, customer_name, customer_email, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, inspectionId, saleAmount, revenueShareAmount, inspectorRevenue,
       paymentMethod, customerName, customerEmail, notes]
    );

    console.log(`[Admin] Sale recorded: $${(saleAmount / 100).toFixed(2)} for user ID ${userId}`);

    res.json({
      message: 'Sale recorded successfully',
      sale: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Record sale error:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

/**
 * GET /api/admin/sales
 * Get all sales with revenue share tracking
 */
router.get('/sales', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, revenueShareStatus, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT s.*, u.email, u.company_name
      FROM inspector_sales s
      JOIN users u ON s.user_id = u.id
    `;

    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push(`s.user_id = $${params.length + 1}`);
      params.push(userId);
    }

    if (revenueShareStatus) {
      conditions.push(`s.revenue_share_status = $${params.length + 1}`);
      params.push(revenueShareStatus);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ` + conditions.join(' AND ');
    }

    queryText += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Calculate totals
    const totalsResult = await query(`
      SELECT
        COUNT(*) as total_sales,
        SUM(sale_amount) as total_revenue,
        SUM(revenue_share_amount) as total_revenue_share,
        SUM(CASE WHEN revenue_share_status = 'pending' THEN revenue_share_amount ELSE 0 END) as pending_revenue_share
      FROM inspector_sales
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `, params.slice(0, -2)); // Remove limit/offset params

    res.json({
      sales: result.rows,
      totals: {
        totalSales: parseInt(totalsResult.rows[0].total_sales) || 0,
        totalRevenue: parseInt(totalsResult.rows[0].total_revenue) || 0,
        totalRevenueShare: parseInt(totalsResult.rows[0].total_revenue_share) || 0,
        pendingRevenueShare: parseInt(totalsResult.rows[0].pending_revenue_share) || 0
      }
    });
  } catch (error) {
    console.error('[Admin] Get sales error:', error);
    res.status(500).json({ error: 'Failed to retrieve sales' });
  }
});

/**
 * GET /api/admin/sales/:userId
 * Get sales for specific inspector
 */
router.get('/sales/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT * FROM inspector_sales
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Calculate inspector totals
    const totalsResult = await query(`
      SELECT
        COUNT(*) as total_sales,
        SUM(sale_amount) as total_revenue,
        SUM(revenue_share_amount) as total_owed,
        SUM(CASE WHEN revenue_share_status = 'paid' THEN revenue_share_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN revenue_share_status = 'pending' THEN revenue_share_amount ELSE 0 END) as total_pending
      FROM inspector_sales
      WHERE user_id = $1
    `, [userId]);

    res.json({
      sales: result.rows,
      totals: totalsResult.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Get inspector sales error:', error);
    res.status(500).json({ error: 'Failed to retrieve inspector sales' });
  }
});

/**
 * PATCH /api/admin/sales/:saleId/revenue-share
 * Mark revenue share as paid
 */
router.patch('/sales/:saleId/revenue-share', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { saleId } = req.params;
    const { status } = req.body;

    if (!['paid', 'pending', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid revenue share status' });
    }

    const result = await query(
      `UPDATE inspector_sales
       SET revenue_share_status = $2,
           revenue_share_paid_at = ${status === 'paid' ? 'NOW()' : 'NULL'}
       WHERE id = $1
       RETURNING *`,
      [saleId, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json({
      message: 'Revenue share updated successfully',
      sale: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Update revenue share error:', error);
    res.status(500).json({ error: 'Failed to update revenue share' });
  }
});

/**
 * GET /api/admin/territories
 * Get all territories
 */
router.get('/territories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*,
             (SELECT COUNT(*) FROM users WHERE territory = t.territory_name AND license_status = 'active') as active_inspectors
      FROM territories t
      ORDER BY territory_name
    `);

    res.json({
      territories: result.rows
    });
  } catch (error) {
    console.error('[Admin] Get territories error:', error);
    res.status(500).json({ error: 'Failed to retrieve territories' });
  }
});

/**
 * POST /api/admin/territories
 * Create new territory
 */
router.post('/territories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      territoryName,
      country = 'USA',
      state,
      city,
      zipCodes = [],
      maxInspectors = 5
    } = req.body;

    if (!territoryName) {
      return res.status(400).json({ error: 'Territory name is required' });
    }

    const result = await query(
      `INSERT INTO territories (territory_name, country, state, city, zip_codes, max_inspectors)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [territoryName, country, state, city, zipCodes, maxInspectors]
    );

    res.json({
      message: 'Territory created successfully',
      territory: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Create territory error:', error);
    res.status(500).json({ error: 'Failed to create territory' });
  }
});

/**
 * USER CREATION & PASSWORD MANAGEMENT
 */

/**
 * POST /api/admin/users/create
 * Create a new user account with password (admin only)
 * Perfect for onboarding new licensees
 */
router.post('/users/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      userType = 'pro',
      companyName,
      phone,
      plan = 'pro-basic',
      // License fields
      territory,
      licenseType = 'independent',
      revenueSharePercentage = 20,
      monthlyPlatformFee = 297,
      upfrontFeePaid = 0,
      featuresEnabled = {
        ev_module: false,
        advanced_fraud: true,
        ai_reports: true,
        lead_bot: false
      },
      autoActivateLicense = true,
      licenseExpiresAt,
      licenseDurationMonths = 12 // Default 1-year license
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
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
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash(password, 10);

    // Determine initial credits and status
    let inspectionCredits = -1; // Unlimited for pro
    let subscriptionStatus = autoActivateLicense ? 'active' : 'trial';
    let licenseStatus = autoActivateLicense ? 'active' : 'inactive';

    // Calculate license expiry: explicit date, or default duration from now
    const expiryDate = autoActivateLicense
      ? (licenseExpiresAt
          ? new Date(licenseExpiresAt)
          : new Date(Date.now() + licenseDurationMonths * 30 * 24 * 60 * 60 * 1000))
      : null;

    // Create user with license fields
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
        license_status,
        license_type,
        territory,
        revenue_share_percentage,
        monthly_platform_fee,
        upfront_fee_paid,
        features_enabled,
        license_issued_at,
        license_expires_at,
        onboarding_completed,
        created_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ${autoActivateLicense ? 'NOW()' : 'NULL'}, $16, $17, NOW())
       RETURNING id, email, user_type, company_name, plan, license_status, territory, license_expires_at`,
      [
        email.toLowerCase(),
        passwordHash,
        userType,
        companyName,
        phone || null,
        plan,
        inspectionCredits,
        subscriptionStatus,
        licenseStatus,
        licenseType,
        territory || null,
        revenueSharePercentage,
        monthlyPlatformFee,
        upfrontFeePaid,
        JSON.stringify(featuresEnabled),
        expiryDate,
        false // onboarding_completed
      ]
    );

    const newUser = result.rows[0];

    console.log(`[Admin] Created new ${userType} user: ${newUser.email} with license: ${licenseStatus}`);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      credentials: {
        email: email.toLowerCase(),
        password: password, // Return password so admin can share with new user
        loginUrl: process.env.FRONTEND_URL || 'https://your-app.vercel.app'
      }
    });
  } catch (error) {
    console.error('[Admin] Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PATCH /api/admin/users/:id/password
 * Reset/change a user's password (admin only)
 */
router.patch('/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Hash new password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash(newPassword, 10);

    // Update password
    const result = await query(
      `UPDATE users
       SET password_hash = $2
       WHERE id = $1
       RETURNING id, email`,
      [id, passwordHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Password reset for user: ${result.rows[0].email}`);

    res.json({
      message: 'Password updated successfully',
      user: result.rows[0],
      newPassword: newPassword // Return so admin can share with user
    });
  } catch (error) {
    console.error('[Admin] Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * POST /api/admin/users/bulk-create
 * Create multiple users at once (for batch onboarding)
 */
router.post('/users/bulk-create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const bcrypt = await import('bcryptjs');
    const createdUsers = [];
    const errors = [];

    for (const userData of users) {
      try {
        const {
          email,
          password,
          companyName,
          territory,
          userType = 'pro',
          plan = 'pro-basic',
          licenseType = 'independent',
          revenueSharePercentage = 20,
          monthlyPlatformFee = 297,
          upfrontFeePaid = 0
        } = userData;

        // Validate
        if (!email || !password) {
          errors.push({ email, error: 'Email and password required' });
          continue;
        }

        // Check if exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
          errors.push({ email, error: 'Email already exists' });
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.default.hash(password, 10);

        // Create user
        const result = await query(
          `INSERT INTO users (
            email, password_hash, user_type, company_name, plan,
            inspection_credits, subscription_status, license_status, license_type,
            territory, revenue_share_percentage, monthly_platform_fee, upfront_fee_paid,
            features_enabled, license_issued_at, created_at
          )
           VALUES ($1, $2, $3, $4, $5, -1, 'active', 'active', $6, $7, $8, $9, $10,
                   '{"ev_module": false, "advanced_fraud": true, "ai_reports": true, "lead_bot": false}',
                   NOW(), NOW())
           RETURNING id, email, company_name, territory`,
          [email.toLowerCase(), passwordHash, userType, companyName, plan, licenseType,
           territory, revenueSharePercentage, monthlyPlatformFee, upfrontFeePaid]
        );

        createdUsers.push({
          ...result.rows[0],
          password: password // Include password in response
        });

      } catch (err) {
        errors.push({ email: userData.email, error: err.message });
      }
    }

    console.log(`[Admin] Bulk created ${createdUsers.length} users, ${errors.length} errors`);

    res.json({
      message: `Created ${createdUsers.length} users`,
      created: createdUsers,
      errors: errors
    });
  } catch (error) {
    console.error('[Admin] Bulk create error:', error);
    res.status(500).json({ error: 'Failed to bulk create users' });
  }
});

/**
 * GET /api/admin/usage
 * Get per-user usage stats: inspections, last login, OBD connections, reports
 */
router.get('/usage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id,
        u.email,
        u.company_name,
        u.user_type,
        u.plan,
        u.license_status,
        u.license_expires_at,
        u.last_login_at,
        u.created_at,
        COUNT(DISTINCT i.id) as total_inspections,
        COUNT(DISTINCT CASE WHEN i.created_at > NOW() - INTERVAL '30 days' THEN i.id END) as inspections_last_30d,
        COUNT(DISTINCT CASE WHEN i.created_at > NOW() - INTERVAL '7 days' THEN i.id END) as inspections_last_7d,
        MAX(i.created_at) as last_inspection_at,
        COUNT(DISTINCT CASE WHEN i.vehicle_type = 'Commercial' THEN i.id END) as commercial_inspections,
        COUNT(DISTINCT CASE WHEN i.vehicle_type = 'Truck' THEN i.id END) as truck_inspections,
        COUNT(DISTINCT CASE WHEN i.vehicle_type = 'EV' THEN i.id END) as ev_inspections
      FROM users u
      LEFT JOIN inspections i ON i.user_id = u.id
      WHERE u.user_type != 'admin'
      GROUP BY u.id
      ORDER BY total_inspections DESC
    `);

    res.json({ usage: result.rows });
  } catch (error) {
    console.error('[Admin] Usage stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve usage stats' });
  }
});

/**
 * GET /api/admin/pending
 * Get users with pending/inactive license status waiting for approval
 */
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, user_type, company_name, phone, plan, created_at, license_status
      FROM users
      WHERE license_status IN ('inactive', 'pending')
      AND user_type != 'admin'
      ORDER BY created_at DESC
    `);

    res.json({ pending: result.rows });
  } catch (error) {
    console.error('[Admin] Pending users error:', error);
    res.status(500).json({ error: 'Failed to retrieve pending users' });
  }
});

/**
 * PATCH /api/admin/users/:id/approve
 * Approve a pending user and activate their license
 */
router.patch('/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseDurationMonths = 12, plan } = req.body;

    const expiryDate = new Date(Date.now() + licenseDurationMonths * 30 * 24 * 60 * 60 * 1000);

    const updates = [
      `license_status = 'active'`,
      `subscription_status = 'active'`,
      `license_issued_at = NOW()`,
      `license_expires_at = $2`
    ];
    const params = [id, expiryDate];

    if (plan) {
      updates.push(`plan = $${params.length + 1}`);
      params.push(plan);
    }

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1
       RETURNING id, email, license_status, license_expires_at, plan`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Approved user: ${result.rows[0].email} — license active until ${expiryDate.toLocaleDateString()}`);

    res.json({
      message: `User approved. License active for ${licenseDurationMonths} months.`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

/**
 * GET /api/admin/expiring
 * Get users whose licenses expire within the next 30 days
 */
router.get('/expiring', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await query(`
      SELECT id, email, company_name, user_type, plan, license_status, license_expires_at
      FROM users
      WHERE license_expires_at IS NOT NULL
        AND license_expires_at > NOW()
        AND license_expires_at < NOW() + INTERVAL '${parseInt(days)} days'
        AND license_status = 'active'
      ORDER BY license_expires_at ASC
    `);

    res.json({ expiring: result.rows });
  } catch (error) {
    console.error('[Admin] Expiring licenses error:', error);
    res.status(500).json({ error: 'Failed to retrieve expiring licenses' });
  }
});

/**
 * PATCH /api/admin/users/:id/last-login
 * Update last login timestamp (called by auth middleware)
 */
router.patch('/users/:id/last-login', async (req, res) => {
  try {
    await query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update last login' });
  }
});

export default router;

