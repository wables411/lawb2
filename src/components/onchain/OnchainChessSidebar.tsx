// Sidebar for the on-chain game: move history, players + on-chain ELO, and piece-set picker.
// Presentational (data via props); the piece picker uses the shared ChessPieceSetContext so
// the choice applies to the board immediately.

import React, { useState } from 'react';
import { CHESS_PIECE_SETS } from '../../config/chessPieceSets';
import { useChessPieceSet } from '../../contexts/ChessPieceSetContext';
import type { OnchainMove } from '../../hooks/useOnchainChessMoves';

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

const short = (a: string) => (a && a !== ZERO ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');
const ZERO = '0x0000000000000000000000000000000000000000';

export const OnchainChessSidebar: React.FC<OnchainChessSidebarProps> = ({ moves, players, onViewProfile }) => {
  const [tab, setTab] = useState<Tab>('moves');
  const { currentPieceSet, setCurrentPieceSet } = useChessPieceSet();
  const tabs: Tab[] = players ? ['moves', 'players', 'pieces'] : ['moves', 'pieces'];

  // pair moves into numbered rows: 1. white black
  const rows: { n: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: moves[i]?.san, b: moves[i + 1]?.san });
  }

  const youTag = (addr: string) => (players?.me && addr.toLowerCase() === players.me ? ' (you)' : '');

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...tabBtn, ...(tab === t ? tabActive : {}) }}>
            {t === 'moves' ? 'Moves' : t === 'players' ? 'Players' : 'Pieces'}
          </button>
        ))}
      </div>

      <div style={body}>
        {tab === 'moves' && (
          rows.length === 0 ? <div style={muted}>No moves yet.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <td style={{ ...cell, color: '#888', width: 28 }}>{r.n}.</td>
                    <td style={cell}>{r.w ?? ''}</td>
                    <td style={cell}>{r.b ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'players' && players && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div>
              <b>White</b>{youTag(players.white)}<br />{short(players.white)} · ELO {players.eloWhite ?? '—'}
              {onViewProfile && players.white !== ZERO && (
                <><br /><button style={linkBtn} onClick={() => onViewProfile(players.white)}>View Lawb ID</button></>
              )}
            </div>
            <div>
              <b>Black</b>{youTag(players.black)}<br />{short(players.black)} · ELO {players.eloBlack ?? '—'}
              {onViewProfile && players.black !== ZERO && (
                <><br /><button style={linkBtn} onClick={() => onViewProfile(players.black)}>View Lawb ID</button></>
              )}
            </div>
            <hr style={{ width: '100%', borderColor: '#444' }} />
            <div>Wager: {players.wagerLabel}</div>
            <div>Status: {players.statusText}</div>
          </div>
        )}

        {tab === 'pieces' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CHESS_PIECE_SETS.map((s) => (
              <button key={s.id} onClick={() => setCurrentPieceSet(s)}
                style={{ ...rowBtn, ...(currentPieceSet.id === s.id ? tabActive : {}) }}>
                {s.name}
              </button>
            ))}
            <div style={muted}>More sets unlock with NFT holdings (coming).</div>
          </div>
        )}
      </div>
    </div>
  );
};

const wrap: React.CSSProperties = {
  width: 'min(92vw, 280px)', display: 'flex', flexDirection: 'column', gap: 6,
  fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#eee',
};
const body: React.CSSProperties = {
  border: '1px solid #555', padding: 8, minHeight: 200, maxHeight: 420, overflowY: 'auto', background: 'rgba(0,0,0,0.25)',
};
const tabBtn: React.CSSProperties = {
  flex: 1, fontFamily: 'inherit', fontSize: 12, padding: '5px 4px', cursor: 'pointer',
  background: '#c0c0c0', border: '2px outset #fff', color: '#000',
};
const tabActive: React.CSSProperties = { background: '#000080', color: '#fff', border: '2px inset #fff' };
const rowBtn: React.CSSProperties = { fontFamily: 'inherit', fontSize: 12, padding: '6px 8px', cursor: 'pointer', textAlign: 'left', background: '#c0c0c0', border: '2px outset #fff', color: '#000' };
const cell: React.CSSProperties = { padding: '2px 4px', borderBottom: '1px solid #333' };
const muted: React.CSSProperties = { color: '#888', fontSize: 12 };
const linkBtn: React.CSSProperties = {
  marginTop: 4, fontFamily: 'inherit', fontSize: 11, padding: '3px 6px', cursor: 'pointer',
  background: '#c0c0c0', border: '2px outset #fff', color: '#000',
};
