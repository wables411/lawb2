/**
 * Shared Lawb chess ↔ chess.js bridge.
 * UI board: row 0 = top, col 0 = a-file. Blue = lowercase pieces, Red = uppercase.
 * chess.js: White = Lawb blue (lowercase in UI), Black = Lawb red (uppercase in UI).
 */
import { Chess, type Move, type Square } from 'chess.js';

export function rcToSquare(row: number, col: number): Square {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}` as Square;
}

export function squareToRc(sq: string): { row: number; col: number } {
  const col = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq.slice(1), 10);
  return { row: 8 - rank, col };
}

export function chessTurnToUi(turn: 'w' | 'b'): 'blue' | 'red' {
  return turn === 'w' ? 'blue' : 'red';
}

export function uiTurnToChess(player: 'blue' | 'red'): 'w' | 'b' {
  return player === 'blue' ? 'w' : 'b';
}

/** Build UI 8×8 grid from a chess.js instance (rank 0 = eight rank). */
export function boardFromChess(chess: Chess): (string | null)[][] {
  const b = chess.board();
  const out: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) out[r][c] = null;
      else out[r][c] = p.color === 'w' ? p.type : p.type.toUpperCase();
    }
  }
  return out;
}

/**
 * Lawb board → Stockfish/chess.js standard FEN (same mapping as legacy ChessGame.boardToFEN).
 * currentPlayer = side to move in Lawb terms (blue/red).
 */
/** Load UI board + side to move into an existing chess.js instance (for legality / FEN). */
export function loadLawbPositionIntoChess(chess: Chess, board: (string | null)[][], sideToMove: 'blue' | 'red'): boolean {
  const fen = lawbBoardToFen(board, sideToMove);
  try {
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

export function lawbBoardToFen(board: (string | null)[][], currentPlayer: 'blue' | 'red'): string {
  let fen = '';
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        if (piece >= 'a' && piece <= 'z') {
          fen += piece.toUpperCase();
        } else if (piece >= 'A' && piece <= 'Z') {
          fen += piece.toLowerCase();
        } else {
          fen += piece;
        }
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }
  fen += ' ' + (currentPlayer === 'blue' ? 'w' : 'b');
  fen += ' KQkq - 0 1';
  return fen;
}

export function lawbLegalMoveDestinations(chess: Chess, row: number, col: number): { row: number; col: number }[] {
  const sq = rcToSquare(row, col);
  const moves = chess.moves({ square: sq, verbose: true }) as Move[];
  return moves.map((m) => squareToRc(m.to));
}

export function tryMoveOnChess(
  chess: Chess,
  from: { row: number; col: number },
  to: { row: number; col: number },
  promotion?: string,
): Move | null {
  const fromSq = rcToSquare(from.row, from.col);
  const toSq = rcToSquare(to.row, to.col);
  const opts: { from: string; to: string; promotion?: string } = { from: fromSq, to: toSq };
  if (promotion) opts.promotion = promotion.slice(0, 1).toLowerCase();
  const m = chess.move(opts);
  return m ?? null;
}

/** Easy AI: random legal move biased away from captures and giving check. */
export function pickEasyPassiveMove(chess: Chess): { from: { row: number; col: number }; to: { row: number; col: number }; promotion?: string } | null {
  const moves = chess.moves({ verbose: true }) as Move[];
  if (!moves.length) return null;
  const nonCap = moves.filter((m) => !m.isCapture());
  const noCheck = nonCap.filter((m) => !m.san.includes('+') && !m.san.includes('#'));
  const pool = noCheck.length ? noCheck : nonCap.length ? nonCap : moves;
  const pick = pool[Math.floor(Math.random() * pool.length)]!;
  return {
    from: squareToRc(pick.from),
    to: squareToRc(pick.to),
    promotion: pick.promotion,
  };
}

/** Parse UCI (e2e4, e7e8q) and verify on a copy; returns null if illegal. */
export function validateEngineUci(chess: Chess, uci: string | null): { from: { row: number; col: number }; to: { row: number; col: number }; promotion?: string } | null {
  if (!uci || uci === '(none)') return null;
  const clean = uci.trim();
  if (clean.length < 4) return null;
  const fromSq = clean.slice(0, 2);
  const toSq = clean.slice(2, 4);
  const promotion = clean.length >= 5 ? clean.slice(4, 5) : undefined;
  const from = squareToRc(fromSq);
  const to = squareToRc(toSq);
  const clone = new Chess(chess.fen());
  const mv = tryMoveOnChess(clone, from, to, promotion);
  if (!mv) return null;
  return { from, to, promotion: mv.promotion };
}
