export type View = 'home' | 'dashboard' | 'daily_affairs' | 'practice' | 'grading' | 'tools' | 'chat' | 'analytics' | 'profile';

export interface User {
  name: string;
  plan: 'Free' | 'Premium';
  tokens: number;
  streak: number;
  efficiency: number;
  avatarUrl: string;
}

export interface NavItem {
  id: View;
  label: string;
  icon: string;
}
