/**
 * lawb-firebase.js — Firebase Admin SDK connection helper for Clawb
 *
 * Provides authenticated read/write access to the chess-220ee Firebase Realtime Database.
 * Uses a service account key (Admin SDK) which bypasses all client security rules.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync, existsSync } from 'fs';
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
const LOCAL_STREAM = String(process.env.CLAWB_LOCAL_STREAM || '0').toLowerCase() === '1' ||
  process.argv.includes('--local-stream');

// --- Initialize ---
let app = null;
let db = null;
let firebaseAvailable = false;

// Always try Firebase when credentials exist. In --local-stream, world uses WebSocket; chess/PVP need Firebase.
const saPath = resolve(process.cwd(), SERVICE_ACCOUNT_PATH);
if (LOCAL_STREAM && !existsSync(saPath)) {
  console.log('[Firebase] No service account file. World + Retake run locally; chess/PVP disabled.');
} else {
  try {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
    app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: DATABASE_URL,
    });
    db = getDatabase(app);
    firebaseAvailable = true;
    if (LOCAL_STREAM) {
      console.log('[Firebase] Connected. Local-stream mode: world uses WebSocket; chess/PVP use Firebase.');
    }
  } catch (err) {
    if (LOCAL_STREAM) {
      console.warn('[Firebase] Failed to connect:', err.message);
      console.warn('[Firebase] World + Retake will run locally; chess/PVP disabled.');
      db = null;
      app = null;
    } else {
      console.error('[Firebase] Failed to initialize:', err.message);
      process.exit(1);
    }
  }
}

export const isFirebaseAvailable = () => firebaseAvailable;

// --- Clawb Status ---

/**
 * Set Clawb's online status.
 * Frontend reads this at clawb/status/ to show green/grey dot.
 */
export async function setClawbOnline(activity = 'idle') {
  if (!db) return;
  await db.ref('clawb/status').set({
    online: true,
    last_seen: Date.now(),
    current_activity: activity,
  });
}

export async function setClawbOffline() {
  if (!db) return;
  await db.ref('clawb/status').set({
    online: false,
    last_seen: Date.now(),
    current_activity: 'offline',
  });
}

export async function updateClawbActivity(activity) {
  if (!db) return;
  await db.ref('clawb/status').update({
    current_activity: activity,
    last_seen: Date.now(),
  });
}

/** Heartbeat — call every 30s to keep last_seen fresh */
export async function heartbeat(activity) {
  if (!db) return;
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
  if (!db) return () => {};
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
  if (!db) return null;
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
  if (!db) return () => {};
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
  if (!db) return () => {};
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
 * Always set updated_at so frontend sync is consistent.
 */
export async function updateGame(inviteCode, data) {
  if (!db) return;
  await db.ref(`chess_games/${inviteCode}`).update({
    ...data,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Post a message to a chess game's private chat.
 */
export async function postGameChatMessage(inviteCode, message) {
  if (!db) return null;
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

// --- Public Chess Chat ---

/**
 * Listen for new public chess chat messages.
 * Fires for messages added AFTER this listener starts.
 */
export function onPublicChatMessage(callback) {
  if (!db) return () => {};
  const messagesRef = db.ref('chess_chat/public/messages');
  const listener = messagesRef
    .orderByChild('timestamp')
    .startAt(Date.now())
    .on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback({ id: snapshot.key, ...data });
      }
    });

  return () => messagesRef.off('child_added', listener);
}

/**
 * Post a message to the public chess chat as Clawb.
 */
export async function postPublicChatMessage(message) {
  if (!db) return null;
  const chatRef = db.ref('chess_chat/public/messages').push();
  await chatRef.set({
    userId: 'clawb',
    walletAddress: '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429',
    displayName: 'Clawb',
    message,
    timestamp: Date.now(),
    room: 'public',
  });
  return chatRef.key;
}

/**
 * Get all active chess games where Clawb is a player.
 */
export async function getActiveClawbGames() {
  if (!db) return [];
  const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
  const snap = await db
    .ref('chess_games')
    .orderByChild('game_state')
    .equalTo('active')
    .once('value');
  const games = snap.val() || {};
  return Object.entries(games)
    .filter(
      ([, g]) =>
        g.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase() ||
        g.blue_player?.toLowerCase() === CLAWB_WALLET.toLowerCase()
    )
    .map(([code, g]) => {
      const clawbColor =
        g.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase()
          ? 'red'
          : 'blue';
      return { code, clawbColor, ...g };
    });
}

// --- Raw DB access for advanced use ---
export { db, app };
export default db;
