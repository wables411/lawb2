import { database } from './firebaseApp';
import { ref, set, update, get, query, orderByChild, limitToLast, equalTo, remove } from "firebase/database";

// Helper function to check if database is available
const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
};

export interface LeaderboardEntry {
  username: string; // wallet address
  chain_type: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  points: number;
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
    const points = result === 'win' ? 3 : result === 'draw' ? 1 : 0;
    
    const updatedEntry: LeaderboardEntry = {
      username: walletAddress,
      chain_type: 'sanko',
      wins: (existingEntry?.wins || 0) + (result === 'win' ? 1 : 0),
      losses: (existingEntry?.losses || 0) + (result === 'loss' ? 1 : 0),
      draws: (existingEntry?.draws || 0) + (result === 'draw' ? 1 : 0),
      total_games: (existingEntry?.total_games || 0) + 1,
      points: (existingEntry?.points || 0) + points,
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

// Get top leaderboard entries (ordered by points descending)
export const getTopLeaderboardEntries = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
  try {
    const database = getDatabaseOrThrow();
    const leaderboardRef = ref(database, 'leaderboard');
    console.log('[LEADERBOARD] Fetching from Firebase path: leaderboard');
    
    const snapshot = await get(leaderboardRef);
    console.log('[LEADERBOARD] Snapshot exists:', snapshot.exists(), 'hasChildren:', snapshot.hasChildren());
    
    if (!snapshot.exists()) {
      console.log('[LEADERBOARD] No data in leaderboard path');
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val() as LeaderboardEntry;
      if (entry) {
        entries.push(entry);
      }
    });

    console.log('[LEADERBOARD] Found', entries.length, 'entries before sorting');

    // Sort by points descending, then by wins descending, then by total games ascending
    entries.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return a.total_games - b.total_games;
    });

    const result = entries.slice(0, limit);
    console.log('[LEADERBOARD] Returning', result.length, 'entries');
    return result;
  } catch (error: any) {
    console.error('[LEADERBOARD] Error getting top entries:', error, 'message:', error?.message);
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

// Get user's rank in leaderboard
export const getUserRank = async (walletAddress: string): Promise<number | null> => {
  try {
    if (!walletAddress) return null;

    const entries = await getTopLeaderboardEntries(1000); // Get all entries to find rank
    const userIndex = entries.findIndex(entry => 
      entry.username?.toLowerCase() === walletAddress.toLowerCase()
    );
    
    return userIndex >= 0 ? userIndex + 1 : null;
  } catch (error) {
    console.error('[LEADERBOARD] Error getting user rank:', error);
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