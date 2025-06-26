import React, { useState, useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  mobileChessContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
  },
  gameModeSelection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '8px',
    height: '100%',
    overflowY: 'auto',
  },
  gameModeOption: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    '&:active': {
      border: '2px inset #fff',
    },
  },
  difficultySelection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
    height: '100%',
    overflowY: 'auto',
  },
  difficultyButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  difficultyButton: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '60px',
    '&.selected': {
      background: '#000080',
      color: 'white',
      border: '2px inset #fff',
    },
    '&:active': {
      border: '2px inset #fff',
    },
  },
  startButton: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '8px',
    alignSelf: 'center',
    '&:active': {
      border: '2px inset #fff',
    },
  },
  pieceGallery: {
    maxHeight: '120px',
    overflowY: 'auto',
    marginBottom: '8px',
    padding: '4px',
    background: '#f0f0f0',
    border: '1px inset #fff',
  },
  pieceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
    gap: '4px',
  },
  pieceItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2px',
    fontSize: '8px',
    textAlign: 'center',
  },
  pieceImage: {
    width: '24px',
    height: '24px',
    marginBottom: '2px',
  },
  pieceName: {
    fontSize: '8px',
    fontWeight: 'bold',
  },
  pieceDesc: {
    fontSize: '7px',
    color: '#666',
  },
  leaderboard: {
    maxHeight: '100px',
    overflowY: 'auto',
    fontSize: '10px',
    background: '#f0f0f0',
    border: '1px inset #fff',
    padding: '4px',
  },
  leaderboardTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '9px',
  },
  leaderboardTableTh: {
    background: '#000080',
    color: 'white',
    padding: '2px 4px',
    textAlign: 'center',
    fontWeight: 'bold',
    border: '1px solid #c0c0c0',
  },
  leaderboardTableTd: {
    padding: '2px 4px',
    textAlign: 'center',
    border: '1px solid #c0c0c0',
    background: 'white',
  },
  gameBoard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  chessboard: {
    width: '100%',
    maxWidth: '280px',
    height: '280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gridTemplateRows: 'repeat(8, 1fr)',
    border: '2px solid #000',
    flexShrink: 0,
  },
  square: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  squareLight: {
    backgroundColor: '#f0d9b5',
  },
  squareDark: {
    backgroundColor: '#b58863',
  },
  squareSelected: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  squareLegalMove: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  squareLastMove: {
    backgroundColor: 'rgba(255, 255, 0, 0.3)',
  },
  piece: {
    width: '80%',
    height: '80%',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    cursor: 'pointer',
  },
  gameInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    fontSize: '12px',
    overflowY: 'auto',
    flex: 1,
  },
  status: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '4px',
    background: '#f0f0f0',
    border: '1px inset #fff',
  },
  moveHistory: {
    maxHeight: '80px',
    overflowY: 'auto',
    background: '#f0f0f0',
    border: '1px inset #fff',
    padding: '4px',
    fontSize: '10px',
  },
  gameControls: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    padding: '8px',
    flexWrap: 'wrap',
  },
  controlButton: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '11px',
    '&:active': {
      border: '2px inset #fff',
    },
  },
});

// Chess piece images
const pieceImages: { [key: string]: string } = {
  'R': '/images/redrook.png',
  'N': '/images/redknight.png',
  'B': '/images/redbishop.png',
  'Q': '/images/redqueen.png',
  'K': '/images/redking.png',
  'P': '/images/redpawn.png',
  'r': '/images/bluerook.png',
  'n': '/images/blueknight.png',
  'b': '/images/bluebishop.png',
  'q': '/images/bluequeen.png',
  'k': '/images/blueking.png',
  'p': '/images/bluepawn.png'
};

// Utility to switch player color
const switchPlayer = (player: 'blue' | 'red'): 'blue' | 'red' => (player === 'blue' ? 'red' : 'blue');

