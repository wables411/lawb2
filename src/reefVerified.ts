// Read-only client for the Reef Run verified-score store, written by the replay
// validator (reef-validator/) after it reproduces each submitted run proof.
// Source: https://reef.lawb.xyz/verified — credential-free, same pattern as the
// chess ELO feed (firebaseElo.ts reads elo.json). No Firebase involved.
//
// Bandwidth discipline: the whole payload is fetched at most once per session
// and memoized. No listeners, no polling.

export interface ReefVerifiedEntry {
  /** Longest replay-verified survival, in seconds. */
  best_survival_sec: number;
  best_points: number;
  total_points: number;
  runs: number;
  /** ISO timestamp of the most recent accepted run. */
  last_at: string | null;
}

interface ReefVerifiedFeed {
  wallets?: Record<string, ReefVerifiedEntry>;
}

// Same base the game submits proofs to (ArcadeSceneController.submitRunProof);
// prod default so read-only surfaces work even without the env var.
const REEF_VALIDATOR_BASE = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REEF_VALIDATOR_URL) ||
  'https://reef.lawb.xyz'
).replace(/\/+$/, '');

let feedPromise: Promise<Record<string, ReefVerifiedEntry> | null> | null = null;

/**
 * The whole verified table (lowercased wallet -> aggregates), one fetch per
 * session. Null when the validator is unreachable — callers should degrade
 * gracefully (surfaces just omit their ✓ badges).
 */
export function getReefVerifiedFeed(): Promise<Record<string, ReefVerifiedEntry> | null> {
  feedPromise ??= (async () => {
    try {
      const res = await fetch(`${REEF_VALIDATOR_BASE}/verified`);
      if (!res.ok) return null;
      const feed = (await res.json()) as ReefVerifiedFeed;
      return feed.wallets ?? null;
    } catch {
      return null;
    }
  })();
  return feedPromise;
}

/**
 * Best replay-verified Reef Run aggregates across a profile's wallets (the
 * verified store is keyed by whichever wallet actually played). Null when none
 * of the wallets has a verified run or the feed is unreachable.
 */
export async function getBestReefVerified(
  wallets: readonly string[],
): Promise<ReefVerifiedEntry | null> {
  const feed = await getReefVerifiedFeed();
  if (!feed) return null;
  let best: ReefVerifiedEntry | null = null;
  for (const w of wallets) {
    const hit = feed[w.toLowerCase()];
    if (
      hit &&
      (!best ||
        hit.best_survival_sec > best.best_survival_sec ||
        (hit.best_survival_sec === best.best_survival_sec && hit.runs > best.runs))
    ) {
      best = hit;
    }
  }
  return best;
}
