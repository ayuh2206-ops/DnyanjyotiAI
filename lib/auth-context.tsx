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
import { auth, db, googleProvider, VERO_EMAIL } from './firebase';
import { UserRole, PaymentStatus, PlanType, checkFacultyAssignment, activateFacultyAssignment, createFaculty } from './db';

// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  plan: PlanType;
  tokens: number;
  streak: number;
  longestStreak: number;
  efficiency: number;
  targetExam: string;
  isAdmin: boolean;
  // Payment
  paymentStatus: PaymentStatus;
  paymentExpiry?: Date | null;
  lifetimeAccess: boolean;
  // Batch assignment
  batchId?: string | null;
  batchName?: string | null;
  facultyId?: string | null;
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
  createdAt: Date;
  lastLoginAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isVero: boolean;
  isFaculty: boolean;
  isStudent: boolean;
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

// Check if user is VERO admin
const isVeroAdmin = (email: string | null | undefined): boolean => {
  return email === VERO_EMAIL;
};

// Default profile for new users
const createDefaultProfile = (user: User): Omit<UserProfile, 'createdAt' | 'lastLoginAt'> => {
  const isVero = isVeroAdmin(user.email);
  
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'UPSC Aspirant',
    photoURL: user.photoURL,
    role: isVero ? 'vero' : 'student',
    plan: isVero ? 'Lifetime' : 'Free',
    tokens: isVero ? 999999 : 500,
    streak: 0,
    longestStreak: 0,
    efficiency: 0,
    targetExam: 'UPSC CSE 2025',
    isAdmin: isVero,
    paymentStatus: isVero ? 'lifetime' : 'none',
    paymentExpiry: null,
    lifetimeAccess: isVero,
    batchId: null,
    batchName: null,
    facultyId: null,
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
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Role helpers
  const isVero = userProfile?.role === 'vero' || isVeroAdmin(userProfile?.email);
  const isFaculty = userProfile?.role === 'faculty';
  const isStudent = userProfile?.role === 'student' || (!isVero && !isFaculty);

  // Fetch or create user profile from Firestore
  const fetchOrCreateUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const isVero = isVeroAdmin(firebaseUser.email);

      // Check if this email is pre-assigned as faculty
      let facultyAssignment = null;
      if (!isVero && firebaseUser.email) {
        facultyAssignment = await checkFacultyAssignment(firebaseUser.email);
      }

      if (userSnap.exists()) {
        // Existing user - update last login
        const data = userSnap.data();
        const currentRole = data.role;
        
        // Determine the role (priority: vero > faculty assignment > existing role)
        let newRole: UserRole = currentRole || 'student';
        if (isVero) {
          newRole = 'vero';
        } else if (facultyAssignment && !facultyAssignment.isActivated) {
          // This user has been assigned as faculty but hasn't activated yet
          newRole = 'faculty';
        }

        const updates: any = {
          lastLoginAt: serverTimestamp(),
          isAdmin: isVero,
        };

        // Auto-upgrade to vero role if email matches
        if (isVero) {
          updates.role = 'vero';
          updates.plan = 'Lifetime';
          updates.lifetimeAccess = true;
          updates.paymentStatus = 'lifetime';
        }
        
        // Auto-upgrade to faculty role if pre-assigned
        if (facultyAssignment && !facultyAssignment.isActivated && currentRole !== 'faculty') {
          updates.role = 'faculty';
          updates.plan = 'Lifetime';
          updates.lifetimeAccess = true;
          updates.paymentStatus = 'lifetime';
          updates.tokens = 999999;
          
          // Activate the faculty assignment
          await activateFacultyAssignment(facultyAssignment.id!, firebaseUser.uid);
          
          // Create faculty record
          await createFaculty({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || facultyAssignment.displayName || 'Faculty',
            photoURL: firebaseUser.photoURL,
            specialization: facultyAssignment.specialization || [],
            batchIds: [],
            totalStudents: 0,
            isActive: true,
            createdBy: facultyAssignment.assignedBy,
          });
        }

        await updateDoc(userRef, updates);
        
        return {
          ...data,
          uid: firebaseUser.uid,
          isAdmin: isVero || data.isAdmin,
          role: updates.role || newRole,
          plan: updates.plan || data.plan,
          lifetimeAccess: updates.lifetimeAccess ?? data.lifetimeAccess,
          paymentStatus: updates.paymentStatus || data.paymentStatus,
          tokens: updates.tokens ?? data.tokens,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: new Date(),
          paymentExpiry: data.paymentExpiry?.toDate() || null,
        } as UserProfile;
      } else {
        // New user - create profile
        let role: UserRole = 'student';
        let plan: PlanType = 'Free';
        let tokens = 500;
        let lifetimeAccess = false;
        let paymentStatus: PaymentStatus = 'none';

        if (isVero) {
          role = 'vero';
          plan = 'Lifetime';
          tokens = 999999;
          lifetimeAccess = true;
          paymentStatus = 'lifetime';
        } else if (facultyAssignment) {
          // New user with faculty pre-assignment
          role = 'faculty';
          plan = 'Lifetime';
          tokens = 999999;
          lifetimeAccess = true;
          paymentStatus = 'lifetime';
          
          // Activate the faculty assignment
          await activateFacultyAssignment(facultyAssignment.id!, firebaseUser.uid);
          
          // Create faculty record
          await createFaculty({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || facultyAssignment.displayName || 'Faculty',
            photoURL: firebaseUser.photoURL,
            specialization: facultyAssignment.specialization || [],
            batchIds: [],
            totalStudents: 0,
            isActive: true,
            createdBy: facultyAssignment.assignedBy,
          });
        }

        const newProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'UPSC Aspirant',
          photoURL: firebaseUser.photoURL,
          role,
          plan,
          tokens,
          streak: 0,
          longestStreak: 0,
          efficiency: 0,
          targetExam: 'UPSC CSE 2025',
          isAdmin: isVero,
          paymentStatus,
          paymentExpiry: null,
          lifetimeAccess,
          batchId: null,
          batchName: null,
          facultyId: null,
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
        };

        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
        
        return {
          ...newProfile,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      return null;
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
      const cleanData: Record<string, any> = { ...data };
      
      // Remove fields that shouldn't be directly updated
      delete cleanData.createdAt;
      delete cleanData.lastLoginAt;
      delete cleanData.uid;
      
      await updateDoc(userRef, cleanData);
      
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
          uid: user.uid,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
          paymentExpiry: data.paymentExpiry?.toDate() || null,
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
    
    // VERO and lifetime users have unlimited tokens
    if (isVero || userProfile.lifetimeAccess) {
      return true;
    }
    
    if (userProfile.tokens < amount) {
      return false;
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
      const subjectKey = subject.toLowerCase().replace(/\s+/g, '') as keyof typeof userProfile.subjects;
      const currentScore = userProfile.subjects[subjectKey] || 50;
      const newScore = Math.round((currentScore * 0.7) + (score * 0.3));
      
      await updateUserProfile({
        subjects: {
          ...userProfile.subjects,
          [subjectKey]: Math.min(100, Math.max(0, newScore)),
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
    isVero,
    isFaculty,
    isStudent,
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
