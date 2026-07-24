// Read-only client for the global LawbChess ELO node (/chessElo) written by the
// droplet cron indexer (elo-indexer/, spec §8b). Clients can never write it — the
// rules lock writes to the indexer's service account.
//
// Bandwidth discipline: one-shot get() per address per session, memoized. No listeners.

import { database } from './firebaseApp';
import { ref, get } from 'firebase/database';

export interface GlobalEloEntry {
  elo: number;
  games: number;
}

const cache = new Map<string, GlobalEloEntry | null>();

/**
 * Global cross-chain PvP ELO for a player (initial 1200, K=32 — same math as the
 * on-chain per-chain rating). Returns null when the player has no finished
 * on-chain games anywhere (unrated) or Firebase is unavailable.
 */
export async function getGlobalElo(walletAddress: string): Promise<GlobalEloEntry | null> {
  const key = walletAddress.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    if (!database) return null;
    const snapshot = await get(ref(database, `chessElo/global/${key}`));
    const value = snapshot.exists() ? (snapshot.val() as GlobalEloEntry) : null;
    cache.set(key, value);
    return value;
  } catch (error) {
    console.error('[FIREBASE] Error getting global ELO:', error);
    return null;
  }
}
