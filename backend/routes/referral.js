/**
 * AI Auto Pro — Neuroscience-Based Viral Referral System
 *
 * 7 Neurological Levers:
 * 1. Identity Labeling — tier titles (Certified → Elite → Master → Director → Partner)
 * 2. Variable Reward / Dopamine Loop — surprise bonuses at each milestone
 * 3. Endowed Progress Effect — progress bar starts at 20%, not 0%
 * 4. Social Proof Ticker — live feed of referral activity
 * 5. Reciprocity Pre-load — done-for-you email template + instant link
 * 6. Exclusivity Framing — "your private access link" not "affiliate link"
 * 7. Loss Aversion Trigger — pending credit expiry countdown at 48h
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import crypto from 'crypto';

const router = express.Router();

// ── Tier definitions ──────────────────────────────────────────────────────
const REFERRAL_TIERS = [
  { count: 0,  reward: 0,    bonus: 0,    title: 'Certified AI Auto Pro Inspector', badge: 'certified' },
  { count: 1,  reward: 100,  bonus: 0,    title: 'Certified AI Auto Pro Inspector', badge: 'certified' },
  { count: 3,  reward: 300,  bonus: 100,  title: 'Elite Inspector',                 badge: 'elite'     },
  { count: 5,  reward: 500,  bonus: 250,  title: 'Master Inspector',                badge: 'master'    },
  { count: 10, reward: 1000, bonus: 500,  title: 'Regional Director',               badge: 'director'  },
  { count: 25, reward: 2500, bonus: 1500, title: 'National Partner',                badge: 'partner'   },
];

function getTierForCount(count) {
  let tier = REFERRAL_TIERS[0];
  for (const t of REFERRAL_TIERS) { if (count >= t.count) tier = t; }
  return tier;
}

function getNextTier(count) {
  for (const t of REFERRAL_TIERS) { if (t.count > count) return t; }
  return null;
}

function generateReferralCode(userId) {
  const hash = crypto.createHash('sha256').update(`${userId}-aap-${Date.now()}`).digest('hex');
  return `AAP-${hash.substring(0, 8).toUpperCase()}`;
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ── GET /api/referral/dashboard ───────────────────────────────────────────
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Get or create referral record
    let rows = await query('SELECT * FROM referrals WHERE user_id = $1', [userId]);
    if (rows.rows.length === 0) {
      const code = generateReferralCode(userId);
      await query(
        'INSERT INTO referrals (user_id, referral_code, total_referrals, pending_credit, paid_credit) VALUES ($1, $2, 0, 0, 0)',
        [userId, code]
      );
      rows = await query('SELECT * FROM referrals WHERE user_id = $1', [userId]);
    }
    const referral = rows.rows[0];
    const count = referral.total_referrals;
    const currentTier = getTierForCount(count);
    const nextTier = getNextTier(count);

    // Endowed progress: minimum 20% even at 0
    const progressToNext = nextTier
      ? Math.max(20, Math.round(((count - currentTier.count) / (nextTier.count - currentTier.count)) * 100))
      : 100;

    // Referred users
    const refUsers = await query(`
      SELECT u.name, u.created_at, rc.reward_amount, rc.status
      FROM referral_conversions rc
      JOIN users u ON u.id = rc.referred_user_id
      WHERE rc.referrer_user_id = $1
      ORDER BY rc.created_at DESC LIMIT 20
    `, [userId]);

    // Loss aversion
    const pendingExpiry = referral.pending_expires_at ? new Date(referral.pending_expires_at) : null;
    const hoursUntilExpiry = pendingExpiry ? Math.max(0, Math.round((pendingExpiry - Date.now()) / 3600000)) : null;
    const lossAversionAlert = referral.pending_credit > 0 && hoursUntilExpiry !== null && hoursUntilExpiry < 48
      ? { active: true, amount: referral.pending_credit, hoursLeft: hoursUntilExpiry,
          message: `You have $${referral.pending_credit} in pending referral credit. Refer 1 more person in the next ${hoursUntilExpiry} hours to unlock it.` }
      : null;

    const frontendUrl = process.env.FRONTEND_URL || 'https://aiautopro.com';

    res.json({
      referralCode: referral.referral_code,
      referralLink: `${frontendUrl}/?ref=${referral.referral_code}`,
      totalReferrals: count,
      pendingCredit: referral.pending_credit,
      paidCredit: referral.paid_credit,
      currentTier,
      nextTier,
      progressToNext,
      referredUsers: refUsers.rows,
      lossAversionAlert,
      identityTitle: currentTier.title,
      identityBadge: currentTier.badge,
    });
  } catch (err) {
    console.error('Referral dashboard error:', err);
    res.status(500).json({ error: 'Failed to load referral data' });
  }
});

// ── GET /api/referral/social-feed ─────────────────────────────────────────
router.get('/social-feed', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        split_part(u.name, ' ', 1) || ' ' || left(split_part(u.name, ' ', 2), 1) || '.' AS display_name,
        '' AS city,
        rc.reward_amount,
        rc.created_at
      FROM referral_conversions rc
      JOIN users u ON u.id = rc.referrer_user_id
      WHERE rc.status = 'paid'
      ORDER BY rc.created_at DESC LIMIT 20
    `);

    const seedActivity = [
      { display_name: 'Marcus T.', city: 'Houston, TX', reward_amount: 200, created_at: new Date(Date.now() - 1800000).toISOString() },
      { display_name: 'Darius W.', city: 'Atlanta, GA', reward_amount: 100, created_at: new Date(Date.now() - 3600000).toISOString() },
      { display_name: 'James R.', city: 'Dallas, TX', reward_amount: 450, created_at: new Date(Date.now() - 7200000).toISOString() },
      { display_name: 'Kevin M.', city: 'Chicago, IL', reward_amount: 100, created_at: new Date(Date.now() - 10800000).toISOString() },
      { display_name: 'Tony B.', city: 'Phoenix, AZ', reward_amount: 750, created_at: new Date(Date.now() - 14400000).toISOString() },
    ];

    const real = result.rows || [];
    const feed = real.length >= 5 ? real : [...real, ...seedActivity].slice(0, 8);

    res.json({ feed: feed.map(f => ({
      ...f,
      message: `${f.display_name} in ${f.city || 'your area'} just earned $${f.reward_amount} in referral rewards`,
      timeAgo: getTimeAgo(f.created_at),
    }))});
  } catch (err) {
    res.json({ feed: [] });
  }
});

// ── POST /api/referral/track ──────────────────────────────────────────────
router.post('/track', async (req, res) => {
  const { refCode, visitorId } = req.body;
  if (!refCode) return res.json({ ok: true });
  try {
    const r = await query('SELECT id FROM referrals WHERE referral_code = $1', [refCode]);
    if (r.rows.length > 0) {
      await query(
        'INSERT INTO referral_clicks (referral_code, visitor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [refCode, visitorId || 'anonymous']
      );
    }
    res.json({ ok: true, valid: r.rows.length > 0 });
  } catch (err) {
    res.json({ ok: true });
  }
});

// ── POST /api/referral/convert — called when referred user activates ──────
router.post('/convert', authenticateToken, async (req, res) => {
  const { referredUserId, refCode } = req.body;
  try {
    const r = await query('SELECT * FROM referrals WHERE referral_code = $1', [refCode]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Invalid referral code' });
    const referral = r.rows[0];

    const newCount = referral.total_referrals + 1;
    const currentTier = getTierForCount(referral.total_referrals);
    const newTier = getTierForCount(newCount);
    const baseReward = 100;
    const bonusReward = newTier.count > currentTier.count ? newTier.bonus : 0;
    const totalReward = baseReward + bonusReward;

    const nextTier = getNextTier(newCount);
    const pendingExpiry = nextTier && (nextTier.count - newCount) === 1
      ? new Date(Date.now() + 48 * 3600000).toISOString()
      : null;

    await query(
      'UPDATE referrals SET total_referrals = $1, pending_credit = pending_credit + $2, pending_expires_at = COALESCE($3, pending_expires_at) WHERE referral_code = $4',
      [newCount, totalReward, pendingExpiry, refCode]
    );

    await query(
      'INSERT INTO referral_conversions (referrer_user_id, referred_user_id, referral_code, reward_amount, bonus_amount, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [referral.user_id, referredUserId, refCode, baseReward, bonusReward, 'pending']
    );

    const tierUpgrade = newTier.count > currentTier.count;
    res.json({ ok: true, reward: totalReward, tierUpgrade, newTier: tierUpgrade ? newTier : null });
  } catch (err) {
    console.error('Referral convert error:', err);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// ── POST /api/referral/payout — admin marks credit as paid ───────────────
router.post('/payout', authenticateToken, async (req, res) => {
  if (req.user.userType !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { userId, amount } = req.body;
  try {
    await query(
      'UPDATE referrals SET paid_credit = paid_credit + $1, pending_credit = GREATEST(0, pending_credit - $1) WHERE user_id = $2',
      [amount, userId]
    );
    await query(
      "UPDATE referral_conversions SET status = 'paid' WHERE referrer_user_id = $1 AND status = 'pending'",
      [userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Payout failed' });
  }
});

export default router;
