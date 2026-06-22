// Local sandbox (no wallet, no wager, no chain) — play a full game against yourself on the
// real on-chain board UI to verify look, cosmetics, and interaction. Pure chess.js; the
// actual on-chain path uses the SAME OnchainChessBoard fed by the (verified) decoder.

import React, { useCallback, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { squareToAlgebraic, algebraicToSquare } from '../../utils/lawbChessBoard';
import { OnchainChessBoard } from './OnchainChessBoard';

function boardFromChess(chess: Chess): (string | null)[][] {
  const raw = chess.board(); // raw[0] = rank 8
  const out: (string | null)[][] = Array.from({ length: 8 }, () => Array<string | null>(8).fill(null));
  for (let dr = 0; dr < 8; dr++) {
    for (let f = 0; f < 8; f++) {
      const cell = raw[dr][f];
      if (!cell) continue;
      out[7 - dr][f] = cell.color === 'w' ? cell.type.toUpperCase() : cell.type.toLowerCase();
    }
  }
  return out;
}

export const OnchainChessDemo: React.FC<{ onLeave: () => void }> = ({ onLeave }) => {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(() => chess.fen());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [selected, setSelected] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [pendingPromo, setPendingPromo] = useState<{ from: number; to: number } | null>(null);

  const board = useMemo(() => boardFromChess(chess), [fen]); // eslint-disable-line react-hooks/exhaustive-deps
  const clear = () => { setSelected(null); setTargets([]); };

  const apply = useCallback((from: number, to: number, promotion?: string) => {
    try {
      chess.move({ from: squareToAlgebraic(from), to: squareToAlgebraic(to), promotion });
      setFen(chess.fen());
    } catch { /* illegal — ignore */ }
    clear();
    setPendingPromo(null);
  }, [chess]);

  const handleClick = useCallback((sq: number) => {
    if (chess.isGameOver()) return;
    const turn = chess.turn(); // 'w' | 'b'
    const ownPieceAt = (s: number) => {
      const p = board[s >> 3]?.[s & 7];
      if (!p) return false;
      return (p === p.toUpperCase()) === (turn === 'w');
    };
    const selectIfMovable = (s: number) => {
      const moves = chess.moves({ square: squareToAlgebraic(s) as never, verbose: true });
      if (!moves.length) return false;
      setSelected(s);
      setTargets(moves.map((m) => algebraicToSquare((m as { to: string }).to)));
      return true;
    };

    if (selected === null) { if (ownPieceAt(sq)) selectIfMovable(sq); return; }
    if (sq === selected) { clear(); return; }
    const moves = chess.moves({ square: squareToAlgebraic(selected) as never, verbose: true });
    const move = moves.find((m) => algebraicToSquare((m as { to: string }).to) === sq) as
      | { promotion?: string } | undefined;
    if (!move) { if (ownPieceAt(sq) && selectIfMovable(sq)) return; clear(); return; }
    if (move.promotion) { setPendingPromo({ from: selected, to: sq }); return; }
    apply(selected, sq);
  }, [apply, board, chess, selected]);

  const status = chess.isCheckmate() ? `Checkmate — ${chess.turn() === 'w' ? 'Black' : 'White'} wins`
    : chess.isStalemate() ? 'Stalemate — draw'
    : chess.isDraw() ? 'Draw'
    : chess.inCheck() ? `${chess.turn() === 'w' ? 'White' : 'Black'} in check`
    : `${chess.turn() === 'w' ? 'White' : 'Black'} to move`;

  const reset = () => { chess.reset(); setFen(chess.fen()); clear(); setPendingPromo(null); };

  return (
    <div style={panel}>
      <div style={{ textAlign: 'center' }}>
        <b>Local sandbox</b> — no wallet, no wager. Play both sides to try the board.
      </div>
      <OnchainChessBoard
        board={board}
        orientation={orientation}
        selectedSquare={selected}
        legalTargets={targets}
        interactive
        onSquareClick={handleClick}
      />
      <div style={{ minHeight: 20 }}><b>{status}</b></div>
      {pendingPromo && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>Promote to:</span>
          {(['q', 'r', 'b', 'n'] as const).map((p) => (
            <button key={p} style={btn} onClick={() => apply(pendingPromo.from, pendingPromo.to, p)}>{p.toUpperCase()}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btn} onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>Flip board</button>
        <button style={btn} onClick={reset}>Reset</button>
        <button style={btn} onClick={onLeave}>Back to lobby</button>
      </div>
    </div>
  );
};

const panel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12,
  fontFamily: "'MS Sans Serif', Arial, sans-serif", fontSize: 13, color: '#eee',
};
const btn: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', cursor: 'pointer',
  background: '#c0c0c0', border: '2px outset #fff', color: '#000',
};
