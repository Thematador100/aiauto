import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Middleware to verify JWT tokens and attach user info to request
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      plan: decoded.plan,
      userType: decoded.userType
    };

    console.log(`[Auth] User ${req.user.email} authenticated`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to enforce license status.
 * Blocks access for users whose license is suspended, cancelled, or inactive.
 * Admins bypass this check. Trial users are allowed through.
 */
export const requireActiveLicense = async (req, res, next) => {
  try {
    // Admins bypass license checks entirely
    if (req.user.userType === 'admin') {
      return next();
    }

    const result = await query(
      `SELECT license_status, license_expires_at, features_enabled
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { license_status, license_expires_at, features_enabled } = result.rows[0];

    // NULL or missing license_status is treated as 'active' (backwards-compatible for existing users)
    const effectiveStatus = license_status || 'active';

    // Check if license has expired
    if (license_expires_at && new Date(license_expires_at) < new Date()) {
      return res.status(403).json({
        error: 'License expired',
        code: 'LICENSE_EXPIRED',
        message: 'Your license has expired. Please contact your administrator to renew.',
        licenseStatus: 'expired'
      });
    }

    // Check license status
    if (effectiveStatus === 'suspended') {
      return res.status(403).json({
        error: 'License suspended',
        code: 'LICENSE_SUSPENDED',
        message: 'Your account has been suspended. Please contact your administrator.',
        licenseStatus: 'suspended'
      });
    }

    if (effectiveStatus === 'cancelled') {
      return res.status(403).json({
        error: 'License cancelled',
        code: 'LICENSE_CANCELLED',
        message: 'Your license has been cancelled. Please contact your administrator to reactivate.',
        licenseStatus: 'cancelled'
      });
    }

    if (effectiveStatus === 'inactive') {
      return res.status(403).json({
        error: 'License inactive',
        code: 'LICENSE_INACTIVE',
        message: 'Your account has not been activated yet. Please contact your administrator.',
        licenseStatus: 'inactive'
      });
    }

    // Attach features to request for downstream feature checks
    req.user.featuresEnabled = features_enabled || {};
    req.user.licenseStatus = effectiveStatus;

    next();
  } catch (error) {
    console.error('[Auth] License check error:', error);
    res.status(500).json({ error: 'License verification failed' });
  }
};

/**
 * Middleware factory to require a specific feature flag.
 * Usage: requireFeature('ev_module')
 */
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    // Admins bypass feature checks
    if (req.user.userType === 'admin') {
      return next();
    }

    const features = req.user.featuresEnabled || {};

    if (!features[featureName]) {
      return res.status(403).json({
        error: 'Feature not available',
        code: 'FEATURE_DISABLED',
        message: `The "${featureName}" feature is not enabled on your license. Contact your administrator to upgrade.`,
        feature: featureName
      });
    }

    next();
  };
};

/**
 * Optional middleware to check if user has a specific subscription plan
 */
export const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.plan !== requiredPlan) {
      return res.status(403).json({
        error: `This feature requires ${requiredPlan} plan`,
        currentPlan: req.user.plan
      });
    }

    next();
  };
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (userId, email, plan, userType) => {
  return jwt.sign(
    { userId, email, plan, userType },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default { authenticateToken, requireActiveLicense, requireFeature, requirePlan, generateToken };
