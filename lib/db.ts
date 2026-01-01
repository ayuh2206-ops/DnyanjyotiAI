// Firestore Database Service
// Handles all database operations for the application

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch,
  onSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface QuizResult {
  id?: string;
  userId: string;
  quizType: 'daily_5' | 'mock_test' | 'news_quiz' | 'pyq';
  subject: string;
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  createdAt: Date;
}

export interface GradingResult {
  id?: string;
  userId: string;
  questionType: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  question: string;
  answer: string;
  wordCount: number;
  score: number;
  feedback: {
    content: number;
    structure: number;
    accuracy: number;
    examples: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  modelAnswer?: string;
  tokensUsed: number;
  mode: 'standard' | 'deep_pro';
  createdAt: Date;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  subject?: string;
  tokensUsed?: number;
  createdAt: Date;
}

export interface ChatSession {
  id?: string;
  userId: string;
  subject: string;
  mode: 'socratic' | 'direct';
  messages: ChatMessage[];
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySession {
  id?: string;
  userId: string;
  subject: string;
  activity: 'quiz' | 'grading' | 'chat' | 'reading' | 'flashcards';
  duration: number; // in minutes
  date: Date;
}

export interface NewsArticle {
  id?: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  tags: string[];
  gsPaper: number;
  imageUrl?: string;
  originalUrl: string;
  publishedAt: Date;
  createdAt: Date;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  quizzesCompleted: number;
  essaysGraded: number;
  chatMessages: number;
  studyTime: number;
  tokensUsed: number;
}

// ============== QUIZ OPERATIONS ==============

export async function saveQuizResult(result: Omit<QuizResult, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'quiz_history'), {
      ...result,
      createdAt: serverTimestamp(),
    });
    
    // Update user stats
    await updateUserStats(result.userId, {
      testsCompleted: increment(1),
      [`subjects.${result.subject.toLowerCase()}`]: calculateNewSubjectScore(result.score, result.totalQuestions),
    });
    
    // Log activity
    await logDailyActivity(result.userId, 'quizzesCompleted');
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving quiz result:', error);
    throw error;
  }
}

export async function getQuizHistory(
  userId: string, 
  quizType?: string, 
  limitCount: number = 10
): Promise<QuizResult[]> {
  try {
    let q = query(
      collection(db, 'quiz_history'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (quizType) {
      q = query(
        collection(db, 'quiz_history'),
        where('userId', '==', userId),
        where('quizType', '==', quizType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as QuizResult[];
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return [];
  }
}

export async function getTodaysDailyQuiz(userId: string): Promise<QuizResult | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'quiz_history'),
      where('userId', '==', userId),
      where('quizType', '==', 'daily_5'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as QuizResult;
  } catch (error) {
    console.error('Error checking daily quiz:', error);
    return null;
  }
}

// ============== GRADING OPERATIONS ==============

export async function saveGradingResult(result: Omit<GradingResult, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'grading_history'), {
      ...result,
      createdAt: serverTimestamp(),
    });
    
    // Log activity
    await logDailyActivity(result.userId, 'essaysGraded');
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving grading result:', error);
    throw error;
  }
}

