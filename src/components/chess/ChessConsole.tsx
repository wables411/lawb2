import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { getDefaultPieceSet, type ChessPieceSet } from '../../config/chessPieceSets';
import './ChessConsole.css';

interface ChessConsoleProps {
  onClose?: () => void;
  isMobile?: boolean;
}

// Initial board state
const initialBoard: (string | null)[][] = [
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
];

export const ChessConsole: React.FC<ChessConsoleProps> = ({ onClose, isMobile = false }) => {
  const { address, isConnected } = useAccount();
  
  // Game state
  const [board, setBoard] = useState<(string | null)[][]>(() => JSON.parse(JSON.stringify(initialBoard)));
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [selectedPieceSet, setSelectedPieceSet] = useState<ChessPieceSet>(getDefaultPieceSet());
  const [selectedChessboard, setSelectedChessboard] = useState<string>(() => {
    const boards = ['/images/chessboard1.png', '/images/chessboard2.png', '/images/chessboard3.png', 
                    '/images/chessboard4.png', '/images/chessboard5.png', '/images/chessboard6.png'];
    return boards[Math.floor(Math.random() * boards.length)];
  });

  // Get piece images from selected piece set
  const pieceImages = selectedPieceSet.pieceImages;

  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (gameState !== 'playing') return;
    
    const piece = board[row][col];
    
    if (selectedSquare) {
      // Try to move
      if (selectedSquare.row === row && selectedSquare.col === col) {
        // Deselect
        setSelectedSquare(null);
      } else {
        // Attempt move (simplified - just swap for now)
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = board[selectedSquare.row][selectedSquare.col];
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        setBoard(newBoard);
        setSelectedSquare(null);
        setCurrentPlayer(currentPlayer === 'blue' ? 'red' : 'blue');
      }
    } else if (piece) {
      // Select piece
      const pieceColor = piece === piece.toUpperCase() ? 'red' : 'blue';
      if (pieceColor === currentPlayer || (pieceColor === 'red' && currentPlayer === 'blue') || (pieceColor === 'blue' && currentPlayer === 'red')) {
        setSelectedSquare({ row, col });
      }
    }
  };

  // Start game
  const handleStartGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)));
    setCurrentPlayer('blue');
    setSelectedSquare(null);
    setGameState('playing');
  };

  // Render square
  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
    const pieceImageUrl = piece && pieceImages[piece] ? pieceImages[piece] : null;

    return (
      <div
        key={`${row}-${col}`}
        className={`chess-square ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && pieceImageUrl && (
          <div
            className="chess-piece"
            style={{
              backgroundImage: `url(${pieceImageUrl})`,
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className={`chess-console ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="chess-console-content">
        {gameState === 'menu' ? (
          <div className="chess-mode-selector">
            <div className="chess-mode-title">LAWB CHESS</div>
            <div style={{ color: '#858585', marginBottom: '24px', textAlign: 'center' }}>
              {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect wallet to play'}
            </div>
            <button 
              className="chess-start-btn"
              onClick={handleStartGame}
              disabled={!isConnected}
            >
              Start Game
            </button>
          </div>
        ) : (
          <>
            <div className="chess-info-bar">
              <div className="chess-info-item">
                <span className="chess-info-label">Player:</span>
                <span className="chess-info-value">{currentPlayer === 'blue' ? 'Blue' : 'Red'}</span>
              </div>
              <div className="chess-info-item">
                <span className="chess-info-label">Status:</span>
                <span className="chess-info-value">Playing</span>
              </div>
              <button 
                onClick={() => setGameState('menu')}
                style={{
                  padding: '4px 12px',
                  background: '#3e3e42',
                  border: '1px solid #555',
                  color: '#cccccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Menu
              </button>
            </div>
            
            <div className="chess-board-wrapper">
              <div className="chess-board-container">
                <div 
                  className="chess-board"
                  style={{
                    backgroundImage: `url(${selectedChessboard})`,
                  }}
                >
                  {Array.from({ length: 8 }, (_, row) => (
                    Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

