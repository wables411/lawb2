import { ref, push, set, onValue, off, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from './firebaseApp';

export interface ChatMessage {
  id: string;
  userId: string;
  walletAddress: string;
  displayName: string;
  message: string;
  timestamp: number;
  room: 'public' | 'private';
  inviteCode?: string;
}

export interface ChatRoom {
  type: 'public' | 'private';
  inviteCode?: string;
  participants?: string[];
}

// Send a message to public chat
export const sendPublicMessage = async (
  walletAddress: string,
  message: string,
  displayName: string
): Promise<void> => {
  try {
    const messagesRef = ref(database, 'chess_chat/public/messages');
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      userId: walletAddress,
      walletAddress,
      displayName,
      message,
      timestamp: serverTimestamp(),
      room: 'public'
    });

    // Update last message timestamp
    await set(ref(database, 'chess_chat/public/lastMessage'), serverTimestamp());
  } catch (error) {
    console.error('Error sending public message:', error);
    throw error;
  }
};

// Send a message to private chat
export const sendPrivateMessage = async (
  inviteCode: string,
  walletAddress: string,
  message: string,
  displayName: string
): Promise<void> => {
  try {
    const messagesRef = ref(database, `chess_chat/private/${inviteCode}/messages`);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      userId: walletAddress,
      walletAddress,
      displayName,
      message,
      timestamp: serverTimestamp(),
      room: 'private',
      inviteCode
    });

    // Update last message timestamp
    await set(ref(database, `chess_chat/private/${inviteCode}/lastMessage`), serverTimestamp());
  } catch (error) {
    console.error('Error sending private message:', error);
    throw error;
  }
};

// Create private chat room for a chess match
export const createPrivateChatRoom = async (
  inviteCode: string,
  player1Wallet: string,
  player2Wallet: string
): Promise<void> => {
  try {
    const chatRoomRef = ref(database, `chess_chat/private/${inviteCode}`);
    await set(chatRoomRef, {
      participants: {
        [player1Wallet]: true,
        [player2Wallet]: true
      },
      lastMessage: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating private chat room:', error);
    throw error;
  }
};

// Listen to public chat messages
export const listenToPublicChat = (
  callback: (messages: ChatMessage[]) => void,
  limit: number = 50
): (() => void) => {
  const messagesRef = ref(database, 'chess_chat/public/messages');
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));
  
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
      const messageData = childSnapshot.val();
      if (messageData) {
        messages.push({
          id: childSnapshot.key!,
          ...messageData
        });
      }
    });
    callback(messages);
  });

  return unsubscribe;
};

// Listen to private chat messages
export const listenToPrivateChat = (
  inviteCode: string,
  callback: (messages: ChatMessage[]) => void,
  limit: number = 50
): (() => void) => {
  const messagesRef = ref(database, `chess_chat/private/${inviteCode}/messages`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));
  
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
      const messageData = childSnapshot.val();
      if (messageData) {
        messages.push({
          id: childSnapshot.key!,
          ...messageData
        });
      }
    });
    callback(messages);
  });

  return unsubscribe;
};

// Check if user is participant in private chat
export const isPrivateChatParticipant = async (
  inviteCode: string,
  walletAddress: string
): Promise<boolean> => {
  try {
    const participantsRef = ref(database, `chess_chat/private/${inviteCode}/participants/${walletAddress}`);
    const snapshot = await onValue(participantsRef, (snapshot) => {
      return snapshot.exists();
    });
    return false; // Default to false for safety
  } catch (error) {
    console.error('Error checking private chat participant:', error);
    return false;
  }
};

// Get display name for wallet address
export const getDisplayName = (walletAddress: string): string => {
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};
