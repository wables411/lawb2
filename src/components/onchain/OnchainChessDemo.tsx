// Local sandbox (no wallet, no wager, no chain) — play a full game against yourself on the
// real on-chain board UI to verify look, cosmetics, and interaction. Pure chess.js; the
// actual on-chain path uses the SAME OnchainChessBoard fed by the (verified) decoder.

import React, { useCallback, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { squareToAlgebraic, algebraicToSquare } from '../../utils/lawbChessBoard';
import { randomChessBoard } from '../../config/chessBoards';
import { OnchainChessBoard } from './OnchainChessBoard';
import { OnchainChessSidebar } from './OnchainChessSidebar';
import { OnchainChessResult, type GameOutcome } from './OnchainChessResult';
import { playChessSound } from '../../utils/chessSounds';
import type { OnchainMove } from '../../hooks/useOnchainChessMoves';
import { oc, ocBtnSecondary, ocBtnGhost, OcArenaHeader, OcPill } from './onchainUi';

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
  const [boardImage] = useState(() => randomChessBoard());
  const [selected, setSelected] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [pendingPromo, setPendingPromo] = useState<{ from: number; to: number } | null>(null);
  const [captureSquare, setCaptureSquare] = useState<number | null>(null);
  const [result, setResult] = useState<{ outcome: GameOutcome; detail: string } | null>(null);

  const board = useMemo(() => boardFromChess(chess), [fen]); // eslint-disable-line react-hooks/exhaustive-deps
  const moves = useMemo<OnchainMove[]>(() => // eslint-disable-line react-hooks/exhaustive-deps
    chess.history({ verbose: true }).map((m) => ({
      san: (m as { san: string }).san,
      from: algebraicToSquare((m as { from: string }).from),
      to: algebraicToSquare((m as { to: string }).to),
    })), [fen]);
  const lastMove = moves.length ? { from: moves[moves.length - 1].from, to: moves[moves.length - 1].to } : null;
  const clear = () => { setSelected(null); setTargets([]); };

  const apply = useCallback((from: number, to: number, promotion?: string) => {
    let res: { captured?: string } | null = null;
    try {
      res = chess.move({ from: squareToAlgebraic(from), to: squareToAlgebraic(to), promotion });
    } catch { res = null; }
    if (res) {
      if (res.captured) {
        playChessSound('capture');
        setCaptureSquare(to);
        window.setTimeout(() => setCaptureSquare(null), 600);
      } else if (promotion) {
        playChessSound('promote');
      } else {
        playChessSound('move');
      }
      if (chess.isCheck()) playChessSound('check');
      setFen(chess.fen());
      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          setResult({ outcome: 'win', detail: `${chess.turn() === 'w' ? 'Black' : 'White'} wins by checkmate` });
        } else {
          setResult({ outcome: 'draw', detail: chess.isStalemate() ? 'Stalemate' : 'Draw' });
        }
      }
    }
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

  const reset = () => { chess.reset(); setFen(chess.fen()); clear(); setPendingPromo(null); setResult(null); setCaptureSquare(null); };

  return (
    <div style={panel}>
      <OcArenaHeader right={<OcPill tone="cyan">Sandbox</OcPill>} />
      <div style={{ textAlign: 'center', color: oc.muted, fontSize: 12.5 }}>
        No wallet, no wager — play both sides to try the board.
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 'min(92vw, 480px)' }}>
          <div style={{ backgroundImage: 'linear-gradient(#0c1728, #0a1220)', border: `1px solid ${oc.line2}`,
            borderRadius: 16, padding: 12, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
            <OnchainChessBoard
              board={board}
              orientation={orientation}
              selectedSquare={selected}
              legalTargets={targets}
              lastMove={lastMove}
              boardImage={boardImage}
              captureSquare={captureSquare}
              interactive
              onSquareClick={handleClick}
            />
          </div>
          <div style={{ minHeight: 20, fontWeight: 700, color: oc.muted }}>{status}</div>
        </div>
        <OnchainChessSidebar moves={moves} />
      </div>
      {pendingPromo && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: oc.muted, fontSize: 12 }}>Promote to:</span>
          {(['q', 'r', 'b', 'n'] as const).map((p) => (
            <button key={p} style={ocBtnSecondary} onClick={() => apply(pendingPromo.from, pendingPromo.to, p)}>{p.toUpperCase()}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={ocBtnGhost} onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>Flip board</button>
        <button style={ocBtnGhost} onClick={reset}>Reset</button>
        <button style={ocBtnGhost} onClick={onLeave}>Back to lobby</button>
      </div>
      {result && <OnchainChessResult outcome={result.outcome} detail={result.detail} onClose={() => setResult(null)} />}
    </div>
  );
};

const panel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 16,
  fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif", fontSize: 13, color: oc.ink,
  backgroundImage: oc.panel, border: `1px solid ${oc.line}`, borderRadius: 16,
  maxWidth: 800, margin: '0 auto', boxShadow: '0 24px 60px rgba(0,0,0,.4)',
};
