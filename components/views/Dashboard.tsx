'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getQuizHistory, getWeeklyActivity, DailyActivity } from '@/lib/db';
import { GlassCard, Badge, Button } from '../UI';

export const DashboardView: React.FC = () => {
  const { userProfile } = useAuth();
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (userProfile?.uid) {
        const activity = await getWeeklyActivity(userProfile.uid);
        setWeeklyActivity(activity);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [userProfile?.uid]);

  if (!userProfile) return null;

  // Calculate radar data from user subjects
  const radarData = [
    { subject: 'Polity', value: userProfile.subjects.polity },
    { subject: 'History', value: userProfile.subjects.history },
    { subject: 'Econ', value: userProfile.subjects.economy },
    { subject: 'Science', value: userProfile.subjects.science },
    { subject: 'Env', value: userProfile.subjects.environment },
    { subject: 'Current', value: userProfile.subjects.currentAffairs },
  ];

  // Calculate polygon points for radar chart
  const calculateRadarPoints = () => {
    const center = 100;
    const maxRadius = 60;
    const angleStep = (2 * Math.PI) / radarData.length;
    
    return radarData.map((item, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const radius = (item.value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Good {getGreeting()}, {userProfile.displayName.split(' ')[0]}</h1>
          <p className="text-[#c9ad92]">Ready to conquer your goals today? Your performance is trending up.</p>
        </div>
        {/* Daily Streak Card */}
        <GlassCard className="px-6 py-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-[#c9ad92] uppercase tracking-widest mb-1">Daily Streak</p>
            <p className="text-3xl font-bold text-white">{userProfile.streak} <span className="text-lg font-normal text-[#c9ad92]">Days</span></p>
            <p className="text-xs text-green-400 flex items-center justify-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              Keep it up!
            </p>
          </div>
          <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl icon-filled streak-fire">local_fire_department</span>
          </div>
        </GlassCard>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily 5 Quiz */}
          <GlassCard className="p-0 flex flex-col sm:flex-row overflow-hidden hover:border-primary/30 transition-all">
            <div className="w-full sm:w-1/3 h-40 sm:h-auto bg-cover bg-center relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400')` }}>
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#2c2219] to-transparent"></div>
              <div className="absolute top-4 left-4 size-10 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-white">quiz</span>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white">The Daily 5 Quiz</h3>
              <p className="text-[#c9ad92] text-sm mt-2 mb-4">Test your retention on key topics with 5 rapid-fire questions.</p>
              <Button icon="arrow_forward" className="self-start">Start Quiz</Button>
            </div>
          </GlassCard>

          {/* UPSC-GPT Chat */}
          <GlassCard className="p-0 flex flex-col sm:flex-row overflow-hidden hover:border-primary/30 transition-all">
            <div className="w-full sm:w-1/3 h-40 sm:h-auto bg-cover bg-center relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400')` }}>
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#2c2219] to-transparent"></div>
              <div className="absolute top-4 left-4 size-10 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-white">forum</span>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white">UPSC-GPT Chat</h3>
              <p className="text-[#c9ad92] text-sm mt-2 mb-4">Ask doubts, get explanations, and learn with your AI tutor.</p>
              <Button variant="secondary" icon="chat" className="self-start">Start Chat</Button>
            </div>
          </GlassCard>
        </div>

        {/* Proficiency Radar */}
        <div className="lg:col-span-5">
          <GlassCard className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Proficiency Radar</h3>
                <p className="text-[#c9ad92] text-xs mt-1">Your subject-wise performance</p>
              </div>
              <button className="text-primary text-sm font-medium hover:text-primary/80">Full Report</button>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[280px]">
              {/* Custom SVG Radar Chart */}
              <svg viewBox="0 0 200 200" className="w-full h-full max-h-[280px]">
                {/* Grid Web */}
                <g fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                  <polygon points="100,20 169,55 169,125 100,160 31,125 31,55" fill="none" />
                  <polygon points="100,47 147,70 147,110 100,133 53,110 53,70" fill="none" />
                  <polygon points="100,73 124,85 124,95 100,107 76,95 76,85" fill="none" />
                  <line x1="100" y1="100" x2="100" y2="20" />
                  <line x1="100" y1="100" x2="169" y2="55" />
                  <line x1="100" y1="100" x2="169" y2="125" />
                  <line x1="100" y1="100" x2="100" y2="160" />
                  <line x1="100" y1="100" x2="31" y2="125" />
                  <line x1="100" y1="100" x2="31" y2="55" />
                </g>
                {/* Labels */}
                <g className="text-[11px] fill-white font-medium" textAnchor="middle">
                  <text x="100" y="12">Polity</text>
                  <text x="180" y="55">History</text>
                  <text x="180" y="135">Econ</text>
                  <text x="100" y="178">Science</text>
                  <text x="20" y="135">Env</text>
                  <text x="20" y="55">Current</text>
                </g>
                {/* Data Polygon */}
                <polygon 
                  points={calculateRadarPoints()} 
                  fill="rgba(236, 127, 19, 0.2)" 
                  stroke="#ec7f13" 
                  strokeWidth="2"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_10px_rgba(236,127,19,0.3)]"
                />
                {/* Data Points */}
                <g fill="#ec7f13">
                  {radarData.map((item, i) => {
                    const center = 100;
                    const maxRadius = 60;
                    const angleStep = (2 * Math.PI) / radarData.length;
                    const angle = angleStep * i - Math.PI / 2;
                    const radius = (item.value / 100) * maxRadius;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    return <circle key={i} cx={x} cy={y} r="4" />;
                  })}
                </g>
              </svg>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Weekly Activity */}
      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
          <div className="flex items-center gap-4 text-xs text-[#c9ad92]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary"></span>
              Quizzes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              Essays
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              Chat
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {weeklyActivity.map((day, i) => {
            const maxVal = Math.max(
              ...weeklyActivity.map(d => d.quizzesCompleted + d.essaysGraded + d.chatMessages),
              1
            );
            const total = day.quizzesCompleted + day.essaysGraded + day.chatMessages;
            const height = (total / maxVal) * 100;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1 items-center" style={{ height: '120px' }}>
                  <div 
                    className="w-full max-w-[40px] rounded-t bg-gradient-to-t from-primary/80 to-primary transition-all hover:from-primary hover:to-primary/80"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#c9ad92]">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="text-center">
          <span className="material-symbols-outlined text-primary text-2xl mb-2">quiz</span>
          <p className="text-2xl font-bold text-white">{userProfile.testsCompleted}</p>
          <p className="text-xs text-[#c9ad92]">Tests Completed</p>
        </GlassCard>
        <GlassCard className="text-center">
          <span className="material-symbols-outlined text-blue-400 text-2xl mb-2">schedule</span>
          <p className="text-2xl font-bold text-white">{Math.floor(userProfile.totalStudyTime / 60)}h</p>
          <p className="text-xs text-[#c9ad92]">Study Time</p>
        </GlassCard>
        <GlassCard className="text-center">
          <span className="material-symbols-outlined text-green-400 text-2xl mb-2">percent</span>
          <p className="text-2xl font-bold text-white">{userProfile.averageScore || 0}%</p>
          <p className="text-xs text-[#c9ad92]">Avg Score</p>
        </GlassCard>
        <GlassCard className="text-center">
          <span className="material-symbols-outlined text-purple-400 text-2xl mb-2">token</span>
          <p className="text-2xl font-bold text-white">{userProfile.tokens}</p>
          <p className="text-xs text-[#c9ad92]">Tokens Left</p>
        </GlassCard>
      </div>
    </div>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
