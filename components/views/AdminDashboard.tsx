'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllUsers, getSystemStats } from '@/lib/db';
import { GlassCard, Button, Badge, Skeleton, Avatar } from '../UI';

interface SystemStats {
  totalUsers: number;
  activeToday: number;
  totalQuizzes: number;
  totalGradings: number;
  totalTokensUsed: number;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: string;
  tokens: number;
  streak: number;
  testsCompleted: number;
  isAdmin: boolean;
  createdAt: any;
  lastLoginAt: any;
}

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.isAdmin) return;
      
      try {
        setLoading(true);
        const [usersData, systemStats] = await Promise.all([
          getAllUsers(),
          getSystemStats()
        ]);
        
        setUsers(usersData as UserData[]);
        setStats(systemStats);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile?.isAdmin]);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const premiumUsers = users.filter(u => u.plan === 'Premium').length;
  const freeUsers = users.filter(u => u.plan === 'Free').length;
  const totalTokensInCirculation = users.reduce((sum, u) => sum + (u.tokens || 0), 0);

  if (!userProfile?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GlassCard className="text-center p-8">
          <span className="material-symbols-outlined text-red-400 text-4xl mb-4">lock</span>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#c9ad92]">You don't have permission to view this page.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge color="purple">Admin Panel</Badge>
          </div>
          <h1 className="text-3xl font-bold text-white">System Dashboard</h1>
          <p className="text-[#c9ad92]">Monitor and manage DnyanGPT platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="refresh">Refresh Data</Button>
          <Button icon="download">Export Report</Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: 'dashboard' },
          { id: 'users', label: 'Users', icon: 'group' },
          { id: 'analytics', label: 'Analytics', icon: 'analytics' },
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-white">group</span>
              </div>
              <p className="text-[#c9ad92] text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || users.length}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-green-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  +{users.filter(u => {
                    const created = u.createdAt?.toDate?.() || new Date(u.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return created > weekAgo;
                  }).length} this week
                </span>
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-white">diamond</span>
              </div>
              <p className="text-[#c9ad92] text-sm font-medium">Premium Users</p>
              <p className="text-3xl font-bold text-white mt-1">{premiumUsers}</p>
              <div className="text-xs text-[#c9ad92] mt-2">
                {((premiumUsers / users.length) * 100).toFixed(1)}% conversion rate
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-white">quiz</span>
              </div>
              <p className="text-[#c9ad92] text-sm font-medium">Total Quizzes</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalQuizzes || 0}</p>
              <div className="text-xs text-[#c9ad92] mt-2">
                Across all users
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-white">token</span>
              </div>
              <p className="text-[#c9ad92] text-sm font-medium">Tokens in Circulation</p>
              <p className="text-3xl font-bold text-white mt-1">{totalTokensInCirculation.toLocaleString()}</p>
              <div className="text-xs text-[#c9ad92] mt-2">
                ~{(stats?.totalTokensUsed || 0).toLocaleString()} used total
              </div>
            </GlassCard>
          </div>

          {/* Activity & Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Platform Activity
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-400">quiz</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Quiz Sessions</p>
                      <p className="text-xs text-[#c9ad92]">Today</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">{stats?.totalQuizzes || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-400">history_edu</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Essay Gradings</p>
                      <p className="text-xs text-[#c9ad92]">Today</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">{stats?.totalGradings || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-400">token</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Tokens Used</p>
                      <p className="text-xs text-[#c9ad92]">Total</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">{stats?.totalTokensUsed || 0}</span>
                </div>
              </div>
            </GlassCard>

            {/* User Distribution */}
            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">pie_chart</span>
                User Distribution
              </h3>
              <div className="flex items-center justify-center gap-8 py-8">
                {/* Simple pie representation */}
                <div className="relative size-32">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-[#483623]"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="16"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="text-primary"
                      strokeWidth="4"
                      strokeDasharray={`${(premiumUsers / users.length) * 100}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="16"
                      cx="18"
                      cy="18"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{users.length}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-white">Premium</p>
                      <p className="text-xs text-[#c9ad92]">{premiumUsers} users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#483623]"></div>
                    <div>
                      <p className="text-sm font-medium text-white">Free</p>
                      <p className="text-xs text-[#c9ad92]">{freeUsers} users</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              All Users ({filteredUsers.length})
            </h3>
            <div className="relative max-w-md flex-1 md:max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c9ad92] text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2c2219] border border-[#483623] text-sm text-white placeholder-[#c9ad92] focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#c9ad92] text-sm border-b border-[#483623]">
                  <th className="pb-3 font-medium pl-2">User</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Tokens</th>
                  <th className="pb-3 font-medium">Streak</th>
                  <th className="pb-3 font-medium">Tests</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-b border-[#483623]/30 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                        <div>
                          <p className="font-medium text-white flex items-center gap-2">
                            {user.displayName || 'Unknown'}
                            {user.isAdmin && <Badge color="purple" className="text-[10px]">Admin</Badge>}
                          </p>
                          <p className="text-xs text-[#c9ad92]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge color={user.plan === 'Premium' ? 'primary' : 'blue'}>
                        {user.plan || 'Free'}
                      </Badge>
                    </td>
                    <td className="py-4 text-white">{user.tokens || 0}</td>
                    <td className="py-4">
                      <span className="flex items-center gap-1 text-orange-400">
                        <span className="material-symbols-outlined text-sm icon-filled">local_fire_department</span>
                        {user.streak || 0}
                      </span>
                    </td>
                    <td className="py-4 text-[#c9ad92]">{user.testsCompleted || 0}</td>
                    <td className="py-4 text-[#c9ad92]">
                      {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button className="text-primary hover:text-white p-1 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-[#c9ad92]">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">search_off</span>
              <p>No users found matching your search.</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <GlassCard>
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl mb-2 text-primary">analytics</span>
            <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
            <p className="text-[#c9ad92] mb-4">Detailed platform analytics coming in Phase 2</p>
            <Badge>Coming Soon</Badge>
          </div>
        </GlassCard>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Platform Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">New User Bonus</p>
                  <p className="text-xs text-[#c9ad92]">Tokens given to new signups</p>
                </div>
                <span className="text-white font-bold">500</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Daily Quiz Limit (Free)</p>
                  <p className="text-xs text-[#c9ad92]">Max quizzes per day</p>
                </div>
                <span className="text-white font-bold">5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Chat Token Cost</p>
                  <p className="text-xs text-[#c9ad92]">Tokens per message</p>
                </div>
                <span className="text-white font-bold">3-5</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">api</span>
              API Configuration
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-sm font-medium text-white mb-1">Gemini 2.5 Flash</p>
                <p className="text-xs text-[#c9ad92]">Fast operations (chat, quiz)</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-sm font-medium text-white mb-1">Gemini 2.5 Pro</p>
                <p className="text-xs text-[#c9ad92]">Smart operations (grading, analysis)</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-sm font-medium text-white mb-1">Firebase</p>
                <p className="text-xs text-[#c9ad92]">Authentication & Database</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
