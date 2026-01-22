import React, { useState } from 'react';
import './ChessPieceInfo.css';

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

  // Define all chess pieces with their descriptions
  const pieces: ChessPiece[] = [
    {
      key: 'K',
      name: 'Red King',
      img: '/images/lawbstation/redking.png',
      desc: 'The King is the most important piece. If your King is captured (checkmate), you lose the game. The King can move one square in any direction (horizontally, vertically, or diagonally).',
      color: 'red',
      type: 'king'
    },
    {
      key: 'k',
      name: 'Blue King',
      img: '/images/lawbstation/blueking.png',
      desc: 'The King is the most important piece. If your King is captured (checkmate), you lose the game. The King can move one square in any direction (horizontally, vertically, or diagonally).',
      color: 'blue',
      type: 'king'
    },
    {
      key: 'Q',
      name: 'Red Queen',
      img: '/images/lawbstation/redqueen.png',
      desc: 'The Queen is the most powerful piece. It can move any number of squares in any direction (horizontally, vertically, or diagonally) as long as the path is clear.',
      color: 'red',
      type: 'queen'
    },
    {
      key: 'q',
      name: 'Blue Queen',
      img: '/images/lawbstation/bluequeen.png',
      desc: 'The Queen is the most powerful piece. It can move any number of squares in any direction (horizontally, vertically, or diagonally) as long as the path is clear.',
      color: 'blue',
      type: 'queen'
    },
    {
      key: 'R',
      name: 'Red Rook',
      img: '/images/lawbstation/redrook.png',
      desc: 'The Rook can move any number of squares horizontally or vertically (but not diagonally) as long as the path is clear.',
      color: 'red',
      type: 'rook'
    },
    {
      key: 'r',
      name: 'Blue Rook',
      img: '/images/lawbstation/bluerook.png',
      desc: 'The Rook can move any number of squares horizontally or vertically (but not diagonally) as long as the path is clear.',
      color: 'blue',
      type: 'rook'
    },
    {
      key: 'B',
      name: 'Red Bishop',
      img: '/images/lawbstation/redbishop.png',
      desc: 'The Bishop can move any number of squares diagonally (but not horizontally or vertically) as long as the path is clear. Each player starts with two Bishops, one on a light square and one on a dark square.',
      color: 'red',
      type: 'bishop'
    },
    {
      key: 'b',
      name: 'Blue Bishop',
      img: '/images/lawbstation/bluebishop.png',
      desc: 'The Bishop can move any number of squares diagonally (but not horizontally or vertically) as long as the path is clear. Each player starts with two Bishops, one on a light square and one on a dark square.',
      color: 'blue',
      type: 'bishop'
    },
    {
      key: 'N',
      name: 'Red Knight',
      img: '/images/lawbstation/redknight.png',
      desc: 'The Knight moves in an L-shape: two squares in one direction and then one square perpendicular, or one square in one direction and then two squares perpendicular. The Knight is the only piece that can jump over other pieces.',
      color: 'red',
      type: 'knight'
    },
    {
      key: 'n',
      name: 'Blue Knight',
      img: '/images/lawbstation/blueknight.png',
      desc: 'The Knight moves in an L-shape: two squares in one direction and then one square perpendicular, or one square in one direction and then two squares perpendicular. The Knight is the only piece that can jump over other pieces.',
      color: 'blue',
      type: 'knight'
    },
    {
      key: 'P',
      name: 'Red Pawn',
      img: '/images/lawbstation/redpawn.png',
      desc: 'The Pawn moves forward one square at a time (or two squares on its first move). Pawns capture diagonally one square forward. When a Pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a Queen).',
      color: 'red',
      type: 'pawn'
    },
    {
      key: 'p',
      name: 'Blue Pawn',
      img: '/images/lawbstation/bluepawn.png',
      desc: 'The Pawn moves forward one square at a time (or two squares on its first move). Pawns capture diagonally one square forward. When a Pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a Queen).',
      color: 'blue',
      type: 'pawn'
    }
  ];

  // Group pieces by type for better organization
  const pieceOrder = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  const orderedPieces: ChessPiece[] = [];
  pieceOrder.forEach(type => {
    const redPiece = pieces.find(p => p.type === type && p.color === 'red');
    const bluePiece = pieces.find(p => p.type === type && p.color === 'blue');
    if (redPiece) orderedPieces.push(redPiece);
    if (bluePiece) orderedPieces.push(bluePiece);
  });

  const handlePieceClick = (pieceKey: string) => {
    if (selectedPiece === pieceKey) {
      setSelectedPiece(null);
    } else {
      setSelectedPiece(pieceKey);
    }
  };

  return (
    <div className={`chess-piece-info ${isMobile ? 'mobile' : ''}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="chess-piece-info-header" style={{ flexShrink: 0 }}>
        <h2>Chess Piece Info</h2>
      </div>
      <div className="chess-piece-info-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', width: '100%' }}>
        <div className="chess-piece-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px', position: 'relative', width: '100%' }}>
          {orderedPieces.map((piece) => {
            const isSelected = selectedPiece === piece.key;
            return (
              <div 
                key={piece.key} 
                className="chess-piece-info-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '2px',
                  clear: 'both',
                  float: 'none',
                  top: 'auto',
                  left: 'auto',
                  right: 'auto',
                  bottom: 'auto'
                }}
              >
                <button
                  className={`chess-piece-info-item ${isSelected ? 'selected' : ''} ${piece.color}`}
                  onClick={() => handlePieceClick(piece.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    background: isSelected ? '#ffff00' : '#c0c0c0',
                    border: isSelected ? '2px inset #c0c0c0' : '2px outset #c0c0c0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: '#000000',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    position: 'relative',
                    margin: 0,
                    clear: 'both',
                    float: 'none',
                    top: 'auto',
                    left: 'auto',
                    right: 'auto',
                    bottom: 'auto',
                    borderLeft: piece.color === 'red' ? '4px solid #ff0000' : '4px solid #0000ff'
                  }}
                >
                  <div className="chess-piece-info-item-content" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <img 
                      src={piece.img} 
                      alt={piece.name}
                      className="chess-piece-info-image"
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        flexShrink: 0,
                        background: '#ffffff',
                        border: '1px inset #808080',
                        padding: '2px',
                        boxSizing: 'border-box',
                        display: 'block',
                        position: 'relative'
                      }}
                      onError={(e) => {
                        // Fallback if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <span 
                      className="chess-piece-info-name"
                      style={{
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        flex: 1,
                        textAlign: 'left',
                        color: piece.color === 'red' ? '#ff0000' : '#0000ff',
                        position: 'relative',
                        display: 'block'
                      }}
                    >
                      {piece.name}
                    </span>
                  </div>
                </button>
                {isSelected && (
                  <div 
                    className="chess-piece-info-description"
                    style={{
                      marginTop: '2px',
                      marginLeft: '4px',
                      marginRight: '4px',
                      marginBottom: '2px',
                      background: '#ffffff',
                      border: '2px inset #c0c0c0',
                      padding: '12px',
                      boxSizing: 'border-box',
                      position: 'relative',
                      width: 'calc(100% - 8px)',
                      display: 'block'
                    }}
                  >
                    <div 
                      className="chess-piece-info-desc-content"
                      style={{
                        fontSize: '11px',
                        lineHeight: '1.5',
                        color: '#000000',
                        textAlign: 'left',
                        position: 'relative',
                        display: 'block'
                      }}
                    >
                      {piece.desc}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
