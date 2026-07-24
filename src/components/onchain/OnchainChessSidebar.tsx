// Sidebar for the on-chain game: move history, players + on-chain ELO, and piece-set picker.
// Presentational (data via props); the piece picker uses the shared ChessPieceSetContext so
// the choice applies to the board immediately. Styled with the shared deep-sea tokens.

import React, { useState } from 'react';
import { CHESS_PIECE_SETS } from '../../config/chessPieceSets';
import { useChessPieceSet } from '../../contexts/ChessPieceSetContext';
import type { OnchainMove } from '../../hooks/useOnchainChessMoves';
import { oc, solid } from './onchainUi';

type Tab = 'moves' | 'players' | 'pieces';

export interface OnchainChessSidebarProps {
  moves: OnchainMove[];
  /** when omitted (e.g. local sandbox), the Players tab is hidden */
  players?: {
    white: `0x${string}`;
    black: `0x${string}`;
    eloWhite?: number;
    eloBlack?: number;
    wagerLabel: string;
    statusText: string;
    /** lowercased connected address, to mark "you" */
    me?: string;
  };
  /** open a player's Lawb ID / profile */
  onViewProfile?: (address: `0x${string}`) => void;
}

const ZERO = '0x0000000000000000000000000000000000000000';
const short = (a: string) => (a && a !== ZERO ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

export const OnchainChessSidebar: React.FC<OnchainChessSidebarProps> = ({ moves, players, onViewProfile }) => {
  const [tab, setTab] = useState<Tab>('moves');
  const { currentPieceSet, setCurrentPieceSet } = useChessPieceSet();
  const tabs: Tab[] = players ? ['moves', 'players', 'pieces'] : ['moves', 'pieces'];

  const rows: { n: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: moves[i]?.san, b: moves[i + 1]?.san });
  }
  const youTag = (addr: string) => (players?.me && addr.toLowerCase() === players.me ? ' · you' : '');

  return (
    <div style={{
      width: 'min(92vw, 280px)', display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif", color: oc.ink,
    }}>
      {/* tab strip */}
      <div style={{ display: 'flex', gap: 4, backgroundImage: solid('#0a1322'), border: `1px solid ${oc.line}`, borderRadius: 11, padding: 4 }}>
        {tabs.map((t) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, border: 0, cursor: 'pointer', borderRadius: 8, padding: '9px 4px',
              fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
              color: on ? oc.ink : oc.muted, backgroundImage: on ? solid('#12213a') : 'none',
            }}>
              {t === 'moves' ? 'Moves' : t === 'players' ? 'Players' : 'Pieces'}
            </button>
          );
        })}
      </div>

      <div style={{
        backgroundImage: oc.card, border: `1px solid ${oc.line}`, borderRadius: 13, padding: 8,
        minHeight: 210, maxHeight: 420, overflowY: 'auto',
      }}>
        {tab === 'moves' && (
          rows.length === 0
            ? <div style={{ color: oc.muted2, fontSize: 12, padding: 6 }}>No moves yet.</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rows.map((r) => (
                  <div key={r.n} style={{
                    display: 'grid', gridTemplateColumns: '26px 1fr 1fr', gap: 4, padding: '5px 8px', borderRadius: 7,
                    fontFamily: 'ui-monospace, monospace', fontSize: 12.5,
                    backgroundImage: r.n % 2 ? 'linear-gradient(rgba(255,255,255,.02), rgba(255,255,255,.02))' : 'none',
                  }}>
                    <span style={{ color: oc.muted2 }}>{r.n}.</span>
                    <span style={{ color: oc.ink }}>{r.w ?? ''}</span>
                    <span style={{ color: oc.muted }}>{r.b ?? ''}</span>
                  </div>
                ))}
              </div>
            )
        )}

        {tab === 'players' && players && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
            {([['White', players.white, players.eloWhite, oc.blue], ['Black', players.black, players.eloBlack, oc.red]] as const).map(
              ([label, addr, elo, accent]) => (
                <div key={label} style={{
                  backgroundImage: solid('#0a1322'), border: `1px solid ${oc.line}`, borderLeft: `3px solid ${accent}`,
                  borderRadius: 10, padding: '9px 11px',
                }}>
                  <div style={{ fontWeight: 700, color: oc.ink }}>{label}<span style={{ color: oc.muted2, fontWeight: 400 }}>{youTag(addr)}</span></div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: oc.muted, marginTop: 2 }}>
                    {short(addr)} · ELO {elo ?? '—'}
                  </div>
                  {onViewProfile && addr !== ZERO && (
                    <button onClick={() => onViewProfile(addr)} style={{
                      marginTop: 6, border: `1px solid ${oc.line2}`, cursor: 'pointer', borderRadius: 8, padding: '5px 10px',
                      fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                      color: oc.cyan, backgroundImage: solid('#12213a'),
                    }}>View Lawb ID</button>
                  )}
                </div>
              ),
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: oc.muted }}>
              <span style={{ color: oc.muted2 }}>WAGER</span><span style={{ color: oc.gold, fontWeight: 700 }}>{players.wagerLabel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: oc.muted }}>
              <span style={{ color: oc.muted2 }}>STATUS</span><span>{players.statusText}</span>
            </div>
          </div>
        )}

        {tab === 'pieces' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CHESS_PIECE_SETS.map((s) => {
              const on = currentPieceSet.id === s.id;
              return (
                <button key={s.id} onClick={() => setCurrentPieceSet(s)} style={{
                  border: `1px solid ${on ? oc.line2 : oc.line}`, cursor: 'pointer', borderRadius: 9, padding: '9px 11px',
                  textAlign: 'left', fontSize: 12.5, fontWeight: 600,
                  color: on ? oc.ink : oc.muted,
                  backgroundImage: on ? solid('rgba(63,224,214,.10)') : solid('#0a1322'),
                }}>{s.name}</button>
              );
            })}
            <div style={{ color: oc.muted2, fontSize: 11 }}>More sets unlock with NFT holdings (coming).</div>
          </div>
        )}
      </div>
    </div>
  );
};
