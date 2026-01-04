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

// ============== TYPES ==============

export type UserRole = 'student' | 'faculty' | 'vero';
export type PaymentStatus = 'active' | 'expired' | 'lifetime' | 'trial' | 'none';
export type PlanType = 'Free' | 'Premium' | 'Lifetime';

export interface UserProfile {
  id?: string;
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

export interface Faculty {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phone?: string;
  specialization: string[];
  batchIds: string[];
  totalStudents: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface Batch {
  id?: string;
  name: string;
  description?: string;
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  studentCount: number;
  targetExam: string;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  maxStudents: number;
  createdAt: Date;
  createdBy: string;
}

export interface Payment {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  plan: PlanType;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  validFrom: Date;
  validUntil?: Date | null;
  isLifetime: boolean;
  notes?: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface AdminLog {
  id?: string;
  action: string;
  targetUserId?: string;
  targetUserIds?: string[];
  details?: string;
  performedBy: string;
  performedByEmail: string;
  createdAt: Date;
}

export interface QuizResult {
  id?: string;
  userId: string;
  quizType: 'daily_5' | 'mock_test' | 'news_quiz' | 'pyq';
  subject: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
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
  duration: number;
  date: Date;
}

export interface DailyActivity {
  date: string;
  quizzesCompleted: number;
  essaysGraded: number;
  chatMessages: number;
  studyTime: number;
  tokensUsed: number;
}

export interface RecentActivity {
  id: string;
  type: 'quiz' | 'grading' | 'chat';
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export interface StudentProgress {
  quizzes: QuizResult[];
  gradings: GradingResult[];
  weeklyActivity: DailyActivity[];
  totalStudyTime: number;
  averageQuizScore: number;
  averageGradingScore: number;
  subjectScores: Record<string, number>;
}

// ============== NEW TYPES FOR COMPLETE FEATURES ==============

// Faculty Email Pre-Assignment (VERO assigns faculty by email)
export interface FacultyAssignment {
  id?: string;
  email: string;
  displayName?: string;
  specialization: string[];
  assignedBy: string;
  assignedByEmail: string;
  isActivated: boolean;
  activatedAt?: Date | null;
  createdAt: Date;
}

// News Articles for Daily Affairs
export interface NewsArticle {
  id?: string;
  title: string;
  content: string;
  summary60Words?: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags: string[];
  gsPaper?: string[];
  readingTime: number;
  isPublished: boolean;
  publishedAt?: Date | null;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Editorial Briefs (60-word summaries)
export interface EditorialBrief {
  id?: string;
  articleId?: string;
  title: string;
  brief: string;
  keyTerms: string[];
  upscRelevance: string;
  gsPaper: string;
  relatedTopics: string[];
  createdBy: string;
  createdAt: Date;
}

// Previous Year Questions
export interface PYQQuestion {
  id?: string;
  year: number;
  paper: 'Prelims' | 'Mains-GS1' | 'Mains-GS2' | 'Mains-GS3' | 'Mains-GS4' | 'Essay';
  questionNumber: number;
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks?: number;
  createdBy: string;
  createdAt: Date;
}

// Syllabus Tracking
export interface SyllabusItem {
  id?: string;
  subject: string;
  topic: string;
  subtopics: string[];
  paper: string;
  order: number;
}

export interface SyllabusProgress {
  id?: string;
  userId: string;
  syllabusItemId: string;
  subject: string;
  topic: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'revision';
  completedAt?: Date | null;
  lastRevisedAt?: Date | null;
  notes?: string;
  updatedAt: Date;
}

// Flashcards
export interface Flashcard {
  id?: string;
  userId: string;
  front: string;
  back: string;
  topic: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  nextReviewDate: Date;
  repetitions: number;
  easeFactor: number;
  interval: number;
  createdAt: Date;
}

export interface FlashcardDeck {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  subject: string;
  cardCount: number;
  createdAt: Date;
}

// Mind Maps
export interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

export interface MindMap {
  id?: string;
  userId: string;
  topic: string;
  subject: string;
  data: MindMapNode;
  createdAt: Date;
}

// Gamification Badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: 'streak' | 'tests' | 'score' | 'study_time' | 'special';
    value: number;
  };
  earnedAt?: Date;
}

export interface UserBadge {
  id?: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

// All available badges
export const AVAILABLE_BADGES: Badge[] = [
  // Streak Badges
  { id: 'fire_starter', name: 'Fire Starter', description: '7-day study streak', icon: '🔥', color: 'orange', requirement: { type: 'streak', value: 7 } },
  { id: 'consistent', name: 'Consistent', description: '30-day study streak', icon: '⚡', color: 'yellow', requirement: { type: 'streak', value: 30 } },
  { id: 'diamond', name: 'Diamond', description: '90-day study streak', icon: '💎', color: 'blue', requirement: { type: 'streak', value: 90 } },
  { id: 'legend', name: 'Legend', description: '180-day study streak', icon: '🏆', color: 'gold', requirement: { type: 'streak', value: 180 } },
  
  // Test Completion Badges
  { id: 'first_test', name: 'First Steps', description: 'Complete your first test', icon: '🎯', color: 'green', requirement: { type: 'tests', value: 1 } },
  { id: 'dedicated', name: 'Dedicated', description: 'Complete 25 tests', icon: '📚', color: 'purple', requirement: { type: 'tests', value: 25 } },
  { id: 'master', name: 'Test Master', description: 'Complete 100 tests', icon: '🎓', color: 'indigo', requirement: { type: 'tests', value: 100 } },
  
  // Score Badges
  { id: 'sharp_mind', name: 'Sharp Mind', description: 'Score 90% in any test', icon: '🧠', color: 'pink', requirement: { type: 'score', value: 90 } },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Score 100% in any test', icon: '✨', color: 'rainbow', requirement: { type: 'score', value: 100 } },
  
  // Study Time Badges
  { id: 'night_owl', name: 'Night Owl', description: '50 hours of study time', icon: '🦉', color: 'gray', requirement: { type: 'study_time', value: 50 } },
  { id: 'marathon', name: 'Marathon', description: '200 hours of study time', icon: '🏃', color: 'teal', requirement: { type: 'study_time', value: 200 } },
];

// ============== USER OPERATIONS ==============

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        paymentExpiry: data.paymentExpiry?.toDate() || null,
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return null;
    