// Chess piece gallery for mobile
const pieceGallery = [
  { key: 'K', name: 'Red King', img: '/images/redking.png', desc: 'Moves one square in any direction' },
  { key: 'Q', name: 'Red Queen', img: '/images/redqueen.png', desc: 'Moves any number of squares in any direction' },
  { key: 'R', name: 'Red Rook', img: '/images/redrook.png', desc: 'Moves any number of squares horizontally or vertically' },
  { key: 'B', name: 'Red Bishop', img: '/images/redbishop.png', desc: 'Moves any number of squares diagonally' },
  { key: 'N', name: 'Red Knight', img: '/images/redknight.png', desc: 'Moves in an L-shape: 2 squares in one direction, then 1 square perpendicular' },
  { key: 'P', name: 'Red Pawn', img: '/images/redpawn.png', desc: 'Moves forward one square, captures diagonally' },
];

interface MobileChessGameProps {
  onClose: () => void;
}

const MobileChessGame: React.FC<MobileChessGameProps> = ({ onClose }) => {
  const classes = useStyles();
  const [gameState, setGameState] = useState<'menu' | 'difficulty' | 'game'>('menu');
  const [selectedMode, setSelectedMode] = useState<'ai' | 'multiplayer'>('ai');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [board, setBoard] = useState<string[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  // Initialize board
  useEffect(() => {
    const initialBoard = [
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
    ];
    setBoard(initialBoard);
  }, []);

  const handleGameModeSelect = (mode: 'ai' | 'multiplayer') => {
    setSelectedMode(mode);
    setGameState('difficulty');
  };

  const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setGameState('game');
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState !== 'game') return;

    const piece = board[row][col];
    
    if (selectedSquare) {
      // Move piece
      const [fromRow, fromCol] = selectedSquare;
      if (legalMoves.some(([r, c]) => r === row && c === col)) {
        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = newBoard[fromRow][fromCol];
        newBoard[fromRow][fromCol] = '';
        
        setBoard(newBoard);
        setCurrentPlayer(switchPlayer(currentPlayer));
        setMoveHistory(prev => [...prev, `${fromRow},${fromCol} -> ${row},${col}`]);
        
        // Simple AI move for AI mode
        if (selectedMode === 'ai' && currentPlayer === 'blue') {
          setTimeout(() => {
            // Simple random AI move
            const aiMoves = [];
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                if (newBoard[r][c] && newBoard[r][c] === newBoard[r][c].toLowerCase()) {
                  // Find possible moves for this piece
                  for (let tr = 0; tr < 8; tr++) {
                    for (let tc = 0; tc < 8; tc++) {
                      if (newBoard[tr][tc] === '' || newBoard[tr][tc] === newBoard[tr][tc].toUpperCase()) {
                        aiMoves.push([r, c, tr, tc]);
                      }
                    }
                  }
                }
              }
            }
            
            if (aiMoves.length > 0) {
              const [fromR, fromC, toR, toC] = aiMoves[Math.floor(Math.random() * aiMoves.length)];
              const aiBoard = newBoard.map(row => [...row]);
              aiBoard[toR][toC] = aiBoard[fromR][fromC];
              aiBoard[fromR][fromC] = '';
              setBoard(aiBoard);
              setCurrentPlayer('blue');
              setMoveHistory(prev => [...prev, `AI: ${fromR},${fromC} -> ${toR},${toC}`]);
            }
          }, 500);
        }
      }
      
      setSelectedSquare(null);
      setLegalMoves([]);
    } else if (piece && piece === piece.toLowerCase() === (currentPlayer === 'blue')) {
      // Select piece
      setSelectedSquare([row, col]);
      // Calculate legal moves (simplified)
      const moves: [number, number][] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c] === '' || board[r][c] === board[r][c].toUpperCase()) {
            moves.push([r, c]);
          }
        }
      }
      setLegalMoves(moves);
    }
  };

  const resetGame = () => {
    const initialBoard = [
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
    ];
    setBoard(initialBoard);
    setCurrentPlayer('blue');
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameStatus('');
    setMoveHistory([]);
  };

  const backToMenu = () => {
    setGameState('menu');
    resetGame();
  };

  const renderGameModeSelection = () => (
    <div className={classes.gameModeSelection}>
      <h3 style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '16px' }}>Select Game Mode</h3>
      <div className={classes.gameModeOption} onClick={() => handleGameModeSelect('ai')}>
        VS the House
      </div>
      <div className={classes.gameModeOption} onClick={() => handleGameModeSelect('multiplayer')}>
        Multiplayer
      </div>
    </div>
  );

  const renderDifficultySelection = () => (
    <div className={classes.difficultySelection}>
      <h3 style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '16px' }}>Select Difficulty</h3>
      
      <div className={classes.pieceGallery}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textAlign: 'center' }}>Lawbstation Chess Pieces</h4>
        <div className={classes.pieceGrid}>
          {pieceGallery.map(piece => (
            <div key={piece.key} className={classes.pieceItem}>
              <img src={piece.img} alt={piece.name} className={classes.pieceImage} />
              <div className={classes.pieceName}>{piece.name}</div>
              <div className={classes.pieceDesc}>{piece.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={classes.difficultyButtons}>
        <button 
          className={`${classes.difficultyButton} ${selectedDifficulty === 'easy' ? 'selected' : ''}`}
          onClick={() => setSelectedDifficulty('easy')}
        >
          Easy
        </button>
        <button 
          className={`${classes.difficultyButton} ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
          onClick={() => setSelectedDifficulty('medium')}
        >
          Medium
        </button>
        <button 
          className={`${classes.difficultyButton} ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
          onClick={() => setSelectedDifficulty('hard')}
        >
          Hard
        </button>
      </div>

      <button className={classes.startButton} onClick={() => setGameState('game')}>
        Start Game
      </button>

      <div className={classes.leaderboard}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textAlign: 'center' }}>Leaderboard</h4>
        <table className={classes.leaderboardTable}>
          <thead>
            <tr>
              <th className={classes.leaderboardTableTh}>Rank</th>
              <th className={classes.leaderboardTableTh}>Player</th>
              <th className={classes.leaderboardTableTh}>Wins</th>
              <th className={classes.leaderboardTableTh}>Losses</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.slice(0, 5).map((entry, index) => (
              <tr key={index}>
                <td className={classes.leaderboardTableTd}>{index + 1}</td>
                <td className={classes.leaderboardTableTd}>{entry.username?.slice(0, 8)}...</td>
                <td className={classes.leaderboardTableTd}>{entry.wins}</td>
                <td className={classes.leaderboardTableTd}>{entry.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className={classes.gameBoard}>
      <div className={classes.chessboard}>
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex;
            const isLegalMove = legalMoves.some(([r, c]) => r === rowIndex && c === colIndex);
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`${classes.square} ${isLight ? classes.squareLight : classes.squareDark} ${
                  isSelected ? classes.squareSelected : ''
                } ${isLegalMove ? classes.squareLegalMove : ''}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {piece && (
                  <div
                    className={classes.piece}
                    style={{ backgroundImage: `url(${pieceImages[piece]})` }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={classes.gameInfo}>
        <div className={classes.status}>
          Current Player: {currentPlayer === 'blue' ? 'Blue' : 'Red'}
        </div>
        
        <div className={classes.moveHistory}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '11px' }}>Move History</h4>
          {moveHistory.slice(-5).map((move, index) => (
            <div key={index} style={{ fontSize: '9px' }}>{move}</div>
          ))}
        </div>

        <div className={classes.gameControls}>
          <button className={classes.controlButton} onClick={resetGame}>
            New Game
          </button>
          <button className={classes.controlButton} onClick={backToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={classes.mobileChessContainer}>
      {gameState === 'menu' && renderGameModeSelection()}
      {gameState === 'difficulty' && renderDifficultySelection()}
      {gameState === 'game' && renderGame()}
    </div>
  );
};

export default MobileChessGame; 