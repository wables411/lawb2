import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAed5bn78c6Mb5Y3ezULH9CEg7IAKYFAps",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chess-220ee.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://chess-220ee-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chess-220ee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chess-220ee.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "724477138097",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:724477138097:web:7dc15f79db3bda5c763e90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Chess game operations with Firebase
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

  // Subscribe to game updates (real-time that actually works)
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
  },

  // Get open games (waiting for players to join)
  async getOpenGames() {
    const gamesRef = ref(database, 'chess_games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) return [];
    
    const games = snapshot.val();
    const openGames = Object.values(games).filter((game: any) => 
      game.game_state === 'waiting' && 
      game.is_public && 
      !game.red_player
    );
    
    // Sort by creation date (newest first)
    openGames.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return openGames;
  },

  // Delete a game
  async deleteGame(gameId: string) {
    const gameRef = ref(database, `chess_games/${gameId}`);
    await set(gameRef, null);
  },

  // Migrate existing game from Supabase to Firebase
  async migrateGame(supabaseGame: any) {
    const gameRef = ref(database, `chess_games/${supabaseGame.game_id}`);
    await set(gameRef, {
      ...supabaseGame,
      migrated_at: new Date().toISOString()
    });
  },

  // Leaderboard operations
  async updateLeaderboard(entry: any) {
    const leaderboardRef = ref(database, `leaderboard/${entry.username}`);
    await set(leaderboardRef, {
      ...entry,
      updated_at: new Date().toISOString()
    });
  },

  async getLeaderboard() {
    const leaderboardRef = ref(database, 'leaderboard');
    const snapshot = await get(leaderboardRef);
    
    if (!snapshot.exists()) return [];
    
    const entries = snapshot.val();
    return Object.values(entries).sort((a: any, b: any) => b.points - a.points);
  },

  // Subscribe to leaderboard updates
  subscribeToLeaderboard(callback: (entries: any[]) => void) {
    const leaderboardRef = ref(database, 'leaderboard');
    
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const entries = snapshot.val();
        const sortedEntries = Object.values(entries).sort((a: any, b: any) => b.points - a.points);
        console.log('[FIREBASE] Leaderboard update received:', sortedEntries);
        callback(sortedEntries);
      }
    });

    return unsubscribe;
  }
};

export default firebaseChess; 