'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { auth, db, googleProvider, isAdmin } from './firebase';

// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  plan: 'Free' | 'Premium';
  tokens: number;
  streak: number;
  longestStreak: number;
  efficiency: number;
  targetExam: string;
  createdAt: Date;
  lastLoginAt: Date;
  isAdmin: boolean;
  // Stats
  testsCompleted: number;
  totalStudyTime: number;
  averageScore: number;
  // Subjects
  subjects: {
    polity: number;
    history: number;
    geography: number;
    economy: number;
    environment: number;
    science: number;
    currentAffairs: number;
    ethics: number;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateStreak: () => Promise<void>;
  deductTokens: (amount: number) => Promise<boolean>;
  addTokens: (amount: number) => Promise<void>;
  updateSubjectScore: (subject: string, score: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default profile for new users
const createDefaultProfile = (user: User): Omit<UserProfile, 'createdAt' | 'lastLoginAt'> => ({
  uid: user.uid,
  email: user.email || '',
  displayName: user.displayName || 'UPSC Aspirant',
  photoURL: user.photoURL,
  plan: 'Free',
  tokens: 500, // Starting tokens
  streak: 0,
  longestStreak: 0,
  efficiency: 0,
  targetExam: 'UPSC CSE 2025',
  isAdmin: isAdmin(user.email),
  testsCompleted: 0,
  totalStudyTime: 0,
  averageScore: 0,
  subjects: {
    polity: 50,
    history: 50,
    geography: 50,
    economy: 50,
    environment: 50,
    science: 50,
    currentAffairs: 50,
    ethics: 50,
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile from Firestore
  const fetchOrCreateUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Update last login
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          // Update admin status in case it changed
          isAdmin: isAdmin(firebaseUser.email),
        });
        
        const data = userSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: new Date(),
        } as UserProfile;
      } else {
        // Create new profile
        const defaultProfile = createDefaultProfile(firebaseUser);
        await setDoc(userRef, {
          ...defaultProfile,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
        
        // Also create initial collections for the user
        await initializeUserCollections(firebaseUser.uid);
        
        return {
          ...defaultProfile,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      return null;
    }
  };

  // Initialize user collections (quiz_history, grading_history, etc.)
  const initializeUserCollections = async (uid: string) => {
    try {
      // Create analytics document
      await setDoc(doc(db, 'analytics', uid), {
        uid,
        dailyQuizzes: [],
        weeklyProgress: [],
        monthlyProgress: [],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error initializing user collections:', error);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profile = await fetchOrCreateUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create profile with custom name
      const userRef = doc(db, 'users', result.user.uid);
      const defaultProfile = createDefaultProfile(result.user);
      defaultProfile.displayName = name;
      
      await setDoc(userRef, {
        ...defaultProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      
      await initializeUserCollections(result.user.uid);
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
      
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        } as UserProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Update streak
  const updateStreak = async () => {
    if (!user || !userProfile) return;
    
    try {
      const newStreak = userProfile.streak + 1;
      const newLongestStreak = Math.max(newStreak, userProfile.longestStreak);
      
      await updateUserProfile({
        streak: newStreak,
        longestStreak: newLongestStreak,
      });
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Deduct tokens
  const deductTokens = async (amount: number): Promise<boolean> => {
    if (!user || !userProfile) return false;
    
    if (userProfile.tokens < amount) {
      return false; // Not enough tokens
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tokens: increment(-amount),
      });
      
      setUserProfile(prev => prev ? { ...prev, tokens: prev.tokens - amount } : null);
      return true;
    } catch (error) {
      console.error('Error deducting tokens:', error);
      return false;
    }
  };

  // Add tokens
  const addTokens = async (amount: number) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tokens: increment(amount),
      });
      
      setUserProfile(prev => prev ? { ...prev, tokens: prev.tokens + amount } : null);
    } catch (error) {
      console.error('Error adding tokens:', error);
    }
  };

  // Update subject score
  const updateSubjectScore = async (subject: string, score: number) => {
    if (!user || !userProfile) return;
    
    try {
      const currentScore = userProfile.subjects[subject as keyof typeof userProfile.subjects] || 50;
      // Running average
      const newScore = Math.round((currentScore * 0.7) + (score * 0.3));
      
      await updateUserProfile({
        subjects: {
          ...userProfile.subjects,
          [subject]: Math.min(100, Math.max(0, newScore)),
        },
      });
    } catch (error) {
      console.error('Error updating subject score:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
    refreshUserProfile,
    updateStreak,
    deductTokens,
    addTokens,
    updateSubjectScore,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
