import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Chess game operations
export const firebaseChess = {
  // Get game state
  async getGame(gameId: string) {
    const gameRef = ref(database, `chess_games/${gameId}`);
    const snapshot = await get(gameRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Update game state
  async updateGame(gameId: string, gameData: any) {
    const gameRef = ref(database, `chess_games/${gameId}`);
    await set(gameRef, {
      ...gameData,
      updated_at: new Date().toISOString()
    });
  },

  // Subscribe to game updates (real-time)
  subscribeToGame(gameId: string, callback: (gameData: any) => void) {
    const gameRef = ref(database, `chess_games/${gameId}`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val();
        console.log('[FIREBASE] Game update received:', gameData);
        callback(gameData);
      }
    });

    return unsubscribe;
  },

  // Create new game
  async createGame(gameData: any) {
    const gameRef = ref(database, `chess_games/${gameData.game_id}`);
    await set(gameRef, {
      ...gameData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  },

  // Get all active games
  async getActiveGames() {
    const gamesRef = ref(database, 'chess_games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) return [];
    
    const games = snapshot.val();
    return Object.values(games).filter((game: any) => 
      game.game_state === 'waiting' || game.game_state === 'active'
    );
  }
};

export default firebaseChess; 