import React from 'react';
import { User } from '../types';

interface LicenseGateProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const STATUS_CONFIG: Record<string, { title: string; message: string; color: string; icon: string }> = {
  suspended: {
    title: 'Account Suspended',
    message: 'Your account has been suspended by the administrator. Please contact support to resolve this issue.',
    color: 'red',
    icon: '🚫',
  },
  cancelled: {
    title: 'License Cancelled',
    message: 'Your license has been cancelled. Please contact the administrator to reactivate your account.',
    color: 'red',
    icon: '❌',
  },
  inactive: {
    title: 'Pending Admin Approval',
    message: 'Your account is pending approval by the administrator. You will receive access once your account has been reviewed and activated. This typically takes 1 business day.',
    color: 'yellow',
    icon: '⏳',
  },
  expired: {
    title: 'License Expired',
    message: 'Your license has expired. Please contact the administrator to renew your subscription.',
    color: 'orange',
    icon: '⏰',
  },
};

/**
 * LicenseGate: Blocks access for users with suspended/cancelled/inactive/expired licenses.
 * Admins always pass through. Active and trial licenses pass through.
 */
export const LicenseGate: React.FC<LicenseGateProps> = ({ user, onLogout, children }) => {
  // Admins bypass all license checks
  if (user.userType === 'admin') {
    return <>{children}</>;
  }

  // Active and trial licenses pass through
  const status = user.licenseStatus;
  if (!status || status === 'active' || status === 'trial') {
    return <>{children}</>;
  }

  // Blocked - show the appropriate message
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.suspended;

  return (
    <div className="min-h-screen bg-dark-bg text-light-text flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className={`bg-dark-card border ${
          config.color === 'red' ? 'border-red-500' :
          config.color === 'yellow' ? 'border-yellow-500' :
          'border-orange-500'
        } rounded-lg p-8 text-center`}>
          <div className="text-6xl mb-4">{config.icon}</div>
          <h1 className={`text-2xl font-bold mb-3 ${
            config.color === 'red' ? 'text-red-400' :
            config.color === 'yellow' ? 'text-yellow-400' :
            'text-orange-400'
          }`}>
            {config.title}
          </h1>
          <p className="text-medium-text mb-6 leading-relaxed">
            {config.message}
          </p>

          <div className="bg-dark-bg rounded-lg p-4 mb-6 text-left">
            <div className="text-sm text-medium-text space-y-1">
              <div>Account: <span className="text-light-text">{user.email}</span></div>
              <div>License Status: <span className={`font-semibold ${
                config.color === 'red' ? 'text-red-400' :
                config.color === 'yellow' ? 'text-yellow-400' :
                'text-orange-400'
              }`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="mailto:support@aiautoinspect.com"
              className="block w-full px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg font-semibold transition-colors text-center"
            >
              Contact Support
            </a>
            <button
              onClick={onLogout}
              className="w-full px-6 py-3 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