    const data = userSnap.data();
    return {
      id: userSnap.id,
      uid: userSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      paymentExpiry: data.paymentExpiry?.toDate() || null,
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const cleanUpdates: Record<string, any> = { ...updates };
    
    // Convert Date objects to Timestamps
    if (updates.paymentExpiry) {
      cleanUpdates.paymentExpiry = Timestamp.fromDate(updates.paymentExpiry);
    }
    
    await updateDoc(userRef, cleanUpdates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// ============== QUIZ OPERATIONS ==============

export async function saveQuizResult(result: Omit<QuizResult, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'quiz_history'), {
      ...result,
      createdAt: serverTimestamp(),
    });
    
    await updateUserStats(result.userId, {
      testsCompleted: increment(1),
    });
    
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
    
    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
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
    
    await updateUserStats(session.userId, {
      totalStudyTime: increment(session.duration),
    });
    
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

async function updateUserStats(userId: string, updates: Record<string, any>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// ============== RECENT ACTIVITY ==============

export async function getRecentActivity(userId: string, limitCount: number = 5): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];
    
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
    
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// ============== FACULTY OPERATIONS ==============

export async function createFaculty(facultyData: Omit<Faculty, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'faculties'), {
      ...facultyData,
      createdAt: serverTimestamp(),
    });
    
    // Update user role to faculty
    await updateDoc(doc(db, 'users', facultyData.uid), {
      role: 'faculty',
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating faculty:', error);
    throw error;
  }
}

export async function getFaculty(uid: string): Promise<Faculty | null> {
  try {
    const q = query(collection(db, 'faculties'), where('uid', '==', uid), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    } as Faculty;
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return null;
  }
}

export async function getAllFaculties(): Promise<Faculty[]> {
  try {
    const q = query(collection(db, 'faculties'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Faculty[];
  } catch (error) {
    console.error('Error fetching all faculties:', error);
    return [];
  }
}

export async function updateFaculty(id: string, updates: Partial<Faculty>): Promise<void> {
  try {
    const facultyRef = doc(db, 'faculties', id);
    await updateDoc(facultyRef, updates);
  } catch (error) {
    console.error('Error updating faculty:', error);
    throw error;
  }
}

export async function deleteFaculty(id: string, uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'faculties', id));
    // Revert user role to student
    await updateDoc(doc(db, 'users', uid), {
      role: 'student',
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    throw error;
  }
}

// ============== BATCH OPERATIONS ==============

export async function createBatch(batchData: Omit<Batch, 'id' | 'createdAt' | 'studentCount'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'batches'), {
      ...batchData,
      studentCount: 0,
      startDate: Timestamp.fromDate(batchData.startDate),
      endDate: batchData.endDate ? Timestamp.fromDate(batchData.endDate) : null,
      createdAt: serverTimestamp(),
    });
    
    // Add batch to faculty's batchIds
    const facultyQuery = query(collection(db, 'faculties'), where('uid', '==', batchData.facultyId), limit(1));
    const facultySnap = await getDocs(facultyQuery);
    
