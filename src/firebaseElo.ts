// Read-only client for the global LawbChess ELO (spec §8b), written by the droplet
// cron indexer (elo-indexer/). Primary source: the static JSON the droplet serves at
// https://chess.lawb.xyz/elo.json (no credentials anywhere in the pipeline). Fallback:
// the read-only Firebase /chessElo node (clients can never write it).
//
// Bandwidth discipline: the whole payload is fetched at most once per session and
// memoized; per-address Firebase fallback reads are one-shot and memoized. No listeners.

import { database } from './firebaseApp';
import { ref, get } from 'firebase/database';

export interface GlobalEloEntry {
  elo: number;
  games: number;
}

const ELO_FEED_URL = 'https://chess.lawb.xyz/elo.json';

let feedPromise: Promise<Record<string, GlobalEloEntry> | null> | null = null;

function loadFeed(): Promise<Record<string, GlobalEloEntry> | null> {
  feedPromise ??= (async () => {
    try {
      const res = await fetch(ELO_FEED_URL);
      if (!res.ok) return null;
      const payload = (await res.json()) as { global?: Record<string, GlobalEloEntry> };
      return payload.global ?? null;
    } catch {
      return null;
    }
  })();
  return feedPromise;
}

const cache = new Map<string, GlobalEloEntry | null>();

/**
 * Global cross-chain PvP ELO for a player (initial 1200, K=32 — same math as the
 * on-chain per-chain rating). Returns null when the player has no finished
 * on-chain games anywhere (unrated) or no source is reachable.
 */
export async function getGlobalElo(walletAddress: string): Promise<GlobalEloEntry | null> {
  const key = walletAddress.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  const feed = await loadFeed();
  if (feed) {
    const value = feed[key] ?? null;
    cache.set(key, value);
    return value;
  }

  // Droplet feed unreachable — fall back to the Firebase mirror.
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
