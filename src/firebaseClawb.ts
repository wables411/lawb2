import { ref, push, set, onValue, off, serverTimestamp, query, orderByChild, limitToLast, get } from 'firebase/database';
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
