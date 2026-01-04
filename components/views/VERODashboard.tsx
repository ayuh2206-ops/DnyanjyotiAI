'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  getAllUsers, 
  getAllFaculties, 
  getAllBatches, 
  getAllPayments,
  getSystemStats, 
  grantLifetimeAccess, 
  revokeAccess,
  bulkUpdatePaymentStatus,
  setUserRole,
  addTokensToUser,
  deleteUser,
  createFaculty,
  deleteFaculty,
  getAdminLogs,
  assignFacultyByEmail,
  getAllFacultyAssignments,
  removeFacultyAssignment,
  UserProfile,
  Faculty,
  Batch,
  Payment,
  AdminLog,
  FacultyAssignment,
} from '@/lib/db';
import { GlassCard, Button, Badge, Input, Modal, Avatar, LoadingSpinner, Toast } from '../UI';

type TabType = 'overview' | 'users' | 'faculties' | 'assignments' | 'batches' | 'payments' | 'logs';

interface SystemStats {
  totalUsers: number;
  activeToday: number;
  totalStudents: number;
  totalFaculties: number;
  totalBatches: number;
  totalQuizzes: number;
  totalGradings: number;
  activeSubscriptions: number;
  lifetimeUsers: number;
  expiredUsers: number;
  freeUsers: number;
  totalRevenue: number;
}

