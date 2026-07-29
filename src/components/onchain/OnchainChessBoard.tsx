// Presentational on-chain chess board (Phase 4). Pure: paints a decoded (string|null)[][]
// board using the player's selected piece-set cosmetics. No contract / no chess logic here.

import React from 'react';
import { useChessPieceSet } from '../../contexts/ChessPieceSetContext';
import { oc } from './onchainUi';
import './onchainChess.css';

// Deep-sea board squares: cool light + steel-blue dark, refined so the lawbster pieces pop.
const SQ_LIGHT = '#cfe0ef';
const SQ_DARK = '#5f7ea6';

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
  /** square (0..63) to play the capture animation on, or null */
  captureSquare?: number | null;
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
  captureSquare = null,
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
        // Fill the parent card. Sizing itself to the viewport (min(92vw, 480px)) ignored the
        // card's padding, so the board overflowed its container and clipped the h-file on phones.
        width: '100%',
        aspectRatio: '1 / 1',
        border: `1px solid ${oc.line2}`,
        borderRadius: 8,
        overflow: 'hidden',
        boxSizing: 'border-box',
        userSelect: 'none',
        touchAction: 'manipulation',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.35)',
        // inline background-image keeps the theme-nuke from blanking the board
        backgroundImage: boardImage ? `url(${boardImage})` : `linear-gradient(${SQ_DARK}, ${SQ_DARK})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {rows.map((rank, rIdx) =>
        cols.map((file, cIdx) => {
          const sq = sqIndex(rank, file);
          const piece = board?.[rank]?.[file] ?? null;
          const isDark = (rank + file) % 2 === 0;
          const isSelected = selectedSquare === sq;
          const isTarget = legalTargets.includes(sq);
          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const img = piece ? pieceImages[piece] : null;
          // coordinate labels: files on the visual bottom row, ranks on the visual left column
          const fileLabel = rIdx === 7 ? String.fromCharCode(97 + file) : null;
          const rankLabel = cIdx === 0 ? String(rank + 1) : null;
          const labelColor = isDark ? 'rgba(233,241,251,.55)' : 'rgba(20,38,60,.5)';
          const baseFill = boardImage ? 'transparent' : isDark ? SQ_DARK : SQ_LIGHT;
          return (
            <div
              key={sq}
              onClick={interactive && onSquareClick ? () => onSquareClick(sq) : undefined}
              style={{
                position: 'relative',
                // inline background-image so it survives the theme-nuke; flat fills via linear-gradient
                backgroundImage: baseFill === 'transparent' ? 'none' : `linear-gradient(${baseFill}, ${baseFill})`,
                boxShadow: isSelected
                  ? `inset 0 0 0 3px ${oc.cyan}`
                  : isLast
                    ? 'inset 0 0 0 3px rgba(242,183,60,.85)'
                    : 'none',
                cursor: interactive && (piece || isTarget) ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected && (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(63,224,214,.22), rgba(63,224,214,.22))', pointerEvents: 'none' }} />
              )}
              {fileLabel && (
                <span style={{ position: 'absolute', right: 3, bottom: 1, fontSize: 9, fontFamily: 'ui-monospace, monospace', color: labelColor, pointerEvents: 'none' }}>{fileLabel}</span>
              )}
              {rankLabel && (
                <span style={{ position: 'absolute', left: 2, top: 1, fontSize: 9, fontFamily: 'ui-monospace, monospace', color: labelColor, pointerEvents: 'none' }}>{rankLabel}</span>
              )}
              {img && (
                <img
                  src={img}
                  alt={piece ?? ''}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))', position: 'relative', zIndex: 1 }}
                />
              )}
              {isTarget && (
                <div
                  style={{
                    position: 'absolute',
                    width: piece ? '86%' : '30%',
                    height: piece ? '86%' : '30%',
                    borderRadius: '50%',
                    border: piece ? `3px solid ${oc.cyan}` : 'none',
                    backgroundImage: piece ? 'none' : 'linear-gradient(rgba(63,224,214,.7), rgba(63,224,214,.7))',
                    boxShadow: piece ? 'none' : '0 0 8px rgba(63,224,214,.5)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              )}
              {captureSquare === sq && (
                <img src="/images/capture.gif" alt="capture" className="oc-capture-anim" />
              )}
            </div>
          );
        }),
      )}
    </div>
  );
};
