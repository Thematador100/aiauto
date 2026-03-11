import React, { useState } from 'react';
import { User } from '../types';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const licenseBadge = () => {
    const status = user.licenseStatus || 'active';
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      trial: 'bg-blue-500/20 text-blue-400',
      suspended: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-red-500/20 text-red-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      expired: 'bg-yellow-500/20 text-yellow-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="bg-dark-card rounded-lg border border-dark-border p-6">
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-medium-text mb-1">Email</label>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm text-medium-text mb-1">Account Type</label>
            <p className="text-lg font-medium capitalize">{user.userType || 'Standard'}</p>
          </div>
          <div>
            <label className="block text-sm text-medium-text mb-1">Plan</label>
            <p className="text-lg font-medium capitalize">{user.plan || 'Free'}</p>
          </div>
          <div>
            <label className="block text-sm text-medium-text mb-1">License Status</label>
            <div className="mt-1">{licenseBadge()}</div>
          </div>
          {user.companyName && (
            <div>
              <label className="block text-sm text-medium-text mb-1">Company</label>
              <p className="text-lg font-medium">{user.companyName}</p>
            </div>
          )}
          {typeof user.inspectionCredits === 'number' && (
            <div>
              <label className="block text-sm text-medium-text mb-1">Inspection Credits</label>
              <p className="text-lg font-medium">
                {user.inspectionCredits === -1 ? 'Unlimited' : user.inspectionCredits}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features Enabled */}
      {user.featuresEnabled && Object.keys(user.featuresEnabled).length > 0 && (
        <div className="bg-dark-card rounded-lg border border-dark-border p-6">
          <h3 className="text-lg font-semibold mb-4">Enabled Features</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(user.featuresEnabled).map(([feature, enabled]) => (
              <span
                key={feature}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  enabled
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                }`}
              >
                {enabled ? '\u2713' : '\u2717'} {feature.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-dark-card rounded-lg border border-dark-border p-6">
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-light-text mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-text mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-text mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Sign Out */}
      <div className="bg-dark-card rounded-lg border border-dark-border p-6">
        <h3 className="text-lg font-semibold mb-2">Sign Out</h3>
        <p className="text-medium-text text-sm mb-4">Sign out of your account on this device.</p>
        <button
          onClick={onLogout}
          className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