    if (!facultySnap.empty) {
      const facultyDoc = facultySnap.docs[0];
      const currentBatches = facultyDoc.data().batchIds || [];
      await updateDoc(doc(db, 'faculties', facultyDoc.id), {
        batchIds: [...currentBatches, docRef.id],
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating batch:', error);
    throw error;
  }
}

export async function getBatch(id: string): Promise<Batch | null> {
  try {
    const docRef = doc(db, 'batches', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Batch;
  } catch (error) {
    console.error('Error fetching batch:', error);
    return null;
  }
}

export async function getBatchesByFaculty(facultyUid: string): Promise<Batch[]> {
  try {
    const q = query(
      collection(db, 'batches'),
      where('facultyId', '==', facultyUid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Batch;
    });
  } catch (error) {
    console.error('Error fetching batches by faculty:', error);
    return [];
  }
}

export async function getAllBatches(): Promise<Batch[]> {
  try {
    const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Batch;
    });
  } catch (error) {
    console.error('Error fetching all batches:', error);
    return [];
  }
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<void> {
  try {
    const batchRef = doc(db, 'batches', id);
    const cleanUpdates: Record<string, any> = { ...updates };
    
    if (updates.startDate) {
      cleanUpdates.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      cleanUpdates.endDate = Timestamp.fromDate(updates.endDate);
    }
    
    await updateDoc(batchRef, cleanUpdates);
  } catch (error) {
    console.error('Error updating batch:', error);
    throw error;
  }
}

export async function deleteBatch(id: string): Promise<void> {
  try {
    // Remove batch from all students
    const studentsQuery = query(collection(db, 'users'), where('batchId', '==', id));
    const studentsSnap = await getDocs(studentsQuery);
    
    const batch = writeBatch(db);
    studentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, { batchId: null, batchName: null });
    });
    await batch.commit();
    
    // Delete the batch
    await deleteDoc(doc(db, 'batches', id));
  } catch (error) {
    console.error('Error deleting batch:', error);
    throw error;
  }
}

export async function addStudentToBatch(batchId: string, studentId: string): Promise<void> {
  try {
    const batchRef = doc(db, 'batches', batchId);
    const batchSnap = await getDoc(batchRef);
    
    if (!batchSnap.exists()) throw new Error('Batch not found');
    
    const batchData = batchSnap.data();
    
    // Update batch student count
    await updateDoc(batchRef, {
      studentCount: increment(1),
    });
    
    // Update student's batch assignment
    await updateDoc(doc(db, 'users', studentId), {
      batchId: batchId,
      batchName: batchData.name,
      facultyId: batchData.facultyId,
    });
  } catch (error) {
    console.error('Error adding student to batch:', error);
    throw error;
  }
}

export async function removeStudentFromBatch(batchId: string, studentId: string): Promise<void> {
  try {
    const batchRef = doc(db, 'batches', batchId);
    
    // Update batch student count
    await updateDoc(batchRef, {
      studentCount: increment(-1),
    });
    
    // Remove batch from student
    await updateDoc(doc(db, 'users', studentId), {
      batchId: null,
      batchName: null,
      facultyId: null,
    });
  } catch (error) {
    console.error('Error removing student from batch:', error);
    throw error;
  }
}

export async function getStudentsByBatch(batchId: string): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('batchId', '==', batchId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        paymentExpiry: data.paymentExpiry?.toDate() || null,
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching students by batch:', error);
    return [];
  }
}

// ============== STUDENT PROGRESS (FOR FACULTY) ==============

export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  try {
    const [quizzes, gradings, weeklyActivity] = await Promise.all([
      getQuizHistory(studentId, undefined, 50),
      getGradingHistory(studentId, 50),
      getWeeklyActivity(studentId),
    ]);
    
    const totalStudyTime = weeklyActivity.reduce((sum, day) => sum + day.studyTime, 0);
    
    const averageQuizScore = quizzes.length > 0 
      ? Math.round(quizzes.reduce((sum, q) => sum + (q.score / q.totalQuestions) * 100, 0) / quizzes.length)
      : 0;
    
    const averageGradingScore = gradings.length > 0
      ? Math.round(gradings.reduce((sum, g) => sum + g.score, 0) / gradings.length * 10)
      : 0;
    
    // Calculate subject scores from quizzes
    const subjectScores: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};
    
    quizzes.forEach(quiz => {
      const subject = quiz.subject.toLowerCase();
      const score = (quiz.score / quiz.totalQuestions) * 100;
      
      if (!subjectScores[subject]) {
        subjectScores[subject] = 0;
        subjectCounts[subject] = 0;
      }
      subjectScores[subject] += score;
      subjectCounts[subject]++;
    });
    
    Object.keys(subjectScores).forEach(subject => {
      subjectScores[subject] = Math.round(subjectScores[subject] / subjectCounts[subject]);
    });
    
    return {
      quizzes,
      gradings,
      weeklyActivity,
      totalStudyTime,
      averageQuizScore,
      averageGradingScore,
      subjectScores,
    };
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return {
      quizzes: [],
      gradings: [],
      weeklyActivity: [],
      totalStudyTime: 0,
      averageQuizScore: 0,
      averageGradingScore: 0,
      subjectScores: {},
    };
  }
}

// ============== PAYMENT OPERATIONS ==============

