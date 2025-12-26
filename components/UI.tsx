'use client';

import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${hoverEffect ? 'hover:-translate-y-1 hover:border-primary/30 hover:bg-white/5 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, fullWidth, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-[0_0_20px_rgba(236,127,19,0.3)] hover:shadow-[0_0_25px_rgba(236,127,19,0.5)] border border-white/10",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm",
    ghost: "text-white/60 hover:text-white hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: ReactNode; color?: 'green' | 'blue' | 'primary' | 'red' }> = ({ children, color = 'primary' }) => {
  const colors = {
    primary: "bg-primary/20 text-primary border-primary/30",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold border ${colors[color]} backdrop-blur-md`}>
      {children}
    </span>
  );
};