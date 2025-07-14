import { getApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';

// Get the already initialized Firebase app or initialize if needed
const app = getApps().length > 0 ? getApp() : null;
const database = app ? getDatabase(app) : null;

// Helper function to check if database is available
const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
};

// Chess game operations with Firebase
export const firebaseChess = {
  // Get game state
  async getGame(gameId: string) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${gameId}`);
      const snapshot = await get(gameRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('[FIREBASE] Error getting game:', error);
      return null;
    }
  },

  // Update game state
  async updateGame(gameId: string, gameData: any) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${gameId}`);
      await set(gameRef, {
        ...gameData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[FIREBASE] Error updating game:', error);
    }
  },

  // Subscribe to game updates (real-time that actually works)
  subscribeToGame(gameId: string, callback: (gameData: any) => void) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${gameId}`);
      
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          console.log('[FIREBASE] Game update received:', gameData);
          callback(gameData);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('[FIREBASE] Error subscribing to game:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Create new game
  async createGame(gameData: any) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${gameData.game_id}`);
      await set(gameRef, {
        ...gameData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[FIREBASE] Error creating game:', error);
    }
  },

  // Get all active games
  async getActiveGames() {
    try {
      const db = getDatabaseOrThrow();
      const gamesRef = ref(db, 'chess_games');
      const snapshot = await get(gamesRef);
      
      if (!snapshot.exists()) return [];
      
      const games = snapshot.val();
      return Object.values(games).filter((game: any) => 
        game.game_state === 'waiting' || game.game_state === 'active'
      );
    } catch (error) {
      console.error('[FIREBASE] Error getting active games:', error);
      return [];
    }
  },

  // Get open games (waiting for players to join)
  async getOpenGames() {
    try {
      const db = getDatabaseOrThrow();
      const gamesRef = ref(db, 'chess_games');
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
    } catch (error) {
      console.error('[FIREBASE] Error getting open games:', error);
      return [];
    }
  },

  // Delete a game
  async deleteGame(gameId: string) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${gameId}`);
      await set(gameRef, null);
    } catch (error) {
      console.error('[FIREBASE] Error deleting game:', error);
    }
  },

  // Migrate existing game from Supabase to Firebase
  async migrateGame(supabaseGame: any) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${supabaseGame.game_id}`);
      await set(gameRef, {
        ...supabaseGame,
        migrated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[FIREBASE] Error migrating game:', error);
    }
  },

  // Leaderboard operations
  async updateLeaderboard(entry: any) {
    try {
      const db = getDatabaseOrThrow();
      const leaderboardRef = ref(db, `leaderboard/${entry.username}`);
      await set(leaderboardRef, {
        ...entry,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[FIREBASE] Error updating leaderboard:', error);
    }
  },

  async getLeaderboard() {
    try {
      const db = getDatabaseOrThrow();
      const leaderboardRef = ref(db, 'leaderboard');
      const snapshot = await get(leaderboardRef);
      
      if (!snapshot.exists()) return [];
      
      const entries = snapshot.val();
      return Object.values(entries).sort((a: any, b: any) => b.points - a.points);
    } catch (error) {
      console.error('[FIREBASE] Error getting leaderboard:', error);
      return [];
    }
  },

  // Subscribe to leaderboard updates
  subscribeToLeaderboard(callback: (entries: any[]) => void) {
    try {
      const db = getDatabaseOrThrow();
      const leaderboardRef = ref(db, 'leaderboard');
      
      const unsubscribe = onValue(leaderboardRef, (snapshot) => {
        if (snapshot.exists()) {
          const entries = snapshot.val();
          const sortedEntries = Object.values(entries).sort((a: any, b: any) => b.points - a.points);
          console.log('[FIREBASE] Leaderboard update received:', sortedEntries);
          callback(sortedEntries);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('[FIREBASE] Error subscribing to leaderboard:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }
};

export default firebaseChess; 