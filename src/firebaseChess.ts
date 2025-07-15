import { database } from './firebaseApp';
import { ref, set, get, onValue, off, remove } from 'firebase/database';

// Helper function to check if database is available
const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
};

// Chess game operations with Firebase
export const firebaseChess = {
  // Get game state by inviteCode
  async getGame(inviteCode: string) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${inviteCode}`);
      const snapshot = await get(gameRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('[FIREBASE] Error getting game:', error);
      return null;
    }
  },

  // Update game state by inviteCode
  async updateGame(inviteCode: string, gameData: any) {
    if (!inviteCode) {
      console.error('[FIREBASE] Tried to update game with undefined inviteCode!', gameData);
      throw new Error('inviteCode is required for updateGame');
    }
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${inviteCode}`);
      await set(gameRef, {
        ...gameData,
        updated_at: new Date().toISOString()
      });
      console.log('[FIREBASE] Game updated successfully');
    } catch (error) {
      console.error('[FIREBASE] Error updating game:', error);
    }
  },

  // Subscribe to game updates (real-time that actually works)
  subscribeToGame(inviteCode: string, callback: (gameData: any) => void) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${inviteCode}`);
      
      console.log('[FIREBASE] Setting up Firebase real-time subscription for game:', inviteCode);
      
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          console.log('[FIREBASE] Game update received:', gameData);
          callback(gameData);
        }
      });

      console.log('[FIREBASE] Firebase subscription setup complete for game:', inviteCode);
      return unsubscribe;
    } catch (error) {
      console.error('[FIREBASE] Error subscribing to game:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Create new game by inviteCode
  async createGame(gameData: any) {
    const inviteCode = gameData.invite_code;
    if (!inviteCode) {
      console.error('[FIREBASE] Tried to create game with undefined inviteCode!', gameData);
      throw new Error('inviteCode is required for createGame');
    }
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${inviteCode}`);
      
      console.log('[FIREBASE] Creating game with data:', gameData);
      
      await set(gameRef, {
        ...gameData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('[FIREBASE] Game created successfully:', inviteCode);
      
      // Verify the game was created by reading it back
      const verificationSnapshot = await get(gameRef);
      if (verificationSnapshot.exists()) {
        console.log('[FIREBASE] Game verification successful:', verificationSnapshot.val());
      } else {
        console.error('[FIREBASE] Game creation verification failed - game not found after creation');
      }
    } catch (error) {
      console.error('[FIREBASE] Error creating game:', error);
      throw error; // Re-throw to allow proper error handling
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
      
      if (!snapshot.exists()) {
        console.log('[FIREBASE] No games found in database');
        return [];
      }
      
      const games = snapshot.val();
      console.log('[FIREBASE] All games in database:', games);
      
      const openGames = Object.values(games).filter((game: any) => {
        const isWaiting = game.game_state === 'waiting';
        const isPublic = game.is_public;
        const noRedPlayer = !game.red_player;
        
        console.log('[FIREBASE] Game filter check:', {
          inviteCode: game.invite_code,
          gameState: game.game_state,
          isPublic: game.is_public,
          redPlayer: game.red_player,
          isWaiting,
          isPublic,
          noRedPlayer,
          passes: isWaiting && isPublic && noRedPlayer
        });
        
        return isWaiting && isPublic && noRedPlayer;
      });
      
      // Sort by creation date (newest first)
      openGames.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log('[FIREBASE] Open games found:', openGames.length, openGames);
      return openGames;
    } catch (error) {
      console.error('[FIREBASE] Error getting open games:', error);
      return [];
    }
  },

  // Delete a game by inviteCode
  async deleteGame(inviteCode: string) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${inviteCode}`);
      await remove(gameRef);
      console.log('[FIREBASE] Game deleted:', inviteCode);
    } catch (error) {
      console.error('[FIREBASE] Error deleting game:', error);
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

// Utility to find a game by player address using contract mapping
// (This should be called from the frontend using ethers/web3 to get inviteCode, then use getGame)
export const findGameByPlayer = async (playerAddress: string) => {
  try {
    const db = getDatabaseOrThrow();
    const gamesRef = ref(db, 'chess_games');
    const snapshot = await get(gamesRef);
    if (!snapshot.exists()) return null;
    const games = snapshot.val();
    // Find the first game where a player is involved
    for (const key in games) {
      if (games[key].red_player === playerAddress || games[key].white_player === playerAddress) {
        return { ...games[key], invite_code: key };
      }
    }
    return null;
  } catch (error) {
    console.error('[FIREBASE] Error finding game by player:', error);
    return null;
  }
};

export default firebaseChess; 