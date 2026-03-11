import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface DIYDashboardProps {
  user: User;
  onLogout: () => void;
  onStartInspection: () => void;
}

interface InspectionHistory {
  id: string;
  vehicle_vin: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  created_at: string;
  status: string;
}

/**
 * Phase 2C: Simplified DIY Dashboard
 * For individual car buyers - streamlined interface for quick inspections
 */
export const DIYDashboard: React.FC<DIYDashboardProps> = ({ user, onLogout, onStartInspection }) => {
  const [history, setHistory] = useState<InspectionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

  // Fetch inspection history
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/inspections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.inspections || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Check if user has credits
  const hasCredits = (user.inspectionCredits ?? 0) > 0;
  const creditsRemaining = user.inspectionCredits ?? 0;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-primary">AI Auto Pro</h1>
            <span className="text-medium-text text-sm">Car Buyer Inspection</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-light-text">{user.email}</div>
              <div className="text-xs text-medium-text">
                {creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'} remaining
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-light-text mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-medium-text">
            Ready to inspect your next vehicle? Let's make sure you're getting a great deal.
          </p>
        </div>

        {/* Credits Warning */}
        {!hasCredits && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-red-300 mb-2">No Inspection Credits</h3>
                <p className="text-red-200 mb-4">
                  You've used all your inspection credits. Purchase more to continue inspecting vehicles.
                </p>
                <button className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors">
                  Buy More Credits
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Start Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">
                Start a New Inspection
              </h3>
              <p className="text-blue-100 mb-6 max-w-xl">
                Get a professional AI-powered inspection in minutes. We'll check for fraud,
                hidden damage, common issues, and give you a "Should I Buy?" recommendation.
              </p>
              <button
                onClick={onStartInspection}
                disabled={!hasCredits}
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasCredits ? 'Start Inspection' : 'No Credits Available'}
              </button>
            </div>
            <div className="text-8xl opacity-20 hidden md:block">🚗</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🕵️</div>
            <div className="text-sm font-semibold text-light-text mb-1">Fraud Detection</div>
            <div className="text-xs text-medium-text">Odometer tampering & flood damage</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-sm font-semibold text-light-text mb-1">Known Issues</div>
            <div className="text-xs text-medium-text">Common problems for this vehicle</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🤖</div>
            <div className="text-sm font-semibold text-light-text mb-1">AI Analysis</div>
            <div className="text-xs text-medium-text">Photo analysis & condition report</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-sm font-semibold text-light-text mb-1">PDF Report</div>
            <div className="text-xs text-medium-text">Download & share your report</div>
          </div>
        </div>

        {/* Inspection History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-light-text">Your Inspection History</h3>
            <button
              onClick={fetchHistory}
              className="text-primary hover:text-primary-light text-sm font-semibold"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
              <div className="text-medium-text">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <div className="text-light-text font-semibold mb-2">No Inspections Yet</div>
              <div className="text-medium-text">
                Start your first inspection to see it here
              </div>
            </div>
          ) : (
            <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-bg">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-medium-text">Vehicle</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-medium-text">VIN</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-medium-text">Date</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-medium-text">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-medium-text">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {history.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-dark-bg transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-light-text font-medium">
                          {inspection.vehicle_year} {inspection.vehicle_make} {inspection.vehicle_model}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-medium-text font-mono text-sm">
                        {inspection.vehicle_vin}
                      </td>
                      <td className="px-6 py-4 text-medium-text text-sm">
                        {new Date(inspection.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          inspection.status === 'completed'
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {inspection.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-primary hover:text-primary-light text-sm font-semibold">
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-dark-card border border-dark-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-light-text mb-3">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">1️⃣</span>
                <span className="font-semibold text-light-text">Enter VIN</span>
              </div>
              <p className="text-medium-text">
                Start by entering the vehicle's VIN number. We'll pull up its make, model, year, and check for recalls.
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">2️⃣</span>
                <span className="font-semibold text-light-text">Take Photos</span>
              </div>
              <p className="text-medium-text">
                Use your phone to take photos of the exterior, interior, engine bay, and any damage or concerns.
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">3️⃣</span>
                <span className="font-semibold text-light-text">Get AI Report</span>
              </div>
              <p className="text-medium-text">
                Our AI analyzes everything and gives you a detailed report with a clear buy/don't buy recommendation.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-medium-text text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@aiautopro.com" className="text-primary hover:text-primary-light">
              support@aiautopro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
