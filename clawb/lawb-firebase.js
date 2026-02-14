/**
 * lawb-firebase.js — Firebase Admin SDK connection helper for Clawb
 *
 * Provides authenticated read/write access to the chess-220ee Firebase Realtime Database.
 * Uses a service account key (Admin SDK) which bypasses all client security rules.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env if available
const envPath = resolve(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env is optional — env vars might already be set
}

// --- Config ---
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://chess-220ee-default-rtdb.firebaseio.com';

// --- Initialize ---
let serviceAccount;
try {
  const saPath = resolve(process.cwd(), SERVICE_ACCOUNT_PATH);
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
} catch (err) {
  console.error('[Firebase] Failed to load service account key from:', SERVICE_ACCOUNT_PATH);
  console.error('[Firebase] Download it from: Firebase Console → chess-220ee → Project Settings → Service Accounts → Generate New Private Key');
  console.error('[Firebase] Save it as service-account.json in the clawb/ directory');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: DATABASE_URL,
});

const db = getDatabase(app);

// --- Clawb Status ---

/**
 * Set Clawb's online status.
 * Frontend reads this at clawb/status/ to show green/grey dot.
 */
export async function setClawbOnline(activity = 'idle') {
  await db.ref('clawb/status').set({
    online: true,
    last_seen: Date.now(),
    current_activity: activity,
  });
}

export async function setClawbOffline() {
  await db.ref('clawb/status').set({
    online: false,
    last_seen: Date.now(),
    current_activity: 'offline',
  });
}

export async function updateClawbActivity(activity) {
  await db.ref('clawb/status').update({
    current_activity: activity,
    last_seen: Date.now(),
  });
}

/** Heartbeat — call every 30s to keep last_seen fresh */
export async function heartbeat(activity) {
  await db.ref('clawb/status').update({
    online: true,
    last_seen: Date.now(),
    ...(activity ? { current_activity: activity } : {}),
  });
}

// --- Clawb Chat ---

/**
 * Listen for new visitor messages.
 * Returns a function to stop listening.
 */
export function onVisitorMessage(callback) {
  const messagesRef = db.ref('clawb/chat/visitor_messages');
  // Only listen to new messages (after current time)
  const listener = messagesRef.orderByChild('timestamp').startAt(Date.now()).on('child_added', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        id: snapshot.key,
        ...data,
      });
    }
  });

  return () => messagesRef.off('child_added', listener);
}

/**
 * Post a Clawb response to the chat.
 * Frontend reads from clawb/chat/messages/.
 */
export async function postClawbMessage(message, replyTo = null, page = '/') {
  const msgRef = db.ref('clawb/chat/messages').push();
  await msgRef.set({
    author: 'clawb',
    message,
    page,
    ...(replyTo ? { reply_to: replyTo } : {}),
    timestamp: Date.now(),
  });
  return msgRef.key;
}

// --- Chess Games ---

/**
 * Listen for vs Clawb chess games (game_type: 'vs_clawb').
 * Fires when a new game is created or updated.
 */
export function onVsClawbGame(callback) {
  const gamesRef = db.ref('chess_games');
  const listener = gamesRef.orderByChild('game_type').equalTo('vs_clawb').on('child_changed', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({ id: snapshot.key, ...data });
    }
  });

  // Also listen for new games
  const addListener = gamesRef.orderByChild('game_type').equalTo('vs_clawb').on('child_added', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({ id: snapshot.key, ...data });
    }
  });

  return () => {
    gamesRef.off('child_changed', listener);
    gamesRef.off('child_added', addListener);
  };
}

/**
 * Listen for open PVP games waiting for a second player.
 */
export function onOpenPvpGames(callback) {
  const gamesRef = db.ref('chess_games');
  const listener = gamesRef.orderByChild('game_state').equalTo('waiting_for_join').on('child_added', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({ id: snapshot.key, ...data });
    }
  });

  return () => gamesRef.off('child_added', listener);
}

/**
 * Update a chess game's data.
 */
export async function updateGame(inviteCode, data) {
  await db.ref(`chess_games/${inviteCode}`).update(data);
}

/**
 * Post a message to a chess game's private chat.
 */
export async function postGameChatMessage(inviteCode, message) {
  const chatRef = db.ref(`chess_chat/private/${inviteCode}/messages`).push();
  await chatRef.set({
    userId: 'clawb',
    walletAddress: '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429',
    displayName: 'Clawb',
    message,
    timestamp: Date.now(),
    room: 'private',
    inviteCode,
  });
  return chatRef.key;
}

// --- Raw DB access for advanced use ---
export { db, app };
export default db;
