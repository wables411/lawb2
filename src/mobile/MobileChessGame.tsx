import React, { useState, useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import './MobileChessGame.css';

// Supabase configuration
const supabaseUrl = 'https://roxwocgknkiqnsgiojgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

// Game modes
const GameMode = {
  AI: 'ai',
  ONLINE: 'online'
} as const;

// Leaderboard data type
interface LeaderboardEntry {
  username: string;
  chain_type: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  points: number;
  updated_at: string;
}

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
    '&.selected': {
      background: '#000080',
      color: 'white',
      border: '2px inset #fff',
    },
    '&.disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
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
  walletRequired: {
    textAlign: 'center',
    padding: '20px',
    background: '#f0f0f0',
    border: '2px inset #c0c0c0',
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

// Initial board state (matching desktop)
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
  onClose?: () => void;
}

const MobileChessGame: React.FC<MobileChessGameProps> = () => {
  const classes = useStyles();
  const { address: walletAddress } = useAccount();
  
  // Game state
  const [gameState, setGameState] = useState<'active' | 'checkmate' | 'stalemate'>('active');
  const [gameMode, setGameMode] = useState<typeof GameMode[keyof typeof GameMode]>(GameMode.AI);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [board, setBoard] = useState<(string | null)[][]>(() => JSON.parse(JSON.stringify(initialBoard)) as (string | null)[][]);
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ row: number; col: number }[]>([]);
  const [status, setStatus] = useState('Select game mode');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  
  const aiWorkerRef = useRef<Worker | null>(null);
  const isAIMovingRef = useRef<boolean>(false);
  const boardRef = useRef<(string | null)[][]>(board);

  // Update board ref whenever board state changes
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Check wallet connection and update status
  useEffect(() => {
    if (!walletAddress) {
      setStatus('Connect wallet to play');
      setGameState('active');
    } else {
      setStatus('Select game mode');
    }
  }, [walletAddress]);

  // Initialize AI worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        aiWorkerRef.current = new Worker('/aiWorker.js');
        aiWorkerRef.current.onmessage = (e: MessageEvent) => {
          const { move } = e.data as { move?: { from: { row: number; col: number }; to: { row: number; col: number } } };
          if (move) {
            setStatus('AI made a move');
            isAIMovingRef.current = false;
            makeMove(move.from, move.to, true);
          } else {
            isAIMovingRef.current = false;
            setStatus('AI could not find a move');
          }
        };
        aiWorkerRef.current.onerror = (error: ErrorEvent) => {
          console.error('AI Worker error:', error);
          setStatus('AI worker error - using fallback mode');
          isAIMovingRef.current = false;
        };
      } catch (error) {
        console.error('Failed to initialize AI worker:', error);
        setStatus('AI worker failed to load - using fallback mode');
      }
    }
    return () => {
      if (aiWorkerRef.current) {
        aiWorkerRef.current.terminate();
      }
    };
  }, []);

  // Load leaderboard
  useEffect(() => {
    void loadLeaderboard();
  }, []);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('points', { ascending: false });

      if (error) {
        console.error('Failed to load leaderboard:', error);
        return;
      }

      if (data) {
        setLeaderboardData(data as LeaderboardEntry[]);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getPieceColor = (piece: string | null): 'blue' | 'red' => {
    if (!piece) return 'blue';
    return piece === piece.toUpperCase() ? 'red' : 'blue';
  };

  const getLegalMoves = (from: { row: number; col: number }, boardState = board, player = currentPlayer): { row: number; col: number }[] => {
    const moves: { row: number; col: number }[] = [];
    const piece = boardState[from.row][from.col];
    if (!piece) return moves;

    const pieceColor = getPieceColor(piece);
    if (pieceColor !== player) return moves;

    // Simple legal move calculation (simplified for mobile)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const targetPiece = boardState[r][c];
        if (!targetPiece || getPieceColor(targetPiece) !== pieceColor) {
          moves.push({ row: r, col: c });
        }
      }
    }

    return moves;
  };

  const makeMove = (from: { row: number; col: number }, to: { row: number; col: number }, isAIMove = false) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    
    if (!piece) return;

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    setBoard(newBoard);
    setCurrentPlayer(switchPlayer(currentPlayer));
    setMoveHistory(prev => [...prev, `${from.row},${from.col} -> ${to.row},${to.col}`]);
    setSelectedPiece(null);
    setLegalMoves([]);
    
    // AI move for AI mode
    if (gameMode === GameMode.AI && !isAIMove && currentPlayer === 'blue') {
      window.setTimeout(() => {
        if (aiWorkerRef.current && !isAIMovingRef.current) {
          isAIMovingRef.current = true;
          aiWorkerRef.current.postMessage({
            board: newBoard,
            difficulty: difficulty,
            player: 'red'
          });
        } else {
          // Fallback random move
          const aiMoves = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (newBoard[r][c] && getPieceColor(newBoard[r][c]) === 'red') {
                for (let tr = 0; tr < 8; tr++) {
                  for (let tc = 0; tc < 8; tc++) {
                    if (!newBoard[tr][tc] || getPieceColor(newBoard[tr][tc]) === 'blue') {
                      aiMoves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
                    }
                  }
                }
              }
            }
          }
          
          if (aiMoves.length > 0) {
            const randomMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
            makeMove(randomMove.from, randomMove.to, true);
          }
        }
      }, 500);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState !== 'active' || isAIMovingRef.current) return;

    const piece = board[row][col];
    
    if (selectedPiece) {
      // Move piece
      const [fromRow, fromCol] = [selectedPiece.row, selectedPiece.col];
      if (legalMoves.some(move => move.row === row && move.col === col)) {
        makeMove({ row: fromRow, col: fromCol }, { row, col });
      }
      
      setSelectedPiece(null);
      setLegalMoves([]);
    } else if (piece && getPieceColor(piece) === currentPlayer) {
      // Select piece
      setSelectedPiece({ row, col });
      setLegalMoves(getLegalMoves({ row, col }));
    }
  };

  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)) as (string | null)[][]);
    setCurrentPlayer('blue');
    setSelectedPiece(null);
    setLegalMoves([]);
    setGameState('active');
    setMoveHistory([]);
    setStatus('Select game mode');
  };

  const backToMenu = () => {
    setGameState('active');
    resetGame();
  };

  const handleGameModeSelect = (mode: typeof GameMode[keyof typeof GameMode]) => {
    setGameMode(mode);
    setGameState('active');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Wallet required screen
  if (!walletAddress) {
    return (
      <div className={classes.mobileChessContainer}>
        <div className={classes.walletRequired}>
          <p>Connect your wallet to play chess</p>
        </div>
      </div>
    );
  }

  const renderGameModeSelection = () => (
    <div className={classes.gameModeSelection}>
      <h3 style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '16px' }}>Select Game Mode</h3>
      <div 
        className={`${classes.gameModeOption} ${gameMode === GameMode.AI ? 'selected' : ''}`}
        onClick={() => handleGameModeSelect(GameMode.AI)}
      >
        VS the House
      </div>
      <div 
        className={`${classes.gameModeOption} disabled`}
        onClick={() => {}} // Disabled
      >
        PvP Under Construction
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
          className={`${classes.difficultyButton} ${difficulty === 'easy' ? 'selected' : ''}`}
          onClick={() => setDifficulty('easy')}
        >
          Easy
        </button>
        <button 
          className={`${classes.difficultyButton} ${difficulty === 'medium' ? 'selected' : ''}`}
          onClick={() => setDifficulty('medium')}
        >
          Medium
        </button>
        <button 
          className={`${classes.difficultyButton} ${difficulty === 'hard' ? 'selected' : ''}`}
          onClick={() => setDifficulty('hard')}
        >
          Hard
        </button>
      </div>

      <button className={classes.startButton} onClick={() => setGameState('active')}>
        Start Game
      </button>

      <div className={classes.leaderboard}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textAlign: 'center' }}>Leaderboard</h4>
        <table className={classes.leaderboardTable}>
          <thead>
            <tr>
              <th className={classes.leaderboardTableTh}>Rank</th>
              <th className={classes.leaderboardTableTh}>Player</th>
              <th className={classes.leaderboardTableTh}>W</th>
              <th className={classes.leaderboardTableTh}>L</th>
              <th className={classes.leaderboardTableTh}>D</th>
              <th className={classes.leaderboardTableTh}>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.slice(0, 5).map((entry, index) => (
              <tr key={entry.username}>
                <td className={classes.leaderboardTableTd}>{index + 1}</td>
                <td className={classes.leaderboardTableTd}>{formatAddress(entry.username)}</td>
                <td className={classes.leaderboardTableTd}>{entry.wins}</td>
                <td className={classes.leaderboardTableTd}>{entry.losses}</td>
                <td className={classes.leaderboardTableTd}>{entry.draws}</td>
                <td className={classes.leaderboardTableTd}>{entry.points}</td>
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
            const isSelected = selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex;
            const isLegalMove = legalMoves.some(move => move.row === rowIndex && move.col === colIndex);
            
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
          {status}
        </div>
        <div className={classes.status}>
          Current: {currentPlayer === 'blue' ? 'Blue' : 'Red'}
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
      {gameState === 'active' && renderGameModeSelection()}
      {gameState === 'active' && renderDifficultySelection()}
      {gameState === 'active' && renderGame()}
    </div>
  );
};

export default MobileChessGame; 