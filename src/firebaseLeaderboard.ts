import { database } from './firebaseApp';
import { ref, set, update, get, query, orderByChild, limitToLast, remove } from 'firebase/database';

// Helper function to check if database is available
const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
};

export interface PointsBreakdown {
  chess: number;
  stream: number;
  games: number;
  holdings: number;
  [key: string]: number; // extensible for future sources
}

export interface LeaderboardEntry {
  username: string; // wallet address
  chain_type: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  points: number;           // ecosystem total (sum of breakdown)
  points_breakdown?: PointsBreakdown;
  created_at: string;
  updated_at: string;
}

// Format wallet address for display (e.g., "0x1234...5678")
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Get a specific user's leaderboard entry
export const getUserLeaderboardEntry = async (walletAddress: string): Promise<LeaderboardEntry | null> => {
  try {
    if (!walletAddress) {
      console.error('[LEADERBOARD] No wallet address provided');
      return null;
    }

    const database = getDatabaseOrThrow();
    const entryRef = ref(database, `leaderboard/${walletAddress}`);
    const snapshot = await get(entryRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as LeaderboardEntry;
    }
    
    return null;
  } catch (error) {
    console.error('[LEADERBOARD] Error getting user entry:', error);
    return null;
  }
};

// Update or create a leaderboard entry
export const updateLeaderboardEntry = async (
  walletAddress: string, 
  result: 'win' | 'loss' | 'draw'
): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error('[LEADERBOARD] No wallet address provided');
      return false;
    }
    
    // Prevent zero addresses from being recorded in leaderboard
    if (walletAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('[LEADERBOARD] Skipping leaderboard update for zero address');
      return false;
    }

    const now = new Date().toISOString();
    const database = getDatabaseOrThrow();
    const entryRef = ref(database, `leaderboard/${walletAddress}`);
    
    // Get existing entry
    const snapshot = await get(entryRef);
    const existingEntry = snapshot.exists() ? snapshot.val() as LeaderboardEntry : null;
    
    // Calculate new values
    const chessPoints = result === 'win' ? 3 : result === 'draw' ? 1 : 0;

    // Migrate existing entries: treat all legacy points as chess
    const breakdown: PointsBreakdown = existingEntry?.points_breakdown || {
      chess: existingEntry?.points || 0,
      stream: 0,
      games: 0,
      holdings: 0,
    };
    breakdown.chess = (breakdown.chess || 0) + chessPoints;

    const totalPoints = Object.values(breakdown).reduce(
      (sum, v) => sum + (typeof v === 'number' ? v : 0),
      0,
    );

    const updatedEntry: LeaderboardEntry = {
      username: walletAddress,
      chain_type: 'sanko',
      wins: (existingEntry?.wins || 0) + (result === 'win' ? 1 : 0),
      losses: (existingEntry?.losses || 0) + (result === 'loss' ? 1 : 0),
      draws: (existingEntry?.draws || 0) + (result === 'draw' ? 1 : 0),
      total_games: (existingEntry?.total_games || 0) + 1,
      points: totalPoints,
      points_breakdown: breakdown,
      created_at: existingEntry?.created_at || now,
      updated_at: now
    };

    // Update the entry
    await set(entryRef, updatedEntry);
    
    console.log('[LEADERBOARD] Successfully updated entry for:', formatAddress(walletAddress), 'Result:', result);
    return true;
  } catch (error) {
    console.error('[LEADERBOARD] Error updating leaderboard entry:', error);
    return false;
  }
};

