import React, { useState, useEffect } from 'react';
import { MainApp } from './MainApp';
import { User } from '../types';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  diyUsers: number;
  totalInspections: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

interface UserRecord {
  id: string;
  email: string;
  user_type: string;
  company_name: string;
  plan: string;
  inspection_credits: number;
  subscription_status: string;
  created_at: string;
  license_status: string | null;
  license_type: string | null;
  territory: string | null;
  revenue_share_percentage: number | null;
  features_enabled: Record<string, boolean> | null;
  license_issued_at: string | null;
  license_expires_at: string | null;
}

interface UsageRecord {
  id: string;
  email: string;
  company_name: string;
  user_type: string;
  plan: string;
  license_status: string;
  license_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
  total_inspections: number;
  inspections_last_30d: number;
  inspections_last_7d: number;
  last_inspection_at: string | null;
  commercial_inspections: number;
  truck_inspections: number;
  ev_inspections: number;
}

interface PendingUser {
  id: string;
  email: string;
  user_type: string;
  company_name: string;
  phone: string;
  plan: string;
  created_at: string;
  license_status: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  userType: 'pro' | 'diy' | 'admin';
  companyName: string;
  phone: string;
  plan: string;
  territory: string;
}

/**
 * Phase 2C: Enterprise Admin Dashboard with FULL Management Capabilities
 * - Create new user logins
 * - Manage credits, passwords, accounts
 * - View activity and audit logs
 * - Never leaves admin stranded
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'staff' | 'sales' | 'usage' | 'pending' | 'inspector'>('overview');
  const [showInspectorTool, setShowInspectorTool] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'diy'>('all');
  const [filterLicense, setFilterLicense] = useState<string>('all');

  // Modals and forms
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditCreditsModal, setShowEditCreditsModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    userType: 'pro',
    companyName: '',
    phone: '',
    plan: 'pro-basic',
    territory: ''
  });

  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);

  const [newCredits, setNewCredits] = useState<number>(0);
  const [newPassword, setNewPassword] = useState('');
  const [editFeatures, setEditFeatures] = useState<Record<string, boolean>>({
    ev_module: false,
    advanced_fraud: true,
    ai_reports: true,
    lead_bot: false,
  });
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
   const [usageData, setUsageData] = useState<UsageRecord[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [salesData, setSalesData] = useState<{sales: any[], totals: any} | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

  // Fetch platform statistics
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const licenseParam = filterLicense !== 'all' ? `&licenseStatus=${filterLicense}` : '';
      const response = await fetch(`${BACKEND_URL}/api/admin/users?type=${filterType}${licenseParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showMessage('error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserForm),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `User created! Login: ${data.credentials.email} / ${data.credentials.password}`);
        setShowCreateUserModal(false);
        setCreateUserForm({
          email: '',
          password: '',
          userType: 'pro',
          companyName: '',
          phone: '',
          plan: 'pro-basic',
          territory: ''
        });
        fetchUsers();
      } else {
        showMessage('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      showMessage('error', 'Network error creating user');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user credits
  const handleUpdateCredits = async () => {
    if (!selectedUser) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inspectionCredits: newCredits }),
      });

      if (response.ok) {
        showMessage('success', `Credits updated for ${selectedUser.email}`);
        setShowEditCreditsModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to update credits');
      }
    } catch (error) {
      showMessage('error', 'Network error updating credits');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset user password
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Password reset! New password: ${data.newPassword}`);
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        showMessage('error', data.error || 'Failed to reset password');
      }
    } catch (error) {
      showMessage('error', 'Network error resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showMessage('success', `User ${selectedUser.email} deleted`);
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      showMessage('error', 'Network error deleting user');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle license status (activate / suspend)
  const handleToggleLicense = async (targetUser: UserRecord, newStatus: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/licenses/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `License ${newStatus} for ${targetUser.email}`);
        fetchUsers();
      } else {
        showMessage('error', data.error || 'Failed to update license');
      }
    } catch (error) {
      showMessage('error', 'Network error updating license');
    } finally {
      setIsLoading(false);
    }
  };

  // Update feature flags
  const handleUpdateFeatures = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/licenses/${selectedUser.id}/features`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features: editFeatures }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Features updated for ${selectedUser.email}`);
        setShowFeaturesModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showMessage('error', data.error || 'Failed to update features');
      }
    } catch (error) {
      showMessage('error', 'Network error updating features');
    } finally {
      setIsLoading(false);
    }
  };

  // Set license expiry date
  const handleSetExpiry = async (preset?: number) => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const body: any = {};
      if (preset) {
        body.licenseDurationMonths = preset;
      } else if (expiryDate) {
        body.licenseExpiresAt = new Date(expiryDate).toISOString();
      } else {
        showMessage('error', 'Select a date or duration');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/licenses/${selectedUser.id}/expiry`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `License expiry set for ${selectedUser.email}: ${new Date(data.user.license_expires_at).toLocaleDateString()}`);
        setShowExpiryModal(false);
        setSelectedUser(null);
        setExpiryDate('');
        fetchUsers();
      } else {
        showMessage('error', data.error || 'Failed to set expiry');
      }
    } catch (error) {
      showMessage('error', 'Network error setting expiry');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch usage stats
  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/usage`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsageData(data.usage || []);
      }
    } catch (error) {
      showMessage('error', 'Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending users
  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const [pendingRes, expiringRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/pending`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/expiring?days=30`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingUsers(data.pending || []);
        setPendingCount(data.pending?.length || 0);
      }
      if (expiringRes.ok) {
        const data = await expiringRes.json();
        setExpiringCount(data.expiring?.length || 0);
      }
    } catch (error) {
      showMessage('error', 'Failed to load pending users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sales data
  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/sales?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      }
    } catch (error) {
      showMessage('error', 'Failed to load sales data');
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch activity log (recent inspections + logins)
  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const [inspRes, usersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/inspections?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/users?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      const activities: any[] = [];
      if (inspRes.ok) {
        const data = await inspRes.json();
        (data.inspections || []).forEach((insp: any) => {
          activities.push({
            type: 'inspection',
            icon: '🔍',
            label: `Inspection completed`,
            detail: `${insp.vehicle_type || 'Vehicle'} — ${insp.email || insp.user_id}`,
            time: insp.created_at,
          });
        });
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        (data.users || []).slice(0, 20).forEach((u: any) => {
          if (u.last_login_at) {
            activities.push({
              type: 'login',
              icon: '👤',
              label: `User login`,
              detail: u.email,
              time: u.last_login_at,
            });
          }
        });
      }
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivityData(activities.slice(0, 60));
    } catch (error) {
      showMessage('error', 'Failed to load activity data');
    } finally {
      setActivityLoading(false);
    }
  };

  // Approve a pending user
  const handleApproveUser = async (userId: string, licenseDurationMonths: number = 12) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseDurationMonths }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage('success', `User approved! License active for ${licenseDurationMonths} months.`);
        fetchPending();
      } else {
        showMessage('error', data.error || 'Failed to approve user');
      }
    } catch (error) {
      showMessage('error', 'Network error approving user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPending(); // Always load pending count on mount
  }, []);

  useEffect(() => {
    if (activeTab === 'customers' || activeTab === 'staff') {
      fetchUsers();
    } else if (activeTab === 'usage') {
      fetchUsage();
    } else if (activeTab === 'pending') {
      fetchPending();
    } else if (activeTab === 'sales') {
      fetchSales();
    } else if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab, filterType, filterLicense]);

  // Filter users by search query
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If admin wants to use inspector tool, show MainApp inline
  if (showInspectorTool) {
    return <MainApp user={user} onLogout={() => setShowInspectorTool(false)} />;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Success/Error Message */}
      {actionMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          actionMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-semibold`}>
          {actionMessage.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">🛡️ Admin Panel</h1>
            <span className="text-medium-text text-sm">Full Platform Control</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-light-text">{user.email}</div>
              <div className="text-xs text-medium-text">Administrator</div>
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

      {/* Navigation Tabs */}
      <div className="bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-medium-text hover:text-light-text'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'customers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-medium-text hover:text-light-text'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'staff'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-medium-text hover:text-light-text'
              }`}
            >
              Staff & Admins
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'sales'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-medium-text hover:text-light-text'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'usage'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-medium-text hover:text-light-text'
              }`}
            >
              Usage
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-2 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-medium-text hover:text-light-text'
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowInspectorTool(true)}
              className="py-4 px-2 border-b-2 border-transparent text-green-500 hover:text-green-400 font-semibold transition-colors"
            >
              🔧 Use Inspector Tool
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-light-text mb-6">Platform Overview</h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-medium-text">Loading statistics...</div>
              </div>
            ) : stats ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Total Users */}
                  <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-medium-text text-sm">Total Users</span>
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="text-3xl font-bold text-light-text">{stats.totalUsers}</div>
                    <div className="text-xs text-medium-text mt-2">
                      {stats.proUsers} Pro • {stats.diyUsers} DIY
                    </div>
                  </div>

                  {/* Total Inspections */}
                  <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-medium-text text-sm">Total Inspections</span>
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="text-3xl font-bold text-light-text">{stats.totalInspections}</div>
                    <div className="text-xs text-medium-text mt-2">All-time platform total</div>
                  </div>

                  {/* Active Subscriptions */}
                  <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-medium-text text-sm">Active Subscriptions</span>
                      <span className="text-2xl">💳</span>
                    </div>
                    <div className="text-3xl font-bold text-light-text">{stats.activeSubscriptions}</div>
                    <div className="text-xs text-medium-text mt-2">Pro plan subscribers</div>
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90 mb-2">Total Revenue (Estimated)</div>
                      <div className="text-4xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm opacity-75 mt-2">Based on current subscriptions & purchases</div>
                    </div>
                    <div className="text-6xl opacity-20">💰</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-xl font-bold text-light-text mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setActiveTab('customers');
                        setShowCreateUserModal(true);
                      }}
                      className="bg-primary hover:bg-primary/90 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="text-white font-semibold mb-1">➕ Create Customer</div>
                      <div className="text-sm text-white/80">Add new inspector or DIY account</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('staff')}
                      className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="text-white font-semibold mb-1">👥 Manage Staff</div>
                      <div className="text-sm text-white/80">Create admins & team members</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('sales')}
                      className="bg-dark-card border border-dark-border hover:border-primary rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="text-primary font-semibold mb-1">💰 Sales & Revenue</div>
                      <div className="text-sm text-medium-text">Track earnings and subscriptions</div>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-red-400">Failed to load statistics</div>
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-light-text">Customer Management</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                <span>➕</span>
                <span>Create Customer Account</span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-medium-text mb-2">Search Users</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Email or company name..."
                    className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm text-medium-text mb-2">User Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Types</option>
                    <option value="pro">Pro Inspectors</option>
                    <option value="diy">DIY Users</option>
                  </select>
                </div>

                {/* License Status Filter */}
                <div>
                  <label className="block text-sm text-medium-text mb-2">License Status</label>
                  <select
                    value={filterLicense}
                    onChange={(e) => setFilterLicense(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-medium-text">Loading users...</div>
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-bg">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">User</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">Type</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">License</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">Plan</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">Territory</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">Expires</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">Joined</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-medium-text">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {filteredUsers.map((u) => {
                        const licenseStatus = u.license_status || 'none';
                        const isActive = licenseStatus === 'active' || licenseStatus === 'trial';
                        const isSuspended = licenseStatus === 'suspended';
                        const isCancelled = licenseStatus === 'cancelled';

                        return (
                        <tr key={u.id} className="hover:bg-dark-bg transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-light-text font-medium">{u.email}</div>
                            {u.company_name && (
                              <div className="text-sm text-medium-text">{u.company_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              u.user_type === 'pro' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'
                            }`}>
                              {u.user_type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              isActive ? 'bg-green-900/50 text-green-300' :
                              isSuspended ? 'bg-red-900/50 text-red-300' :
                              isCancelled ? 'bg-gray-900/50 text-gray-400' :
                              'bg-yellow-900/50 text-yellow-300'
                            }`}>
                              {licenseStatus === 'none' ? 'No License' : licenseStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-medium-text text-sm">{u.plan || 'N/A'}</td>
                          <td className="px-4 py-4 text-medium-text text-sm">{u.territory || '-'}</td>
                          <td className="px-4 py-4 text-sm">
                            {u.license_expires_at ? (
                              <span className={`font-medium ${
                                new Date(u.license_expires_at) < new Date()
                                  ? 'text-red-400'
                                  : new Date(u.license_expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                    ? 'text-yellow-400'
                                    : 'text-green-400'
                              }`}>
                                {new Date(u.license_expires_at).toLocaleDateString()}
                                {new Date(u.license_expires_at) < new Date() && ' (EXPIRED)'}
                              </span>
                            ) : (
                              <span className="text-medium-text">No expiry</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-medium-text text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {/* License Toggle */}
                              {isActive ? (
                                <button
                                  onClick={() => handleToggleLicense(u, 'suspended')}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
                                  title="Suspend license - blocks all access"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleLicense(u, 'active')}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors"
                                  title="Activate license - restores access"
                                >
                                  Activate
                                </button>
                              )}

                              {/* Features */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditFeatures(u.features_enabled || {
                                    ev_module: false,
                                    advanced_fraud: true,
                                    ai_reports: true,
                                    lead_bot: false,
                                  });
                                  setShowFeaturesModal(true);
                                }}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors"
                                title="Manage feature flags"
                              >
                                Features
                              </button>

                              {/* Credits */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewCredits(u.inspection_credits);
                                  setShowEditCreditsModal(true);
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                                title="Edit Credits"
                              >
                                Credits
                              </button>

                              {/* Password */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewPassword('');
                                  setShowResetPasswordModal(true);
                                }}
                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-semibold transition-colors"
                                title="Reset Password"
                              >
                                Password
                              </button>

                              {/* Set Expiry */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setExpiryDate(u.license_expires_at ? new Date(u.license_expires_at).toISOString().split('T')[0] : '');
                                  setShowExpiryModal(true);
                                }}
                                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold transition-colors"
                                title="Set license expiry date"
                              >
                                Expiry
                              </button>

                              {/* Cancel License */}
                              {!isCancelled && (
                                <button
                                  onClick={() => handleToggleLicense(u, 'cancelled')}
                                  className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold transition-colors"
                                  title="Cancel license permanently"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-medium-text">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Staff & Admins Tab - ADMIN ONLY SECTION */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-light-text">Staff & Admin Management</h2>
                <p className="text-medium-text text-sm mt-1">🔒 Admin-only section - Create and manage staff accounts</p>
              </div>
              <button
                onClick={() => {
                  setCreateUserForm({...createUserForm, userType: 'admin', plan: 'admin'});
                  setShowCreateUserModal(true);
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                <span>👥</span>
                <span>Create Admin User</span>
              </button>
            </div>

            <div className="bg-dark-card border border-purple-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🛡️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-light-text mb-2">Admin Access Control</h3>
                  <p className="text-medium-text text-sm mb-4">
                    This section allows you to create admin-level accounts for your team members. Admin users can:
                  </p>
                  <ul className="text-sm text-medium-text space-y-1 list-disc list-inside">
                    <li>Access this admin panel</li>
                    <li>Manage all customer accounts</li>
                    <li>Reset any user's password</li>
                    <li>View sales and revenue data</li>
                    <li>Use the inspection tool themselves</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Admin Users List */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-medium-text">Loading admin users...</div>
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-bg border-b border-dark-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-light-text">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-light-text">Company/Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-light-text">Created</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-light-text">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {users.filter(u => u.plan === 'admin' || u.user_type === 'admin').map((adminUser) => (
                        <tr key={adminUser.id} className="hover:bg-dark-bg/50">
                          <td className="px-6 py-4 text-light-text">{adminUser.email}</td>
                          <td className="px-6 py-4 text-medium-text">{adminUser.company_name || 'N/A'}</td>
                          <td className="px-6 py-4 text-medium-text text-sm">
                            {new Date(adminUser.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedUser(adminUser);
                                setShowResetPasswordModal(true);
                              }}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                            >
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.plan === 'admin' || u.user_type === 'admin').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-medium-text">
                            No admin users found. Click "Create Admin User" to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales & Revenue Tab */}
        {activeTab === 'sales' && (
          <div>
            <h2 className="text-2xl font-bold text-light-text mb-6">Sales & Revenue Tracking</h2>

            {/* Revenue Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Total Revenue</div>
                  <div className="text-3xl font-bold mb-1">${stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs opacity-75">All-time earnings</div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Active Subscriptions</div>
                  <div className="text-3xl font-bold mb-1">{stats.activeSubscriptions}</div>
                  <div className="text-xs opacity-75">Currently paying customers</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Total Users</div>
                  <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
                  <div className="text-xs opacity-75">{stats.proUsers} Pro + {stats.diyUsers} DIY</div>
                </div>
              </div>
            )}

            {/* Real Sales Transaction Log */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-light-text">Sales Transaction Log</h3>
                <button onClick={fetchSales} className="px-3 py-1.5 bg-dark-border rounded-lg text-medium-text hover:text-light-text text-sm transition-colors">🔄 Refresh</button>
              </div>
              {salesLoading ? (
                <div className="text-center py-8 text-medium-text">Loading sales data...</div>
              ) : salesData && salesData.sales.length > 0 ? (
                <>
                  {/* Totals bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-dark-bg rounded-lg p-3 text-center">
                      <div className="text-xs text-medium-text mb-1">Total Sales</div>
                      <div className="text-lg font-bold text-light-text">{salesData.totals.totalSales}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3 text-center">
                      <div className="text-xs text-medium-text mb-1">Total Revenue</div>
                      <div className="text-lg font-bold text-green-400">${(salesData.totals.totalRevenue / 100).toLocaleString()}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3 text-center">
                      <div className="text-xs text-medium-text mb-1">Revenue Share Paid</div>
                      <div className="text-lg font-bold text-blue-400">${(salesData.totals.totalRevenueShare / 100).toLocaleString()}</div>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-3 text-center">
                      <div className="text-xs text-medium-text mb-1">Pending Payouts</div>
                      <div className="text-lg font-bold text-yellow-400">${(salesData.totals.pendingRevenueShare / 100).toLocaleString()}</div>
                    </div>
                  </div>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-border text-medium-text">
                          <th className="text-left py-2 pr-4">Date</th>
                          <th className="text-left py-2 pr-4">Inspector</th>
                          <th className="text-left py-2 pr-4">Plan</th>
                          <th className="text-right py-2 pr-4">Amount</th>
                          <th className="text-right py-2 pr-4">Rev Share</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.sales.map((sale: any, i: number) => (
                          <tr key={i} className="border-b border-dark-border/50 hover:bg-dark-bg/50 transition-colors">
                            <td className="py-2 pr-4 text-medium-text">{new Date(sale.created_at).toLocaleDateString()}</td>
                            <td className="py-2 pr-4 text-light-text">{sale.email || sale.company_name || sale.user_id}</td>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">{sale.plan_type || 'Pro'}</span>
                            </td>
                            <td className="py-2 pr-4 text-right text-green-400 font-semibold">${((sale.sale_amount || 0) / 100).toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right text-blue-400">${((sale.revenue_share_amount || 0) / 100).toLocaleString()}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                sale.revenue_share_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                sale.revenue_share_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>{sale.revenue_share_status || 'N/A'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-medium-text">
                  <div className="text-3xl mb-2">💰</div>
                  <p>No sales recorded yet. Sales will appear here as inspectors sign up.</p>
                </div>
              )}
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-light-text mb-4">Revenue by Plan</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-medium-text">Pro Subscriptions</span>
                    <span className="text-light-text font-semibold">{stats?.proUsers || 0} users</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-medium-text">DIY Subscriptions</span>
                    <span className="text-light-text font-semibold">{stats?.diyUsers || 0} users</span>
                  </div>
                </div>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-light-text mb-4">Platform Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-medium-text">Total Inspections</span>
                    <span className="text-light-text font-semibold">{stats?.totalInspections || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-medium-text">Avg per User</span>
                    <span className="text-light-text font-semibold">
                      {stats && stats.totalUsers > 0
                        ? (stats.totalInspections / stats.totalUsers).toFixed(1)
                        : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-light-text">Activity Log</h2>
              <button onClick={fetchActivity} className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-medium-text hover:text-light-text transition-colors text-sm">🔄 Refresh</button>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              {activityLoading ? (
                <div className="text-center py-8 text-medium-text">Loading activity...</div>
              ) : activityData.length > 0 ? (
                <div className="space-y-2">
                  {activityData.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-dark-border/50 hover:bg-dark-bg/30 rounded px-2 transition-colors">
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-light-text text-sm font-medium">{item.label}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            item.type === 'inspection' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>{item.type}</span>
                        </div>
                        <div className="text-medium-text text-xs truncate">{item.detail}</div>
                      </div>
                      <div className="text-medium-text text-xs flex-shrink-0">
                        {new Date(item.time).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-medium-text">
                  <div className="text-3xl mb-3">📊</div>
                  <p className="font-medium text-light-text mb-1">No activity yet</p>
                  <p className="text-sm">Inspections and logins will appear here as the platform is used.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Tracking Tab */}
        {activeTab === 'usage' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-light-text">Usage Tracking</h2>
              <button onClick={fetchUsage} className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-medium-text hover:text-light-text transition-colors text-sm">
                🔄 Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-medium-text">Loading usage data...</div>
            ) : usageData.length === 0 ? (
              <div className="text-center py-12 text-medium-text">
                <div className="text-4xl mb-3">📊</div>
                <p>No usage data available yet.</p>
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border bg-dark-bg">
                      <th className="text-left px-4 py-3 text-sm text-medium-text font-semibold">User</th>
                      <th className="text-left px-4 py-3 text-sm text-medium-text font-semibold">Plan</th>
                      <th className="text-center px-4 py-3 text-sm text-medium-text font-semibold">Total</th>
                      <th className="text-center px-4 py-3 text-sm text-medium-text font-semibold">30d</th>
                      <th className="text-center px-4 py-3 text-sm text-medium-text font-semibold">7d</th>
                      <th className="text-center px-4 py-3 text-sm text-medium-text font-semibold">Commercial</th>
                      <th className="text-center px-4 py-3 text-sm text-medium-text font-semibold">EV</th>
                      <th className="text-left px-4 py-3 text-sm text-medium-text font-semibold">Last Login</th>
                      <th className="text-left px-4 py-3 text-sm text-medium-text font-semibold">License Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.map((u) => (
                      <tr key={u.id} className="border-b border-dark-border hover:bg-dark-bg/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-light-text">{u.email}</div>
                          <div className="text-xs text-medium-text">{u.company_name || u.user_type}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{u.plan}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-light-text">{u.total_inspections}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${ u.inspections_last_30d > 0 ? 'text-green-400' : 'text-medium-text'}`}>{u.inspections_last_30d}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${ u.inspections_last_7d > 0 ? 'text-blue-400' : 'text-medium-text'}`}>{u.inspections_last_7d}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${ u.commercial_inspections > 0 ? 'text-orange-400' : 'text-medium-text'}`}>{u.commercial_inspections}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${ u.ev_inspections > 0 ? 'text-teal-400' : 'text-medium-text'}`}>{u.ev_inspections}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-medium-text">
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.license_expires_at ? (
                            <span className={`text-xs font-semibold ${
                              new Date(u.license_expires_at) < new Date() ? 'text-red-400' :
                              new Date(u.license_expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {new Date(u.license_expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-medium-text">No expiry</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-light-text">Pending Approvals</h2>
                <p className="text-medium-text text-sm mt-1">New signups waiting for your activation. Approve with a license duration.</p>
              </div>
              <button onClick={fetchPending} className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-medium-text hover:text-light-text transition-colors text-sm">
                🔄 Refresh
              </button>
            </div>

            {expiringCount > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-lg p-4 mb-6 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-yellow-400 font-semibold">{expiringCount} license{expiringCount !== 1 ? 's' : ''} expiring within 30 days</p>
                  <p className="text-xs text-medium-text">Go to the Usage tab to see which users need renewal.</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-medium-text">Loading pending users...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-light-text font-semibold">No pending approvals</p>
                <p className="text-medium-text text-sm">All signups have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="bg-dark-card border border-yellow-500/30 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-light-text">{u.email}</span>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{u.license_status}</span>
                        </div>
                        <div className="text-sm text-medium-text">
                          {u.company_name && <span className="mr-3">🏢 {u.company_name}</span>}
                          {u.phone && <span className="mr-3">📞 {u.phone}</span>}
                          <span>📅 Signed up {new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-medium-text mt-1">Type: {u.user_type} | Plan: {u.plan}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleApproveUser(u.id, 1)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Approve 1 Month
                        </button>
                        <button
                          onClick={() => handleApproveUser(u.id, 6)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Approve 6 Months
                        </button>
                        <button
                          onClick={() => handleApproveUser(u.id, 12)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Approve 1 Year
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deny and delete ${u.email}?`)) {
                              // Call delete endpoint
                              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                              fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud'}/api/admin/users/${u.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                              }).then(() => fetchPending());
                            }
                          }}
                          className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-light-text mb-6">Create New User</h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-medium-text mb-2">Email *</label>
                    <input
                      type="email"
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                      required
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-medium-text mb-2">Password * (min 8 chars)</label>
                    <input
                      type="text"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                      required
                      minLength={8}
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="Will be shown after creation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-medium-text mb-2">User Type *</label>
                    <select
                      value={createUserForm.userType}
                      onChange={(e) => setCreateUserForm({...createUserForm, userType: e.target.value as any})}
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value="pro">Pro Inspector</option>
                      <option value="diy">DIY User</option>
                      <option value="admin">🛡️ Admin (Staff Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-medium-text mb-2">Plan *</label>
                    <select
                      value={createUserForm.plan}
                      onChange={(e) => setCreateUserForm({...createUserForm, plan: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    >
                      {createUserForm.userType === 'admin' ? (
                        <option value="admin">Admin Access</option>
                      ) : (
                        <>
                          <option value="pro-basic">Pro Basic ($99/mo)</option>
                          <option value="pro-team">Pro Team ($299/mo)</option>
                          <option value="diy-single">DIY Single ($50)</option>
                          <option value="diy-5pack">DIY 5-Pack ($200)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-medium-text mb-2">Company Name</label>
                    <input
                      type="text"
                      value={createUserForm.companyName}
                      onChange={(e) => setCreateUserForm({...createUserForm, companyName: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-medium-text mb-2">Phone</label>
                    <input
                      type="tel"
                      value={createUserForm.phone}
                      onChange={(e) => setCreateUserForm({...createUserForm, phone: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-medium-text mb-2">Territory</label>
                    <input
                      type="text"
                      value={createUserForm.territory}
                      onChange={(e) => setCreateUserForm({...createUserForm, territory: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="e.g., Los Angeles, CA"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="px-6 py-3 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credits Modal */}
      {showEditCreditsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-light-text mb-4">Edit Inspection Credits</h3>
            <p className="text-medium-text mb-4">User: <span className="text-light-text">{selectedUser.email}</span></p>

            <div className="mb-6">
              <label className="block text-sm text-medium-text mb-2">
                Inspection Credits (-1 for unlimited)
              </label>
              <input
                type="number"
                value={newCredits}
                onChange={(e) => setNewCredits(parseInt(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdateCredits}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Updating...' : 'Update Credits'}
              </button>
              <button
                onClick={() => {
                  setShowEditCreditsModal(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-light-text mb-4">Reset Password</h3>
            <p className="text-medium-text mb-4">User: <span className="text-light-text">{selectedUser.email}</span></p>

            <div className="mb-6">
              <label className="block text-sm text-medium-text mb-2">
                New Password (min 8 characters)
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                placeholder="Enter new password"
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleResetPassword}
                disabled={isLoading || newPassword.length < 8}
                className="flex-1 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="px-6 py-2 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-red-600 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete User</h3>
            <p className="text-light-text mb-2">
              Are you sure you want to delete this user?
            </p>
            <p className="text-medium-text mb-6">
              Email: <span className="text-light-text font-semibold">{selectedUser.email}</span><br/>
              This will permanently delete all their data and inspections.
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleDeleteUser}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Deleting...' : 'Yes, Delete User'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Flags Modal */}
      {showFeaturesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-purple-500 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-light-text mb-2">Feature Flags</h3>
            <p className="text-medium-text mb-6 text-sm">
              Control which features are enabled for <span className="text-light-text font-semibold">{selectedUser.email}</span>
            </p>

            <div className="space-y-4 mb-6">
              {[
                { key: 'ev_module', label: 'EV Module', description: 'Electric vehicle inspection support' },
                { key: 'advanced_fraud', label: 'Advanced Fraud Detection', description: 'AI-powered fraud analysis' },
                { key: 'ai_reports', label: 'AI Reports', description: 'AI-generated inspection reports' },
                { key: 'lead_bot', label: 'Lead Bot', description: 'Automated lead generation' },
              ].map(feature => (
                <div key={feature.key} className="flex items-center justify-between bg-dark-bg rounded-lg p-3">
                  <div>
                    <div className="text-light-text font-medium text-sm">{feature.label}</div>
                    <div className="text-medium-text text-xs">{feature.description}</div>
                  </div>
                  <button
                    onClick={() => setEditFeatures(prev => ({ ...prev, [feature.key]: !prev[feature.key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editFeatures[feature.key] ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editFeatures[feature.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdateFeatures}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Features'}
              </button>
              <button
                onClick={() => {
                  setShowFeaturesModal(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* License Expiry Modal */}
      {showExpiryModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-orange-500 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-light-text mb-2">Set License Expiry</h3>
            <p className="text-medium-text mb-4 text-sm">
              Control when access expires for <span className="text-light-text font-semibold">{selectedUser.email}</span>
            </p>

            {selectedUser.license_expires_at && (
              <div className={`mb-4 px-3 py-2 rounded text-sm ${
                new Date(selectedUser.license_expires_at) < new Date()
                  ? 'bg-red-900/30 text-red-300'
                  : 'bg-green-900/30 text-green-300'
              }`}>
                Current expiry: {new Date(selectedUser.license_expires_at).toLocaleDateString()}
                {new Date(selectedUser.license_expires_at) < new Date() && ' (EXPIRED)'}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-medium-text mb-2">Quick Presets</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetExpiry(6)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-dark-bg border border-dark-border text-light-text rounded hover:border-orange-400 transition-colors text-sm"
                >
                  6 Months
                </button>
                <button
                  onClick={() => handleSetExpiry(12)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm font-semibold"
                >
                  1 Year
                </button>
                <button
                  onClick={() => handleSetExpiry(24)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-dark-bg border border-dark-border text-light-text rounded hover:border-orange-400 transition-colors text-sm"
                >
                  2 Years
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-medium-text mb-2">Or Set Custom Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2 focus:outline-none focus:border-orange-400"
                />
                <button
                  onClick={() => handleSetExpiry()}
                  disabled={isLoading || !expiryDate}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  Set
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowExpiryModal(false);
                setSelectedUser(null);
                setExpiryDate('');
              }}
              className="w-full px-6 py-2 bg-dark-bg border border-dark-border text-light-text rounded-lg font-semibold hover:border-primary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
