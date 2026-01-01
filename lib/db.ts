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
  // Realtime
  subscribeToUserProfile,
};
