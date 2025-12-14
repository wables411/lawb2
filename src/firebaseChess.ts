import { database } from './firebaseApp';
import { ref, set, get, onValue, off, remove, update } from 'firebase/database';

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
      await update(gameRef, {
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
      
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          callback(gameData);
        }
      });
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

  // Manually create game from transaction data
  async createGameFromTransaction(inviteCode: string, bluePlayer: string, wagerToken: string, wagerAmount: string) {
    try {
      const db = getDatabaseOrThrow();
      const gameRef = ref(db, `chess_games/${inviteCode}`);
      
      // Convert token address to symbol
      let tokenSymbol = 'DMT';
      if (wagerToken === '0x754cDAd6f5821077d6915004Be2cE05f93d176f8') {
        tokenSymbol = 'DMT';
      } else if (wagerToken === '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F') {
        tokenSymbol = 'LAWB';
      } else if (wagerToken === '0x6F5e2d3b8c5C5c5F9bcB4adCF40b13308e688D4D') {
        tokenSymbol = 'GOLD';
      } else if (wagerToken === '0xeA240b96A9621e67159c59941B9d588eb290ef09') {
        tokenSymbol = 'MOSS';
      }
      
      const gameData = {
        invite_code: inviteCode,
        game_title: `Chess Game ${inviteCode.slice(-6)}`,
        bet_amount: wagerAmount,
        bet_token: tokenSymbol,
        blue_player: bluePlayer,
        red_player: '0x0000000000000000000000000000000000000000',
        game_state: 'waiting_for_join',
        board: { 
          positions: {
            '0,0': 'R', '0,1': 'N', '0,2': 'B', '0,3': 'Q', '0,4': 'K', '0,5': 'B', '0,6': 'N', '0,7': 'R',
            '1,0': 'P', '1,1': 'P', '1,2': 'P', '1,3': 'P', '1,4': 'P', '1,5': 'P', '1,6': 'P', '1,7': 'P',
            '6,0': 'p', '6,1': 'p', '6,2': 'p', '6,3': 'p', '6,4': 'p', '6,5': 'p', '6,6': 'p', '6,7': 'p',
            '7,0': 'r', '7,1': 'n', '7,2': 'b', '7,3': 'q', '7,4': 'k', '7,5': 'b', '7,6': 'n', '7,7': 'r'
          }, 
          rows: 8, 
          cols: 8 
        },
        current_player: 'blue',
        chain: 'sanko',
        contract_address: '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56',
        is_public: true,
        created_at: new Date().toISOString()
      };
      
      await set(gameRef, gameData);
      console.log('[FIREBASE] Game created from transaction:', inviteCode, 'with token:', tokenSymbol);
      return gameData;
    } catch (error) {
      console.error('[FIREBASE] Error creating game from transaction:', error);
      throw error;
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
        game.game_state === 'waiting_for_join' || game.game_state === 'waiting' || game.game_state === 'active'
      );
    } catch (error) {
      console.error('[FIREBASE] Error getting active games:', error);
      return [];
    }
  },

  // Get open games (waiting for players to join)
  // Optionally filter by chain
  async getOpenGames(filterChain?: 'sanko' | 'base' | 'arbitrum') {
    try {
      const db = getDatabaseOrThrow();
      const gamesRef = ref(db, 'chess_games');
      const snapshot = await get(gamesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const games = snapshot.val();
      const totalGames = Object.keys(games || {}).length;
      
      const openGames = Object.values(games).filter((game: any) => {
        // Only show games that are waiting for join (not active yet)
        const isWaitingForJoin = game.game_state === 'waiting_for_join' || game.game_state === 'waiting';
        const isPublic = game.is_public !== false; // Default to true if not set
        const noRedPlayer = !game.red_player || game.red_player === '0x0000000000000000000000000000000000000000';
        
        // Additional check: if game_state is undefined, treat as waiting_for_join
        const hasValidState = game.game_state === 'waiting_for_join' || game.game_state === 'waiting' || game.game_state === undefined;
        
        // Chain filter (if specified)
        const matchesChain = !filterChain || !game.chain || game.chain === filterChain;
        
        return hasValidState && isPublic && noRedPlayer && matchesChain;
      });
      
      // Sort by creation date (newest first)
      openGames.sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      
      console.log('[FIREBASE] Found', openGames.length, 'open games out of', totalGames, 'total games', filterChain ? `(filtered by ${filterChain})` : '');
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