import React, { useState, useEffect } from 'react';
import { supabaseConfig } from '../config/supabase';

const SUPABASE_URL = supabaseConfig.url;
const SUPABASE_ANON_KEY = supabaseConfig.anonKey;

export const EnhancedAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'territories' | 'revenue'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/admin/stats`, {
          headers: { 'apikey': SUPABASE_ANON_KEY },
        }),
        fetch(`${SUPABASE_URL}/functions/v1/admin/users`, {
          headers: { 'apikey': SUPABASE_ANON_KEY },
        }),
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk user operations
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Delete ${selectedUsers.size} users?`)) return;

    // Implementation would go here
    alert(`Would delete ${selectedUsers.size} users`);
    setSelectedUsers(new Set());
  };

  const handleBulkAssignTerritory = async () => {
    if (selectedUsers.size === 0) return;
    const territory = prompt('Enter territory ID:');
    if (!territory) return;

    alert(`Would assign territory ${territory} to ${selectedUsers.size} users`);
    setSelectedUsers(new Set());
  };

  const toggleUserSelection = (userId: number) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-light-text">Admin Dashboard</h1>
          <button
            onClick={loadData}
            className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-dark-border">
          {(['dashboard', 'users', 'territories', 'revenue'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-medium-text hover:text-light-text'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="blue" />
            <StatCard title="Active Inspectors" value={stats?.activeInspectors || 0} icon="🔧" color="green" />
            <StatCard title="Total Inspections" value={stats?.totalInspections || 0} icon="📋" color="purple" />
            <StatCard title="Revenue (MTD)" value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`} icon="💰" color="yellow" />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="bg-dark-card p-4 rounded-lg border border-dark-border flex gap-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-light-text"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-light-text"
              >
                <option value="all">All Types</option>
                <option value="inspector">Inspectors</option>
                <option value="diy">DIY Users</option>
                <option value="admin">Admins</option>
                <option value="staff">Staff</option>
                <option value="sales">Sales</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
              <div className="bg-primary/10 border border-primary rounded-lg p-4 flex items-center justify-between">
                <span className="text-light-text font-medium">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkAssignTerritory}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Assign Territory
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-bg">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="p-4 text-left text-light-text font-semibold">Email</th>
                    <th className="p-4 text-left text-light-text font-semibold">Type</th>
                    <th className="p-4 text-left text-light-text font-semibold">Plan</th>
                    <th className="p-4 text-left text-light-text font-semibold">Status</th>
                    <th className="p-4 text-left text-light-text font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-t border-dark-border hover:bg-dark-bg/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-4 text-light-text">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.user_type === 'inspector' ? 'bg-blue-900 text-blue-200' :
                          user.user_type === 'admin' ? 'bg-purple-900 text-purple-200' :
                          'bg-gray-700 text-gray-200'
                        }`}>
                          {user.user_type}
                        </span>
                      </td>
                      <td className="p-4 text-medium-text">{user.plan || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.license_status === 'active' ? 'bg-green-900 text-green-200' :
                          user.license_status === 'trial' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-red-900 text-red-200'
                        }`}>
                          {user.license_status || 'inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-red-500 hover:text-red-400 text-sm">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Territories Tab */}
        {activeTab === 'territories' && (
          <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
            <h2 className="text-xl font-semibold text-light-text mb-4">Territory Management</h2>
            <p className="text-medium-text mb-4">Drag and drop inspectors to assign territories</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-dark-border rounded-lg p-6 min-h-[300px]">
                <h3 className="font-semibold text-light-text mb-3">Available Inspectors</h3>
                <div className="space-y-2">
                  {users.filter(u => u.user_type === 'inspector').map(inspector => (
                    <div key={inspector.id} className="bg-dark-bg p-3 rounded border border-dark-border cursor-move hover:border-primary transition-colors">
                      <div className="font-medium text-light-text">{inspector.email}</div>
                      <div className="text-sm text-medium-text">{inspector.company_name || 'No company'}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-2 border-dashed border-dark-border rounded-lg p-6 min-h-[300px]">
                <h3 className="font-semibold text-light-text mb-3">Territory Assignments</h3>
                <p className="text-medium-text text-sm">Drop inspectors here to assign territories</p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
              <h3 className="text-lg font-semibold text-light-text mb-4">Revenue Overview</h3>
              <div className="space-y-4">
                <RevenueItem label="License Fees (Monthly)" amount={stats?.licenseFees || 0} />
                <RevenueItem label="Platform Share (20%)" amount={stats?.platformShare || 0} />
                <RevenueItem label="Total Revenue" amount={(stats?.licenseFees || 0) + (stats?.platformShare || 0)} highlight />
              </div>
            </div>
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
              <h3 className="text-lg font-semibold text-light-text mb-4">Top Performers</h3>
              <p className="text-medium-text">Coming soon: Inspector performance metrics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-900/20 border-blue-500',
    green: 'bg-green-900/20 border-green-500',
    purple: 'bg-purple-900/20 border-purple-500',
    yellow: 'bg-yellow-900/20 border-yellow-500',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-light-text">{value}</span>
      </div>
      <div className="text-medium-text font-medium">{title}</div>
    </div>
  );
};

const RevenueItem: React.FC<{ label: string; amount: number; highlight?: boolean }> = ({ label, amount, highlight }) => (
  <div className={`flex justify-between items-center ${highlight ? 'border-t-2 border-primary pt-4' : ''}`}>
    <span className={`${highlight ? 'text-light-text font-semibold' : 'text-medium-text'}`}>{label}</span>
    <span className={`${highlight ? 'text-2xl font-bold text-primary' : 'text-lg text-light-text'}`}>
      ${amount.toLocaleString()}
    </span>
  </div>
);
