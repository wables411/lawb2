import React, { useEffect, useState } from 'react';
import { database } from '../firebaseApp';
import { firebaseProfiles } from '../firebaseProfiles';
import {
  formatAddress,
  getTopLeaderboardEntries,
  mergeLeaderboardEntriesForDisplay,
  normalizeLeaderboardPathKey,
  type LeaderboardEntry,
} from '../firebaseLeaderboard';
import { getDisplayName } from '../utils/displayName';
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

/**
 * One-shot fetch of top leaderboard rows (indexed query, no realtime listener).
 */
export const LawbLeaderboardPanel: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameByKey, setNameByKey] = useState<Record<string, string>>({});

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
        merged.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.total_games - b.total_games;
        });
        const data = merged.slice(0, 25);
        if (!cancelled) {
          setRows(data);
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
        <div style={linuxNotesPillStyle(isMobile)}>Top 25 by total points</div>
      </div>
      <p style={{ ...linuxNotesSubtleTextStyle(isMobile), marginBottom: 10 }}>
        Sorted by total points. Linked wallets under the same Lawb profile are merged into one row (points added
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
          {rows.map((entry, i) => {
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
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700 }}>{entry.points}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
