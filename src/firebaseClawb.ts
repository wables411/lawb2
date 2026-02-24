import {
  ref,
  push,
  set,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  onDisconnect,
  remove,
} from 'firebase/database';
import { database } from './firebaseApp';

// --- Types ---

export interface ClawbStatus {
  online: boolean;
  last_seen: number;
  current_activity: string; // "playing chess" | "watching" | "idle"
}

export interface ClawbChatMessage {
  id: string;
  author: string; // "clawb" or wallet address or "anonymous"
  message: string;
  page: string;
  reply_to?: string;
  timestamp: number;
}

export interface ClawbWorldAction {
  id: string;
  action: string; // dance | swim | spin | wave | jump | etc
  by: string; // wallet address or anonymous
  source: string; // world | stream | system
  timestamp: number;
  command?: string;
  targetRoom?: string;
  targetNftIndex?: number;
  [key: string]: unknown;
}

export interface WorldPlayerPresence {
  wallet: string;
  room: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  updatedAt: number;
}

// --- Clawb Status ---

/** Subscribe to Clawb's online status. Returns unsubscribe function. */
export const listenToClawbStatus = (
  callback: (status: ClawbStatus | null) => void
): (() => void) => {
  const statusRef = ref(database, 'clawb/status');

  const unsubscribe = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ClawbStatus);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// --- Clawb Chat ---

/** Send a visitor message to Clawb. */
export const sendClawbMessage = async (
  message: string,
  author: string, // wallet address or "anonymous"
  page: string
): Promise<string> => {
  try {
    const messagesRef = ref(database, 'clawb/chat/visitor_messages');
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key!;

    await set(newMessageRef, {
      author,
      message,
      page,
      timestamp: serverTimestamp(),
    });

    return messageId;
  } catch (error) {
    console.error('[ClawbChat] Error sending message:', error);
    throw error;
  }
};

/** Listen to Clawb's responses. Returns unsubscribe function. */
export const listenToClawbResponses = (
  callback: (messages: ClawbChatMessage[]) => void,
  limit: number = 50
): (() => void) => {
  const messagesRef = ref(database, 'clawb/chat/messages');
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: ClawbChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data) {
        messages.push({
          id: childSnapshot.key!,
          ...data,
        });
      }
    });
    callback(messages);
  });

  return unsubscribe;
};

/** Listen to visitor messages (so we can display our own messages in the chat). */
export const listenToVisitorMessages = (
  callback: (messages: ClawbChatMessage[]) => void,
  limit: number = 50
): (() => void) => {
  const messagesRef = ref(database, 'clawb/chat/visitor_messages');
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: ClawbChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data) {
        messages.push({
          id: childSnapshot.key!,
          ...data,
        });
      }
    });
    callback(messages);
  });

  return unsubscribe;
};

// --- Clawb World Actions ---

/** Queue a world action for Clawb to perform in /world. */
export const enqueueWorldAction = async (
  action: string,
  by: string,
  source: string = 'world',
  extra: Record<string, unknown> = {}
): Promise<string> => {
  const actionsRef = ref(database, 'clawb/world/actions');
  const newActionRef = push(actionsRef);
  const actionId = newActionRef.key!;
  await set(newActionRef, {
    action: (action || '').toLowerCase().trim(),
    by,
    source,
    ...extra,
    timestamp: serverTimestamp(),
  });
  return actionId;
};

/** Listen to recent world actions so clients can animate Clawb consistently. */
export const listenToWorldActions = (
  callback: (actions: ClawbWorldAction[]) => void,
  limit: number = 30
): (() => void) => {
  const actionsRef = ref(database, 'clawb/world/actions');
  const actionsQuery = query(actionsRef, orderByChild('timestamp'), limitToLast(limit));

  const unsubscribe = onValue(actionsQuery, (snapshot) => {
    const actions: ClawbWorldAction[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data && data.action) {
        actions.push({
          id: childSnapshot.key!,
          ...data,
        });
      }
    });
    callback(actions);
  });

  return unsubscribe;
};

// --- Multiplayer World Presence ---

const presencePathForWallet = (wallet: string): string => {
  return `world/players/${wallet.toLowerCase()}`;
};

/** Publish this player's world presence. */
export const upsertWorldPresence = async (
  wallet: string,
  payload: Omit<WorldPlayerPresence, 'wallet' | 'updatedAt'>
): Promise<void> => {
  if (!wallet) return;
  const data: WorldPlayerPresence = {
    wallet: wallet.toLowerCase(),
    ...payload,
    updatedAt: Date.now(),
  };
  await set(ref(database, presencePathForWallet(wallet)), data);
};

/** Remove this player's world presence (on leave). */
export const removeWorldPresence = async (wallet: string): Promise<void> => {
  if (!wallet) return;
  await remove(ref(database, presencePathForWallet(wallet)));
};

/** Register an onDisconnect cleanup for this wallet's world presence. */
export const registerWorldPresenceDisconnectCleanup = async (wallet: string): Promise<void> => {
  if (!wallet) return;
  await onDisconnect(ref(database, presencePathForWallet(wallet))).remove();
};

/** Listen to all current world players. */
export const listenToWorldPlayers = (
  callback: (players: WorldPlayerPresence[]) => void
): (() => void) => {
  const playersRef = ref(database, 'world/players');
  const unsubscribe = onValue(playersRef, (snapshot) => {
    const players: WorldPlayerPresence[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data && data.wallet && typeof data.x === 'number' && typeof data.y === 'number' && typeof data.z === 'number') {
        players.push(data as WorldPlayerPresence);
      }
    });
    callback(players);
  });
  return unsubscribe;
};
