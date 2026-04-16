/**
 * Chess RTDB surface — keep reads bounded:
 * - Prefer `getActiveGames` / `getOpenGames` (indexed queries), not full-tree reads.
 * - UI: subscribe to `chess_games/{inviteCode}` only while in a match; never `subscribeToAllGames` in production UI.
 */
import { database } from './firebaseApp';
import { ref, set, get, onValue, off, remove, update, query, orderByChild, equalTo } from 'firebase/database';
const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429'.toLowerCase();

// Board positions keys historically existed in two formats:
// - legacy: "row,col" (comma)
// - current: "row_col" (underscore) used by the UI
// Normalize on read so old games keep working.
const normalizePositionsKeys = (positions: unknown) => {
  if (!positions || typeof positions !== 'object') return positions;
  const entries = Object.entries(positions as Record<string, unknown>);
  let changed = false;
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    const nextKey = key.includes(',') ? key.replace(',', '_') : key;
    if (nextKey !== key) changed = true;
    normalized[nextKey] = value;
  }

  return changed ? normalized : positions;
};

const normalizeGameData = (gameData: any) => {
  const positions = gameData?.board?.positions;
  const normalizedPositions = normalizePositionsKeys(positions);
  if (normalizedPositions !== positions) {
    return {
      ...gameData,
      board: {
        ...gameData.board,
        positions: normalizedPositions
      }
    };
  }
  return gameData;
};

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
      return snapshot.exists() ? normalizeGameData(snapshot.val()) : null;
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
          const gameData = normalizeGameData(snapshot.val());
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
            '0_0': 'R', '0_1': 'N', '0_2': 'B', '0_3': 'Q', '0_4': 'K', '0_5': 'B', '0_6': 'N', '0_7': 'R',
            '1_0': 'P', '1_1': 'P', '1_2': 'P', '1_3': 'P', '1_4': 'P', '1_5': 'P', '1_6': 'P', '1_7': 'P',
            '6_0': 'p', '6_1': 'p', '6_2': 'p', '6_3': 'p', '6_4': 'p', '6_5': 'p', '6_6': 'p', '6_7': 'p',
            '7_0': 'r', '7_1': 'n', '7_2': 'b', '7_3': 'q', '7_4': 'k', '7_5': 'b', '7_6': 'n', '7_7': 'r'
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

  // Get all active games (query by state — avoids full chess_games download)
  async getActiveGames() {
    try {
      const db = getDatabaseOrThrow();
      const states = ['waiting_for_join', 'waiting', 'active'] as const;
      const all: Array<{ key: string; game: any }> = [];
      for (const s of states) {
        const q = query(ref(db, 'chess_games'), orderByChild('game_state'), equalTo(s));
        const snap = await get(q);
        if (snap.exists()) snap.forEach((child) => { all.push({ key: child.key!, game: child.val() }); });
      }
      return all.map(({ key, game }) => ({ ...normalizeGameData(game), invite_code: key }));
    } catch (error) {
      console.error('[FIREBASE] Error getting active games:', error);
      return [];
    }
  },

  // Get open games (waiting for players to join) — query by state, not full tree
  async getOpenGames(filterChain?: 'sanko' | 'base' | 'arbitrum') {
    try {
      const db = getDatabaseOrThrow();
      const all: Array<{ key: string; game: any }> = [];
      for (const s of ['waiting_for_join', 'waiting'] as const) {
        const q = query(ref(db, 'chess_games'), orderByChild('game_state'), equalTo(s));
        const snap = await get(q);
        if (snap.exists()) snap.forEach((child) => { all.push({ key: child.key!, game: child.val() }); });
      }
      const openGames = all
        .map(({ key, game }) => ({ ...normalizeGameData(game), invite_code: key }))
        .filter((game: any) => {
          const isPublic = game.is_public !== false;
          const noRedPlayer = !game.red_player || game.red_player === '0x0000000000000000000000000000000000000000';
          const matchesChain = !filterChain || !game.chain || game.chain === filterChain;
          return isPublic && noRedPlayer && matchesChain;
        });
      openGames.sort((a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      console.log('[FIREBASE] Found', openGames.length, 'open games (queried by state)', filterChain ? `(filtered by ${filterChain})` : '');
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
  },

  async getActiveVsClawbGame() {
    try {
      const db = getDatabaseOrThrow();
      const q = query(ref(db, 'chess_games'), orderByChild('game_type'), equalTo('vs_clawb'));
      const snap = await get(q);
      if (!snap.exists()) return null;
      const vsClawb: Array<{ key: string; game: any }> = [];
      snap.forEach((child) => { vsClawb.push({ key: child.key!, game: child.val() }); });
      const active = vsClawb
        .filter(({ game }) => game?.game_state === 'active')
        .map(({ key, game }) => ({ ...normalizeGameData(game), invite_code: key }));
      active.sort((a: any, b: any) =>
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
      );
      return active[0] || null;
    } catch (error) {
      console.error('[FIREBASE] Error getting active vs_clawb game:', error);
      return null;
    }
  },

  // Prefer any active game where Clawb is a player (vs_clawb or PVP/public).
  async getActiveClawbGame() {
    try {
      const q = query(ref(getDatabaseOrThrow(), 'chess_games'), orderByChild('game_state'), equalTo('active'));
      const snap = await get(q);
      if (!snap.exists()) return null;
      const clawbGames: Array<{ key: string; game: any }> = [];
      snap.forEach((child) => { clawbGames.push({ key: child.key!, game: child.val() }); });
      const filtered = clawbGames
        .filter(({ game }) => {
          const blue = String(game?.blue_player || '').toLowerCase();
          const red = String(game?.red_player || '').toLowerCase();
          return blue === CLAWB_WALLET || red === CLAWB_WALLET;
        })
        .map(({ key, game }) => ({ ...normalizeGameData(game), invite_code: key }));

      filtered.sort((a: any, b: any) =>
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
      );
      return filtered[0] || null;
    } catch (error) {
      console.error('[FIREBASE] Error getting active Clawb game:', error);
      return null;
    }
  },

  subscribeToAllGames(callback: (games: Record<string, any>) => void) {
    try {
      const db = getDatabaseOrThrow();
      const gamesRef = ref(db, 'chess_games');
      return onValue(gamesRef, (snapshot) => {
        if (snapshot.exists()) callback(snapshot.val());
        else callback({});
      });
    } catch (error) {
      console.error('[FIREBASE] Error subscribing to all games:', error);
      return () => {};
    }
  }
};

// Utility to find a game by player address — reuses getActiveGames (query-based, not full tree)
export const findGameByPlayer = async (playerAddress: string) => {
  try {
    const games = await firebaseChess.getActiveGames();
    const needle = (playerAddress || '').toLowerCase();
    const match = games.find(
      (g: any) =>
        (g.red_player || '').toLowerCase() === needle || (g.blue_player || '').toLowerCase() === needle
    );
    return match || null;
  } catch (error) {
    console.error('[FIREBASE] Error finding game by player:', error);
    return null;
  }
};

export default firebaseChess; 