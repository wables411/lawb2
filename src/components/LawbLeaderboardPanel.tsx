import React, { useEffect, useState } from 'react';
import { database } from '../firebaseApp';
import { formatAddress, getTopLeaderboardEntries, type LeaderboardEntry } from '../firebaseLeaderboard';

const ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '36px 1fr 64px',
  gap: '6px',
  alignItems: 'center',
  fontSize: '12px',
  padding: '4px 0',
  borderBottom: '1px solid #c0c0c0',
};

/**
 * One-shot fetch of top leaderboard rows (indexed query, no realtime listener).
 */
export const LawbLeaderboardPanel: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await getTopLeaderboardEntries(25);
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

  return (
    <div
      style={{
        fontFamily: "'MS Sans Serif', Tahoma, sans-serif",
        fontSize: isMobile ? 14 : 12,
        color: '#000',
        padding: isMobile ? '8px 4px' : '4px',
        minHeight: 200,
        maxHeight: isMobile ? '70vh' : 420,
        overflow: 'auto',
      }}
    >
      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Lawb leaderboard (top 25 by total points)</p>
      <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#444', lineHeight: 1.35 }}>
        Sorted by total points. Open your Lawb Profile to see how your points break down.
      </p>
      {loading && <p style={{ margin: 0 }}>Loading…</p>}
      {error && <p style={{ margin: 0, color: '#a00' }}>{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p style={{ margin: 0 }}>No entries yet. Play Lawb Chess when it returns to earn points.</p>
      )}
      {!loading && rows.length > 0 && (
        <>
          <div
            style={{
              ...ROW_STYLE,
              fontWeight: 'bold',
              borderBottom: '2px solid #808080',
              paddingBottom: 6,
            }}
          >
            <span>#</span>
            <span>Player</span>
            <span style={{ textAlign: 'right' }}>Pts</span>
          </div>
          {rows.map((entry, i) => (
            <div key={entry.username || i} style={ROW_STYLE}>
              <span>{i + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatAddress(entry.username)}
              </span>
              <span style={{ textAlign: 'right' }}>{entry.points}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
