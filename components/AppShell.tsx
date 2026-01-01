'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Home } from './views/Home';
import { Chat } from './views/Chat';
import { Login } from './views/Login';
import { AdminDashboard } from './views/AdminDashboard';
import { DashboardView } from './views/Dashboard';
import { DailyAffairsView } from './views/DailyAffairs';
import { PracticeView } from './views/Practice';
import { GradingView } from './views/Grading';
import { AnalyticsView } from './views/Analytics';
import { ToolsView } from './views/Tools';
import { ProfileView } from './views/Profile';
import { LoadingSpinner, Avatar } from './UI';

// Types
type View = 'home' | 'dashboard' | 'daily_affairs' | 'practice' | 'grading' | 'tools' | 'chat' | 'analytics' | 'profile' | 'admin';

interface NavItem {
  id: View;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'daily_affairs', label: 'Daily Affairs', icon: 'newspaper' },
  { id: 'practice', label: 'Practice', icon: 'quiz' },
  { id: 'grading', label: 'AI Grading', icon: 'history_edu' },
  { id: 'tools', label: 'Study Tools', icon: 'handyman' },
  { id: 'chat', label: 'UPSC-GPT', icon: 'forum' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', adminOnly: true },
];

export default function AppShell() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter nav items based on admin status
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly) {
      return userProfile?.isAdmin;
    }
    return true;
  });

  const renderView = () => {
    if (!userProfile) return null;

    switch (currentView) {
      case 'home':
        return <Home onNavigate={setCurrentView} />;
      case 'chat':
        return <Chat />;
      case 'dashboard':
        return <DashboardView />;
      case 'daily_affairs':
        return <DailyAffairsView />;
      case 'practice':
        return <PracticeView />;
      case 'grading':
        return <GradingView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'tools':
        return <ToolsView />;
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return userProfile.isAdmin ? <AdminDashboard /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen app-background items-center justify-center">
        <LoadingSpinner size="lg" text="Loading DnyanGPT..." />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user || !userProfile) {
    return (
      <div className="flex h-screen app-background text-white font-sans overflow-hidden relative">
        <div className="flex-1 relative z-10 flex items-center justify-center">
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen app-background text-white font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 w-72 h-full glass-sidebar flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined text-3xl">local_library</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">DnyanGPT</h1>
              <p className="text-[10px] text-[#c9ad92] uppercase tracking-widest">UPSC Prep</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                currentView === item.id 
                  ? 'bg-primary/10 text-white border border-primary/20' 
                  : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${currentView === item.id ? 'icon-filled text-primary' : ''}`}>
                {item.icon}
              </span>
              {item.label}
              {item.adminOnly && (
                <span className="ml-auto admin-badge">Admin</span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2c2219] border border-[#483623]">
            <Avatar 
              src={userProfile.photoURL} 
              name={userProfile.displayName} 
              size="md"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{userProfile.displayName}</p>
              <p className="text-[10px] text-[#c9ad92] truncate flex items-center gap-1">
                {userProfile.plan} Plan
                {userProfile.isAdmin && <span className="admin-badge ml-1">Admin</span>}
              </p>
            </div>
            <button 
              onClick={signOut}
              className="text-[#c9ad92] hover:text-white p-1"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-[#483623] bg-[#221910]/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-white/70 hover:text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-xl font-bold capitalize hidden md:block">
              {currentView.replace('_', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="hidden lg:flex relative max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c9ad92] text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search topics, quizzes, or articles..."
                className="w-64 pl-10 pr-4 py-2 rounded-lg bg-[#2c2219] border border-[#483623] text-sm text-white placeholder-[#c9ad92] focus:outline-none focus:border-primary"
              />
            </div>
            
            {/* Tokens Display */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-sm">token</span>
              <span className="text-xs font-semibold text-primary">{userProfile.tokens} Tokens</span>
            </div>
            
            {/* Streak Display */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <span className="material-symbols-outlined text-orange-400 text-sm icon-filled streak-fire">local_fire_department</span>
              <span className="text-xs font-semibold text-orange-400">{userProfile.streak} Days</span>
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 text-[#c9ad92] hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            
            {/* Date */}
            <span className="text-sm text-[#c9ad92] hidden md:block">{currentDate}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