export async function createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      validFrom: Timestamp.fromDate(paymentData.validFrom),
      validUntil: paymentData.validUntil ? Timestamp.fromDate(paymentData.validUntil) : null,
      createdAt: serverTimestamp(),
    });
    
    // Update user payment status
    const userUpdates: Partial<UserProfile> = {
      plan: paymentData.plan,
      paymentStatus: paymentData.isLifetime ? 'lifetime' : 'active',
      lifetimeAccess: paymentData.isLifetime,
    };
    
    if (paymentData.validUntil) {
      userUpdates.paymentExpiry = paymentData.validUntil;
    }
    
    await updateUser(paymentData.userId, userUpdates);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

export async function getAllPayments(): Promise<Payment[]> {
  try {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || null,
      } as Payment;
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    return [];
  }
}

export async function getPaymentsByUser(userId: string): Promise<Payment[]> {
  try {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || null,
      } as Payment;
    });
  } catch (error) {
    console.error('Error fetching payments by user:', error);
    return [];
  }
}

// ============== VERO ADMIN OPERATIONS ==============

export async function getSystemStats(): Promise<{
  totalUsers: number;
  activeToday: number;
  totalStudents: number;
  totalFaculties: number;
  totalBatches: number;
  totalQuizzes: number;
  totalGradings: number;
  activeSubscriptions: number;
  lifetimeUsers: number;
  expiredUsers: number;
  freeUsers: number;
  totalRevenue: number;
}> {
  try {
    const [usersSnap, quizzesSnap, gradingsSnap, facultiesSnap, batchesSnap, paymentsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'quiz_history')),
      getDocs(collection(db, 'grading_history')),
      getDocs(collection(db, 'faculties')),
      getDocs(collection(db, 'batches')),
      getDocs(collection(db, 'payments')),
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let activeToday = 0;
    let totalStudents = 0;
    let activeSubscriptions = 0;
    let lifetimeUsers = 0;
    let expiredUsers = 0;
    let freeUsers = 0;
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      const lastLogin = data.lastLoginAt?.toDate();
      if (lastLogin && lastLogin >= today) activeToday++;
      if (data.role === 'student' || !data.role) totalStudents++;
      if (data.paymentStatus === 'active') activeSubscriptions++;
      if (data.lifetimeAccess || data.paymentStatus === 'lifetime') lifetimeUsers++;
      if (data.paymentStatus === 'expired') expiredUsers++;
      if (data.plan === 'Free' || !data.plan) freeUsers++;
    });
    
    let totalRevenue = 0;
    paymentsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed') {
        totalRevenue += data.amount || 0;
      }
    });
    
    return {
      totalUsers: usersSnap.size,
      activeToday,
      totalStudents,
      totalFaculties: facultiesSnap.size,
      totalBatches: batchesSnap.size,
      totalQuizzes: quizzesSnap.size,
      totalGradings: gradingsSnap.size,
      activeSubscriptions,
      lifetimeUsers,
      expiredUsers,
      freeUsers,
      totalRevenue,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return {
      totalUsers: 0,
      activeToday: 0,
      totalStudents: 0,
      totalFaculties: 0,
      totalBatches: 0,
      totalQuizzes: 0,
      totalGradings: 0,
      activeSubscriptions: 0,
      lifetimeUsers: 0,
      expiredUsers: 0,
      freeUsers: 0,
      totalRevenue: 0,
    };
  }
}

export async function grantLifetimeAccess(userId: string, grantedBy: string, grantedByEmail: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      plan: 'Lifetime',
      paymentStatus: 'lifetime',
      lifetimeAccess: true,
    });
    
    await logAdminAction('grant_lifetime_access', grantedBy, grantedByEmail, userId);
  } catch (error) {
    console.error('Error granting lifetime access:', error);
    throw error;
  }
}

export async function revokeAccess(userId: string, revokedBy: string, revokedByEmail: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      plan: 'Free',
      paymentStatus: 'none',
      lifetimeAccess: false,
      paymentExpiry: null,
    });
    
    await logAdminAction('revoke_access', revokedBy, revokedByEmail, userId);
  } catch (error) {
    console.error('Error revoking access:', error);
    throw error;
  }
}

export async function bulkUpdatePaymentStatus(
  userIds: string[], 
  status: PaymentStatus,
  plan: PlanType,
  updatedBy: string,
  updatedByEmail: string
): Promise<void> {
  try {
    const batchOp = writeBatch(db);
    
    userIds.forEach(userId => {
      const userRef = doc(db, 'users', userId);
      const updates: Record<string, any> = { 
        paymentStatus: status,
        plan: plan,
      };
      
      if (status === 'lifetime') {
        updates.lifetimeAccess = true;
      } else if (status === 'none' || status === 'expired') {
        updates.lifetimeAccess = false;
      }
      
      batchOp.update(userRef, updates);
    });
    
    await batchOp.commit();
    
    await logAdminAction(
      'bulk_update_payment_status', 
      updatedBy, 
      updatedByEmail, 
      undefined,
      userIds,
      `Changed ${userIds.length} users to ${plan} (${status})`
    );
  } catch (error) {
    console.error('Error bulk updating payment status:', error);
    throw error;
  }
}

