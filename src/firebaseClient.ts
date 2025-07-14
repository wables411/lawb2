import { database } from './firebaseApp';
import { ref, set, get, onValue, off } from 'firebase/database';

// Chess game operations
export const firebaseChess = {
  // Get game state
  async getGame(gameId: string) {
    if (!database) {
      console.error('[FIREBASE] Database not initialized');
      return null;
    }
    const gameRef = ref(database, `chess_games/${gameId}`);
    const snapshot = await get(gameRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Update game state
  async updateGame(gameId: string, gameData: any) {
    if (!database) {
      console.error('[FIREBASE] Database not initialized');
      return;
    }
    const gameRef = ref(database, `chess_games/${gameId}`);
    await set(gameRef, {
      ...gameData,
      updated_at: new Date().toISOString()
    });
  },

  // Subscribe to game updates (real-time)
  subscribeToGame(gameId: string, callback: (gameData: any) => void) {
    if (!database) {
      console.error('[FIREBASE] Database not initialized');
      return () => {};
    }
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
    if (!database) {
      console.error('[FIREBASE] Database not initialized');
      return;
    }
    const gameRef = ref(database, `chess_games/${gameData.game_id}`);
    await set(gameRef, {
      ...gameData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  },

  // Get all active games
  async getActiveGames() {
    if (!database) {
      console.error('[FIREBASE] Database not initialized');
      return [];
    }
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