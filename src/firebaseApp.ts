import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import type { Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAed5bn78c6Mb5Y3ezULH9CEg7IAKYFAps",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chess-220ee.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://chess-220ee-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chess-220ee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chess-220ee.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "724477138097",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:724477138097:web:7dc15f79db3bda5c763e90"
};

// Mobile-specific Firebase configuration
// Some mobile browsers need explicit database URL configuration
if (typeof window !== 'undefined' && window.innerWidth <= 768) {
  // Mobile detected - ensure database URL is properly configured
  // Firebase SDK should handle this automatically, but we log for debugging
  console.log('[FIREBASE] Mobile detected, database URL:', firebaseConfig.databaseURL);
}

// Initialize Firebase with error handling
let app: FirebaseApp;
let database: Database;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  // Initialize database - ensure we're using the correct database URL
  // On mobile, explicitly pass the databaseURL to ensure proper connection
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  if (isMobile) {
    // For mobile, explicitly specify database URL to ensure proper initialization
    database = getDatabase(app, firebaseConfig.databaseURL);
  } else {
    database = getDatabase(app);
  }
  
  console.log('[FIREBASE] Initialized successfully', isMobile ? '(mobile)' : '(desktop)');
  console.log('[FIREBASE] Database URL:', firebaseConfig.databaseURL);
  console.log('[FIREBASE] Auth Domain:', firebaseConfig.authDomain);
  console.log('[FIREBASE] Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');
} catch (error) {
  console.error('[FIREBASE] Initialization error:', error);
  // Re-throw to prevent silent failures
  throw error;
}

export { app, database }; 