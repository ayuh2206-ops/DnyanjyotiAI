// Firebase Configuration and Initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDI2cZ9_aB4uEBbIpZCBQ2XqVy2KKZbT0M",
  authDomain: "dnyangpt.firebaseapp.com",
  projectId: "dnyangpt",
  storageBucket: "dnyangpt.firebasestorage.app",
  messagingSenderId: "796205506436",
  appId: "1:796205506436:web:1e90a8cc731053bb2307d1",
  measurementId: "G-SB2NS6X6YT"
};

// Initialize Firebase (singleton pattern for Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (only in browser)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};

// VERO (Super Admin) email - has full platform control
export const VERO_EMAIL = "vero.media.150@gmail.com";

// Legacy support
export const ADMIN_EMAIL = VERO_EMAIL;

export const isAdmin = (email: string | null | undefined): boolean => {
  return email === VERO_EMAIL;
};

export const isVeroAdmin = (email: string | null | undefined): boolean => {
  return email === VERO_EMAIL;
};

export default app;