export async function setUserRole(userId: string, role: UserRole, setBy: string, setByEmail: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
    
    await logAdminAction('set_user_role', setBy, setByEmail, userId, undefined, `Changed role to ${role}`);
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}

export async function addTokensToUser(userId: string, amount: number, addedBy: string, addedByEmail: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      tokens: increment(amount),
    });
    
    await logAdminAction('add_tokens', addedBy, addedByEmail, userId, undefined, `Added ${amount} tokens`);
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
}

async function logAdminAction(
  action: string, 
  performedBy: string, 
  performedByEmail: string,
  targetUserId?: string,
  targetUserIds?: string[],
  details?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'admin_logs'), {
      action,
      performedBy,
      performedByEmail,
      targetUserId,
      targetUserIds,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function getAdminLogs(limitCount: number = 50): Promise<AdminLog[]> {
  try {
    const q = query(collection(db, 'admin_logs'), orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AdminLog[];
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
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

// ============== FACULTY EMAIL ASSIGNMENT ==============

// Check if email is pre-assigned as faculty
export async function checkFacultyAssignment(email: string): Promise<FacultyAssignment | null> {
  try {
    const q = query(
      collection(db, 'facultyAssignments'),
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docData = snapshot.docs[0];
    const data = docData.data();
    return {
      id: docData.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      activatedAt: data.activatedAt?.toDate() || null,
    } as FacultyAssignment;
  } catch (error) {
    console.error('Error checking faculty assignment:', error);
    return null;
  }
}

// Assign faculty by email (VERO only)
export async function assignFacultyByEmail(
  email: string,
  displayName: string,
  specialization: string[],
  assignedBy: string,
  assignedByEmail: string
): Promise<string> {
  try {
    // Check if already assigned
    const existing = await checkFacultyAssignment(email);
    if (existing) {
      throw new Error('This email is already assigned as faculty');
    }

    const docRef = await addDoc(collection(db, 'facultyAssignments'), {
      email: email.toLowerCase(),
      displayName,
      specialization,
      assignedBy,
      assignedByEmail,
      isActivated: false,
      activatedAt: null,
      createdAt: serverTimestamp(),
    });

    // Log admin action
    await addDoc(collection(db, 'adminLogs'), {
      action: 'ASSIGN_FACULTY_EMAIL',
      targetUserId: email,
      details: `Assigned ${email} as faculty with specializations: ${specialization.join(', ')}`,
      performedBy: assignedBy,
      performedByEmail: assignedByEmail,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error assigning faculty:', error);
    throw error;
  }
}

// Activate faculty assignment (called when user logs in with assigned email)
export async function activateFacultyAssignment(
  assignmentId: string,
  userId: string
): Promise<void> {
  try {
    const assignmentRef = doc(db, 'facultyAssignments', assignmentId);
    await updateDoc(assignmentRef, {
      isActivated: true,
      activatedAt: serverTimestamp(),
      userId,
    });
  } catch (error) {
    console.error('Error activating faculty assignment:', error);
    throw error;
  }
}

// Get all faculty assignments
export async function getAllFacultyAssignments(): Promise<FacultyAssignment[]> {
  try {
    const q = query(collection(db, 'facultyAssignments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        activatedAt: data.activatedAt?.toDate() || null,
      } as FacultyAssignment;
    });
  } catch (error) {
    console.error('Error getting faculty assignments:', error);
    return [];
  }
}

// Remove faculty assignment
export async function removeFacultyAssignment(
  assignmentId: string,
  performedBy: string,
  performedByEmail: string
): Promise<void> {
  try {
    const assignmentRef = doc(db, 'facultyAssignments', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    
    if (!assignmentDoc.exists()) {
      throw new Error('Assignment not found');
    }

    const assignmentData = assignmentDoc.data();
    await deleteDoc(assignmentRef);

    // If user has been activated, also update their role back to student
    if (assignmentData.isActivated && assignmentData.userId) {
      const userRef = doc(db, 'users', assignmentData.userId);
      await updateDoc(userRef, { role: 'student' });
    }

    // Log admin action
    await addDoc(collection(db, 'adminLogs'), {
      action: 'REMOVE_FACULTY_ASSIGNMENT',
      targetUserId: assignmentData.email,
      details: `Removed faculty assignment for ${assignmentData.email}`,
      performedBy,
      performedByEmail,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing faculty assignment:', error);
    throw error;
  }
}

// ============== NEWS ARTICLES ==============

// Create news article (Faculty only)
export async function createNewsArticle(
  article: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'newsArticles'), {
      ...article,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating news article:', error);
    throw error;
  }
}

// Get all news articles
export async function getNewsArticles(
  filters?: { tags?: string[]; isPublished?: boolean; limitCount?: number }
): Promise<NewsArticle[]> {
  try {
    let q = query(collection(db, 'newsArticles'), orderBy('createdAt', 'desc'));
    
    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    const snapshot = await getDocs(q);
    let articles = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
      } as NewsArticle;
    });

    // Client-side filtering for tags and published status
    if (filters?.isPublished !== undefined) {
      articles = articles.filter(a => a.isPublished === filters.isPublished);
    }
    if (filters?.tags && filters.tags.length > 0) {
      articles = articles.filter(a => 
        filters.tags!.some(tag => a.tags.includes(tag))
      );
    }

    return articles;
  } catch (error) {
    console.error('Error getting news articles:', error);
    return [];
  }
}

// Update news article
export async function updateNewsArticle(
  articleId: string,
  updates: Partial<NewsArticle>
): Promise<void> {
  try {
    const articleRef = doc(db, 'newsArticles', articleId);
    await updateDoc(articleRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating news article:', error);
    throw error;
  }
}

// Delete news article
export async function deleteNewsArticle(articleId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'newsArticles', articleId));
  } catch (error) {
    console.error('Error deleting news article:', error);
    throw error;
  }
}

// ============== EDITORIAL BRIEFS ==============

export async function createEditorialBrief(
  brief: Omit<EditorialBrief, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'editorialBriefs'), {
      ...brief,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating editorial brief:', error);
    throw error;
  }
}

export async function getEditorialBriefs(limitCount: number = 20): Promise<EditorialBrief[]> {
  try {
    const q = query(
      collection(db, 'editorialBriefs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as EditorialBrief;
    });
  } catch (error) {
    console.error('Error getting editorial briefs:', error);
    return [];
  }
}

// ============== PREVIOUS YEAR QUESTIONS ==============

export async function createPYQ(
  question: Omit<PYQQuestion, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'pyqQuestions'), {
      ...question,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating PYQ:', error);
    throw error;
  }
}

export async function getPYQs(filters?: { year?: number; subject?: string; paper?: string }): Promise<PYQQuestion[]> {
  try {
    let q = query(collection(db, 'pyqQuestions'), orderBy('year', 'desc'));
    
    const snapshot = await getDocs(q);
    let questions = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as PYQQuestion;
    });

    if (filters?.year) {
      questions = questions.filter(q => q.year === filters.year);
    }
    if (filters?.subject) {
      questions = questions.filter(q => q.subject === filters.subject);
    }
    if (filters?.paper) {
      questions = questions.filter(q => q.paper === filters.paper);
    }

    return questions;
  } catch (error) {
    console.error('Error getting PYQs:', error);
    return [];
  }
}