// Update both players' scores when a game ends
export const updateBothPlayersScores = async (
  winner: 'blue' | 'red',
  bluePlayerAddress: string,
  redPlayerAddress: string
): Promise<boolean> => {
  try {
    if (!bluePlayerAddress || !redPlayerAddress) {
      console.error('[LEADERBOARD] Missing player addresses');
      return false;
    }
    
    // Prevent zero addresses from being recorded in leaderboard
    if (bluePlayerAddress === '0x0000000000000000000000000000000000000000' || 
        redPlayerAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('[LEADERBOARD] Skipping leaderboard update - one or both players have zero addresses:', {
        bluePlayer: bluePlayerAddress,
        redPlayer: redPlayerAddress
      });
      return false;
    }

    console.log('[LEADERBOARD] Updating both players scores:', {
      winner,
      bluePlayer: formatAddress(bluePlayerAddress),
      redPlayer: formatAddress(redPlayerAddress)
    });

    // Update blue player
    const blueResult = winner === 'blue' ? 'win' : winner === 'red' ? 'loss' : 'draw';
    await updateLeaderboardEntry(bluePlayerAddress, blueResult);

    // Update red player
    const redResult = winner === 'red' ? 'win' : winner === 'blue' ? 'loss' : 'draw';
    await updateLeaderboardEntry(redPlayerAddress, redResult);

    console.log('[LEADERBOARD] Successfully updated both players scores');
    return true;
  } catch (error) {
    console.error('[LEADERBOARD] Error updating both players scores:', error);
    return false;
  }
};

const LEADERBOARD_QUERY_CAP = 250;

/**
 * Top entries by points using a single indexed query (avoids downloading the entire `leaderboard` tree).
 * Requires `.indexOn": ["points"]` on `leaderboard` in Firebase rules (see database.rules.json).
 */
export const getTopLeaderboardEntries = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
  try {
    const db = getDatabaseOrThrow();
    const leaderboardRef = ref(db, 'leaderboard');
    const capped = Math.min(Math.max(1, limit), LEADERBOARD_QUERY_CAP);
    const q = query(leaderboardRef, orderByChild('points'), limitToLast(capped));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val() as LeaderboardEntry;
      if (entry && typeof entry.points === 'number') {
        entries.push(entry);
      }
    });

    entries.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return a.total_games - b.total_games;
    });

    return entries.slice(0, limit);
  } catch (error: unknown) {
    console.error(
      '[LEADERBOARD] Error getting top entries (is `.indexOn: [\"points\"]` deployed on `leaderboard`?):',
      error,
    );
    return [];
  }
};

// Get leaderboard entry by rank (1-based)
export const getLeaderboardEntryByRank = async (rank: number): Promise<LeaderboardEntry | null> => {
  try {
    const entries = await getTopLeaderboardEntries(rank);
    return entries[rank - 1] || null;
  } catch (error) {
    console.error('[LEADERBOARD] Error getting entry by rank:', error);
    return null;
  }
};

// Rank among top LEADERBOARD_QUERY_CAP by points; null if outside that window or unranked
export const getUserRank = async (walletAddress: string): Promise<number | null> => {
  try {
    if (!walletAddress) return null;

    const entries = await getTopLeaderboardEntries(LEADERBOARD_QUERY_CAP);
    const userIndex = entries.findIndex(
      (entry) => entry.username?.toLowerCase() === walletAddress.toLowerCase(),
    );

    return userIndex >= 0 ? userIndex + 1 : null;
  } catch (error) {
    console.error('[LEADERBOARD] Error getting user rank:', error);
    return null;
  }
};

// Add ecosystem points from any source (stream, games, holdings, etc.)
export const addEcosystemPoints = async (
  walletAddress: string,
  source: keyof PointsBreakdown,
  amount: number
): Promise<boolean> => {
  try {
    if (!walletAddress || amount <= 0) return false;
    if (walletAddress === '0x0000000000000000000000000000000000000000') return false;

    const now = new Date().toISOString();
    const database = getDatabaseOrThrow();
    const entryRef = ref(database, `leaderboard/${walletAddress}`);

    const snapshot = await get(entryRef);
    const existingEntry = snapshot.exists() ? snapshot.val() as LeaderboardEntry : null;

    const breakdown: PointsBreakdown = existingEntry?.points_breakdown || {
      chess: existingEntry?.points || 0,
      stream: 0,
      games: 0,
      holdings: 0,
    };
    breakdown[source] = (breakdown[source] || 0) + amount;

    const totalPoints = Object.values(breakdown).reduce(
      (sum, v) => sum + (typeof v === 'number' ? v : 0),
      0,
    );

    if (existingEntry) {
      await update(entryRef, {
        points: totalPoints,
        points_breakdown: breakdown,
        updated_at: now,
      });
    } else {
      await set(entryRef, {
        username: walletAddress,
        chain_type: 'base',
        wins: 0,
        losses: 0,
        draws: 0,
        total_games: 0,
        points: totalPoints,
        points_breakdown: breakdown,
        created_at: now,
        updated_at: now,
      });
    }

    console.log(`[LEADERBOARD] +${amount} ${source} points for ${formatAddress(walletAddress)} (total: ${totalPoints})`);
    return true;
  } catch (error) {
    console.error('[LEADERBOARD] Error adding ecosystem points:', error);
    return false;
  }
};