export const VERODashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Data state
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<FacultyAssignment[]>([]);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAssignFacultyModal, setShowAssignFacultyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form state for new faculty assignment
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultySpecializations, setNewFacultySpecializations] = useState<string[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, facultiesData, batchesData, paymentsData, logsData, assignmentsData] = await Promise.all([
        getSystemStats(),
        getAllUsers(),
        getAllFaculties(),
        getAllBatches(),
        getAllPayments(),
        getAdminLogs(100),
        getAllFacultyAssignments(),
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setFaculties(facultiesData);
      setBatches(batchesData);
      setPayments(paymentsData);
      setAdminLogs(logsData);
      setFacultyAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle faculty assignment by email
  const handleAssignFaculty = async () => {
    if (!userProfile || !newFacultyEmail.trim()) return;
    
    try {
      await assignFacultyByEmail(
        newFacultyEmail.trim(),
        newFacultyName.trim() || 'Faculty',
        newFacultySpecializations,
        userProfile.uid,
        userProfile.email
      );
      
      setToast({ message: `Faculty invitation sent to ${newFacultyEmail}`, type: 'success' });
      setShowAssignFacultyModal(false);
      setNewFacultyEmail('');
      setNewFacultyName('');
      setNewFacultySpecializations([]);
      fetchAllData();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to assign faculty', type: 'error' });
    }
  };

  // Handle remove faculty assignment
  const handleRemoveFacultyAssignment = async (assignmentId: string) => {
    if (!userProfile) return;
    
    try {
      await removeFacultyAssignment(assignmentId, userProfile.uid, userProfile.email);
      setToast({ message: 'Faculty assignment removed', type: 'success' });
      fetchAllData();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to remove assignment', type: 'error' });
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'lifetime') return matchesSearch && user.lifetimeAccess;
    if (filterStatus === 'active') return matchesSearch && user.paymentStatus === 'active';
    if (filterStatus === 'expired') return matchesSearch && user.paymentStatus === 'expired';
    if (filterStatus === 'free') return matchesSearch && (user.plan === 'Free' || !user.plan);
    if (filterStatus === 'faculty') return matchesSearch && user.role === 'faculty';
    return matchesSearch;
  });

  // Handle user actions
  const handleGrantLifetime = async (userId: string) => {
    if (!userProfile) return;
    try {
      await grantLifetimeAccess(userId, userProfile.uid, userProfile.email);
      setToast({ message: 'Lifetime access granted!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to grant access', type: 'error' });
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!userProfile) return;
    if (!confirm('Are you sure you want to revoke this user\'s access?')) return;
    
    try {
      await revokeAccess(userId, userProfile.uid, userProfile.email);
      setToast({ message: 'Access revoked', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to revoke access', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteUser(userId);
      setToast({ message: 'User deleted', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to delete user', type: 'error' });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!userProfile || selectedUsers.length === 0) return;
    
    try {
      if (action === 'lifetime') {
        await bulkUpdatePaymentStatus(selectedUsers, 'lifetime', 'Lifetime', userProfile.uid, userProfile.email);
      } else if (action === 'premium') {
        await bulkUpdatePaymentStatus(selectedUsers, 'active', 'Premium', userProfile.uid, userProfile.email);
      } else if (action === 'free') {
        await bulkUpdatePaymentStatus(selectedUsers, 'none', 'Free', userProfile.uid, userProfile.email);
      } else if (action === 'expired') {
        await bulkUpdatePaymentStatus(selectedUsers, 'expired', 'Free', userProfile.uid, userProfile.email);
      }
      
      setToast({ message: `Updated ${selectedUsers.length} users`, type: 'success' });
      setSelectedUsers([]);
      setShowBulkModal(false);
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Bulk action failed', type: 'error' });
    }
  };

  const handleAddTokens = async (userId: string, amount: number) => {
    if (!userProfile) return;
    try {
      await addTokensToUser(userId, amount, userProfile.uid, userProfile.email);
      setToast({ message: `Added ${amount} tokens`, type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to add tokens', type: 'error' });
    }
  };

  const handleMakeFaculty = async (user: UserProfile) => {
    if (!userProfile) return;
    try {
      await createFaculty({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        specialization: [],
        batchIds: [],
        totalStudents: 0,
        isActive: true,
        createdBy: userProfile.uid,
      });
      await setUserRole(user.uid, 'faculty', userProfile.uid, userProfile.email);
      setToast({ message: 'User promoted to faculty!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to create faculty', type: 'error' });
    }
  };

  const handleRemoveFaculty = async (faculty: Faculty) => {
    if (!confirm('Remove faculty status? User will become a student.')) return;
    
    try {
      if (faculty.id) {
        await deleteFaculty(faculty.id, faculty.uid);
      }
      setToast({ message: 'Faculty status removed', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to remove faculty', type: 'error' });
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredUsers.map(u => u.uid);
    setSelectedUsers(prev => 
      prev.length === visibleIds.length ? [] : visibleIds
    );
  };

  if (!userProfile?.isAdmin && userProfile?.role !== 'vero') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GlassCard className="text-center p-8">
          <span className="material-symbols-outlined text-red-400 text-4xl mb-4">lock</span>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#c9ad92]">VERO Dashboard is restricted to admin access only.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading VERO Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">shield_person</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">VERO Dashboard</h1>
              <p className="text-[#c9ad92]">Super Admin Control Panel</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="refresh" onClick={fetchAllData}>Refresh</Button>
          <Button icon="download">Export Data</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: 'dashboard' },
          { id: 'users', label: 'All Users', icon: 'group' },
          { id: 'faculties', label: 'Faculties', icon: 'school' },
          { id: 'assignments', label: 'Faculty Invites', icon: 'mail' },
          { id: 'batches', label: 'Batches', icon: 'groups' },
          { id: 'payments', label: 'Payments', icon: 'payments' },
          { id: 'logs', label: 'Admin Logs', icon: 'history' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
            {tab.id === 'assignments' && facultyAssignments.filter(a => !a.isActivated).length > 0 && (
              <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                {facultyAssignments.filter(a => !a.isActivated).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-blue-400 text-2xl mb-2">group</span>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-[#c9ad92]">Total Users</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-green-400 text-2xl mb-2">online_prediction</span>
              <p className="text-2xl font-bold text-white">{stats.activeToday}</p>
              <p className="text-xs text-[#c9ad92]">Active Today</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-purple-400 text-2xl mb-2">diamond</span>
              <p className="text-2xl font-bold text-white">{stats.lifetimeUsers}</p>
              <p className="text-xs text-[#c9ad92]">Lifetime Users</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">school</span>
              <p className="text-2xl font-bold text-white">{stats.totalFaculties}</p>
              <p className="text-xs text-[#c9ad92]">Faculties</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-cyan-400 text-2xl mb-2">groups</span>
              <p className="text-2xl font-bold text-white">{stats.totalBatches}</p>
              <p className="text-xs text-[#c9ad92]">Batches</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-emerald-400 text-2xl mb-2">payments</span>
              <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-[#c9ad92]">Revenue</p>
            </GlassCard>
          </div>

          {/* User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4">User Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-[#c9ad92]">Free Users</span>
                  </div>
                  <span className="text-white font-bold">{stats.freeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-[#c9ad92]">Active Premium</span>
                  </div>
                  <span className="text-white font-bold">{stats.activeSubscriptions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-[#c9ad92]">Lifetime Access</span>
                  </div>
                  <span className="text-white font-bold">{stats.lifetimeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-[#c9ad92]">Expired</span>
                  </div>
                  <span className="text-white font-bold">{stats.expiredUsers}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4">Platform Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">quiz</span>
                    <span className="text-[#c9ad92]">Total Quizzes</span>
                  </div>
                  <span className="text-white font-bold">{stats.totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">history_edu</span>
                    <span className="text-[#c9ad92]">Essays Graded</span>
                  </div>
                  <span className="text-white font-bold">{stats.totalGradings}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400">person</span>
                    <span className="text-[#c9ad92]">Total Students</span>
                  </div>
                  <span className="text-white font-bold">{stats.totalStudents}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <GlassCard>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c9ad92]">search</span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2c2219] border border-[#483623] text-white placeholder-[#c9ad92] focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#2c2219] border border-[#483623] text-white"
            >
              <option value="all">All Users</option>
              <option value="lifetime">Lifetime</option>
              <option value="active">Active Premium</option>
              <option value="expired">Expired</option>
              <option value="free">Free</option>
              <option value="faculty">Faculty</option>
            </select>
            {selectedUsers.length > 0 && (
              <Button icon="edit" onClick={() => setShowBulkModal(true)}>
                Bulk Action ({selectedUsers.length})
              </Button>
            )}
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#c9ad92] text-sm border-b border-[#483623]">
                  <th className="pb-3 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllVisible}
                      className="rounded bg-[#2c2219] border-[#483623]"
                    />
                  </th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tokens</th>
                  <th className="pb-3 font-medium">Last Active</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map(user => (
                  <tr key={user.uid} className="border-b border-[#483623]/30 hover:bg-white/5">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.uid)}
                        onChange={() => toggleSelectUser(user.uid)}
                        className="rounded bg-[#2c2219] border-[#483623]"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                        <div>
                          <p className="font-medium text-white">{user.displayName}</p>
                          <p className="text-xs text-[#c9ad92]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge color={user.role === 'vero' ? 'purple' : user.role === 'faculty' ? 'blue' : 'green'}>
                        {user.role || 'student'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge color={user.plan === 'Lifetime' ? 'purple' : user.plan === 'Premium' ? 'primary' : 'blue'}>
                        {user.plan || 'Free'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className={`flex items-center gap-1 text-xs ${
                        user.lifetimeAccess ? 'text-purple-400' :
                        user.paymentStatus === 'active' ? 'text-green-400' :
                        user.paymentStatus === 'expired' ? 'text-red-400' : 'text-[#c9ad92]'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          user.lifetimeAccess ? 'bg-purple-400' :
                          user.paymentStatus === 'active' ? 'bg-green-400' :
                          user.paymentStatus === 'expired' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></span>
                        {user.lifetimeAccess ? 'Lifetime' : user.paymentStatus || 'None'}
                      </span>
                    </td>
                    <td className="py-3 text-white">{user.tokens?.toLocaleString() || 0}</td>
                    <td className="py-3 text-[#c9ad92]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                          className="p-1 text-[#c9ad92] hover:text-white"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {!user.lifetimeAccess && user.role !== 'vero' && (
                          <button
                            onClick={() => handleGrantLifetime(user.uid)}
                            className="p-1 text-purple-400 hover:text-purple-300"
                            title="Grant Lifetime"
                          >
                            <span className="material-symbols-outlined text-[18px]">diamond</span>
                          </button>
                        )}
                        {user.role !== 'vero' && (
                          <button
                            onClick={() => handleRevokeAccess(user.uid)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Revoke Access"
                          >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-[#c9ad92]">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Faculties Tab */}
      {activeTab === 'faculties' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Faculty Management</h3>
            <div className="flex gap-2">
              <Button variant="secondary" icon="mail" onClick={() => setShowAssignFacultyModal(true)}>
                Invite by Email
              </Button>
              <Button icon="add" onClick={() => setShowAddFacultyModal(true)}>Add Existing User</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculties.map((faculty, index) => (
              <GlassCard key={faculty.id || `faculty-${index}`} className="flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={faculty.photoURL} name={faculty.displayName} size="md" />
                    <div>
                      <p className="font-medium text-white">{faculty.displayName}</p>
                      <p className="text-xs text-[#c9ad92]">{faculty.email}</p>
                    </div>
                  </div>
                  <Badge color={faculty.isActive ? 'green' : 'red'}>
                    {faculty.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c9ad92]">Batches</span>
                    <span className="text-white">{faculty.batchIds?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c9ad92]">Students</span>
                    <span className="text-white">{faculty.totalStudents || 0}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                  <Button variant="secondary" fullWidth onClick={() => handleRemoveFaculty(faculty)}>
                    Remove
                  </Button>
                </div>
              </GlassCard>
            ))}
            
            {faculties.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#c9ad92]">
                <span className="material-symbols-outlined text-4xl mb-2">school</span>
                <p>No faculties yet. Invite faculty members by email or add existing users.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faculty Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Faculty Invitations</h3>
              <p className="text-sm text-[#c9ad92]">Invite users to become faculty by entering their email address</p>
            </div>
            <Button icon="mail" onClick={() => setShowAssignFacultyModal(true)}>
              Invite Faculty
            </Button>
          </div>
          
          {/* Pending Invitations */}
          <GlassCard>
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">pending</span>
              Pending Invitations
            </h4>
            <div className="space-y-3">
              {facultyAssignments.filter(a => !a.isActivated).map((assignment, index) => (
                <div 
                  key={assignment.id || `assignment-pending-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">mail</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{assignment.displayName || 'Pending Faculty'}</p>
                      <p className="text-sm text-[#c9ad92]">{assignment.email}</p>
                      <div className="flex gap-2 mt-1">
                        {assignment.specialization?.map((spec, i) => (
                          <Badge key={i} color="blue">{spec}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="yellow">Pending</Badge>
                    <Button 
                      variant="secondary" 
                      icon="delete"
                      onClick={() => assignment.id && handleRemoveFacultyAssignment(assignment.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
              
              {facultyAssignments.filter(a => !a.isActivated).length === 0 && (
                <p className="text-center py-8 text-[#c9ad92]">No pending invitations</p>
              )}
            </div>
          </GlassCard>

          {/* Activated Invitations */}
          <GlassCard>
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400">check_circle</span>
              Activated Invitations
            </h4>
            <div className="space-y-3">
              {facultyAssignments.filter(a => a.isActivated).map((assignment, index) => (
                <div 
                  key={assignment.id || `assignment-active-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-400">check</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{assignment.displayName || 'Faculty'}</p>
                      <p className="text-sm text-[#c9ad92]">{assignment.email}</p>
                      <p className="text-xs text-green-400 mt-1">
                        Activated on {assignment.activatedAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge color="green">Active</Badge>
                </div>
              ))}
              
              {facultyAssignments.filter(a => a.isActivated).length === 0 && (
                <p className="text-center py-8 text-[#c9ad92]">No activated invitations yet</p>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Batch Management</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch, index) => (
              <GlassCard key={batch.id || `batch-${index}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-white">{batch.name}</h4>
                    <p className="text-xs text-[#c9ad92]">{batch.facultyName}</p>
                  </div>
                  <Badge color={batch.isActive ? 'green' : 'red'}>
                    {batch.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c9ad92]">Students</span>
                    <span className="text-white">{batch.studentCount} / {batch.maxStudents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c9ad92]">Target Exam</span>
                    <span className="text-white">{batch.targetExam}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c9ad92]">Started</span>
                    <span className="text-white">{new Date(batch.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
            
            {batches.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#c9ad92]">
                <span className="material-symbols-outlined text-4xl mb-2">groups</span>
                <p>No batches created yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <GlassCard>
          <h3 className="text-lg font-bold text-white mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#c9ad92] text-sm border-b border-[#483623]">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {payments.map((payment, index) => (
                  <tr key={payment.id || `payment-${index}`} className="border-b border-[#483623]/30">
                    <td className="py-3">
                      <p className="text-white">{payment.userName}</p>
                      <p className="text-xs text-[#c9ad92]">{payment.userEmail}</p>
                    </td>
                    <td className="py-3">
                      <Badge color={payment.isLifetime ? 'purple' : 'primary'}>
                        {payment.plan}
                      </Badge>
                    </td>
                    <td className="py-3 text-white">₹{payment.amount}</td>
                    <td className="py-3">
                      <Badge color={payment.status === 'completed' ? 'green' : payment.status === 'pending' ? 'yellow' : 'red'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-[#c9ad92]">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {payments.length === 0 && (
            <div className="text-center py-12 text-[#c9ad92]">
              <span className="material-symbols-outlined text-4xl mb-2">payments</span>
              <p>No payments recorded yet.</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <GlassCard>
          <h3 className="text-lg font-bold text-white mb-4">Admin Activity Log</h3>
          <div className="space-y-3">
            {adminLogs.map((log, index) => (
              <div key={log.id || `log-${index}`} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-400">security</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{log.action.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-xs text-[#c9ad92]">
                      by {log.performedByEmail} • {log.details || 'No details'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#c9ad92]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            
            {adminLogs.length === 0 && (
              <div className="text-center py-12 text-[#c9ad92]">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                <p>No admin activity logged yet.</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Bulk Action Modal */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Action">
        <p className="text-[#c9ad92] mb-4">Apply action to {selectedUsers.length} selected users:</p>
        <div className="space-y-3">
          <Button fullWidth variant="secondary" onClick={() => handleBulkAction('lifetime')}>
            Grant Lifetime Access
          </Button>
          <Button fullWidth variant="secondary" onClick={() => handleBulkAction('premium')}>
            Set as Premium
          </Button>
          <Button fullWidth variant="secondary" onClick={() => handleBulkAction('free')}>
            Set as Free
          </Button>
          <Button fullWidth variant="danger" onClick={() => handleBulkAction('expired')}>
            Mark as Expired
          </Button>
        </div>
      </Modal>

      {/* User Detail Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selectedUser.photoURL} name={selectedUser.displayName} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedUser.displayName}</h3>
                <p className="text-[#c9ad92]">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge color={selectedUser.role === 'vero' ? 'purple' : selectedUser.role === 'faculty' ? 'blue' : 'green'}>
                    {selectedUser.role || 'student'}
                  </Badge>
                  <Badge color={selectedUser.plan === 'Lifetime' ? 'purple' : selectedUser.plan === 'Premium' ? 'primary' : 'blue'}>
                    {selectedUser.plan || 'Free'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-xs text-[#c9ad92]">Tokens</p>
                <p className="text-white font-bold">{selectedUser.tokens?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#c9ad92]">Streak</p>
                <p className="text-white font-bold">{selectedUser.streak} days</p>
              </div>
              <div>
                <p className="text-xs text-[#c9ad92]">Tests Completed</p>
                <p className="text-white font-bold">{selectedUser.testsCompleted}</p>
              </div>
              <div>
                <p className="text-xs text-[#c9ad92]">Avg Score</p>
                <p className="text-white font-bold">{selectedUser.averageScore}%</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => handleAddTokens(selectedUser.uid, 100)}
              >
                +100 Tokens
              </Button>
              {selectedUser.role === 'student' && (
                <Button 
                  variant="secondary" 
                  onClick={() => handleMakeFaculty(selectedUser)}
                >
                  Make Faculty
                </Button>
              )}
              {!selectedUser.lifetimeAccess && selectedUser.role !== 'vero' && (
                <Button onClick={() => handleGrantLifetime(selectedUser.uid)}>
                  Grant Lifetime
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Faculty Modal */}
      <Modal isOpen={showAddFacultyModal} onClose={() => setShowAddFacultyModal(false)} title="Add New Faculty">
        <p className="text-[#c9ad92] mb-4">
          Search for an existing user to promote to faculty, or ask them to sign up first.
        </p>
        <div className="space-y-4">
          {users.filter(u => u.role === 'student' || !u.role).slice(0, 10).map(user => (
            <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                <div>
                  <p className="text-white text-sm">{user.displayName}</p>
                  <p className="text-xs text-[#c9ad92]">{user.email}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => { handleMakeFaculty(user); setShowAddFacultyModal(false); }}>
                Make Faculty
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Invite Faculty by Email Modal */}
      <Modal 
        isOpen={showAssignFacultyModal} 
        onClose={() => {
          setShowAssignFacultyModal(false);
          setNewFacultyEmail('');
          setNewFacultyName('');
          setNewFacultySpecializations([]);
        }} 
        title="Invite Faculty by Email"
      >
        <p className="text-[#c9ad92] mb-4">
          Enter an email address to invite someone as faculty. When they sign up or log in with this email, 
          they will automatically be assigned the Faculty role.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#c9ad92] mb-1">Email Address *</label>
            <Input
              type="email"
              value={newFacultyEmail}
              onChange={(e) => setNewFacultyEmail(e.target.value)}
              placeholder="faculty@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c9ad92] mb-1">Display Name</label>
            <Input
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              placeholder="Dr. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c9ad92] mb-2">Specialization</label>
            <div className="flex flex-wrap gap-2">
              {['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science', 'Ethics', 'Current Affairs'].map(subject => (
                <button
                  key={subject}
                  onClick={() => {
                    if (newFacultySpecializations.includes(subject)) {
                      setNewFacultySpecializations(prev => prev.filter(s => s !== subject));
                    } else {
                      setNewFacultySpecializations(prev => [...prev, subject]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    newFacultySpecializations.includes(subject)
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-[#c9ad92] hover:bg-white/20'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-400">info</span>
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-300">
                  <li>Enter the faculty member&apos;s email address</li>
                  <li>They sign up or log in using that email</li>
                  <li>They are automatically assigned the Faculty role</li>
                  <li>They can then access the Faculty Dashboard</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowAssignFacultyModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleAssignFaculty}
              disabled={!newFacultyEmail.trim()}
            >
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
