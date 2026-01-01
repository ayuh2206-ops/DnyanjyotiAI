'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getRecentActivity, RecentActivity } from '@/lib/db';
import { GlassCard, Badge, Button } from '../UI';

export type View = 'home' | 'dashboard' | 'daily_affairs' | 'practice' | 'grading' | 'tools' | 'chat' | 'analytics' | 'profile' | 'admin';

interface HomeProps {
  onNavigate: (view: View) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (userProfile?.uid) {
        const activity = await getRecentActivity(userProfile.uid, 3);
        setRecentActivity(activity);
      }
      setLoading(false);
    };
    
    fetchActivity();
  }, [userProfile?.uid]);

  // Calculate days until prelims (example: June 2025)
  const getDaysUntilPrelims = () => {
    const prelims = new Date('2025-06-01');
    const today = new Date();
    const diff = prelims.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const quickActions = [
    { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', desc: 'View overall progress and daily tasks.', gradient: 'from-orange-500/20' },
    { id: 'daily_affairs', title: 'Daily Affairs', icon: 'newspaper', desc: 'Curated news briefs from The Hindu.', gradient: 'from-blue-500/20' },
    { id: 'practice', title: 'Practice Tests', icon: 'quiz', desc: 'AI-generated quizzes & PYQs.', gradient: 'from-purple-500/20' },
    { id: 'grading', title: 'AI Grading', icon: 'history_edu', desc: 'Instant Mains answer evaluation.', gradient: 'from-green-500/20' },
    { id: 'tools', title: 'Study Tools', icon: 'handyman', desc: 'Flashcards, OCR & more.', gradient: 'from-yellow-500/20' },
    { id: 'chat', title: 'UPSC-GPT', icon: 'forum', desc: 'Socratic AI Mentor 24/7.', gradient: 'from-teal-500/20' },
    { id: 'analytics', title: 'Performance', icon: 'monitoring', desc: 'Deep dive analytics.', gradient: 'from-red-500/20' },
    { id: 'profile', title: 'Profile', icon: 'person', desc: 'Manage account & settings.', gradient: 'from-gray-500/20' },
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (!userProfile) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge>{userProfile.targetExam}</Badge>
            <Badge color="green">Prelims: {getDaysUntilPrelims()} Days</Badge>
            {userProfile.isAdmin && <Badge color="purple">Admin</Badge>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            Welcome back, {userProfile.displayName.split(' ')[0]}
          </h1>
          <p className="text-[#c9ad92] text-lg font-light max-w-xl">
            Your AI learning hub is ready. What would you like to focus on today?
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-[#c9ad92] uppercase tracking-widest font-semibold mb-1">Study Streak</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-3xl font-bold text-white">{userProfile.streak}</span>
              <span className="material-symbols-outlined text-primary text-2xl icon-filled streak-fire">local_fire_department</span>
            </div>
          </div>
          <div className="h-12 w-px bg-white/20"></div>
          <div className="text-right">
            <p className="text-xs text-[#c9ad92] uppercase tracking-widest font-semibold mb-1">Efficiency</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-3xl font-bold text-white">{userProfile.efficiency}%</span>
              <span className="material-symbols-outlined text-green-400 text-2xl">trending_up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((item) => (
          <GlassCard 
            key={item.id} 
            onClick={() => onNavigate(item.id as View)}
            hoverEffect
            className={`h-48 flex flex-col justify-between group cursor-pointer bg-gradient-to-br ${item.gradient} to-transparent relative overflow-hidden`}
          >
            <div className="flex justify-between items-start z-10">
              <div className="size-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center transition-all group-hover:bg-primary group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/20">
                <span className="material-symbols-outlined text-2xl text-white">{item.icon}</span>
              </div>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white/80 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
            </div>
            <div className="z-10">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-[#c9ad92] leading-relaxed">{item.desc}</p>
            </div>
            {/* Background Icon */}
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-white/[0.03] group-hover:text-white/[0.06] transition-colors rotate-12">{item.icon}</span>
          </GlassCard>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Recent Activity
              </h3>
              <button 
                onClick={() => onNavigate('analytics')}
                className="text-xs text-[#c9ad92] hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 spinner"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, i) => (
                  <div 
                    key={activity.id || i} 
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-lg bg-primary/20 flex items-center justify-center ${activity.color}`}>
                        <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{activity.title}</p>
                        <p className="text-xs text-[#c9ad92]">{activity.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs text-white/40 font-mono">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#c9ad92]">
                  <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
                  <p className="text-sm">No recent activity yet.</p>
                  <p className="text-xs mt-1">Start a quiz or chat to see your activity here!</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quote Card */}
        <GlassCard className="flex flex-col justify-center bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
          <span className="material-symbols-outlined absolute top-4 right-4 text-white/10 text-[80px] rotate-12">format_quote</span>
          <div className="relative z-10">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Daily Inspiration</p>
            <blockquote className="text-xl font-serif text-white/90 italic mb-4 leading-relaxed">
              &quot;Arise, awake, and stop not till the goal is reached.&quot;
            </blockquote>
            <p className="text-sm font-bold text-white">— Swami Vivekananda</p>
          </div>
        </GlassCard>
      </div>

      {/* Upgrade CTA - Only show for Free users */}
      {userProfile.plan === 'Free' && (
        <GlassCard className="bg-gradient-to-r from-primary/20 via-transparent to-primary/10 border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Upgrade to Premium</h3>
              <p className="text-sm text-[#c9ad92]">Unlock unlimited AI grading, advanced analytics, and more.</p>
            </div>
          </div>
          <Button icon="arrow_forward">Explore Plans</Button>
        </GlassCard>
      )}

      {/* Token Info */}
      <div className="text-center text-xs text-[#c9ad92]">
        You have <span className="text-primary font-bold">{userProfile.tokens}</span> tokens remaining. 
        <button className="text-primary hover:underline ml-1">Learn how tokens work</button>
      </div>
    </div>
  );
};