export async function getGradingHistory(
  userId: string, 
  limitCount: number = 10
): Promise<GradingResult[]> {
  try {
    const q = query(
      collection(db, 'grading_history'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as GradingResult[];
  } catch (error) {
    console.error('Error fetching grading history:', error);
    return [];
  }
}

// ============== CHAT OPERATIONS ==============

export async function createChatSession(
  userId: string, 
  subject: string, 
  mode: 'socratic' | 'direct'
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'chat_sessions'), {
      userId,
      subject,
      mode,
      messages: [],
      totalTokens: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

export async function addChatMessage(
  sessionId: string, 
  message: Omit<ChatMessage, 'id' | 'createdAt'>,
  userId: string
): Promise<void> {
  try {
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Chat session not found');
    }
    
    const messages = sessionSnap.data().messages || [];
    messages.push({
      ...message,
      createdAt: new Date().toISOString(),
    });
    
    await updateDoc(sessionRef, {
      messages,
      totalTokens: increment(message.tokensUsed || 0),
      updatedAt: serverTimestamp(),
    });
    
    // Log activity for user messages
    if (message.role === 'user') {
      await logDailyActivity(userId, 'chatMessages');
    }
  } catch (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }
}

export async function getChatSessions(
  userId: string, 
  limitCount: number = 20
): Promise<ChatSession[]> {
  try {
    const q = query(
      collection(db, 'chat_sessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ChatSession[];
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  try {
    const docRef = doc(db, 'chat_sessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as ChatSession;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return null;
  }
}

// ============== STUDY SESSION OPERATIONS ==============

export async function logStudySession(session: Omit<StudySession, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'study_sessions'), {
      ...session,
      date: Timestamp.fromDate(session.date),
    });
    
    // Update total study time
    await updateUserStats(session.userId, {
      totalStudyTime: increment(session.duration),
    });
    
    // Log daily activity
    await logDailyActivity(session.userId, 'studyTime', session.duration);
    
    return docRef.id;
  } catch (error) {
    console.error('Error logging study session:', error);
    throw error;
  }
}

// ============== ANALYTICS OPERATIONS ==============

export async function getDailyActivity(userId: string, date: string): Promise<DailyActivity | null> {
  try {
    const docRef = doc(db, 'daily_activity', `${userId}_${date}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as DailyActivity;
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    return null;
  }
}

export async function getWeeklyActivity(userId: string): Promise<DailyActivity[]> {
  try {
    const activities: DailyActivity[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = await getDailyActivity(userId, dateStr);
      activities.push(activity || {
        date: dateStr,
        quizzesCompleted: 0,
        essaysGraded: 0,
        chatMessages: 0,
        studyTime: 0,
        tokensUsed: 0,
      });
    }
    
    return activities;
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    return [];
  }
}

async function logDailyActivity(
  userId: string, 
  field: keyof Omit<DailyActivity, 'date'>,
  amount: number = 1
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'daily_activity', `${userId}_${today}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        [field]: increment(amount),
      });
    } else {
      await setDoc(docRef, {
        date: today,
        quizzesCompleted: field === 'quizzesCompleted' ? amount : 0,
        essaysGraded: field === 'essaysGraded' ? amount : 0,
        chatMessages: field === 'chatMessages' ? amount : 0,
        studyTime: field === 'studyTime' ? amount : 0,
        tokensUsed: field === 'tokensUsed' ? amount : 0,
      });
    }
  } catch (error) {
    console.error('Error logging daily activity:', error);
  }
}

// ============== USER STATS OPERATIONS ==============

async function updateUserStats(userId: string, updates: Record<string, any>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

function calculateNewSubjectScore(score: number, total: number): number {
  // Calculate percentage score
  const percentage = (score / total) * 100;
  // This will be used with running average in the context
  return Math.round(percentage);
}

// ============== RECENT ACTIVITY ==============

export interface RecentActivity {
  id: string;
  type: 'quiz' | 'grading' | 'chat';
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export async function getRecentActivity(userId: string, limitCount: number = 5): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];
    
    // Get recent quizzes
    const quizzes = await getQuizHistory(userId, undefined, 3);
    quizzes.forEach(quiz => {
      activities.push({
        id: quiz.id || '',
        type: 'quiz',
        title: `Completed ${quiz.quizType === 'daily_5' ? 'Daily 5' : 'Mock Test'} (${quiz.subject})`,
        subtitle: `Score: ${quiz.score}/${quiz.totalQuestions} • Accuracy: ${Math.round((quiz.score / quiz.totalQuestions) * 100)}%`,
        timestamp: quiz.createdAt,
        icon: 'check_circle',
        color: 'text-green-400',
      });
    });
    
    // Get recent gradings
    const gradings = await getGradingHistory(userId, 3);
    gradings.forEach(grading => {
      activities.push({
        id: grading.id || '',
        type: 'grading',
        title: `AI Evaluation: ${grading.questionType} Answer`,
        subtitle: `Score: ${grading.score}/10 • Feedback Received`,
        timestamp: grading.createdAt,
        icon: 'psychology',
        color: 'text-primary',
      });
    });
    
    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// ============== ADMIN OPERATIONS ==============

export async function getAllUsers(): Promise<DocumentData[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastLoginAt: doc.data().lastLoginAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function getSystemStats(): Promise<{
  totalUsers: number;
  activeToday: number;
  totalQuizzes: number;
  totalGradings: number;
  totalTokensUsed: number;
}> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const quizzesSnap = await getDocs(collection(db, 'quiz_history'));
    const gradingsSnap = await getDocs(collection(db, 'grading_history'));
    
    // Count active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let activeToday = 0;
    
    usersSnap.docs.forEach(doc => {
      const lastLogin = doc.data().lastLoginAt?.toDate();
      if (lastLogin && lastLogin >= today) {
        activeToday++;
      }
    });
    
    // Sum tokens used
    let totalTokensUsed = 0;
    usersSnap.docs.forEach(doc => {
      // Calculate used tokens (starting - current)
      const startingTokens = 500; // Default starting tokens
      const currentTokens = doc.data().tokens || 0;
      totalTokensUsed += Math.max(0, startingTokens - currentTokens);
    });
    
    return {
      totalUsers: usersSnap.size,
      activeToday,
      totalQuizzes: quizzesSnap.size,
      totalGradings: gradingsSnap.size,
      totalTokensUsed,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return {
      totalUsers: 0,
      activeToday: 0,
      totalQuizzes: 0,
      totalGradings: 0,
      totalTokensUsed: 0,
    };
  }
}

// ============== REALTIME SUBSCRIPTIONS ==============

export function subscribeToUserProfile(
  userId: string, 
  callback: (data: DocumentData | null) => void
): () => void {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        lastLoginAt: docSnap.data().lastLoginAt?.toDate() || new Date(),
      });
    } else {
      callback(null);
    }
  });
}

export default {
  // Quiz
  saveQuizResult,
  getQuizHistory,
  getTodaysDailyQuiz,
  // Grading
  saveGradingResult,
  getGradingHistory,
  // Chat
  createChatSession,
  addChatMessage,
  getChatSessions,
  getChatSession,
  // Study
  logStudySession,
  // Analytics
  getDailyActivity,
  getWeeklyActivity,
  getRecentActivity,
  // Admin
  getAllUsers,
  getSystemStats,
  // Realtime
  subscribeToUserProfile,
};
