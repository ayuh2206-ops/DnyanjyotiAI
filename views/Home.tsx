import React, { useRef, useState } from 'react';
import { GlassCard, Badge } from '../components/UI';
import { View } from '../types';

interface HomeProps {
  onNavigate: (view: View) => void;
  user: { name: string; streak: number; efficiency: number };
  onWallpaperChange: (url: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, user, onWallpaperChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onWallpaperChange(url);
    }
  };

  const handleUrlSubmit = () => {
      if(urlInput.trim()) {
          onWallpaperChange(urlInput.trim());
          setShowUrlInput(false);
          setUrlInput('');
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge>UPSC CSE 2025</Badge>
            <Badge color="green">Prelims: 124 Days</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <p className="text-white/80 text-lg font-light mr-2 drop-shadow-md">
              Your AI learning hub is ready.
            </p>
            
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full p-1 border border-white/10">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-white/10 text-xs font-bold text-white transition-all"
                    title="Upload Image"
                >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload
                </button>
                <div className="w-px h-4 bg-white/20"></div>
                <button 
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${showUrlInput ? 'bg-primary text-white' : 'hover:bg-white/10 text-white'}`}
                    title="Paste Link"
                >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    Link
                </button>
            </div>

            {showUrlInput && (
                <div className="flex items-center gap-2 animate-fade-in">
                    <input 
                        type="text" 
                        placeholder="Paste image URL..." 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-primary w-48 backdrop-blur-md"
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    />
                    <button 
                        onClick={handleUrlSubmit}
                        className="p-1.5 bg-primary rounded-lg text-white hover:bg-primary-hover transition-colors shadow-lg"
                    >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-white/70 uppercase tracking-widest font-semibold drop-shadow-sm">Study Streak</p>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-bold text-white drop-shadow-md">{user.streak}</span>
              <span className="material-symbols-outlined text-primary text-[20px] icon-filled drop-shadow-md">local_fire_department</span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="text-right">
            <p className="text-xs text-white/70 uppercase tracking-widest font-semibold drop-shadow-sm">Efficiency</p>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-bold text-white drop-shadow-md">{user.efficiency}%</span>
              <span className="material-symbols-outlined text-green-400 text-[20px] drop-shadow-md">trending_up</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', desc: 'View overall progress and tasks.', color: 'primary' },
          { id: 'daily_affairs', title: 'Daily Affairs', icon: 'newspaper', desc: 'Curated news from The Hindu.', color: 'blue' },
          { id: 'practice', title: 'Practice Tests', icon: 'quiz', desc: 'Chapter-wise & Full-length mocks.', color: 'purple' },
          { id: 'grading', title: 'AI Grading', icon: 'history_edu', desc: 'Instant Mains answer evaluation.', color: 'green' },
          { id: 'tools', title: 'Study Tools', icon: 'library_books', desc: 'Flashcards, OCR & more.', color: 'yellow' },
          { id: 'chat', title: 'UPSC-GPT', icon: 'forum', desc: 'Socratic AI Mentor 24/7.', color: 'teal' },
          { id: 'analytics', title: 'Performance', icon: 'monitoring', desc: 'Deep dive analytics.', color: 'red' },
          { id: 'profile', title: 'Profile', icon: 'settings', desc: 'Manage account & settings.', color: 'gray' },
        ].map((item) => (
          <GlassCard 
            key={item.id} 
            onClick={() => onNavigate(item.id as View)}
            hoverEffect={true}
            className="h-56 flex flex-col justify-between group"
          >
            <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full blur-3xl transition-all opacity-20 group-hover:opacity-40 bg-${item.color === 'primary' ? 'orange' : item.color}-500`}></div>
            <div className="flex justify-between items-start z-10">
              <div className={`size-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center transition-all shadow-lg group-hover:bg-${item.color === 'primary' ? 'orange' : item.color}-500 group-hover:border-white/20 backdrop-blur-md`}>
                <span className="material-symbols-outlined text-2xl text-white">{item.icon}</span>
              </div>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white/80 transition-colors">arrow_outward</span>
            </div>
            <div className="z-10">
              <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{item.title}</h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium drop-shadow-sm">{item.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <GlassCard>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    Recent Activity
                    </h3>
                    <button className="text-xs text-white/70 hover:text-white transition-colors">View All</button>
                </div>
                <div className="space-y-4">
                    {[
                        { title: 'Completed Mock Test #3 (Polity)', sub: 'Score: 112/200 • Accuracy: 78%', time: '2h ago', icon: 'check_circle', color: 'text-green-400', bg: 'bg-green-500/20' },
                        { title: 'Read: "India-US Relations Analysis"', sub: 'Daily Affairs • 5 mins read', time: '5h ago', icon: 'article', color: 'text-blue-400', bg: 'bg-blue-500/20' },
                        { title: 'AI Evaluation: Mains Answer', sub: 'GS Paper 2 • Feedback Received', time: 'Yesterday', icon: 'psychology', color: 'text-primary', bg: 'bg-primary/20' }
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 rounded-lg ${activity.bg} flex items-center justify-center ${activity.color}`}>
                                    <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white drop-shadow-sm">{activity.title}</p>
                                    <p className="text-xs text-white/60">{activity.sub}</p>
                                </div>
                            </div>
                            <span className="text-xs text-white/50 font-mono">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
        <GlassCard className="flex flex-col justify-center bg-gradient-to-br from-primary/10 to-transparent">
             <span className="material-symbols-outlined absolute top-4 right-4 text-white/10 text-[80px] rotate-12">format_quote</span>
             <div className="relative z-10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 drop-shadow-sm">Daily Inspiration</p>
                <blockquote className="text-xl font-serif text-white/90 italic mb-4 leading-relaxed drop-shadow-md">
                    "Arise, awake, and stop not till the goal is reached."
                </blockquote>
                <p className="text-sm font-bold text-white drop-shadow-md">— Swami Vivekananda</p>
             </div>
        </GlassCard>
      </div>
    </div>
  );
};