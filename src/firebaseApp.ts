import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAed5bn78c6Mb5Y3ezULH9CEg7IAKYFAps",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chess-220ee.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://chess-220ee-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chess-220ee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chess-220ee.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "724477138097",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:724477138097:web:7dc15f79db3bda5c763e90"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database }; 