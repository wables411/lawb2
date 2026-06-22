// Custom chessboard background images (same set the live ChessMultiplayer uses), with
// selection helpers. The board image IS the checkered surface; squares render transparent
// on top of it (see OnchainChessBoard).

export const CHESS_BOARD_IMAGES: readonly string[] = [
  '/images/chessboard1.png',
  '/images/chessboard2.png',
  '/images/chessboard3.png',
  '/images/chessboard4.png',
  '/images/chessboard5.png',
  '/images/chessboard6.png',
];

/** Random board (used by the local sandbox). */
export function randomChessBoard(): string {
  return CHESS_BOARD_IMAGES[Math.floor(Math.random() * CHESS_BOARD_IMAGES.length)];
}

/**
 * Deterministic board per game code, so both players and any spectators see the SAME
 * board for a given match (the on-chain game has no stored cosmetic).
 */
export function chessBoardForCode(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return CHESS_BOARD_IMAGES[h % CHESS_BOARD_IMAGES.length];
}