// Set holdings points to an absolute value (idempotent sync).
export const setHoldingsPoints = async (
  walletAddress: string,
  holdingsPoints: number
): Promise<boolean> => {
  try {
    if (!walletAddress || holdingsPoints < 0) return false;
    if (walletAddress === '0x0000000000000000000000000000000000000000') return false;

    const now = new Date().toISOString();
    const dbRef = getDatabaseOrThrow();
    const entryRef = ref(dbRef, `leaderboard/${walletAddress}`);

    const snapshot = await get(entryRef);
    const existingEntry = snapshot.exists() ? snapshot.val() as LeaderboardEntry : null;

    const breakdown: PointsBreakdown = existingEntry?.points_breakdown || {
      chess: existingEntry?.points || 0,
      stream: 0,
      games: 0,
      holdings: 0,
    };
    breakdown.holdings = holdingsPoints;

    const totalPoints = Object.values(breakdown).reduce(
      (sum, v) => sum + (typeof v === 'number' ? v : 0),
      0
    );

    if (existingEntry) {
      await update(entryRef, {
        points: totalPoints,
        points_breakdown: breakdown,
        updated_at: now,
      });
    } else {
      await set(entryRef, {
        username: walletAddress,
        chain_type: walletAddress.startsWith('0x') ? 'base' : 'solana',
        wins: 0,
        losses: 0,
        draws: 0,
        total_games: 0,
        points: totalPoints,
        points_breakdown: breakdown,
        created_at: now,
        updated_at: now,
      });
    }

    console.log(`[LEADERBOARD] holdings points synced for ${formatAddress(walletAddress)} => ${holdingsPoints}`);
    return true;
  } catch (error) {
    console.error('[LEADERBOARD] Error setting holdings points:', error);
    return false;
  }
};

// Get a user's points breakdown
export const getUserPointsBreakdown = async (walletAddress: string): Promise<PointsBreakdown | null> => {
  try {
    const entry = await getUserLeaderboardEntry(walletAddress);
    if (!entry) return null;
    return entry.points_breakdown || { chess: entry.points || 0, stream: 0, games: 0, holdings: 0 };
  } catch (error) {
    console.error('[LEADERBOARD] Error getting points breakdown:', error);
    return null;
  }
};

// Reset a user's leaderboard entry (for testing/admin purposes)
export const resetUserLeaderboard = async (walletAddress: string): Promise<boolean> => {
  try {
    if (!walletAddress) return false;

    const now = new Date().toISOString();
    const database = getDatabaseOrThrow();
    const entryRef = ref(database, `leaderboard/${walletAddress}`);
    
    const resetEntry: LeaderboardEntry = {
      username: walletAddress,
      chain_type: 'sanko',
      wins: 0,
      losses: 0,
      draws: 0,
      total_games: 0,
      points: 0,
      points_breakdown: { chess: 0, stream: 0, games: 0, holdings: 0 },
      created_at: now,
      updated_at: now
    };

    await set(entryRef, resetEntry);
    console.log('[LEADERBOARD] Reset leaderboard for:', formatAddress(walletAddress));
    return true;
  } catch (error) {
    console.error('[LEADERBOARD] Error resetting user leaderboard:', error);
    return false;
  }
};

// Remove zero address entry from leaderboard
export const removeZeroAddressEntry = async (): Promise<boolean> => {
  try {
    const database = getDatabaseOrThrow();
    const zeroAddressRef = ref(database, 'leaderboard/0x0000000000000000000000000000000000000000');
    
    await remove(zeroAddressRef);
    console.log('[LEADERBOARD] Removed zero address entry from leaderboard');
    return true;
  } catch (error) {
    console.error('[LEADERBOARD] Error removing zero address entry:', error);
    return false;
  }
}; 