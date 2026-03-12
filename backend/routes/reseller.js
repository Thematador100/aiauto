import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * GET /api/reseller/dashboard
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await query(
      'SELECT id, name, email, is_reseller, max_sub_licenses, plan FROM users WHERE id = $1',
      [userId]
    );
    if (!userResult.rows.length || !userResult.rows[0].is_reseller) {
      return res.status(403).json({ error: 'Reseller access required. Upgrade to Entrepreneur plan.' });
    }
    const reseller = userResult.rows[0];
    const licensesResult = await query(
      `SELECT sl.*,
        u.name as licensee_name,
        u.email as licensee_email,
        u.company_name as licensee_company,
        (SELECT COUNT(*) FROM inspections WHERE user_id = u.id) as inspection_count,
        u.last_login
       FROM sub_licenses sl
       LEFT JOIN users u ON sl.licensee_id = u.id
       WHERE sl.reseller_id = $1
       ORDER BY sl.created_at DESC`,
      [userId]
    );
    const licenses = licensesResult.rows;
    const activeCount = licenses.filter(l => l.status === 'active').length;
    const pendingCount = licenses.filter(l => l.status === 'pending').length;
    const usedSlots = licenses.filter(l => l.status !== 'revoked').length;
    const availableSlots = reseller.max_sub_licenses - usedSlots;
    res.json({
      reseller: { id: reseller.id, name: reseller.name, email: reseller.email, plan: reseller.plan, maxSubLicenses: reseller.max_sub_licenses },
      stats: { totalSlots: reseller.max_sub_licenses, availableSlots: Math.max(0, availableSlots), activeCount, pendingCount, totalInspections: licenses.reduce((sum, l) => sum + parseInt(l.inspection_count || 0), 0) },
      licenses,
    });
  } catch (error) {
    console.error('[Reseller] Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load reseller dashboard' });
  }
});

/**
 * POST /api/reseller/licenses
 */
router.post('/licenses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;
    const userResult = await query('SELECT id, is_reseller, max_sub_licenses FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length || !userResult.rows[0].is_reseller) {
      return res.status(403).json({ error: 'Reseller access required' });
    }
    const maxSlots = userResult.rows[0].max_sub_licenses;
    const countResult = await query("SELECT COUNT(*) FROM sub_licenses WHERE reseller_id = $1 AND status != 'revoked'", [userId]);
    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= maxSlots) {
      return res.status(400).json({ error: `Maximum sub-licenses reached (${maxSlots}/${maxSlots})` });
    }
    const licenseResult = await query(
      `INSERT INTO sub_licenses (reseller_id, status, notes) VALUES ($1, 'pending', $2) RETURNING *`,
      [userId, notes || null]
    );
    res.json({ success: true, license: licenseResult.rows[0], message: 'License key created. Share the key with your inspector so they can register.' });
  } catch (error) {
    console.error('[Reseller] Create license error:', error);
    res.status(500).json({ error: 'Failed to create license' });
  }
});

/**
 * PATCH /api/reseller/licenses/:licenseId/status
 */
router.patch('/licenses/:licenseId/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { licenseId } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended', 'revoked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const licenseResult = await query('SELECT * FROM sub_licenses WHERE id = $1 AND reseller_id = $2', [licenseId, userId]);
    if (!licenseResult.rows.length) {
      return res.status(404).json({ error: 'License not found or not yours' });
    }
    await query('UPDATE sub_licenses SET status = $1, updated_at = NOW() WHERE id = $2', [status, licenseId]);
    const license = licenseResult.rows[0];
    if (license.licensee_id) {
      const newSubStatus = status === 'active' ? 'active' : 'suspended';
      await query('UPDATE users SET subscription_status = $1 WHERE id = $2', [newSubStatus, license.licensee_id]);
    }
    res.json({ success: true, message: `License ${status}` });
  } catch (error) {
    console.error('[Reseller] Update license status error:', error);
    res.status(500).json({ error: 'Failed to update license status' });
  }
});

/**
 * POST /api/reseller/register/:licenseKey
 */
router.post('/register/:licenseKey', async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const { name, email, password, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const licenseResult = await query("SELECT * FROM sub_licenses WHERE license_key = $1 AND status = 'pending'", [licenseKey]);
    if (!licenseResult.rows.length) {
      return res.status(400).json({ error: 'Invalid or already used license key' });
    }
    const license = licenseResult.rows[0];
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserResult = await query(
      `INSERT INTO users (name, email, password, company_name, user_type, plan, reseller_id, subscription_status, license_status)
       VALUES ($1, $2, $3, $4, 'pro', 'reseller-sub', $5, 'active', 'active') RETURNING id, name, email`,
      [name, email, hashedPassword, company || null, license.reseller_id]
    );
    const newUser = newUserResult.rows[0];
    await query("UPDATE sub_licenses SET status = 'active', licensee_id = $1, activated_at = NOW() WHERE id = $2", [newUser.id, license.id]);
    res.json({ success: true, message: 'Account created successfully. You can now log in.', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (error) {
    console.error('[Reseller] Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
