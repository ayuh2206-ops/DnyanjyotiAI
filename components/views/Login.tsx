'use client';

import React from 'react';
import { GlassCard, Button } from '../UI';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen relative z-10 p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-8 text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
             <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">AI Examiner</h1>
            <p className="text-white/50 text-sm font-medium uppercase tracking-widest mt-1">UPSC Preparation Suite</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={onLogin}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-lg shadow-white/5"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            <span>Continue with Google</span>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#141419] px-2 text-white/30">Or</span></div>
          </div>

          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
             <input type="email" placeholder="Email address" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-1 focus:ring-primary outline-none transition-all" />
             <input type="password" placeholder="Password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-1 focus:ring-primary outline-none transition-all" />
             <Button fullWidth>Sign In</Button>
          </form>
        </div>
        
        <p className="text-xs text-white/40">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </GlassCard>
    </div>
  );
};