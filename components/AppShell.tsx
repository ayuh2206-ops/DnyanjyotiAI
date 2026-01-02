'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Home } from './views/Home';
import { Chat } from './views/Chat';
import { Login } from './views/Login';
import { VERODashboard } from './views/VERODashboard';
import { FacultyDashboard } from './views/FacultyDashboard';
import { DashboardView } from './views/Dashboard';
import { DailyAffairs } from './views/DailyAffairs';
import { Practice } from './views/Practice';
import { Grading } from './views/Grading';
import { AnalyticsView } from './views/Analytics';
import { ToolsView } from './views/Tools';
import { ProfileView } from './views/Profile';
import { LoadingSpinner, Avatar, Badge } from './UI';

// Types
type StudentView = 'home' | 'dashboard' | 'daily_affairs' | 'practice' | 'grading' | 'tools' | 'chat' | 'analytics' | 'profile';
type FacultyView = 'faculty_dashboard' | 'profile';
type VeroView = 'vero_dashboard' | 'faculty_dashboard' | StudentView;
type View = StudentView | FacultyView | VeroView;

interface NavItem {
  id: View;
  label: string;
  icon: string;
  roles: ('student' | 'faculty' | 'vero')[];
  badge?: string;
}

// Navigation items with role-based access
const NAV_ITEMS: NavItem[] = [
  // VERO only
  { id: 'vero_dashboard', label: 'VERO Control', icon: 'shield_person', roles: ['vero'], badge: 'Admin' },
  // Faculty + VERO
  { id: 'faculty_dashboard', label: 'Faculty Panel', icon: 'school', roles: ['faculty', 'vero'] },
  // Student views (also accessible to faculty and vero for testing)
  { id: 'home', label: 'Home', icon: 'home', roles: ['student', 'faculty', 'vero'] },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['student', 'faculty', 'vero'] },
  { id: 'daily_affairs', label: 'Daily Affairs', icon: 'newspaper', roles: ['student', 'faculty', 'vero'] },
  { id: 'practice', label: 'Practice', icon: 'quiz', roles: ['student', 'faculty', 'vero'] },
  { id: 'grading', label: 'AI Grading', icon: 'history_edu', roles: ['student', 'faculty', 'vero'] },
  { id: 'tools', label: 'Study Tools', icon: 'handyman', roles: ['student', 'faculty', 'vero'] },
  { id: 'chat', label: 'UPSC-GPT', icon: 'forum', roles: ['student', 'faculty', 'vero'] },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', roles: ['student', 'faculty', 'vero'] },
  { id: 'profile', label: 'Profile', icon: 'person', roles: ['student', 'faculty', 'vero'] },
];

export default function AppShell() {
  const { user, userProfile, loading, signOut, isVero, isFaculty, isStudent } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initialViewSet, setInitialViewSet] = useState(false);

  // Set initial view based on role - only on first load
  useEffect(() => {
    if (userProfile && !initialViewSet) {
      if (isVero) {
        setCurrentView('vero_dashboard');
      } else if (isFaculty) {
        setCurrentView('faculty_dashboard');
      } else {
        setCurrentView('home');
      }
      setInitialViewSet(true);
    }
  }, [userProfile, isVero, isFaculty, initialViewSet]);

  // Get user's role
  const getUserRole = (): 'student' | 'faculty' | 'vero' => {
    if (isVero) return 'vero';
    if (isFaculty) return 'faculty';
    return 'student';
  };

  // Filter nav items based on user role
  const filteredNavItems = NAV_ITEMS.filter(item => {
    const role = getUserRole();
    return item.roles.includes(role);
  });

  // Group nav items
  const adminNavItems = filteredNavItems.filter(item => 
    item.id === 'vero_dashboard' || item.id === 'faculty_dashboard'
  );
  const mainNavItems = filteredNavItems.filter(item => 
    item.id !== 'vero_dashboard' && item.id !== 'faculty_dashboard' && item.id !== 'profile'
  );
  const profileNavItem = filteredNavItems.find(item => item.id === 'profile');

  const renderView = () => {
    if (!userProfile) return null;

    switch (currentView) {
      // Admin views
      case 'vero_dashboard':
        return isVero ? <VERODashboard /> : <DashboardView />;
      case 'faculty_dashboard':
        return (isFaculty || isVero) ? <FacultyDashboard /> : <DashboardView />;
      // Student views
      case 'home':
        return <Home onNavigate={(view: string) => setCurrentView(view as View)} />;
      case 'chat':
        return <Chat />;
      case 'dashboard':
        return <DashboardView />;
      case 'daily_affairs':
        return <DailyAffairs />;
      case 'practice':
        return <Practice />;
      case 'grading':
        return <Grading />;
      case 'analytics':
        return <AnalyticsView />;
      case 'tools':
        return <ToolsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Get role badge color
  const getRoleBadgeColor = (): 'purple' | 'blue' | 'green' => {
    if (isVero) return 'purple';
    if (isFaculty) return 'blue';
    return 'green';
  };

  const getRoleLabel = () => {
    if (isVero) return 'VERO';
    if (isFaculty) return 'Faculty';
    return userProfile?.plan || 'Free';
  };

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
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined text-3xl">local_library</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">DnyanGPT</h1>
              <p className="text-[10px] text-[#c9ad92] uppercase tracking-widest">
                {isVero ? 'Super Admin' : isFaculty ? 'Faculty' : 'UPSC Prep'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          {/* Admin Section */}
          {adminNavItems.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">
                Admin
              </div>
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    currentView === item.id 
                      ? item.id === 'vero_dashboard' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined ${currentView === item.id ? 'icon-filled' : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <Badge color="purple" className="ml-auto text-[10px]">{item.badge}</Badge>
                  )}
                </button>
              ))}
              <div className="h-px bg-white/5 my-4" />
            </>
          )}

          {/* Main Navigation */}
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">
            {isVero || isFaculty ? 'Student View' : 'Menu'}
          </div>
          {mainNavItems.map((item) => (
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
            </button>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Profile */}
          {profileNavItem && (
            <button
              onClick={() => { setCurrentView(profileNavItem.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                currentView === profileNavItem.id 
                  ? 'bg-primary/10 text-white border border-primary/20' 
                  : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${currentView === profileNavItem.id ? 'icon-filled text-primary' : ''}`}>
                {profileNavItem.icon}
              </span>
              {profileNavItem.label}
            </button>
          )}
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2c2219] border border-[#483623]">
            <Avatar 
              src={userProfile.photoURL} 
              name={userProfile.displayName} 
              size="md"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{userProfile.displayName}</p>
              <div className="flex items-center gap-1">
                <Badge color={getRoleBadgeColor()} className="text-[10px]">
                  {getRoleLabel()}
                </Badge>
              </div>
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
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[#483623] bg-[#221910]/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="md:hidden text-white/70 hover:text-white"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold capitalize hidden md:block">
                {currentView.replace(/_/g, ' ')}
              </h2>
              {/* Role indicator */}
              {(isVero || isFaculty) && (
                <Badge color={getRoleBadgeColor()} className="hidden md:flex">
                  {isVero ? '🛡️ VERO Mode' : '👨‍🏫 Faculty Mode'}
                </Badge>
              )}
            </div>
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
            
            {/* Only show tokens for students */}
            {isStudent && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-sm">token</span>
                <span className="text-xs font-semibold text-primary">{userProfile.tokens} Tokens</span>
              </div>
            )}
            
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
