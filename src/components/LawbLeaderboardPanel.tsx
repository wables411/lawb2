import React, { useEffect, useState } from 'react';
import { database } from '../firebaseApp';
import { firebaseProfiles } from '../firebaseProfiles';
import {
  formatAddress,
  getTopLeaderboardEntries,
  mergeLeaderboardEntriesForDisplay,
  normalizeLeaderboardPathKey,
  type LeaderboardEntry,
  type PointsBreakdown,
} from '../firebaseLeaderboard';
import { getDisplayName } from '../utils/displayName';
import { getGlobalEloFeed, getWagedMatches, type GlobalEloEntry, type WagedMatch } from '../firebaseElo';
import { getReefVerifiedFeed, type ReefVerifiedEntry } from '../reefVerified';
import {
  LAWB_CHESS_NFT_COLLECTIONS,
  LAWB_CHESS_WAGER_TOKENS,
} from '../config/lawbChessOnchain';
import {
  linuxNotesHeaderStyle,
  linuxNotesPillStyle,
  linuxNotesSectionStyle,
  linuxNotesShellStyle,
  linuxNotesSubtleTextStyle,
} from './linuxNotesTheme';

/** Group key for linked EVM + Solana rows that share one primary profile. */
function primaryGroupKey(addr: string): string {
  const n = normalizeLeaderboardPathKey(addr.trim());
  if (n) return n;
  const t = addr.trim();
  return t.startsWith('0x') ? t.toLowerCase() : t;
}

/** Fetch extra raw rows so after merging linked keys we still have up to `outLimit` distinct players. */
const RAW_LEADERBOARD_FETCH = 100;

const ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px minmax(0, 1fr) 70px',
  gap: '6px',
  alignItems: 'center',
  fontSize: '12px',
  padding: '8px 0',
  borderBottom: '1px solid #dfdfda',
};

type LeaderboardFilter = 'total' | 'chess' | 'reef_run' | 'holdings' | 'stream';

const CHAIN_NAMES: Record<string, string> = { ethereum: 'Ethereum', arbitrum: 'Arbitrum', base: 'Base' };
const END_REASONS: Record<number, string> = {
  1: 'checkmate', 2: 'stalemate', 3: '50-move', 4: 'insufficient material', 5: 'threefold', 6: 'timeout', 7: 'resignation',
};

/** Human stake label from the frontend's own per-chain token/collection tables (no extra RPC). */
function matchStakeLabel(m: WagedMatch): string {
  if (m.kind === 0) return `${Number(m.wager) / 1e18} ETH each`;
  if (m.kind === 1) {
    const t = (LAWB_CHESS_WAGER_TOKENS[m.chainId] ?? []).find((x) => x.address.toLowerCase() === m.token.toLowerCase());
    if (t) return `${Number(m.wager) / 10 ** t.decimals} ${t.label.split(' ')[0]} each`;
    return `${m.token.slice(0, 6)}…${m.token.slice(-4)} tokens`;
  }
  const c = (LAWB_CHESS_NFT_COLLECTIONS[m.chainId] ?? []).find((x) => x.address.toLowerCase() === m.token.toLowerCase());
  const name = c ? c.label : `${m.token.slice(0, 6)}…${m.token.slice(-4)}`;
  const ids = m.nfts?.map((n) => `#${n.tokenId}`).join(' vs ');
  return `${name}${ids ? ` ${ids}` : ''} · winner takes both`;
}

