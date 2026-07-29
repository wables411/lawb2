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
import { getGlobalEloFeed, type GlobalEloEntry } from '../firebaseElo';
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
  const [filter, setFilter] = useState<LeaderboardFilter>('total');

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
        // ELO badges: one feed fetch per session; silently absent when unreachable.
        const feed = await getGlobalEloFeed();
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
        if (!cancelled) {
          setRows(data);
          setEloByKey(elos);
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
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700 }}>
                  {pointsForFilter(entry, filter)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
