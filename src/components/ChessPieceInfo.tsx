import React, { useState, useMemo } from 'react';
import './ChessPieceInfo.css';
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
    <div className={`chess-piece-info-container ${isMobile ? 'mobile' : ''}`}>
      <h2 className="chess-piece-info-title">
        Chess Piece Info
      </h2>
      
      <div className="chess-piece-info-scroll">
        <div className="chess-piece-info-list">
          {orderedPieces.map((piece) => {
            const isSelected = selectedPiece === piece.key;
            return (
              <div key={piece.key} className="chess-piece-info-item">
                <button
                  onClick={() => handlePieceClick(piece.key)}
                  className={`chess-piece-info-item-button ${piece.color} ${isSelected ? 'selected' : ''}`}
                >
                  <img 
                    src={piece.img} 
                    alt={piece.name}
                    className="chess-piece-info-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span className={`chess-piece-info-name ${piece.color}`}>
                    {piece.name}
                  </span>
                </button>
                {isSelected && (
                  <div className="chess-piece-info-description">
                    {piece.desc}
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
