// Presentational on-chain chess board (Phase 4). Pure: paints a decoded (string|null)[][]
// board using the player's selected piece-set cosmetics. No contract / no chess logic here.

import React from 'react';
import { useChessPieceSet } from '../../contexts/ChessPieceSetContext';

export interface OnchainChessBoardProps {
  /** decoded board, [rank][file], rank 0 = white's first rank (from decodeOnchainBoard) */
  board: (string | null)[][];
  /** 'white' = white pieces at the bottom */
  orientation?: 'white' | 'black';
  /** currently selected source square (0..63), or null */
  selectedSquare?: number | null;
  /** legal destination squares (0..63) to highlight */
  legalTargets?: number[];
  /** last move squares to highlight */
  lastMove?: { from: number; to: number } | null;
  /** custom board background image; when set, squares render transparent over it */
  boardImage?: string | null;
  interactive?: boolean;
  onSquareClick?: (square: number) => void;
}

const sqIndex = (rank: number, file: number) => rank * 8 + file;

export const OnchainChessBoard: React.FC<OnchainChessBoardProps> = ({
  board,
  orientation = 'white',
  selectedSquare = null,
  legalTargets = [],
  lastMove = null,
  boardImage = null,
  interactive = false,
  onSquareClick,
}) => {
  const { currentPieceSet } = useChessPieceSet();
  const pieceImages = currentPieceSet.pieceImages;

  // display order: white at bottom -> rank 8 (row 7) on top; black orientation flips both axes
  const rows = orientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: 'min(92vw, 480px)',
        aspectRatio: '1 / 1',
        border: '2px solid #000',
        boxSizing: 'border-box',
        userSelect: 'none',
        touchAction: 'manipulation',
        ...(boardImage
          ? { backgroundImage: `url(${boardImage})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }
          : {}),
      }}
    >
      {rows.map((rank) =>
        cols.map((file) => {
          const sq = sqIndex(rank, file);
          const piece = board?.[rank]?.[file] ?? null;
          const isDark = (rank + file) % 2 === 0;
          const isSelected = selectedSquare === sq;
          const isTarget = legalTargets.includes(sq);
          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const img = piece ? pieceImages[piece] : null;
          return (
            <div
              key={sq}
              onClick={interactive && onSquareClick ? () => onSquareClick(sq) : undefined}
              style={{
                position: 'relative',
                background: isSelected
                  ? 'rgba(126,179,106,0.75)'
                  : isLast
                    ? 'rgba(230,213,106,0.6)'
                    : boardImage
                      ? 'transparent'
                      : isDark
                        ? '#6a8bb3'
                        : '#cdd7e6',
                cursor: interactive && (piece || isTarget) ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {img && (
                <img
                  src={img}
                  alt={piece ?? ''}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                />
              )}
              {isTarget && (
                <div
                  style={{
                    position: 'absolute',
                    width: piece ? '88%' : '32%',
                    height: piece ? '88%' : '32%',
                    borderRadius: '50%',
                    border: piece ? '3px solid rgba(20,80,20,0.55)' : 'none',
                    background: piece ? 'transparent' : 'rgba(20,80,20,0.45)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          );
        }),
      )}
    </div>
  );
};
