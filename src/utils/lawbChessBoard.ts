// Pure decoders for LawbChess on-chain game state (Phase 4 read path).
//
// The contract is the source of truth for the board; the React renderer paints whatever
// these decoders return, using the existing piece-set cosmetics (chessPieceSets.ts).
// No React / no wagmi here — keep this side-effect-free and unit-testable.
//
// Encoding (onchain-chess/src/ChessEngine.sol):
//   board: one uint256, 64 squares * 4 bits. square index sq = rank*8 + file (a1=0 .. h8=63).
//   piece nibble: type = code & 7 (1=P,2=N,3=B,4=R,5=Q,6=K, 0=empty); color bit = code & 8 (0=White, 8=Black).
// The live board representation (ChessMultiplayer.tsx) is (string|null)[][] indexed [rank][file],
// rank 0 = white's first rank, FEN chars (UPPERCASE = White, lowercase = Black). We emit exactly that.

/** type code (1..6) -> uppercase FEN letter; index 0 unused (empty). */
const TYPE_TO_FEN = ['', 'P', 'N', 'B', 'R', 'Q', 'K'] as const;

export type ChessBoard = (string | null)[][];

/** Decode the packed uint256 board into the live (string|null)[][] representation. */
export function decodeOnchainBoard(board: bigint): ChessBoard {
  const out: ChessBoard = Array.from({ length: 8 }, () => Array<string | null>(8).fill(null));
  for (let sq = 0; sq < 64; sq++) {
    const code = Number((board >> BigInt(sq * 4)) & 0xfn);
    if (code === 0) continue;
    const fen = TYPE_TO_FEN[code & 7];
    if (!fen) continue; // defensive: malformed nibble
    const isBlack = (code & 8) !== 0;
    const rank = sq >> 3;
    const file = sq & 7;
    out[rank][file] = isBlack ? fen.toLowerCase() : fen;
  }
  return out;
}

// ---- square <-> algebraic helpers (a1=0 .. h8=63) ----

export function squareIndex(rank: number, file: number): number {
  return rank * 8 + file;
}

/** 'e2' -> 12. Returns -1 for malformed input. */
export function algebraicToSquare(sqr: string): number {
  if (sqr.length !== 2) return -1;
  const file = sqr.charCodeAt(0) - 97; // 'a'
  const rank = sqr.charCodeAt(1) - 49; // '1'
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return -1;
  return rank * 8 + file;
}

/** 12 -> 'e2'. */
export function squareToAlgebraic(sq: number): string {
  return String.fromCharCode(97 + (sq & 7)) + String.fromCharCode(49 + (sq >> 3));
}

/**
 * Build a FEN string from decoded contract state, so chess.js can generate legal moves
 * for client-side highlighting/promotion (the contract remains the final arbiter).
 * @param board    decoded (string|null)[][] from decodeOnchainBoard
 * @param side     0 = white to move, 1 = black
 * @param castling 4-bit mask (CR_WK=1, CR_WQ=2, CR_BK=4, CR_BQ=8)
 * @param ep       en-passant target square 0..63, or 64 for none
 * @param halfmove halfmove clock (50-move rule)
 */
export function boardToFen(
  board: ChessBoard,
  side: number,
  castling: number,
  ep: number,
  halfmove = 0,
): string {
  const ranks: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += p;
    }
    if (empty) row += empty;
    ranks.push(row);
  }
  const placement = ranks.join('/');
  const active = side === Side.BLACK ? 'b' : 'w';
  let rights = '';
  if (castling & 1) rights += 'K';
  if (castling & 2) rights += 'Q';
  if (castling & 4) rights += 'k';
  if (castling & 8) rights += 'q';
  if (!rights) rights = '-';
  const epStr = ep === NO_EP ? '-' : squareToAlgebraic(ep);
  return `${placement} ${active} ${rights} ${epStr} ${halfmove} 1`;
}

// ---- contract enums (mirror onchain-chess/src/LawbChess.sol) ----

export const WagerKind = { NATIVE: 0, ERC20: 1, ERC721: 2, ERC1155: 3 } as const;
export const GameStatus = { NONE: 0, OPEN: 1, ACTIVE: 2, FINISHED: 3 } as const;
export const EndReason = {
  NONE: 0,
  CHECKMATE: 1,
  STALEMATE: 2,
  FIFTY_MOVE: 3,
  INSUFFICIENT: 4,
  THREEFOLD: 5,
  TIMEOUT: 6,
  RESIGN: 7,
} as const;

/** side-to-move (ChessEngine WHITE_C/BLACK_C). */
export const Side = { WHITE: 0, BLACK: 1 } as const;

/** en-passant sentinel: ep === 64 means "no en-passant target". */
export const NO_EP = 64;

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

/** Decode the 4-bit castling mask (CR_WK=1, CR_WQ=2, CR_BK=4, CR_BQ=8). */
export function decodeCastling(mask: number): CastlingRights {
  return {
    whiteKingside: (mask & 1) !== 0,
    whiteQueenside: (mask & 2) !== 0,
    blackKingside: (mask & 4) !== 0,
    blackQueenside: (mask & 8) !== 0,
  };
}

/** en-passant target square 0..63, or null if none. */
export function decodeEnPassant(ep: number): number | null {
  return ep === NO_EP ? null : ep;
}

/**
 * Positional shape of the contract `games(code)` getter return (20 outputs).
 * wagmi/viem returns multiple outputs as a positional array; this maps it to named fields.
 * Field order is locked to the ABI — do not reorder (matches LawbChess.Game struct).
 */
export interface OnchainGame {
  white: `0x${string}`;
  black: `0x${string}`;
  kind: number;
  token: `0x${string}`;
  wager: bigint;
  board: bigint;
  side: number;
  castling: number;
  ep: number;
  halfmove: number;
  status: number;
  whiteTime: number;
  blackTime: number;
  increment: number;
  lastMoveAt: bigint;
  whiteTokenId: bigint;
  blackTokenId: bigint;
  whiteMoveKey: `0x${string}`;
  blackMoveKey: `0x${string}`;
  moveNonce: bigint;
}

// Integer widths follow viem's mapping: uint <= 48 bits -> number, uint >= 56 bits -> bigint.
// So uint40 lastMoveAt (pos 14) is number; uint256/uint64 fields are bigint.
type RawGameTuple = readonly [
  `0x${string}`, `0x${string}`, number, `0x${string}`, bigint, bigint, number, number,
  number, number, number, number, number, number, number, bigint, bigint,
  `0x${string}`, `0x${string}`, bigint,
];

/** Map the positional `games(code)` return into a named OnchainGame. */
export function parseGameTuple(raw: RawGameTuple): OnchainGame {
  return {
    white: raw[0], black: raw[1], kind: Number(raw[2]), token: raw[3], wager: raw[4],
    board: raw[5], side: Number(raw[6]), castling: Number(raw[7]), ep: Number(raw[8]),
    halfmove: Number(raw[9]), status: Number(raw[10]), whiteTime: Number(raw[11]),
    blackTime: Number(raw[12]), increment: Number(raw[13]), lastMoveAt: BigInt(raw[14]),
    whiteTokenId: raw[15], blackTokenId: raw[16], whiteMoveKey: raw[17],
    blackMoveKey: raw[18], moveNonce: BigInt(raw[19]),
  };
}
