import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';

// Firebase configuration - you'll get these from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Replace with your API key
  authDomain: "your-project.firebaseapp.com", // Replace with your domain
  databaseURL: "https://your-project-default-rtdb.firebaseio.com", // Replace with your database URL
  projectId: "your-project", // Replace with your project ID
  storageBucket: "your-project.appspot.com", // Replace with your bucket
  messagingSenderId: "123456789", // Replace with your sender ID
  appId: "your-app-id" // Replace with your app ID
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