/** m:ss for verified survival badges. */
function formatSurvival(sec: number): string {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function pointsForFilter(entry: LeaderboardEntry, filter: LeaderboardFilter): number {
  const b = (entry.points_breakdown || {}) as Partial<PointsBreakdown>;
  switch (filter) {
    case 'chess':
      return b.chess || 0;
    case 'reef_run':
      // Keep backward compatibility with legacy "games" reef points.
      return (b.reef_run || 0) + (b.games || 0);
    case 'holdings':
      return b.holdings || 0;
    case 'stream':
      return b.stream || 0;
    case 'total':
    default:
      return entry.points || 0;
  }
}

/**
 * One-shot fetch of top leaderboard rows (indexed query, no realtime listener).
 */
export const LawbLeaderboardPanel: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameByKey, setNameByKey] = useState<Record<string, string>>({});
  // On-chain chess ELO badge per merged row (keyed by the row's primary wallet). A profile's
  // rating lives under whichever linked wallet actually played, so the group's wallets are
  // all checked against the indexer feed and the most-played one wins.
  const [eloByKey, setEloByKey] = useState<Record<string, GlobalEloEntry>>({});
  // Replay-verified Reef Run bests per merged row (validator feed, one fetch per
  // session — see reefVerified.ts). Same wallet-group resolution as the ELO badge.
  const [reefByKey, setReefByKey] = useState<Record<string, ReefVerifiedEntry>>({});
  const [filter, setFilter] = useState<LeaderboardFilter>('total');
  // Completed on-chain wager matches (indexer feed; same single fetch as the ELO badges).
  const [matches, setMatches] = useState<WagedMatch[]>([]);
  const [matchNames, setMatchNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    void getWagedMatches().then(async (list) => {
      if (cancelled) return;
      setMatches(list);
      const addrs = [...new Set(list.flatMap((m) => [m.white, m.black]))];
      const pairs = await Promise.all(addrs.map(async (a) => [a, await getDisplayName(a)] as const));
      if (!cancelled) setMatchNames(Object.fromEntries(pairs));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!database) {
        setError('Leaderboard unavailable (Firebase not configured).');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const raw = await getTopLeaderboardEntries(RAW_LEADERBOARD_FETCH);
        const withPrimary = await Promise.all(
          raw.map(async (e) => ({
            entry: e,
            primary: primaryGroupKey(await firebaseProfiles.getPrimaryWallet(e.username)),
          })),
        );
        const groups = new Map<string, LeaderboardEntry[]>();
        for (const { entry, primary } of withPrimary) {
          const list = groups.get(primary) ?? [];
          list.push(entry);
          groups.set(primary, list);
        }
        const merged: LeaderboardEntry[] = [];
        for (const [primary, list] of groups) {
          const m = mergeLeaderboardEntriesForDisplay(list);
          if (m) {
            m.username = primary;
            merged.push(m);
          }
        }
        const data = merged.slice(0, 25);
        // ELO + verified-reef badges: one feed fetch each per session; silently
        // absent when unreachable.
        const [feed, reefFeed] = await Promise.all([getGlobalEloFeed(), getReefVerifiedFeed()]);
        const elos: Record<string, GlobalEloEntry> = {};
        if (feed) {
          for (const [primary, list] of groups) {
            let best: GlobalEloEntry | null = null;
            for (const e of list) {
              const hit = feed[e.username.toLowerCase()];
              if (hit && (!best || hit.games > best.games || (hit.games === best.games && hit.elo > best.elo))) {
                best = hit;
              }
            }
            if (best) elos[primary] = best;
          }
        }
        const reefs: Record<string, ReefVerifiedEntry> = {};
        if (reefFeed) {
          for (const [primary, list] of groups) {
            let best: ReefVerifiedEntry | null = null;
            for (const e of list) {
              const hit = reefFeed[e.username.toLowerCase()];
              if (
                hit &&
                (!best ||
                  hit.best_survival_sec > best.best_survival_sec ||
                  (hit.best_survival_sec === best.best_survival_sec && hit.runs > best.runs))
              ) {
                best = hit;
              }
            }
            if (best) reefs[primary] = best;
          }
        }
        if (!cancelled) {
          setRows(data);
          setEloByKey(elos);
          setReefByKey(reefs);
          if (data.length === 0) {
            setError(null);
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (rows.length === 0) {
      setNameByKey({});
      return;
    }
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        rows.map(async (r) => {
          const key = r.username;
          const name = await getDisplayName(key);
          return [key, name] as const;
        }),
      );
      if (!cancelled) setNameByKey(Object.fromEntries(pairs));
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  return (
    <div
      style={{
        ...linuxNotesShellStyle(isMobile),
        minHeight: 200,
        maxHeight: isMobile ? '70vh' : 420,
        overflow: 'auto',
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <h3 style={linuxNotesHeaderStyle(isMobile)}>Lawb Leaderboard</h3>
        <div style={linuxNotesPillStyle(isMobile)}>Top 25 with score filter</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {([
          ['total', 'Total'],
          ['chess', 'Chess'],
          ['reef_run', 'Reef Run'],
          ['holdings', 'Lawb'],
          ['stream', 'Stream'],
        ] as [LeaderboardFilter, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              ...linuxNotesPillStyle(isMobile),
              cursor: 'pointer',
              background: filter === id ? '#d8bf77' : '#efefe9',
              borderColor: filter === id ? '#a78943' : '#c9c9c2',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p style={{ ...linuxNotesSubtleTextStyle(isMobile), marginBottom: 10 }}>
        Sorted by selected score source. Linked wallets under the same Lawb profile are merged into one row (points added
        together). Open your Lawb Profile for a per-source breakdown.
      </p>
      {loading && <p style={{ margin: 0 }}>Loading…</p>}
      {error && <p style={{ margin: 0, color: '#a00' }}>{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p style={{ margin: 0 }}>No entries yet. Play Lawb Chess when it returns to earn points.</p>
      )}
      {!loading && rows.length > 0 && (
        <div
          style={{
            ...linuxNotesSectionStyle(isMobile),
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              ...ROW_STYLE,
              fontWeight: 'bold',
              borderBottom: '1px solid #d3d3ce',
              paddingBottom: 6,
              color: '#666761',
            }}
          >
            <span>#</span>
            <span>Player</span>
            <span style={{ textAlign: 'right' }}>Pts</span>
          </div>
          {[...rows]
            .sort((a, b) => {
              const av = pointsForFilter(a, filter);
              const bv = pointsForFilter(b, filter);
              if (bv !== av) return bv - av;
              if (b.wins !== a.wins) return b.wins - a.wins;
              return a.total_games - b.total_games;
            })
            .map((entry, i) => {
            const key = entry.username;
            const resolvedRaw = (nameByKey[key] ?? formatAddress(key)).trim();
            const resolved = resolvedRaw.startsWith('@') ? resolvedRaw.slice(1) : resolvedRaw;
            const shortKey = formatAddress(key);
            const sub =
              resolved && resolved !== shortKey ? (
                <div
                  style={{
                    fontSize: 10,
                    color: '#555',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={key}
                >
                  {shortKey}
                </div>
              ) : null;
            const mainLooksLikeAddr = /\.\.\./.test(resolved);
            const mainLabel = !mainLooksLikeAddr && resolved ? `@${resolved}` : resolved;
            return (
              <div key={key || i} style={ROW_STYLE}>
                <span style={{ color: '#6f7068', fontWeight: 600 }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={key}
                  >
                    {mainLabel}
                  </div>
                  {sub}
                  {eloByKey[key] && (
                    <div style={{ fontSize: 10, color: '#6a5a24', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ♟ ELO {eloByKey[key].elo} · {eloByKey[key].games} on-chain {eloByKey[key].games === 1 ? 'game' : 'games'}
                    </div>
                  )}
                  {reefByKey[key] && (
                    <div
                      style={{ fontSize: 10, color: '#1f6f3f', fontWeight: 700, whiteSpace: 'nowrap' }}
                      title="Replay-verified by the Reef Run validator (reef.lawb.xyz) — every run is publicly recomputable"
                    >
                      ✓ Verified reef best {formatSurvival(reefByKey[key].best_survival_sec)} ·{' '}
                      {reefByKey[key].runs} {reefByKey[key].runs === 1 ? 'run' : 'runs'}
                    </div>
                  )}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700 }}>
                  {pointsForFilter(entry, filter)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {matches.length > 0 && (
        <div style={{ ...linuxNotesSectionStyle(isMobile), marginTop: 12, paddingTop: 8, paddingBottom: 8 }}>
          <h3 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 4 }}>⚔ Waged Matches</h3>
          <p style={{ ...linuxNotesSubtleTextStyle(isMobile), marginBottom: 8 }}>
            Every completed on-chain wager match — escrow, moves, and payout all settled by the contract.
          </p>
          {matches.map((m) => {
            const nameOf = (a: string) => {
              const n = (matchNames[a] ?? '').trim();
              return n && !/\.\.\./.test(n) ? `@${n.replace(/^@/, '')}` : formatAddress(a);
            };
            const isDraw = !m.winner;
            const winner = isDraw ? null : m.winner!;
            const loser = isDraw ? null : winner === m.white ? m.black : m.white;
            const when = new Date(m.endedAt * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return (
              <div key={`${m.chain}:${m.code}:${m.endedAt}`} style={{ padding: '10px 0', borderBottom: '1px solid #dfdfda', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  {isDraw ? (
                    <span style={{ fontWeight: 700 }}>{nameOf(m.white)} ½–½ {nameOf(m.black)}</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 700, color: '#6a5a24' }} title={winner!}>🏆 {nameOf(winner!)}</span>
                      <span style={{ color: '#8a8a83' }}>def.</span>
                      <span title={loser!}>{nameOf(loser!)}</span>
                    </>
                  )}
                  <span style={{ color: '#8a8a83' }}>
                    by {END_REASONS[m.reason] ?? 'game over'} · {CHAIN_NAMES[m.chain] ?? m.chain} · {when}
                  </span>
                </div>
                <div style={{ marginTop: 3, fontWeight: 600 }}>{matchStakeLabel(m)}</div>
                {m.nfts && m.nfts.some((n) => n.image) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {m.nfts.map((n) => (
                      <figure key={n.tokenId} style={{ margin: 0, textAlign: 'center' }}>
                        {n.image && (
                          <img
                            src={n.image}
                            alt={`Staked NFT #${n.tokenId}`}
                            loading="lazy"
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #c9c9c2', display: 'block' }}
                          />
                        )}
                        <figcaption style={{ fontSize: 10, color: '#666761', marginTop: 2 }}>
                          #{n.tokenId}{!isDraw && ' → ' + nameOf(winner!)}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
