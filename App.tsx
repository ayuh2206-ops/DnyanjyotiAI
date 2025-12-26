import React, { useState } from 'react';
import { View, User, NavItem } from './types';
import { Home } from './views/Home';
import { Chat } from './views/Chat';
import { Login } from './views/Login';
import { Button, GlassCard, Badge } from './components/UI';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';

// Mock Data
const user: User = {
  name: 'Aarav Patel',
  plan: 'Premium',
  tokens: 2450,
  streak: 12,
  efficiency: 84,
  avatarUrl: 'https://picsum.photos/200'
};

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
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');

  const handleLogin = () => {
    // Mock login logic - in real app this would connect to Firebase
    setIsAuthenticated(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={setCurrentView} user={user} onWallpaperChange={setWallpaper} />;
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
      default:
        return <Home onNavigate={setCurrentView} user={user} onWallpaperChange={setWallpaper} />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-900 text-white font-sans overflow-hidden relative">
      {/* Background Wallpaper - removed opacity-40 to make it fully visible */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-in-out" 
        style={{ backgroundImage: `url('${wallpaper}')` }}
      />
      {/* Light Overlay - Changed from dark-900/90 to black/20 for "negligible" opacity while keeping text readable */}
      <div className="fixed inset-0 bg-black/20 z-0 pointer-events-none" />
      
      {!isAuthenticated ? (
        <div className="flex-1 relative z-10 flex items-center justify-center">
          <Login onLogin={handleLogin} />
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <aside className={`fixed md:relative z-30 w-64 h-full glass-sidebar flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-white text-xl">school</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-tight">AI Examiner</h1>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">UPSC Prep</p>
                </div>
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      currentView === item.id 
                        ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(236,127,19,0.15)]' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${currentView === item.id ? 'icon-filled text-primary' : ''}`}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="mt-auto p-6 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                    <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-full border border-white/20" />
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <p className="text-[10px] text-primary truncate">{user.plan} Plan</p>
                    </div>
                </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col relative z-10 min-w-0">
            <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-transparent backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-white/70 hover:text-white">
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-lg font-semibold capitalize hidden md:block drop-shadow-md">{currentView.replace('_', ' ')}</h2>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/10 backdrop-blur-md">
                    <span className="material-symbols-outlined text-primary text-sm">token</span>
                    <span className="text-xs font-bold text-primary">{user.tokens} Tokens</span>
                 </div>
                 <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined drop-shadow-md">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_#ec7f13]"></span>
                 </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
              <div className="max-w-7xl mx-auto">
                {renderView()}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

// --- Sub-Views (Simplified for the single-file constraint while keeping logic separated) ---

const DashboardView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <GlassCard className="h-48 flex flex-col justify-center relative bg-gradient-to-r from-primary/20 to-transparent">
          <h2 className="text-2xl font-bold mb-2">Daily 5 Quiz</h2>
          <p className="text-white/60 text-sm mb-4">Test retention on yesterday's key topics.</p>
          <Button icon="play_arrow" className="self-start">Start Quiz</Button>
          <span className="material-symbols-outlined absolute right-4 bottom-4 text-9xl text-white/10 rotate-12">quiz</span>
       </GlassCard>
       <GlassCard className="h-48 flex flex-col justify-center relative bg-gradient-to-r from-blue-500/20 to-transparent">
          <h2 className="text-2xl font-bold mb-2">60-Word Brief</h2>
          <p className="text-white/60 text-sm mb-4">Summarized editorials from The Hindu.</p>
          <Button variant="secondary" icon="visibility" className="self-start">Read Now</Button>
          <span className="material-symbols-outlined absolute right-4 bottom-4 text-9xl text-white/10 rotate-12">newspaper</span>
       </GlassCard>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Proficiency Radar</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Polity', A: 120, fullMark: 150 },
                        { subject: 'History', A: 98, fullMark: 150 },
                        { subject: 'Geo', A: 86, fullMark: 150 },
                        { subject: 'Econ', A: 65, fullMark: 150 },
                        { subject: 'Science', A: 85, fullMark: 150 },
                        { subject: 'Env', A: 90, fullMark: 150 },
                    ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Aarav" dataKey="A" stroke="#ec7f13" strokeWidth={3} fill="#ec7f13" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} itemStyle={{ color: '#fff' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
        <GlassCard>
            <h3 className="text-lg font-bold mb-4">Daily Streak</h3>
            <div className="flex items-center justify-center flex-col h-56">
                <div className="relative">
                    <span className="material-symbols-outlined text-[100px] text-primary/20 animate-pulse">local_fire_department</span>
                    <span className="absolute inset-0 flex items-center justify-center text-4xl font-black">12</span>
                </div>
                <p className="text-white/50 mt-2">Days Streak</p>
                <div className="mt-4 px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                    Top 10% of aspirants
                </div>
            </div>
        </GlassCard>
    </div>
  </div>
);

const DailyAffairsView = () => (
    <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Polity', 'Economy', 'Environment', 'Sci & Tech'].map((tag, i) => (
                <button key={i} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${i===0 ? 'bg-primary text-white' : 'bg-black/30 backdrop-blur-sm text-white/70 hover:bg-black/50'}`}>{tag}</button>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <GlassCard key={i} hoverEffect className="group">
                    <div className="h-40 -mx-6 -mt-6 mb-4 bg-gray-800 relative overflow-hidden">
                        <img src={`https://picsum.photos/400/200?random=${i}`} alt="News" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase rounded text-white">Economy</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">RBI maintains status quo on repo rate</h3>
                    <p className="text-sm text-white/60 line-clamp-2 mb-4">The Monetary Policy Committee decided to keep the policy repo rate unchanged at 6.50%.</p>
                    <div className="flex justify-between items-center text-xs text-white/40 border-t border-white/10 pt-3">
                        <span>4 mins read</span>
                        <span>2h ago</span>
                    </div>
                </GlassCard>
            ))}
        </div>
    </div>
);

const PracticeView = () => (
    <div className="space-y-6">
        <GlassCard className="border-l-4 border-l-primary">
            <h2 className="text-xl font-bold mb-4">Mock Test Generator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                    <label className="text-sm text-white/60">Subject</label>
                    <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-primary outline-none">
                        <option>Indian Polity</option>
                        <option>Modern History</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-white/60">Difficulty</label>
                    <div className="flex bg-black/20 rounded-xl p-1 border border-white/10">
                        <button className="flex-1 py-1.5 rounded-lg text-sm text-white/60 hover:text-white">Easy</button>
                        <button className="flex-1 py-1.5 rounded-lg bg-primary text-white text-sm shadow-md">Medium</button>
                        <button className="flex-1 py-1.5 rounded-lg text-white/60 hover:text-white">Hard</button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-white/60">Questions</label>
                    <input type="number" defaultValue={20} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-primary outline-none" />
                </div>
            </div>
            <Button fullWidth icon="bolt">Generate Test</Button>
        </GlassCard>
        
        <h3 className="text-lg font-bold drop-shadow-md">Recent Attempts</h3>
        <div className="space-y-3">
             {[1,2,3].map(i => (
                 <GlassCard key={i} className="py-4 flex items-center justify-between hover:bg-white/10 cursor-pointer">
                    <div>
                        <p className="font-semibold">Polity Sectional Test #{4-i}</p>
                        <p className="text-xs text-white/50">Today, 10:23 AM</p>
                    </div>
                    <Badge color={i===1 ? 'green' : 'red'}>{i===1 ? '142/200' : '85/200'}</Badge>
                 </GlassCard>
             ))}
        </div>
    </div>
);

const GradingView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="flex flex-col gap-6">
            <GlassCard className="flex-1 flex flex-col">
                 <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    <h3 className="font-bold">Submission</h3>
                 </div>
                 <textarea className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed" placeholder="Paste your answer here..."></textarea>
                 <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-white/40">0 words</span>
                    <Button icon="send">Grade Now</Button>
                 </div>
            </GlassCard>
        </div>
        <div className="flex flex-col gap-6">
             <GlassCard className="relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold">Evaluation Report</h3>
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Generated just now</p>
                    </div>
                    <div className="relative size-20 flex items-center justify-center">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                            <path className="text-primary drop-shadow-[0_0_8px_rgba(236,127,19,0.8)]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="65, 100" strokeLinecap="round" strokeWidth="3"></path>
                        </svg>
                        <span className="absolute text-xl font-bold">6.5</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <p className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Strong Introduction</p>
                        <p className="text-xs text-white/70">Definition of "Cooperative Federalism" is accurate and well-referenced.</p>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">error</span> Lack of Data</p>
                        <p className="text-xs text-white/70">Arguments on fiscal deficit are generic. Include statistics.</p>
                    </div>
                </div>
             </GlassCard>
        </div>
    </div>
);

const ToolsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { title: 'Flashcards', icon: 'style', desc: 'Auto-generate from notes.' },
            { title: 'OCR Pipeline', icon: 'document_scanner', desc: 'Digitize handwritten sheets.' },
            { title: 'Syllabus Tracker', icon: 'checklist', desc: 'Track topic completion.' },
            { title: 'Mind Maps', icon: 'hub', desc: 'Visual topic breakdown.' }
        ].map((tool, i) => (
            <GlassCard key={i} hoverEffect className="cursor-pointer group">
                 <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                 </div>
                 <h3 className="font-bold">{tool.title}</h3>
                 <p className="text-sm text-white/50">{tool.desc}</p>
            </GlassCard>
        ))}
    </div>
);

const AnalyticsView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="text-center">
                <p className="text-3xl font-bold text-white mb-1">Top 12%</p>
                <p className="text-xs text-white/50">AIR Prediction</p>
            </GlassCard>
            <GlassCard className="text-center">
                <p className="text-3xl font-bold text-white mb-1">342 Hrs</p>
                <p className="text-xs text-white/50">Total Study Time</p>
            </GlassCard>
            <GlassCard className="text-center">
                <p className="text-3xl font-bold text-white mb-1">112</p>
                <p className="text-xs text-white/50">Avg. Test Score</p>
            </GlassCard>
        </div>
        <GlassCard>
            <h3 className="text-lg font-bold mb-6">Score Trajectory</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                        { name: 'Jan', score: 65 },
                        { name: 'Feb', score: 72 },
                        { name: 'Mar', score: 68 },
                        { name: 'Apr', score: 85 },
                        { name: 'May', score: 90 },
                        { name: 'Jun', score: 110 },
                    ]}>
                        <XAxis dataKey="name" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                        <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                        <Line type="monotone" dataKey="score" stroke="#ec7f13" strokeWidth={3} dot={{r: 4, fill: '#ec7f13'}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    </div>
);

const ProfileView = () => (
    <div className="max-w-2xl mx-auto space-y-6">
        <GlassCard className="flex items-center gap-6">
            <div className="relative">
                <img src={user.avatarUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white/10" />
                <button className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-white hover:bg-primary-hover shadow-lg">
                    <span className="material-symbols-outlined text-sm">edit</span>
                </button>
            </div>
            <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-white/60">UPSC Aspirant • Target 2025</p>
                <div className="flex gap-2 mt-3">
                    <Badge color="green">Active</Badge>
                    <Badge color="primary">Premium</Badge>
                </div>
            </div>
        </GlassCard>
        <GlassCard>
            <h3 className="font-bold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-white/50">Email</label>
                    <input type="email" value="aarav.patel@example.com" readOnly className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-white/50">Phone</label>
                    <input type="text" value="+91 98765 43210" readOnly className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </GlassCard>
    </div>
);

export default App;