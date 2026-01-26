import React, { useState, useMemo } from 'react';
import { useChessPieceSet } from '../contexts/ChessPieceSetContext';

interface ChessPiece {
  key: string;
  name: string;
  img: string;
  desc: string;
  color: 'red' | 'blue';
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
}

interface ChessPieceInfoProps {
  isMobile?: boolean;
}

export const ChessPieceInfo: React.FC<ChessPieceInfoProps> = ({ isMobile = false }) => {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const { currentPieceSet } = useChessPieceSet();

  // Define all chess pieces with their descriptions, using images from current piece set
  const pieces: ChessPiece[] = useMemo(() => [
    {
      key: 'K',
      name: 'Red King',
      img: currentPieceSet.pieceImages['K'] || '/images/lawbstation/redking.png',
      desc: 'The King is the most important piece. If your King is captured (checkmate), you lose the game. The King can move one square in any direction (horizontally, vertically, or diagonally).',
      color: 'red',
      type: 'king'
    },
    {
      key: 'k',
      name: 'Blue King',
      img: currentPieceSet.pieceImages['k'] || '/images/lawbstation/blueking.png',
      desc: 'The King is the most important piece. If your King is captured (checkmate), you lose the game. The King can move one square in any direction (horizontally, vertically, or diagonally).',
      color: 'blue',
      type: 'king'
    },
    {
      key: 'Q',
      name: 'Red Queen',
      img: currentPieceSet.pieceImages['Q'] || '/images/lawbstation/redqueen.png',
      desc: 'The Queen is the most powerful piece. It can move any number of squares in any direction (horizontally, vertically, or diagonally) as long as the path is clear.',
      color: 'red',
      type: 'queen'
    },
    {
      key: 'q',
      name: 'Blue Queen',
      img: currentPieceSet.pieceImages['q'] || '/images/lawbstation/bluequeen.png',
      desc: 'The Queen is the most powerful piece. It can move any number of squares in any direction (horizontally, vertically, or diagonally) as long as the path is clear.',
      color: 'blue',
      type: 'queen'
    },
    {
      key: 'R',
      name: 'Red Rook',
      img: currentPieceSet.pieceImages['R'] || '/images/lawbstation/redrook.png',
      desc: 'The Rook can move any number of squares horizontally or vertically (but not diagonally) as long as the path is clear.',
      color: 'red',
      type: 'rook'
    },
    {
      key: 'r',
      name: 'Blue Rook',
      img: currentPieceSet.pieceImages['r'] || '/images/lawbstation/bluerook.png',
      desc: 'The Rook can move any number of squares horizontally or vertically (but not diagonally) as long as the path is clear.',
      color: 'blue',
      type: 'rook'
    },
    {
      key: 'B',
      name: 'Red Bishop',
      img: currentPieceSet.pieceImages['B'] || '/images/lawbstation/redbishop.png',
      desc: 'The Bishop can move any number of squares diagonally (but not horizontally or vertically) as long as the path is clear. Each player starts with two Bishops, one on a light square and one on a dark square.',
      color: 'red',
      type: 'bishop'
    },
    {
      key: 'b',
      name: 'Blue Bishop',
      img: currentPieceSet.pieceImages['b'] || '/images/lawbstation/bluebishop.png',
      desc: 'The Bishop can move any number of squares diagonally (but not horizontally or vertically) as long as the path is clear. Each player starts with two Bishops, one on a light square and one on a dark square.',
      color: 'blue',
      type: 'bishop'
    },
    {
      key: 'N',
      name: 'Red Knight',
      img: currentPieceSet.pieceImages['N'] || '/images/lawbstation/redknight.png',
      desc: 'The Knight moves in an L-shape: two squares in one direction and then one square perpendicular, or one square in one direction and then two squares perpendicular. The Knight is the only piece that can jump over other pieces.',
      color: 'red',
      type: 'knight'
    },
    {
      key: 'n',
      name: 'Blue Knight',
      img: currentPieceSet.pieceImages['n'] || '/images/lawbstation/blueknight.png',
      desc: 'The Knight moves in an L-shape: two squares in one direction and then one square perpendicular, or one square in one direction and then two squares perpendicular. The Knight is the only piece that can jump over other pieces.',
      color: 'blue',
      type: 'knight'
    },
    {
      key: 'P',
      name: 'Red Pawn',
      img: currentPieceSet.pieceImages['P'] || '/images/lawbstation/redpawn.png',
      desc: 'The Pawn moves forward one square at a time (or two squares on its first move). Pawns capture diagonally one square forward. When a Pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a Queen).',
      color: 'red',
      type: 'pawn'
    },
    {
      key: 'p',
      name: 'Blue Pawn',
      img: currentPieceSet.pieceImages['p'] || '/images/lawbstation/bluepawn.png',
      desc: 'The Pawn moves forward one square at a time (or two squares on its first move). Pawns capture diagonally one square forward. When a Pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a Queen).',
      color: 'blue',
      type: 'pawn'
    }
  ], [currentPieceSet]);

  // Group pieces by type for better organization
  const orderedPieces: ChessPiece[] = useMemo(() => {
    const pieceOrder = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
    const ordered: ChessPiece[] = [];
    pieceOrder.forEach(type => {
      const redPiece = pieces.find(p => p.type === type && p.color === 'red');
      const bluePiece = pieces.find(p => p.type === type && p.color === 'blue');
      if (redPiece) ordered.push(redPiece);
      if (bluePiece) ordered.push(bluePiece);
    });
    return ordered;
  }, [pieces]);

  const handlePieceClick = (pieceKey: string) => {
    if (selectedPiece === pieceKey) {
      setSelectedPiece(null);
    } else {
      setSelectedPiece(pieceKey);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      padding: isMobile ? '16px' : '20px',
      gap: '12px',
      height: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      <h2 style={{ 
        margin: 0, 
        fontSize: isMobile ? '16px' : '18px', 
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000080',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        flexShrink: 0
      }}>
        Chess Piece Info
      </h2>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '4px',
        background: '#c0c0c0',
        border: '2px inset #c0c0c0',
        boxSizing: 'border-box',
        minHeight: 0,
        width: '100%'
      }}>
        {orderedPieces.map((piece) => {
          const isSelected = selectedPiece === piece.key;
          return (
            <div key={piece.key} style={{ marginBottom: '2px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={() => handlePieceClick(piece.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: isMobile ? '12px 16px' : '8px 12px',
                  background: isSelected ? '#ffff00' : '#c0c0c0',
                  border: isSelected ? '2px inset #c0c0c0' : '2px outset #c0c0c0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: isMobile ? '14px' : '12px',
                  color: '#000000',
                  minHeight: isMobile ? '52px' : '44px',
                  boxSizing: 'border-box',
                  fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', sans-serif",
                  borderLeft: piece.color === 'red' ? '4px solid #ff0000' : '4px solid #0000ff',
                  margin: 0,
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#d4d4d4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#c0c0c0';
                  }
                }}
              >
                <img 
                  src={piece.img} 
                  alt={piece.name}
                  style={{
                    width: isMobile ? '40px' : '32px',
                    height: isMobile ? '40px' : '32px',
                    minWidth: isMobile ? '40px' : '32px',
                    minHeight: isMobile ? '40px' : '32px',
                    maxWidth: isMobile ? '40px' : '32px',
                    maxHeight: isMobile ? '40px' : '32px',
                    objectFit: 'contain',
                    flexShrink: 0,
                    background: '#ffffff',
                    border: '1px inset #808080',
                    padding: '2px',
                    boxSizing: 'border-box',
                    display: 'block',
                    marginRight: '12px'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span style={{
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flex: 1,
                  textAlign: 'left',
                  color: piece.color === 'red' ? '#ff0000' : '#0000ff',
                  textDecoration: 'none',
                  display: 'block',
                  minWidth: 0
                }}>
                  {piece.name}
                </span>
              </button>
              {isSelected && (
                <div style={{
                  marginTop: '2px',
                  marginLeft: '4px',
                  marginRight: '4px',
                  marginBottom: '2px',
                  background: '#ffffff',
                  border: '2px inset #c0c0c0',
                  padding: '12px',
                  boxSizing: 'border-box',
                  fontSize: isMobile ? '13px' : '11px',
                  lineHeight: '1.5',
                  color: '#000000',
                  textAlign: 'left'
                }}>
                  {piece.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
