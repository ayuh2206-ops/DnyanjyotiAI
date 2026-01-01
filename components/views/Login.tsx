'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, Button, Input } from '../UI';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      // Parse Firebase error messages
      const errorCode = err.code;
      switch (errorCode) {
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/email-already-in-use':
          setError('Email already in use');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        default:
          setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative z-10 p-4 animate-fade-in">
      {/* Background decorative elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
      
      <GlassCard className="w-full max-w-md p-8 text-center space-y-6">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">DnyanGPT</h1>
            <p className="text-[#c9ad92] text-sm font-medium uppercase tracking-widest mt-1">UPSC Preparation Suite</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Auth Options */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 text-[#c9ad92] bg-[#2c2219]">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailAuth}>
            {isSignUp && (
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon="person"
                disabled={loading}
              />
            )}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="mail"
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="lock"
              disabled={loading}
            />
            <Button 
              fullWidth 
              type="submit" 
              loading={loading}
              className="py-3.5"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          
          <div className="flex items-center justify-between text-xs">
            {!isSignUp && (
              <a href="#" className="text-[#c9ad92] hover:text-primary transition-colors">Forgot password?</a>
            )}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary hover:text-primary/80 transition-colors font-medium ml-auto"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Create account'}
            </button>
          </div>
        </div>
        
        <p className="text-xs text-white/40">
          By continuing, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
        </p>

        {/* Features Preview */}
        <div className="pt-6 border-t border-white/10">
          <p className="text-xs text-[#c9ad92] mb-4">What you&apos;ll get:</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: 'quiz', label: 'AI Quizzes' },
              { icon: 'rate_review', label: 'Essay Grading' },
              { icon: 'analytics', label: 'Analytics' },
            ].map((feature) => (
              <div key={feature.label} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5">
                <span className="material-symbols-outlined text-primary text-xl">{feature.icon}</span>
                <span className="text-[10px] text-[#c9ad92] font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Login Hint */}
        <div className="text-[10px] text-white/20 pt-4">
          Admin access: vero.media.150@gmail.com
        </div>
      </GlassCard>
    </div>
  );
};
