/**
 * Firebase Web SDK — Realtime Database for profiles, leaderboard, usernames, wallet links, claims.
 * Configure via Vite env (set in Netlify / local .env). If unset, `database` stays null and callers no-op/fail soft.
 *
 * VITE_FIREBASE_API_KEY
 * VITE_FIREBASE_AUTH_DOMAIN
 * VITE_FIREBASE_DATABASE_URL   (required for RTDB, e.g. https://chess-220ee-default-rtdb.firebaseio.com)
 * VITE_FIREBASE_PROJECT_ID
 * VITE_FIREBASE_STORAGE_BUCKET
 * VITE_FIREBASE_MESSAGING_SENDER_ID
 * VITE_FIREBASE_APP_ID
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

function readEnv(key: string): string | undefined {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: readEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

const canInit = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);

if (canInit) {
  const opts = {
    apiKey: firebaseConfig.apiKey!,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL!,
    projectId: firebaseConfig.projectId!,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  };
  app = getApps().length ? getApps()[0]! : initializeApp(opts);
  database = getDatabase(app);
} else if (import.meta.env.DEV) {
  console.warn(
    '[firebaseApp] Firebase not configured (missing VITE_FIREBASE_*). Profiles/leaderboard will be unavailable.',
  );
}

/** Throws if Realtime Database is not configured (use when calling `ref()`). */
export function getFirebaseDatabase(): Database {
  if (!database) {
    throw new Error(
      '[firebaseApp] Firebase Realtime Database not configured (set VITE_FIREBASE_* env vars).',
    );
  }
  return database;
}

/**
 * Firebase Auth allows ONE signed-in user per app instance, but a visitor can
 * have an EVM wallet AND a Solana wallet connected at once — and database
 * rules require writes to a wallet's entry to carry that wallet's auth uid.
 * So Solana-keyed writes go through a second app instance (same project)
 * with its own auth session.
 */
let solanaApp: FirebaseApp | null = null;
export function getFirebaseAppForKey(pathKey: string): FirebaseApp {
  if (!app) {
    throw new Error('[firebaseApp] Firebase not configured (set VITE_FIREBASE_* env vars).');
  }
  if (pathKey.startsWith('0x')) return app;
  if (!solanaApp) {
    solanaApp =
      getApps().find((a) => a.name === 'solana-auth') ??
      initializeApp(app.options, 'solana-auth');
  }
  return solanaApp;
}

/** Database bound to the app instance whose auth session matches this wallet key. */
export function getFirebaseDatabaseForKey(pathKey: string): Database {
  return getDatabase(getFirebaseAppForKey(pathKey));
}

export { app, database };
