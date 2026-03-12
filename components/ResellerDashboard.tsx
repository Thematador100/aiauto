import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface SubLicense {
  id: number;
  license_key: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  licensee_name?: string;
  licensee_email?: string;
  licensee_company?: string;
  inspection_count?: number;
  last_login?: string;
  issued_at: string;
  activated_at?: string;
  notes?: string;
}

interface ResellerStats {
  totalSlots: number;
  availableSlots: number;
  activeCount: number;
  pendingCount: number;
  totalInspections: number;
}

interface ResellerDashboardProps {
  token: string;
}

export const ResellerDashboard: React.FC<ResellerDashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [licenses, setLicenses] = useState<SubLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/reseller/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load reseller dashboard');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setLicenses(data.licenses);
    } catch (e) {
      setError('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const createLicense = async () => {
    try {
      setCreating(true);
      const res = await fetch(`${BACKEND_URL}/api/reseller/licenses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: newNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create license');
        return;
      }
      setNewNotes('');
      setShowCreateForm(false);
      fetchDashboard();
    } catch (e) {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (licenseId: number, status: string) => {
    try {
      setActionLoading(licenseId);
      const res = await fetch(`${BACKEND_URL}/api/reseller/licenses/${licenseId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update license');
        return;
      }
      fetchDashboard();
    } catch (e) {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'pending': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'suspended': return 'text-orange-400 bg-orange-900/30 border-orange-700';
      case 'revoked': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-medium-text bg-dark-bg border-dark-border';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-medium-text">Loading reseller dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <p className="text-medium-text text-sm mt-2">The Entrepreneur plan ($3,997) includes 5 sub-licenses to sell or assign to other inspectors.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-light-text">Reseller Dashboard</h1>
          <p className="text-medium-text text-sm mt-1">Manage your sub-licenses and licensees</p>
        </div>
        {stats && stats.availableSlots > 0 && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors"
          >
            + Issue New License
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{stats.availableSlots}</div>
            <div className="text-xs text-medium-text mt-1">Available Slots</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.activeCount}</div>
            <div className="text-xs text-medium-text mt-1">Active Licensees</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{stats.pendingCount}</div>
            <div className="text-xs text-medium-text mt-1">Pending Keys</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-light-text">{stats.totalInspections}</div>
            <div className="text-xs text-medium-text mt-1">Total Inspections</div>
          </div>
        </div>
      )}

      {/* Slot Usage Bar */}
      {stats && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-medium-text">License Slots Used</span>
            <span className="text-light-text font-semibold">{stats.totalSlots - stats.availableSlots} / {stats.totalSlots}</span>
          </div>
          <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((stats.totalSlots - stats.availableSlots) / stats.totalSlots) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Create License Form */}
      {showCreateForm && (
        <div className="bg-dark-card border border-primary/50 rounded-lg p-5">
          <h3 className="text-lg font-bold text-light-text mb-3">Issue New Sub-License</h3>
          <p className="text-sm text-medium-text mb-4">
            A unique license key will be generated. Share it with the inspector — they use it to create their account.
          </p>
          <div className="mb-4">
            <label className="block text-sm text-medium-text mb-1">Notes (optional — e.g., inspector name or company)</label>
            <input
              type="text"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="e.g., John Smith - Dallas TX"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={createLicense}
              disabled={creating}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Generate License Key'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-dark-bg border border-dark-border text-medium-text rounded-lg hover:text-light-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* License List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-light-text">Your Sub-Licenses</h2>
        {licenses.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
            <p className="text-medium-text">No licenses issued yet.</p>
            <p className="text-sm text-medium-text mt-1">Click "Issue New License" to get started.</p>
          </div>
        ) : (
          licenses.map(license => (
            <div key={license.id} className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  {license.licensee_name ? (
                    <div>
                      <div className="font-semibold text-light-text">{license.licensee_name}</div>
                      <div className="text-sm text-medium-text">{license.licensee_email}</div>
                      {license.licensee_company && (
                        <div className="text-xs text-medium-text">{license.licensee_company}</div>
                      )}
                      <div className="text-xs text-medium-text mt-1">
                        {license.inspection_count || 0} inspections
                        {license.last_login && ` · Last active: ${new Date(license.last_login).toLocaleDateString()}`}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-medium-text mb-1">License Key (not yet claimed):</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary bg-dark-bg px-2 py-1 rounded border border-dark-border truncate max-w-xs">
                          {license.license_key}
                        </code>
                        <button
                          onClick={() => copyKey(license.license_key)}
                          className="text-xs px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors whitespace-nowrap"
                        >
                          {copiedKey === license.license_key ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      {license.notes && <div className="text-xs text-medium-text mt-1">{license.notes}</div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded border capitalize ${statusColor(license.status)}`}>
                    {license.status}
                  </span>
                  {license.status === 'active' && (
                    <button
                      onClick={() => updateStatus(license.id, 'suspended')}
                      disabled={actionLoading === license.id}
                      className="text-xs px-2 py-1 bg-orange-900/30 text-orange-400 border border-orange-700 rounded hover:bg-orange-900/50 transition-colors"
                    >
                      Suspend
                    </button>
                  )}
                  {license.status === 'suspended' && (
                    <button
                      onClick={() => updateStatus(license.id, 'active')}
                      disabled={actionLoading === license.id}
                      className="text-xs px-2 py-1 bg-green-900/30 text-green-400 border border-green-700 rounded hover:bg-green-900/50 transition-colors"
                    >
                      Reactivate
                    </button>
                  )}
                  {license.status !== 'revoked' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Revoke this license? This cannot be undone.')) {
                          updateStatus(license.id, 'revoked');
                        }
                      }}
                      disabled={actionLoading === license.id}
                      className="text-xs px-2 py-1 bg-red-900/30 text-red-400 border border-red-700 rounded hover:bg-red-900/50 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs text-medium-text mt-2">
                Issued: {new Date(license.issued_at).toLocaleDateString()}
                {license.activated_at && ` · Activated: ${new Date(license.activated_at).toLocaleDateString()}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
