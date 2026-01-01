'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GlassCard, Button, Badge, Input, Toggle, Avatar, Toast } from '../UI';

export const ProfileView: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [targetExam, setTargetExam] = useState(userProfile?.targetExam || 'UPSC CSE 2025');
  
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [socraticMode, setSocraticMode] = useState(true);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        targetExam,
        updatedAt: new Date()
      });
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      // In production, this would call a server function to delete user data
      setToast({ message: 'Account deletion is handled by support. Please contact us.', type: 'info' });
    }
  };

  // Calculate token usage stats
  const tokenUsagePercent = ((userProfile?.tokens || 0) / 5000) * 100;
  const recentTokenUsage = [30, 45, 20, 60, 80]; // Placeholder - would come from actual data

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header Card */}
      <GlassCard className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <Avatar 
            src={userProfile?.photoURL} 
            name={userProfile?.displayName || 'User'} 
            size="xl"
          />
          <button className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-white hover:bg-primary/80 shadow-lg">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-2xl font-bold text-white">{userProfile?.displayName}</h2>
          <p className="text-[#c9ad92]">{userProfile?.email}</p>
          <p className="text-[#c9ad92] text-sm">UPSC Aspirant • {targetExam}</p>
          <div className="flex gap-2 mt-3 justify-center sm:justify-start flex-wrap">
            <Badge color="green">Active</Badge>
            <Badge color="primary">{userProfile?.plan || 'Free'}</Badge>
            {userProfile?.isAdmin && <Badge color="purple">Admin</Badge>}
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-2xl">token</span>
          <span className="text-2xl font-bold text-white">{userProfile?.tokens || 0}</span>
          <span className="text-xs text-[#c9ad92]">Tokens</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">person</span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                value={userProfile?.email || ''}
                disabled
                placeholder="Email"
              />
              <div className="space-y-2">
                <label className="text-sm text-[#c9ad92]">Target Exam</label>
                <select 
                  className="w-full glass-input rounded-lg px-4 py-3 text-sm"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                >
                  <option value="UPSC CSE 2025">UPSC CSE 2025</option>
                  <option value="UPSC CSE 2026">UPSC CSE 2026</option>
                  <option value="UPSC CSE 2027">UPSC CSE 2027</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#c9ad92]">Member Since</label>
                <input 
                  type="text" 
                  value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                  disabled
                  className="w-full glass-input rounded-lg px-4 py-3 text-sm opacity-60"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveProfile} loading={loading}>
                Save Changes
              </Button>
            </div>
          </GlassCard>

          {/* Study Statistics */}
          <GlassCard>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Study Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white">{userProfile?.testsCompleted || 0}</p>
                <p className="text-xs text-[#c9ad92]">Tests Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white">{userProfile?.streak || 0}</p>
                <p className="text-xs text-[#c9ad92]">Current Streak</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white">{userProfile?.longestStreak || 0}</p>
                <p className="text-xs text-[#c9ad92]">Longest Streak</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white">{userProfile?.averageScore || 0}%</p>
                <p className="text-xs text-[#c9ad92]">Avg Score</p>
              </div>
            </div>
          </GlassCard>

          {/* Preferences */}
          <GlassCard>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">tune</span>
              Preferences
            </h3>
            <div className="space-y-4">
              <Toggle
                label="Email Notifications"
                description="Receive daily briefs and quiz reminders"
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
              <Toggle
                label="Push Notifications"
                description="Get notified about new content"
                checked={pushNotifications}
                onChange={setPushNotifications}
              />
              <Toggle
                label="Dark Mode"
                description="Use dark theme across the app"
                checked={darkMode}
                onChange={setDarkMode}
              />
              <Toggle
                label="Socratic Mode Default"
                description="Start chat sessions in guided learning mode"
                checked={socraticMode}
                onChange={setSocraticMode}
              />
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Token Usage */}
          <GlassCard>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">token</span>
              Token Usage
            </h3>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-white">{userProfile?.tokens || 0}</p>
              <p className="text-xs text-[#c9ad92] mt-1">tokens remaining</p>
              <div className="w-full bg-[#483623] rounded-full h-2 mt-4 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(tokenUsagePercent, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-[#c9ad92] mt-2">
                {userProfile?.plan === 'Premium' ? 'Unlimited plan' : `${5000 - (userProfile?.tokens || 0)} used this month`}
              </p>
            </div>
            
            {/* Usage Chart */}
            <div className="space-y-2 mb-4 mt-6">
              <p className="text-xs text-[#c9ad92]">Recent Usage</p>
              <div className="flex justify-between h-24 gap-1.5 items-end">
                {recentTokenUsage.map((h, i) => (
                  <div 
                    key={i} 
                    className={`w-full rounded-t-sm hover:bg-primary/40 transition-all ${i === recentTokenUsage.length - 1 ? 'bg-primary shadow-[0_0_15px_rgba(236,127,19,0.5)]' : 'bg-primary/20'}`} 
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-[#c9ad92] font-mono">
                <span>4h</span><span>3h</span><span>2h</span><span>1h</span><span>Now</span>
              </div>
            </div>
            
            <Button variant="secondary" fullWidth>
              {userProfile?.plan === 'Premium' ? 'Manage Plan' : 'Upgrade to Premium'}
            </Button>
          </GlassCard>

          {/* Current Plan */}
          <GlassCard className={`${userProfile?.plan === 'Premium' ? 'bg-gradient-to-br from-primary/20 to-transparent border-primary/30' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`size-10 rounded-lg flex items-center justify-center ${userProfile?.plan === 'Premium' ? 'bg-primary/20' : 'bg-white/5'}`}>
                <span className={`material-symbols-outlined ${userProfile?.plan === 'Premium' ? 'text-primary' : 'text-[#c9ad92]'}`}>
                  {userProfile?.plan === 'Premium' ? 'diamond' : 'workspace_premium'}
                </span>
              </div>
              <div>
                <h4 className="text-white font-semibold">{userProfile?.plan || 'Free'} Plan</h4>
                <p className="text-xs text-[#c9ad92]">
                  {userProfile?.plan === 'Premium' ? 'All features unlocked' : 'Limited features'}
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-[#c9ad92]">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                AI Chat Sessions
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                Quiz Generation
              </li>
              <li className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${userProfile?.plan === 'Premium' ? 'text-green-400' : 'text-[#c9ad92]/50'}`}>
                  {userProfile?.plan === 'Premium' ? 'check_circle' : 'cancel'}
                </span>
                <span className={userProfile?.plan !== 'Premium' ? 'opacity-50' : ''}>
                  Deep Pro Grading
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${userProfile?.plan === 'Premium' ? 'text-green-400' : 'text-[#c9ad92]/50'}`}>
                  {userProfile?.plan === 'Premium' ? 'check_circle' : 'cancel'}
                </span>
                <span className={userProfile?.plan !== 'Premium' ? 'opacity-50' : ''}>
                  Unlimited Tokens
                </span>
              </li>
            </ul>
          </GlassCard>

          {/* Account Actions */}
          <GlassCard>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">settings</span>
              Account Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#c9ad92]">logout</span>
                <div>
                  <p className="text-sm font-medium text-white">Sign Out</p>
                  <p className="text-xs text-[#c9ad92]">Log out of your account</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                <span className="material-symbols-outlined text-[#c9ad92]">download</span>
                <div>
                  <p className="text-sm font-medium text-white">Export Data</p>
                  <p className="text-xs text-[#c9ad92]">Download your study data</p>
                </div>
              </button>
            </div>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard className="border-red-500/20">
            <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Danger Zone
            </h3>
            <p className="text-xs text-[#c9ad92] mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button 
              variant="danger" 
              fullWidth
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