export async function getAllPYQYears(): Promise<number[]> {
  try {
    const snapshot = await getDocs(collection(db, 'pyqQuestions'));
    const years = new Set<number>();
    snapshot.docs.forEach(docSnap => {
      const year = docSnap.data().year;
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error('Error getting PYQ years:', error);
    return [];
  }
}

// ============== SYLLABUS TRACKING ==============

export async function initializeSyllabus(): Promise<void> {
  // Default UPSC syllabus structure
  const defaultSyllabus: Omit<SyllabusItem, 'id'>[] = [
    { subject: 'Polity', topic: 'Constitution - Historical Background', subtopics: ['Government of India Acts', 'Making of Constitution'], paper: 'GS2', order: 1 },
    { subject: 'Polity', topic: 'Preamble', subtopics: ['Philosophy', 'Amendment'], paper: 'GS2', order: 2 },
    { subject: 'Polity', topic: 'Fundamental Rights', subtopics: ['Articles 12-35', 'Writs', 'Limitations'], paper: 'GS2', order: 3 },
    { subject: 'Polity', topic: 'DPSP & FD', subtopics: ['Articles 36-51', 'Fundamental Duties'], paper: 'GS2', order: 4 },
    { subject: 'Polity', topic: 'Union Executive', subtopics: ['President', 'PM & Council', 'CAG'], paper: 'GS2', order: 5 },
    { subject: 'History', topic: 'Ancient India', subtopics: ['Indus Valley', 'Vedic Period', 'Mauryas', 'Guptas'], paper: 'GS1', order: 6 },
    { subject: 'History', topic: 'Medieval India', subtopics: ['Delhi Sultanate', 'Mughal Empire', 'Bhakti Movement'], paper: 'GS1', order: 7 },
    { subject: 'History', topic: 'Modern India', subtopics: ['British Rule', 'Freedom Struggle', 'Social Reforms'], paper: 'GS1', order: 8 },
    { subject: 'Geography', topic: 'Physical Geography', subtopics: ['Geomorphology', 'Climatology', 'Oceanography'], paper: 'GS1', order: 9 },
    { subject: 'Geography', topic: 'Indian Geography', subtopics: ['Physiography', 'Climate', 'Rivers', 'Agriculture'], paper: 'GS1', order: 10 },
    { subject: 'Economy', topic: 'Basic Concepts', subtopics: ['National Income', 'GDP', 'Inflation'], paper: 'GS3', order: 11 },
    { subject: 'Economy', topic: 'Indian Economy', subtopics: ['Planning', 'Sectors', 'Reforms'], paper: 'GS3', order: 12 },
    { subject: 'Environment', topic: 'Ecology', subtopics: ['Ecosystems', 'Biodiversity', 'Conservation'], paper: 'GS3', order: 13 },
    { subject: 'Environment', topic: 'Climate Change', subtopics: ['Global Warming', 'International Agreements'], paper: 'GS3', order: 14 },
    { subject: 'Science', topic: 'Physics', subtopics: ['Mechanics', 'Optics', 'Modern Physics'], paper: 'GS3', order: 15 },
    { subject: 'Science', topic: 'Chemistry', subtopics: ['Organic', 'Inorganic', 'Applications'], paper: 'GS3', order: 16 },
    { subject: 'Science', topic: 'Biology', subtopics: ['Botany', 'Zoology', 'Human Body'], paper: 'GS3', order: 17 },
    { subject: 'Ethics', topic: 'Ethics in Governance', subtopics: ['Attitude', 'Aptitude', 'Emotional Intelligence'], paper: 'GS4', order: 18 },
  ];

  try {
    const snapshot = await getDocs(collection(db, 'syllabus'));
    if (snapshot.empty) {
      const batch = writeBatch(db);
      defaultSyllabus.forEach(item => {
        const docRef = doc(collection(db, 'syllabus'));
        batch.set(docRef, item);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error initializing syllabus:', error);
  }
}

export async function getSyllabusItems(): Promise<SyllabusItem[]> {
  try {
    const q = query(collection(db, 'syllabus'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as SyllabusItem));
  } catch (error) {
    console.error('Error getting syllabus:', error);
    return [];
  }
}

export async function getUserSyllabusProgress(userId: string): Promise<SyllabusProgress[]> {
  try {
    const q = query(
      collection(db, 'syllabusProgress'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        completedAt: data.completedAt?.toDate() || null,
        lastRevisedAt: data.lastRevisedAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as SyllabusProgress;
    });
  } catch (error) {
    console.error('Error getting syllabus progress:', error);
    return [];
  }
}

export async function updateSyllabusProgress(
  userId: string,
  syllabusItemId: string,
  subject: string,
  topic: string,
  status: SyllabusProgress['status'],
  notes?: string
): Promise<void> {
  try {
    // Check if progress exists
    const q = query(
      collection(db, 'syllabusProgress'),
      where('userId', '==', userId),
      where('syllabusItemId', '==', syllabusItemId)
    );
    const snapshot = await getDocs(q);

    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (notes) updates.notes = notes;
    if (status === 'completed') updates.completedAt = serverTimestamp();
    if (status === 'revision') updates.lastRevisedAt = serverTimestamp();

    if (snapshot.empty) {
      // Create new progress
      await addDoc(collection(db, 'syllabusProgress'), {
        userId,
        syllabusItemId,
        subject,
        topic,
        ...updates,
      });
    } else {
      // Update existing
      const docRef = doc(db, 'syllabusProgress', snapshot.docs[0].id);
      await updateDoc(docRef, updates);
    }
  } catch (error) {
    console.error('Error updating syllabus progress:', error);
    throw error;
  }
}

// ============== FLASHCARDS ==============

export async function createFlashcard(
  flashcard: Omit<Flashcard, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'flashcards'), {
      ...flashcard,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
}

export async function getUserFlashcards(userId: string): Promise<Flashcard[]> {
  try {
    const q = query(
      collection(db, 'flashcards'),
      where('userId', '==', userId),
      orderBy('nextReviewDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        nextReviewDate: data.nextReviewDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Flashcard;
    });
  } catch (error) {
    console.error('Error getting flashcards:', error);
    return [];
  }
}

export async function updateFlashcardReview(
  flashcardId: string,
  quality: number // 0-5 rating of how well user remembered
): Promise<void> {
  try {
    const flashcardRef = doc(db, 'flashcards', flashcardId);
    const flashcardDoc = await getDoc(flashcardRef);
    
    if (!flashcardDoc.exists()) throw new Error('Flashcard not found');

    const data = flashcardDoc.data();
    let { easeFactor, interval, repetitions } = data;

    // SM-2 algorithm for spaced repetition
    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    await updateDoc(flashcardRef, {
      easeFactor,
      interval,
      repetitions,
      nextReviewDate: Timestamp.fromDate(nextReviewDate),
    });
  } catch (error) {
    console.error('Error updating flashcard review:', error);
    throw error;
  }
}

export async function deleteFlashcard(flashcardId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'flashcards', flashcardId));
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
}

// ============== MIND MAPS ==============

export async function saveMindMap(
  userId: string,
  topic: string,
  subject: string,
  data: MindMapNode
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'mindMaps'), {
      userId,
      topic,
      subject,
      data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving mind map:', error);
    throw error;
  }
}

export async function getUserMindMaps(userId: string): Promise<MindMap[]> {
  try {
    const q = query(
      collection(db, 'mindMaps'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as MindMap;
    });
  } catch (error) {
    console.error('Error getting mind maps:', error);
    return [];
  }
}

// ============== GAMIFICATION BADGES ==============

export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    const q = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const earnedBadgeIds = snapshot.docs.map(doc => doc.data().badgeId);
    
    return AVAILABLE_BADGES.filter(badge => earnedBadgeIds.includes(badge.id)).map(badge => ({
      ...badge,
      earnedAt: snapshot.docs.find(doc => doc.data().badgeId === badge.id)?.data()?.earnedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    // Check if badge already awarded
    const existingQ = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId),
      where('badgeId', '==', badgeId)
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) return false;
    
    // Award badge
    await addDoc(collection(db, 'userBadges'), {
      userId,
      badgeId,
      earnedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

export async function checkAndAwardBadges(
  userId: string, 
  userProfile: { streak: number; testsCompleted: number; totalStudyTime: number; averageScore?: number }
): Promise<Badge[]> {
  const newBadges: Badge[] = [];
  
  try {
    // Get current badges
    const currentBadges = await getUserBadges(userId);
    const earnedIds = new Set(currentBadges.map(b => b.id));
    
    for (const badge of AVAILABLE_BADGES) {
      if (earnedIds.has(badge.id)) continue;
      
      let shouldAward = false;
      
      switch (badge.requirement.type) {
        case 'streak':
          shouldAward = userProfile.streak >= badge.requirement.value;
          break;
        case 'tests':
          shouldAward = userProfile.testsCompleted >= badge.requirement.value;
          break;
        case 'study_time':
          shouldAward = (userProfile.totalStudyTime / 60) >= badge.requirement.value; // Convert minutes to hours
          break;
        case 'score':
          shouldAward = (userProfile.averageScore || 0) >= badge.requirement.value;
          break;
      }
      
      if (shouldAward) {
        const awarded = await awardBadge(userId, badge.id);
        if (awarded) {
          newBadges.push({ ...badge, earnedAt: new Date() });
        }
      }
    }
    
    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

// ============== BOOKMARKS ==============

export async function bookmarkArticle(
  userId: string,
  articleId: string,
  articleType: 'news' | 'editorial' | 'pyq'
): Promise<void> {
  try {
    await addDoc(collection(db, 'bookmarks'), {
      userId,
      articleId,
      articleType,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error bookmarking article:', error);
    throw error;
  }
}

export async function getUserBookmarks(
  userId: string,
  articleType?: string
): Promise<{ articleId: string; articleType: string; createdAt: Date }[]> {
  try {
    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let bookmarks = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        articleId: data.articleId,
        articleType: data.articleType,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });

    if (articleType) {
      bookmarks = bookmarks.filter(b => b.articleType === articleType);
    }

    return bookmarks;
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
}

export async function removeBookmark(userId: string, articleId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      where('articleId', '==', articleId)
    );
    const snapshot = await getDocs(q);
    
    const batchOp = writeBatch(db);
    snapshot.docs.forEach(docSnap => batchOp.delete(docSnap.ref));
    await batchOp.commit();
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

export default {
  // Users
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
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
  // Faculty
  createFaculty,
  getFaculty,
  getAllFaculties,
  updateFaculty,
  deleteFaculty,
  // Faculty Assignment
  checkFacultyAssignment,
  assignFacultyByEmail,
  activateFacultyAssignment,
  getAllFacultyAssignments,
  removeFacultyAssignment,
  // Batch
  createBatch,
  getBatch,
  getBatchesByFaculty,
  getAllBatches,
  updateBatch,
  deleteBatch,
  addStudentToBatch,
  removeStudentFromBatch,
  getStudentsByBatch,
  // Progress
  getStudentProgress,
  // Payment
  createPayment,
  getAllPayments,
  getPaymentsByUser,
  // Admin
  getSystemStats,
  grantLifetimeAccess,
  revokeAccess,
  bulkUpdatePaymentStatus,
  setUserRole,
  addTokensToUser,
  getAdminLogs,
  // News & Content
  createNewsArticle,
  getNewsArticles,
  updateNewsArticle,
  deleteNewsArticle,
  createEditorialBrief,
  getEditorialBriefs,
  // PYQ
  createPYQ,
  getPYQs,
  getAllPYQYears,
  // Syllabus
  initializeSyllabus,
  getSyllabusItems,
  getUserSyllabusProgress,
  updateSyllabusProgress,
  // Flashcards
  createFlashcard,
  getUserFlashcards,
  updateFlashcardReview,
  deleteFlashcard,
  // Mind Maps
  saveMindMap,
  getUserMindMaps,
  // Bookmarks
  bookmarkArticle,
  getUserBookmarks,
  removeBookmark,
  // Badges
  getUserBadges,
  awardBadge,
  checkAndAwardBadges,
  AVAILABLE_BADGES,
  // Realtime
  subscribeToUserProfile,
};
