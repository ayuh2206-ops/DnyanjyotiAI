'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getQuizHistory, getWeeklyActivity } from '@/lib/db';
import { GlassCard, Button, Badge, Skeleton } from '../UI';

interface WeeklyData {
  day: string;
  quizzes: number;
  essays: number;
  chat: number;
  studyTime: number;
}

interface SubjectScore {
  subject: string;
  score: number;
  status: 'High' | 'Avg' | 'Low';
  color: string;
  textColor: string;
  pulse?: boolean;
}

export const AnalyticsView: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'6months' | '3months' | '1month'>('6months');

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.uid) return;
      
      try {
        setLoading(true);
        const [weekly, history] = await Promise.all([
          getWeeklyActivity(userProfile.uid),
          getQuizHistory(userProfile.uid, undefined, 10)
        ]);
        
        // Process weekly data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const processedWeekly = days.map((day, index) => {
          const dayData = weekly.find((w: any) => new Date(w.date).getDay() === index);
          return {
            day,
            quizzes: dayData?.quizzesCompleted || 0,
            essays: dayData?.essaysGraded || 0,
            chat: dayData?.chatMessages || 0,
            studyTime: dayData?.studyTime || 0
          };
        });
        
        setWeeklyData(processedWeekly);
        setQuizHistory(history);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile?.uid]);

  // Calculate subject scores from user profile
  const getSubjectScores = (): SubjectScore[] => {
    if (!userProfile?.subjects) return [];
    
    const subjects = [
      { key: 'polity', name: 'Polity' },
      { key: 'history', name: 'History' },
      { key: 'economy', name: 'Economy' },
      { key: 'geography', name: 'Geography' },
      { key: 'science', name: 'Science & Tech' },
      { key: 'environment', name: 'Environment' },
      { key: 'currentAffairs', name: 'Current Affairs' },
      { key: 'ethics', name: 'Ethics' }
    ];

    return subjects.map(s => {
      const score = userProfile.subjects[s.key as keyof typeof userProfile.subjects] || 50;
      let status: 'High' | 'Avg' | 'Low';
      let color: string;
      let textColor: string;
      let pulse = false;

      if (score >= 70) {
        status = 'High';
        color = 'bg-green-500';
        textColor = 'text-green-400';
      } else if (score >= 50) {
        status = 'Avg';
        color = 'bg-[#c9ad92]';
        textColor = 'text-[#c9ad92]';
      } else {
        status = 'Low';
        color = 'bg-primary';
        textColor = 'text-primary';
        pulse = true;
      }

      return { subject: s.name, score, status, color, textColor, pulse };
    });
  };

  const subjectScores = getSubjectScores();
  const lowestSubject = subjectScores.reduce((min, s) => s.score < min.score ? s : min, subjectScores[0]);

  // Calculate radar points for SVG
  const radarPoints = () => {
    const subjects: (keyof typeof userProfile.subjects)[] = ['polity', 'history', 'science', 'economy', 'environment', 'currentAffairs'];
    const scores = subjects.map(s => (userProfile?.subjects?.[s] || 50) / 100);
    
    const centerX = 100;
    const centerY = 100;
    const radius = 70;
    
    const points = scores.map((score, i) => {
      const angle = (Math.PI * 2 * i) / scores.length - Math.PI / 2;
      const x = centerX + radius * score * Math.cos(angle);
      const y = centerY + radius * score * Math.sin(angle);
      return `${x},${y}`;
    });
    
    return points.join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Performance Analytics</h1>
          <p className="text-[#c9ad92]">Detailed insights into your preparation journey across all subjects.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass-panel px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white hover:bg-white/10">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 30 Days
          </button>
          <Button icon="download">Generate Report</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="text-center py-6">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            Top {Math.max(5, 100 - Math.floor(userProfile?.efficiency || 50))}%
          </p>
          <p className="text-xs text-[#c9ad92]">All India Rank Prediction</p>
          <p className="text-xs text-green-400 mt-2 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            Improving steadily
          </p>
        </GlassCard>
        
        <GlassCard className="text-center py-6">
          <div className="size-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-blue-400">schedule</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{userProfile?.totalStudyTime || 0} Hrs</p>
          <p className="text-xs text-[#c9ad92]">Total Hours Studied</p>
          <p className="text-xs text-[#c9ad92] mt-2">Keep up the momentum!</p>
        </GlassCard>
        
        <GlassCard className="text-center py-6">
          <div className="size-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-purple-400">quiz</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{userProfile?.testsCompleted || 0}</p>
          <p className="text-xs text-[#c9ad92]">Tests Attempted</p>
          <p className="text-xs text-[#c9ad92] mt-2">Avg Score: {userProfile?.averageScore || 0}%</p>
        </GlassCard>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weakness Radar */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Weakness Radar</h3>
                <p className="text-[#c9ad92] text-xs mt-1">Visualizing proficiency across key subjects</p>
              </div>
              <button className="text-primary text-sm font-medium hover:text-primary/80">View Detailed Analysis</button>
            </div>
            <div className="flex items-center justify-center min-h-[300px] relative">
              {/* SVG Radar */}
              <svg viewBox="0 0 200 200" className="w-full h-full max-h-[300px]">
                <g fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                  <polygon points="100,30 157,65 157,135 100,170 43,135 43,65" fill="none" />
                  <polygon points="100,44 143,70 143,130 100,156 57,130 57,70" fill="none" />
                  <polygon points="100,58 129,76 129,124 100,142 71,124 71,76" fill="none" />
                  <polygon points="100,72 115,81 115,119 100,128 85,119 85,81" fill="none" />
                </g>
                <polygon 
                  points={radarPoints()} 
                  fill="rgba(236, 127, 19, 0.15)" 
                  stroke="#ec7f13" 
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {radarPoints().split(' ').map((point, i) => {
                  const [x, y] = point.split(',');
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill="#fff" />
                  );
                })}
              </svg>
              {/* Labels */}
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-[#221910] px-2 py-0.5 rounded border border-[#483623]">Polity</span>
              <span className="absolute top-[25%] right-4 text-xs font-bold text-white bg-[#221910] px-2 py-0.5 rounded border border-[#483623]">History</span>
              <span className="absolute bottom-[20%] right-4 text-xs font-bold text-white bg-[#221910] px-2 py-0.5 rounded border border-[#483623]">Science</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold text-primary bg-[#221910] px-2 py-0.5 rounded border border-primary/50 shadow-[0_0_10px_rgba(236,127,19,0.3)]">Economy</span>
              <span className="absolute bottom-[20%] left-4 text-xs font-bold text-white bg-[#221910] px-2 py-0.5 rounded border border-[#483623]">Env.</span>
              <span className="absolute top-[25%] left-4 text-xs font-bold text-white bg-[#221910] px-2 py-0.5 rounded border border-[#483623]">Current</span>
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Insight */}
          <GlassCard className="border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <p className="text-white font-bold">AI Insight: Focus Area</p>
            </div>
            <p className="text-[#c9ad92] text-sm leading-relaxed mb-4">
              Your accuracy in <span className="text-white font-medium">{lowestSubject?.subject}</span> needs attention. 
              We recommend reviewing this subject to improve your overall score.
            </p>
            <Button fullWidth icon="arrow_forward">Review {lowestSubject?.subject}</Button>
          </GlassCard>

          {/* Subject Breakdown */}
          <GlassCard>
            <h3 className="text-white font-bold mb-4">Subject Breakdown</h3>
            <div className="space-y-4">
              {subjectScores.slice(0, 6).map((item) => (
                <div key={item.subject} className="group">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-white text-sm font-medium">{item.subject}</span>
                    <span className={`${item.textColor} text-xs font-bold`}>{item.score}% {item.status}</span>
                  </div>
                  <div className="w-full bg-[#483623] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full ${item.pulse ? 'animate-pulse' : ''}`} 
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Score Trajectory */}
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
            <p className="text-[#c9ad92] text-sm">Your activity over the past week</p>
          </div>
          <div className="flex items-center gap-2 bg-[#483623]/30 rounded-lg p-1">
            <button 
              onClick={() => setTimeRange('6months')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timeRange === '6months' ? 'bg-[#483623] text-white shadow-sm' : 'text-[#c9ad92] hover:text-white'}`}
            >
              6 Months
            </button>
            <button 
              onClick={() => setTimeRange('3months')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timeRange === '3months' ? 'bg-[#483623] text-white shadow-sm' : 'text-[#c9ad92] hover:text-white'}`}
            >
              3 Months
            </button>
            <button 
              onClick={() => setTimeRange('1month')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timeRange === '1month' ? 'bg-[#483623] text-white shadow-sm' : 'text-[#c9ad92] hover:text-white'}`}
            >
              1 Month
            </button>
          </div>
        </div>
        
        {/* Bar Chart */}
        <div className="h-64 flex items-end justify-around gap-4">
          {weeklyData.map((day, i) => {
            const maxValue = Math.max(...weeklyData.map(d => d.quizzes + d.essays + d.chat));
            const height = maxValue > 0 ? ((day.quizzes + day.essays + day.chat) / maxValue) * 100 : 10;
            const isToday = i === new Date().getDay();
            
            return (
              <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: '200px' }}>
                  <div 
                    className={`w-full max-w-[40px] rounded-t transition-all ${isToday ? 'bg-primary shadow-[0_0_15px_rgba(236,127,19,0.5)]' : 'bg-primary/30 hover:bg-primary/50'}`}
                    style={{ height: `${height}%`, minHeight: '10px' }}
                  >
                    <div className="w-full h-full flex flex-col justify-end">
                      {day.quizzes > 0 && (
                        <div className="w-full bg-green-500/60" style={{ height: `${(day.quizzes / (day.quizzes + day.essays + day.chat)) * 100}%` }}></div>
                      )}
                      {day.essays > 0 && (
                        <div className="w-full bg-blue-500/60" style={{ height: `${(day.essays / (day.quizzes + day.essays + day.chat)) * 100}%` }}></div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-[#c9ad92]'}`}>{day.day}</span>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/60"></div>
            <span className="text-xs text-[#c9ad92]">Quizzes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/60"></div>
            <span className="text-xs text-[#c9ad92]">Essays</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/60"></div>
            <span className="text-xs text-[#c9ad92]">Chat Sessions</span>
          </div>
        </div>
      </GlassCard>

      {/* Recent Quiz Performance */}
      <GlassCard>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Recent Quiz Performance
          </h3>
          <button className="text-primary text-sm font-medium hover:text-primary/80">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#c9ad92] text-sm border-b border-[#483623]">
                <th className="pb-3 font-medium pl-2">Quiz</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {quizHistory.length > 0 ? (
                quizHistory.map((quiz, i) => (
                  <tr key={i} className="border-b border-[#483623]/30 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-2 font-medium text-white capitalize">{quiz.quizType?.replace('_', ' ')}</td>
                    <td className="py-4 text-[#c9ad92] capitalize">{quiz.subject}</td>
                    <td className="py-4">
                      <Badge color={quiz.score >= 70 ? 'green' : quiz.score >= 50 ? 'yellow' : 'red'}>
                        {quiz.score}/{quiz.totalQuestions * 10}
                      </Badge>
                    </td>
                    <td className="py-4 text-[#c9ad92]">
                      {new Date(quiz.createdAt?.toDate?.() || quiz.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#c9ad92]">
                    No quiz history yet. Start practicing to see your progress!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
