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

/** One completed wager match from the indexer's cross-chain feed (newest first). */
export interface WagedMatch {
  chain: string;
  chainId: number;
  code: `0x${string}`;
  white: string;
  black: string;
  /** null = draw */
  winner: string | null;
  /** WagerKind: 0 native, 1 ERC-20, 2 ERC-721, 3 ERC-1155 */
  kind: number;
  token: `0x${string}`;
  /** stake per player as a decimal string (wei/base units; 721: 1) */
  wager: string;
  /** EndReason enum from the contract (6 = timeout, 7 = resign, 1 = checkmate, …) */
  reason: number;
  payout: string;
  whiteElo: number;
  blackElo: number;
  endedAt: number;
  /** staked NFTs with resolved images (721/1155 matches only) */
  nfts?: { staker: 'white' | 'black'; tokenId: string; image: string | null }[];
}

interface EloFeed {
  global?: Record<string, GlobalEloEntry>;
  matches?: WagedMatch[];
}

// Overridable for local dev (point VITE_ELO_FEED_URL at a fixture) — prod uses the droplet.
const ELO_FEED_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELO_FEED_URL) ||
  'https://chess.lawb.xyz/elo.json';

let feedPromise: Promise<EloFeed | null> | null = null;

function loadFeed(): Promise<EloFeed | null> {
  feedPromise ??= (async () => {
    try {
      const res = await fetch(ELO_FEED_URL);
      if (!res.ok) return null;
      return (await res.json()) as EloFeed;
    } catch {
      return null;
    }
  })();
  return feedPromise;
}

/** All completed wager matches (cross-chain, newest first); [] when the feed is unreachable. */
export async function getWagedMatches(): Promise<WagedMatch[]> {
  const feed = await loadFeed();
  return feed?.matches ?? [];
}

const cache = new Map<string, GlobalEloEntry | null>();

/**
 * The whole global-ELO table (lowercased wallet -> entry), one fetch per session.
 * Null when the droplet feed is unreachable — callers should degrade gracefully
 * (e.g. the leaderboard just omits its ELO badges).
 */
export async function getGlobalEloFeed(): Promise<Record<string, GlobalEloEntry> | null> {
  return (await loadFeed())?.global ?? null;
}

/**
 * Global cross-chain PvP ELO for a player (initial 1200, K=32 — same math as the
 * on-chain per-chain rating). Returns null when the player has no finished
 * on-chain games anywhere (unrated) or no source is reachable.
 */
export async function getGlobalElo(walletAddress: string): Promise<GlobalEloEntry | null> {
  const key = walletAddress.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  const feed = (await loadFeed())?.global;
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
