import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  updateLeaderboardEntry, 
  getTopLeaderboardEntries,
  formatAddress as formatLeaderboardAddress,
  removeZeroAddressEntry,
  type LeaderboardEntry 
} from '../firebaseLeaderboard';
import ChessMultiplayer from './ChessMultiplayer';
import './ChessGame.css';

// Game modes
const GameMode = {
  AI: 'ai',
  ONLINE: 'online'
} as const;

// Sanko testnet chain ID
const SANKO_CHAIN_ID = 1992;

// LeaderboardEntry interface is now imported from firebaseLeaderboard

// Chess piece images
const pieceImages: { [key: string]: string } = {
  // Red pieces (uppercase)
  'R': '/images/redrook.png',
  'N': '/images/redknight.png',
  'B': '/images/redbishop.png',
  'Q': '/images/redqueen.png',
  'K': '/images/redking.png',
  'P': '/images/redpawn.png',
  // Blue pieces (lowercase)
  'r': '/images/bluerook.png',
  'n': '/images/blueknight.png',
  'b': '/images/bluebishop.png',
  'q': '/images/bluequeen.png',
  'k': '/images/blueking.png',
  'p': '/images/bluepawn.png'
};

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

interface ChessGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  fullscreen?: boolean;
}

// Piece gallery data
const pieceGallery = [
  { key: 'K', name: 'Red King', img: '/images/redking.png', desc: 'The King moves one square in any direction. Protect your King at all costs!' },
  { key: 'Q', name: 'Red Queen', img: '/images/redqueen.png', desc: 'The Queen moves any number of squares in any direction.' },
  { key: 'R', name: 'Red Rook', img: '/images/redrook.png', desc: 'The Rook moves any number of squares horizontally or vertically.' },
  { key: 'B', name: 'Red Bishop', img: '/images/redbishop.png', desc: 'The Bishop moves any number of squares diagonally.' },
  { key: 'N', name: 'Red Knight', img: '/images/redknight.png', desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
  { key: 'P', name: 'Red Pawn', img: '/images/redpawn.png', desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
  { key: 'k', name: 'Blue King', img: '/images/blueking.png', desc: 'The King moves one square in any direction. Protect your King at all costs!' },
  { key: 'q', name: 'Blue Queen', img: '/images/bluequeen.png', desc: 'The Queen moves any number of squares in any direction.' },
  { key: 'r', name: 'Blue Rook', img: '/images/bluerook.png', desc: 'The Rook moves any number of squares horizontally or vertically.' },
  { key: 'b', name: 'Blue Bishop', img: '/images/bluebishop.png', desc: 'The Bishop moves any number of squares diagonally.' },
  { key: 'n', name: 'Blue Knight', img: '/images/blueknight.png', desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
  { key: 'p', name: 'Blue Pawn', img: '/images/bluepawn.png', desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
];

// Updated difficulty levels
type Difficulty = 'easy' | 'hard';

// Stockfish integration for chess AI
const useStockfish = () => {
  const [stockfishReady, setStockfishReady] = useState(false);
  const stockfishRef = useRef<Worker | null>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current || stockfishRef.current) {
      return; // Already initializing or already loaded
    }

    isInitializingRef.current = true;
    console.log('[DEBUG] Initializing LawbBot...');
    
    const loadStockfish = () => {
      try {
        // Create Worker directly from the Worker file
        const worker = new Worker('/stockfish.worker.js');
        
        worker.onmessage = (event) => {
          console.log('[DEBUG] Stockfish worker message:', event.data);
        };
        
        worker.onerror = (error) => {
          console.error('[DEBUG] Stockfish worker error:', error);
          setStockfishReady(false);
          isInitializingRef.current = false;
        };
        
        // Worker is ready immediately after creation
        console.log('[DEBUG] LawbBot initialized successfully');
        stockfishRef.current = worker;
        setStockfishReady(true);
        isInitializingRef.current = false;
        
        // Configure Stockfish for better performance - these will be sent when needed
        console.log('[DEBUG] Stockfish worker ready for commands');
        
      } catch (error) {
        console.error('[DEBUG] Failed to create Stockfish worker:', error);
        setStockfishReady(false);
        isInitializingRef.current = false;
      }
    };

    void loadStockfish();

    return () => {
      if (stockfishRef.current) {
        try {
          stockfishRef.current.terminate();
        } catch (e) {
          console.warn('[DEBUG] Error terminating LawbBot:', e);
        }
        stockfishRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, []);

  const getStockfishMove = useCallback((fen: string, timeLimit: number = 4000): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!stockfishRef.current) {
        console.warn('[DEBUG] Stockfish not ready, using fallback');
        resolve(null);
        return;
      }

      console.log('[DEBUG] Starting Stockfish calculation for FEN:', fen, 'timeLimit:', timeLimit);
      let bestMove: string | null = null;
      let isResolved = false;

      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        if (typeof message === 'string' && message.startsWith('bestmove ')) {
          const parts = message.split(' ');
          bestMove = parts[1] || null;
          console.log('[DEBUG] Stockfish bestmove found:', bestMove);
          if (!isResolved) {
            isResolved = true;
            stockfishRef.current?.removeEventListener('message', messageHandler);
            resolve(bestMove);
          }
        }
      };

      try {
        stockfishRef.current.addEventListener('message', messageHandler);

        // Set up Stockfish with higher depth
        stockfishRef.current.postMessage('uci');
        stockfishRef.current.postMessage('isready');
        stockfishRef.current.postMessage(`position fen ${fen}`);
        
        // Use longer time limits
        const adjustedTimeLimit = timeLimit > 5000 ? timeLimit * 1.5 : timeLimit;
        stockfishRef.current.postMessage(`go movetime ${adjustedTimeLimit} depth 20`);

        // Timeout fallback
        const timeoutDuration = timeLimit > 5000 ? timeLimit * 2 : timeLimit + 1000;
        window.setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try {
              stockfishRef.current?.removeEventListener('message', messageHandler);
            } catch (e) {
              console.warn('[DEBUG] Error removing message listener:', e);
            }
            console.warn('[DEBUG] Stockfish timeout after', timeoutDuration, 'ms');
            resolve(bestMove);
          }
        }, timeoutDuration);
      } catch (error) {
        console.error('[DEBUG] Stockfish communication error:', error);
        resolve(null);
      }
    });
  }, []);

  // DigitalOcean VPS Stockfish API for production
  const getCloudflareStockfishMove = useCallback(async (fen: string, timeLimit: number = 4000): Promise<string | null> => {
    try {
      // Use DigitalOcean VPS in production, local proxy in development
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = 'https://chess.lawb.xyz/api/stockfish'; // Use trusted HTTPS endpoint
      
      console.log(`[DEBUG] Attempting API call to ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen,
          movetime: timeLimit
        })
      });

      if (response.ok) {
        const data = await response.json() as { move?: string };
        console.log(`[DEBUG] API call successful to ${apiUrl}:`, data);
        return data.move || null; // Netlify function returns 'move', not 'bestmove'
      } else {
        console.warn(`[DEBUG] API failed with status ${response.status} on ${apiUrl}`);
        return null;
      }
    } catch (error) {
      console.warn('[DEBUG] API error:', error);
      return null;
    }
  }, []);

  return { stockfishReady, getStockfishMove, getCloudflareStockfishMove };
};

// Lichess API integration for opening database and analysis
const useLichessAPI = () => {
  const [openingData, setOpeningData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getOpeningData = useCallback(async (fen: string) => {
    try {
      setIsAnalyzing(true);
      // Get opening data from Lichess API
      const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}`);
      if (response.ok) {
        const data = await response.json();
        setOpeningData(data);
        return data;
      }
    } catch (error) {
      console.warn('[DEBUG] Lichess API error:', error);
    } finally {
      setIsAnalyzing(false);
    }
    return null;
  }, []);

  const getMoveAnalysis = useCallback(async (fen: string, move: string) => {
    try {
      // Get move analysis from Lichess API
      const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&play=${move}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('[DEBUG] Lichess move analysis error:', error);
    }
    return null;
  }, []);

  return { openingData, isAnalyzing, getOpeningData, getMoveAnalysis };
};

export const ChessGame: React.FC<ChessGameProps> = ({ onClose, onMinimize, fullscreen = false }) => {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();
  
  // Game state
  const [gameMode, setGameMode] = useState<'ai' | 'online'>(GameMode.AI);
  const [board, setBoard] = useState<(string | null)[][]>(() => JSON.parse(JSON.stringify(initialBoard)));
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [gameState, setGameState] = useState<'active' | 'checkmate' | 'stalemate'>('active');
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('hard');
  const [status, setStatus] = useState<string>('Connect wallet to play');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [legalMoves, setLegalMoves] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // UI state
  const [showGame, setShowGame] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // Capture animation state
  const [captureAnimation, setCaptureAnimation] = useState<{ row: number; col: number; show: boolean } | null>(null);
  
  // Multiplayer state
  const [inviteCode] = useState<string>('');
  const [wager] = useState<number>(0.1);
  
  // Piece state tracking
  const [pieceState, setPieceState] = useState({
    blueKingMoved: false,
    redKingMoved: false,
    blueRooksMove: { left: false, right: false },
    redRooksMove: { left: false, right: false },
    lastPawnDoubleMove: null as { row: number; col: number } | null
  });
  
  const aiWorkerRef = useRef<Worker | null>(null);
  const isAIMovingRef = useRef(false);
  const boardRef = useRef(board);
  const makeMoveRef = useRef<((from: { row: number; col: number }, to: { row: number; col: number }, isAIMove?: boolean) => void) | null>(null);
  const aiTimeoutRef = useRef<number | null>(null);
  const lastAIMoveRef = useRef(false);
  const apiCallInProgressRef = useRef(false);

  // Add showDifficulty state
  const [showDifficulty, setShowDifficulty] = useState(false);

  // Add state for piece gallery modal
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Add state for leaderboard updated message
  const [showLeaderboardUpdated, setShowLeaderboardUpdated] = useState(false);

  // Always use dark mode for chess
  const [darkMode] = useState(true);
  
  // Always apply dark mode classes
  useEffect(() => {
    document.documentElement.classList.add('chess-dark-mode');
    document.body.classList.add('chess-dark-mode');
  }, []);

  // Add Stockfish integration
  const { stockfishReady, getStockfishMove, getCloudflareStockfishMove } = useStockfish();

  // Add Lichess API integration
  const { openingData, isAnalyzing, getOpeningData, getMoveAnalysis } = useLichessAPI();

  // Add state for Stockfish status
  const [stockfishStatus, setStockfishStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  // Add state for opening suggestions
  const [showOpeningSuggestions, setShowOpeningSuggestions] = useState(false);
  const [openingSuggestions, setOpeningSuggestions] = useState<any[]>([]);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);

  // Add state for random chessboard selection
  const [selectedChessboard, setSelectedChessboard] = useState<string>(() => {
    const chessboards = [
      '/images/chessboard1.png',
      '/images/chessboard2.png',
      '/images/chessboard3.png',
      '/images/chessboard4.png',
      '/images/chessboard5.png',
      '/images/chessboard6.png'
    ];
    const randomIndex = Math.floor(Math.random() * chessboards.length);
    const selected = chessboards[randomIndex];
    console.log('[DEBUG] Initial random chessboard selected:', selected, '(index:', randomIndex, ')');
    return selected;
  });

  // Add sound and celebration state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [victoryCelebration, setVictoryCelebration] = useState(false);

  // Check wallet connection and chain - trigger popup if not connected or wrong network
  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setStatus('Connect wallet to play');
      setShowGame(false);
      setShowDifficulty(false);
      // Trigger Reown appkit popup
      void open();
    } else if (chainId !== SANKO_CHAIN_ID) {
      setStatus('Switch to Sanko Testnet to play');
      setShowGame(false);
      setShowDifficulty(false);
      // Trigger Reown appkit popup to switch network
      void open();
    } else {
      setStatus('Select game mode');
    }
  }, [isConnected, walletAddress, chainId, open]);

  // Handle switching to Sanko testnet
  const handleSwitchToSanko = async () => {
    try {
      await switchChain({ chainId: SANKO_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch to Sanko testnet:', error);
      setStatus('Failed to switch network. Please switch manually to Sanko Testnet.');
    }
  };

  // Function to randomly select a chessboard
  const selectRandomChessboard = () => {
    const chessboards = [
      '/images/chessboard1.png',
      '/images/chessboard2.png',
      '/images/chessboard3.png',
      '/images/chessboard4.png',
      '/images/chessboard5.png',
      '/images/chessboard6.png'
    ];
    const randomIndex = Math.floor(Math.random() * chessboards.length);
    const selected = chessboards[randomIndex];
    console.log('[DEBUG] Random chessboard selected:', selected, '(index:', randomIndex, ')');
    return selected;
  };

  // Update Stockfish status when ready state changes
  useEffect(() => {
    if (stockfishReady) {
      setStockfishStatus('ready');
    } else {
      // Check if we've tried to load Stockfish and failed
      const timeoutId = window.setTimeout(() => {
        if (!stockfishReady) {
          setStockfishStatus('failed');
          console.warn('[DEBUG] Stockfish failed to load within timeout');
        }
      }, 10000); // Increased to 10 second timeout
      
      // Cleanup timeout if Stockfish loads before timeout
      return () => window.clearTimeout(timeoutId);
    }
  }, [stockfishReady]);

  // Update board ref whenever board state changes
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Initialize AI worker
  useEffect(() => {
    if (!aiWorkerRef.current && typeof Worker !== 'undefined') {
      aiWorkerRef.current = new Worker('/aiWorker.js');
      aiWorkerRef.current.onmessage = (e: MessageEvent) => {
        console.log('[DEBUG] AI worker response received:', e.data);
        const { move, nodes } = e.data as {
          move?: { from: { row: number; col: number }; to: { row: number; col: number } };
          nodes?: number;
        };
        // Only apply if it's still AI's turn and game is active
        if (move && isAIMovingRef.current && gameState === 'active') {
          console.log('[DEBUG] AI worker move is valid, executing:', move);
          console.log('[DEBUG] AI searched', nodes, 'nodes');
          isAIMovingRef.current = false;
          // Clear any pending timeout
          if (aiTimeoutRef.current) { 
            window.clearTimeout(aiTimeoutRef.current); 
            aiTimeoutRef.current = null; 
          }
          if (makeMoveRef.current) {
            makeMoveRef.current(move.from, move.to, true);
          }
        } else {
          console.log('[DEBUG] AI worker response ignored - not AI turn or game not active');
        }
      };
      aiWorkerRef.current.onerror = (error: ErrorEvent) => {
        console.error('[DEBUG] AI worker error:', error);
        setStatus('AI worker error - using fallback mode');
        isAIMovingRef.current = false;
      };
    }
    return () => {
      if (aiWorkerRef.current) {
        aiWorkerRef.current.terminate();
        aiWorkerRef.current = null;
      }
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load leaderboard
  useEffect(() => {
    void loadLeaderboard();
  }, []);

  // Load leaderboard data from Firebase
  const loadLeaderboard = async (): Promise<void> => {
    try {
      // First, try to remove any zero address entry
      await removeZeroAddressEntry();
      
      const data = await getTopLeaderboardEntries(20);
      setLeaderboardData(data);
      console.log('Leaderboard data loaded:', data);
    } catch (error) {
      setStatus('Failed to load leaderboard');
      console.error('Leaderboard error:', error);
    }
  };

  // Update score using Firebase
  const updateScore = async (gameResult: 'win' | 'loss' | 'draw') => {
    console.log('[DEBUG] updateScore called with:', gameResult);
    if (!walletAddress) {
      console.log('[DEBUG] No wallet address, returning');
      return;
    }

    try {
      console.log('[DEBUG] Updating score for address:', formatLeaderboardAddress(walletAddress));
      
      // Update leaderboard entry using Firebase
      const success = await updateLeaderboardEntry(walletAddress, gameResult);
      
      if (success) {
        console.log('[DEBUG] Successfully updated score for:', formatLeaderboardAddress(walletAddress));
        // Reload leaderboard after score update
        await loadLeaderboard();
      } else {
        console.error('[DEBUG] Failed to update score');
      }
      
    } catch (error) {
      console.error('[DEBUG] Error in updateScore:', error);
    }
  };

  // Utility functions
  const getPieceColor = (piece: string | null): 'blue' | 'red' => {
    if (!piece) return 'blue';
    return piece === piece.toUpperCase() ? 'red' : 'blue';
  };

  const isWithinBoard = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  };

  const coordsToAlgebraic = (row: number, col: number): string => {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
  };

  // Check if king is in check
  const isKingInCheck = (board: (string | null)[][], player: 'blue' | 'red'): boolean => {
    const kingSymbol = player === 'blue' ? 'k' : 'K';
    let kingPos: { row: number; col: number } | null = null;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === kingSymbol) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }
    
    if (!kingPos) {
      console.log(`King not found for ${player}`);
      return false;
    }
    
    const attackingColor = player === 'blue' ? 'red' : 'blue';
    const isUnderAttack = isSquareUnderAttack(kingPos.row, kingPos.col, attackingColor, board);
    console.log(`${player} king at ${kingPos.row},${kingPos.col} under attack: ${isUnderAttack}`);
    return isUnderAttack;
  };

  // Check if square is under attack
  const isSquareUnderAttack = (row: number, col: number, attackingColor: 'blue' | 'red', board: (string | null)[][]): boolean => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && getPieceColor(piece) === attackingColor) {
          if (canPieceMove(piece, r, c, row, col, false, attackingColor, board, true)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Check if move would expose king to check
  const wouldMoveExposeCheck = (startRow: number, startCol: number, endRow: number, endCol: number, player: 'blue' | 'red', boardState = board): boolean => {
    const tempBoard = boardState.map(row => [...row]);
    const piece = tempBoard[startRow][startCol];
    tempBoard[endRow][endCol] = piece;
    tempBoard[startRow][startCol] = null;
    
    return isKingInCheck(tempBoard, player);
  };

  // Move validation functions
  const isValidPawnMove = (color: 'blue' | 'red', startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    const direction = color === 'blue' ? -1 : 1;
    const startingRow = color === 'blue' ? 6 : 1;
    
    // Check if target square is within board bounds
    if (!isWithinBoard(endRow, endCol)) {
      return false;
    }
    
    // Early validation - pawns can only move forward
    if (color === 'blue' && endRow >= startRow) return false; // Blue pawns move up (decreasing row)
    if (color === 'red' && endRow <= startRow) return false;  // Red pawns move down (increasing row)
    
    // Only log for potentially valid moves (within reasonable range) - reduced logging
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);
    
    // Only log if this is a valid pawn move pattern to reduce spam
    const isValidPattern = (rowDiff === 1 && colDiff === 0) || 
                          (rowDiff === 2 && colDiff === 0 && startRow === startingRow) ||
                          (rowDiff === 1 && colDiff === 1);
    
    // Further reduce logging - only log in development mode
    if (isValidPattern && rowDiff <= 2 && colDiff <= 1 && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('[DEBUG] Pawn move check:', { color, from: `${startRow},${startCol}`, to: `${endRow},${endCol}` });
    }
    
    // Forward move (1 square)
    if (startCol === endCol && endRow === startRow + direction) {
      return board[endRow][endCol] === null;
    }
    
    // Initial 2-square move
    if (startCol === endCol && startRow === startingRow && endRow === startRow + 2 * direction) {
      return board[startRow + direction][startCol] === null && board[endRow][endCol] === null;
    }
    
    // Capture move (diagonal)
    if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction) {
      const targetPiece = board[endRow][endCol];
      return targetPiece !== null && getPieceColor(targetPiece) !== color;
    }
    
    // En passant (only if no regular capture is possible)
    if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction) {
      const targetPiece = board[startRow][endCol];
      if (targetPiece && getPieceColor(targetPiece) !== color && targetPiece.toLowerCase() === 'p') {
        if (pieceState.lastPawnDoubleMove && 
            pieceState.lastPawnDoubleMove.row === startRow && 
            pieceState.lastPawnDoubleMove.col === endCol) {
          console.log('[DEBUG] Pawn en passant move');
          return true;
        }
      }
    }
    
    return false;
  };

  const isValidRookMove = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    if (startRow !== endRow && startCol !== endCol) return false;
    return isPathClear(startRow, startCol, endRow, endCol, board);
  };

  const isValidKnightMove = (startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
    const rowDiff = Math.abs(startRow - endRow);
    const colDiff = Math.abs(startCol - endCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  const isValidBishopMove = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) return false;
    return isPathClear(startRow, startCol, endRow, endCol, board);
  };

  const isValidQueenMove = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    return isValidRookMove(startRow, startCol, endRow, endCol, board) || 
           isValidBishopMove(startRow, startCol, endRow, endCol, board);
  };

  const isValidKingMove = (color: 'blue' | 'red', startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
    const rowDiff = Math.abs(startRow - endRow);
    const colDiff = Math.abs(startCol - endCol);
    
    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) return true;
    
    // Castling
    if (rowDiff === 0 && colDiff === 2) {
      if (color === 'blue' && !pieceState.blueKingMoved) {
        if (endCol === 6 && !pieceState.blueRooksMove.right) return true; // Kingside
        if (endCol === 2 && !pieceState.blueRooksMove.left) return true;  // Queenside
      } else if (color === 'red' && !pieceState.redKingMoved) {
        if (endCol === 6 && !pieceState.redRooksMove.right) return true; // Kingside
        if (endCol === 2 && !pieceState.redRooksMove.left) return true;  // Queenside
      }
    }
    
    return false;
  };

  const isPathClear = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    const rowStep = startRow === endRow ? 0 : (endRow - startRow) / Math.abs(endRow - startRow);
    const colStep = startCol === endCol ? 0 : (endCol - startCol) / Math.abs(endCol - startCol);
    
    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;
    
    while (currentRow !== endRow || currentCol !== endCol) {
      if (board[currentRow][currentCol] !== null) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const canPieceMove = (piece: string, startRow: number, startCol: number, endRow: number, endCol: number, checkForCheck = true, playerColor = getPieceColor(piece), boardState = board, silent = false): boolean => {
    if (!isWithinBoard(endRow, endCol)) {
      if (!silent) console.log('[ILLEGAL MOVE] Out of board:', { piece, startRow, startCol, endRow, endCol });
      return false;
    }
    const targetPiece = boardState[endRow][endCol];
    if (targetPiece && getPieceColor(targetPiece) === playerColor) {
      if (!silent) console.log('[ILLEGAL MOVE] Capturing own piece:', { piece, startRow, startCol, endRow, endCol });
      return false;
    }
    const pieceType = piece.toLowerCase();
    let isValid = false;
    switch (pieceType) {
      case 'p':
        isValid = isValidPawnMove(playerColor, startRow, startCol, endRow, endCol, boardState);
        break;
      case 'r':
        isValid = isValidRookMove(startRow, startCol, endRow, endCol, boardState);
        break;
      case 'n':
        isValid = isValidKnightMove(startRow, startCol, endRow, endCol);
        break;
      case 'b':
        isValid = isValidBishopMove(startRow, startCol, endRow, endCol, boardState);
        break;
      case 'q':
        isValid = isValidQueenMove(startRow, startCol, endRow, endCol, boardState);
        break;
      case 'k':
        isValid = isValidKingMove(playerColor, startRow, startCol, endRow, endCol);
        break;
    }
    if (!isValid) {
      if (!silent) console.log('[ILLEGAL MOVE] Piece cannot move that way:', { 
        piece, startRow, startCol, endRow, endCol, playerColor, pieceType,
        targetPiece: boardState[endRow][endCol],
        targetPieceColor: boardState[endRow][endCol] ? getPieceColor(boardState[endRow][endCol]) : null
      });
      return false;
    }
    if (isValid && checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, playerColor, boardState)) {
      if (!silent) console.log('[ILLEGAL MOVE] Move exposes king to check:', { piece, startRow, startCol, endRow, endCol });
      return false;
    }
    return isValid;
  };

  // Get legal moves for a piece (optimized)
  const getLegalMoves = (from: { row: number; col: number }, boardState = board, player = currentPlayer): { row: number; col: number }[] => {
    const moves: { row: number; col: number }[] = [];
    const piece = boardState[from.row][from.col];
    
    if (!piece || getPieceColor(piece) !== player) return moves;
    
    const pieceType = piece.toLowerCase();
    
    // Optimize move generation based on piece type
    if (pieceType === 'p') {
      // For pawns, only check relevant squares
      const direction = player === 'blue' ? -1 : 1;
      const startingRow = player === 'blue' ? 6 : 1;
      
      // Forward moves
      const forwardRow = from.row + direction;
      if (forwardRow >= 0 && forwardRow < 8) {
        if (canPieceMove(piece, from.row, from.col, forwardRow, from.col, true, player, boardState, true)) {
          moves.push({ row: forwardRow, col: from.col });
        }
      }
      
      // Double move from starting position
      if (from.row === startingRow) {
        const doubleRow = from.row + 2 * direction;
        if (doubleRow >= 0 && doubleRow < 8) {
          if (canPieceMove(piece, from.row, from.col, doubleRow, from.col, true, player, boardState, true)) {
            moves.push({ row: doubleRow, col: from.col });
          }
        }
      }
      
      // Diagonal captures
      for (const colOffset of [-1, 1]) {
        const captureCol = from.col + colOffset;
        const captureRow = from.row + direction;
        if (captureCol >= 0 && captureCol < 8 && captureRow >= 0 && captureRow < 8) {
          if (canPieceMove(piece, from.row, from.col, captureRow, captureCol, true, player, boardState, true)) {
            moves.push({ row: captureRow, col: captureCol });
          }
        }
      }
    } else if (pieceType === 'n') {
      // For knights, only check L-shaped moves
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      
      for (const [rowOffset, colOffset] of knightMoves) {
        const newRow = from.row + rowOffset;
        const newCol = from.col + colOffset;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          if (canPieceMove(piece, from.row, from.col, newRow, newCol, true, player, boardState, true)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    } else {
      // For other pieces (rook, bishop, queen, king), check all squares but use silent mode
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (canPieceMove(piece, from.row, from.col, row, col, true, player, boardState, true)) {
            moves.push({ row, col });
          }
        }
      }
    }
    
    return moves;
  };

  // Check for checkmate
  const isCheckmate = (player: 'blue' | 'red', boardState = board): boolean => {
    if (!isKingInCheck(boardState, player)) return false;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && getPieceColor(piece) === player) {
          const legalMoves = getLegalMoves({ row, col }, boardState, player);
          if (legalMoves.length > 0) return false;
        }
      }
    }
    
    return true;
  };

  // Check for stalemate
  const isStalemate = (player: 'blue' | 'red', boardState = board): boolean => {
    if (isKingInCheck(boardState, player)) return false;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && getPieceColor(piece) === player) {
          const legalMoves = getLegalMoves({ row, col }, boardState, player);
          if (legalMoves.length > 0) return false;
        }
      }
    }
    
    return true;
  };

  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (gameState !== 'active' || isAIMovingRef.current) return;
    
    const piece = board[row][col];
    const pieceColor = piece ? getPieceColor(piece) : null;
    
    // If a piece is selected and we click on a legal move
    if (selectedPiece && legalMoves.some(move => move.row === row && move.col === col)) {
      makeMove(selectedPiece, { row, col });
      return;
    }
    
    // If we click on a piece of the current player
    if (piece && pieceColor === currentPlayer) {
      const moves = getLegalMoves({ row, col });
      setSelectedPiece({ row, col });
      setLegalMoves(moves);
      return;
    }
    
    // Deselect if clicking on invalid square
    setSelectedPiece(null);
    setLegalMoves([]);
  };

  // Make a move
  const makeMove = (from: { row: number; col: number }, to: { row: number; col: number }, isAIMove = false) => {
    const piece = board[from.row][from.col];
    console.log('[MOVE ATTEMPT]', { from, to, piece, isAIMove, board: JSON.parse(JSON.stringify(board)), moveHistory });
    if (!piece) return;
    
    // Check for pawn promotion
    if (piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
      setPromotionMove({ from, to });
      setShowPromotion(true);
      return;
    }
    
    executeMove(from, to, 'q', isAIMove);
  };

  // Store makeMove in ref for AI worker access
  makeMoveRef.current = makeMove;

  // Enhanced move execution with opening analysis
  const executeMoveAfterAnimation = useCallback((from: { row: number; col: number }, to: { row: number; col: number }, isAIMove: boolean = false) => {
    
    
    // Set flag to prevent AI validation during board update
    setIsUpdatingBoard(true);
    
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    
    if (!piece) return;
    
    // Execute the move
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    // Handle special moves (castling, en passant, pawn promotion)
    handleSpecialMoves(newBoard, from, to, piece);
    
    
    
    // Update move history
    const moveNotation = getMoveNotation(from, to, piece, newBoard);
    setMoveHistory(prev => {
      const updated = [...prev, moveNotation];
      console.log('[MOVE HISTORY UPDATED]', updated);
      return updated;
    });
    
    // Update last move for highlighting
    setLastMove({ from, to });
    
    // Clear selection
    setSelectedPiece(null);
    setLegalMoves([]);
    
    // Check for opening analysis (first 10 moves)
    if (moveHistory.length < 10 && !isAIMove) {
      const fen = boardToFEN(newBoard, currentPlayer === 'blue' ? 'red' : 'blue');
      getOpeningData(fen).then(data => {
        if (data && data.moves && data.moves.length > 0) {
          setOpeningSuggestions(data.moves.slice(0, 3)); // Top 3 moves
          setShowOpeningSuggestions(true);
          // Auto-hide after 5 seconds
          setTimeout(() => setShowOpeningSuggestions(false), 5000);
        }
      });
    }
    
    // Update piece state
    updatePieceState(from, to, piece);
    
    
    
    // Switch players
    setCurrentPlayer(prev => {
      const newPlayer = prev === 'blue' ? 'red' : 'blue';
      console.log('[DEBUG] Player switched to:', newPlayer);
      // Check game end for the player who is about to move (after switch)
      checkGameEnd(newBoard, newPlayer);
      return newPlayer;
    });
    
    // Check game end conditions
    checkGameEnd(newBoard, currentPlayer === 'blue' ? 'red' : 'blue');
    
    // Update board state IMMEDIATELY to ensure AI validation uses correct state
    setBoard(newBoard);
    
    // Reset AI moving flag and allow AI validation again
    isAIMovingRef.current = false;
    lastAIMoveRef.current = false;
    apiCallInProgressRef.current = false;
    setIsUpdatingBoard(false);
  }, [board, currentPlayer, moveHistory, getOpeningData]);

  // AI move effect - trigger AI move when it's red's turn
  useEffect(() => {
    if (!isAIMovingRef.current && gameMode === 'ai' && currentPlayer === 'red' && !lastAIMoveRef.current && !isUpdatingBoard) {
      isAIMovingRef.current = true;
      if (difficulty === 'easy') {
        // Easy: random move
        setTimeout(() => {
          const move = getRandomAIMove(board);
          if (move) {
            makeMove(move.from, move.to, true);
          } else {
            isAIMovingRef.current = false;
          }
        }, 600);
      } else {
        // Hard: Stockfish API
        setStatus('AI is calculating...');
        const fen = boardToFEN(board, currentPlayer);
        if (apiCallInProgressRef.current) return;
        apiCallInProgressRef.current = true;
        const apiData = { fen, difficulty, movetime: 3000 };
        fetch('https://chess.lawb.xyz/api/stockfish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData)
        }).then(response => {
          if (response.ok) return response.json();
          throw new Error('API call failed');
        }).then(data => {
          console.log('[DEBUG] Stockfish API response:', data);
          const move = data.bestmove || data.move;
          if (move && move !== '(none)' && move.length === 4) {
            const fromCol = move.charCodeAt(0) - 97;
            const fromRowStockfish = parseInt(move[1]);
            const toCol = move.charCodeAt(2) - 97;
            const toRowStockfish = parseInt(move[3]);
            const fromRow = 8 - fromRowStockfish;
            const toRow = 8 - toRowStockfish;
            console.log('[DEBUG] Parsed move:', { fromCol, fromRowStockfish, toCol, toRowStockfish, fromRow, toRow });
            if (fromCol >= 0 && fromCol < 8 && fromRow >= 0 && fromRow < 8 && toCol >= 0 && toCol < 8 && toRow >= 0 && toRow < 8) {
              const moveObj = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
              const piece = board[fromRow][fromCol];
              console.log('[DEBUG] Move validation:', { piece, moveObj, isValid: piece && getPieceColor(piece) === 'red' && canPieceMove(piece, fromRow, fromCol, toRow, toCol, true, 'red', board) });
              if (piece && getPieceColor(piece) === 'red' && canPieceMove(piece, fromRow, fromCol, toRow, toCol, true, 'red', board)) {
                console.log('[DEBUG] Executing Stockfish move:', moveObj);
                makeMove(moveObj.from, moveObj.to, true);
              } else {
                console.warn('[DEBUG] Invalid Stockfish move, falling back to random');
                const fallbackMove = getRandomAIMove(board);
                if (fallbackMove) {
                  makeMove(fallbackMove.from, fallbackMove.to, true);
                }
                isAIMovingRef.current = false;
                apiCallInProgressRef.current = false;
              }
            } else {
              console.warn('[DEBUG] Invalid move coordinates, falling back to random');
              const fallbackMove = getRandomAIMove(board);
              if (fallbackMove) {
                makeMove(fallbackMove.from, fallbackMove.to, true);
              }
              isAIMovingRef.current = false;
              apiCallInProgressRef.current = false;
            }
          } else {
            console.warn('[DEBUG] Invalid move format from API, falling back to random');
            const fallbackMove = getRandomAIMove(board);
            if (fallbackMove) {
              makeMove(fallbackMove.from, fallbackMove.to, true);
            }
            isAIMovingRef.current = false;
            apiCallInProgressRef.current = false;
          }
        }).catch((error) => {
          console.error('[DEBUG] Stockfish API error:', error);
          setStatus('AI error. Falling back to random moves.');
          const fallbackMove = getRandomAIMove(board);
          if (fallbackMove) {
            makeMove(fallbackMove.from, fallbackMove.to, true);
          }
          isAIMovingRef.current = false;
          apiCallInProgressRef.current = false;
        });
      }
    }
  }, [currentPlayer, gameMode, difficulty, board, pieceState, stockfishReady]);

  // Check game end
  const checkGameEnd = (boardState: (string | null)[][], playerToMove: 'blue' | 'red'): 'checkmate' | 'stalemate' | null => {
    console.log('Checking game end for player:', playerToMove);
    
    // Check for king capture first
    const blueKingFound = boardState.some(row => row.some(piece => piece === 'k'));
    const redKingFound = boardState.some(row => row.some(piece => piece === 'K'));
    
    if (!blueKingFound) {
      console.log('[GAME END] KING CAPTURED - Red wins!');
      setGameState('checkmate');
      setStatus('King captured! Red wins!');
      void updateScore('loss');
      setShowLeaderboardUpdated(true);
      setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      return 'checkmate';
    }
    
    if (!redKingFound) {
      console.log('[GAME END] KING CAPTURED - Blue wins!');
      setGameState('checkmate');
      setStatus('King captured! You win!');
      void updateScore('win');
      setShowLeaderboardUpdated(true);
      setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      return 'checkmate';
    }
    
    console.log('Is king in check:', isKingInCheck(boardState, playerToMove));
    
    if (isCheckmate(playerToMove, boardState)) {
      console.log('[GAME END] CHECKMATE', { winner: playerToMove === 'blue' ? 'red' : 'blue', board: JSON.parse(JSON.stringify(boardState)), moveHistory });
      setGameState('checkmate');
      
      // Determine winner and update leaderboard
      const winner = playerToMove === 'blue' ? 'red' : 'blue';
      const isPlayerWin = winner === 'blue'; // Blue is always the human player
      
      if (isPlayerWin) {
        setStatus(`Checkmate! You win!`);
        playSound('victory');
        setShowVictory(true);
        setVictoryCelebration(true);
        triggerVictoryCelebration();
        void updateScore('win');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      } else {
        setStatus(`Checkmate! ${winner === 'red' ? 'AI' : 'Opponent'} wins!`);
        playSound('loser');
        setShowDefeat(true);
        void updateScore('loss');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      }
      
      return 'checkmate';
    }
    
    if (isStalemate(playerToMove, boardState)) {
      console.log('[GAME END] STALEMATE', { board: JSON.parse(JSON.stringify(boardState)), moveHistory });
      setGameState('stalemate');
      
      // Stalemate = loss for the player who gets stalemated
      // playerToMove is the one who has no legal moves, so they lose
      const winner = playerToMove === 'blue' ? 'red' : 'blue';
      const isPlayerWin = winner === 'blue'; // Blue is always the human player
      
      if (isPlayerWin) {
        setStatus(`Stalemate! You win!`);
        playSound('victory');
        setShowVictory(true);
        setVictoryCelebration(true);
        triggerVictoryCelebration();
        void updateScore('win');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      } else {
        setStatus(`Stalemate! ${winner === 'red' ? 'AI' : 'Opponent'} wins!`);
        playSound('loser');
        setShowDefeat(true);
        void updateScore('loss');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      }
      
      return 'stalemate';
    }
    
    if (isKingInCheck(boardState, playerToMove)) {
      console.log('CHECK detected!');
      playSound('check');
      setStatus(`${playerToMove === 'blue' ? 'Blue' : 'Red'} is in check!`);
    } else {
      setStatus(`Your turn`);
    }
    
    return null;
  };

  // Simple AI move (fallback)
  const getRandomAIMove = (boardState: (string | null)[][]): { from: { row: number; col: number }; to: { row: number; col: number } } | null => {
    const aiPieces: { row: number; col: number }[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && getPieceColor(piece) === 'red') {
          aiPieces.push({ row, col });
        }
      }
    }
    // Shuffle pieces for randomness
    for (let i = aiPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [aiPieces[i], aiPieces[j]] = [aiPieces[j], aiPieces[i]];
    }
    // Separate moves into captures and non-captures
    const captureMoves: { from: { row: number; col: number }; to: { row: number; col: number }; value: number }[] = [];
    const nonCaptureMoves: { from: { row: number; col: number }; to: { row: number; col: number } }[] = [];
    for (const piece of aiPieces) {
      const legalMoves = getLegalMoves(piece, boardState, 'red');
      for (const move of legalMoves) {
        const targetPiece = boardState[move.row][move.col];
        if (targetPiece && getPieceColor(targetPiece) === 'blue') {
          // This is a capture move
          const pieceValues: { [key: string]: number } = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
          const value = pieceValues[targetPiece.toLowerCase()] || 0;
          captureMoves.push({ from: piece, to: move, value });
        } else {
          nonCaptureMoves.push({ from: piece, to: move });
        }
      }
    }
    // 30% chance to capture if possible, otherwise prefer non-capturing moves
    if (captureMoves.length > 0 && Math.random() < 0.3) {
      captureMoves.sort((a, b) => a.value - b.value);
      for (const bestCapture of captureMoves) {
        const tempBoard = boardState.map(row => [...row]);
        const pieceSymbol = tempBoard[bestCapture.from.row][bestCapture.from.col];
        tempBoard[bestCapture.to.row][bestCapture.to.col] = pieceSymbol;
        tempBoard[bestCapture.from.row][bestCapture.from.col] = null;
        if (!isKingInCheck(tempBoard, 'red')) {
          return { from: bestCapture.from, to: bestCapture.to };
        }
      }
    }
    // Prefer non-capturing moves
    for (const move of nonCaptureMoves) {
      const tempBoard = boardState.map(row => [...row]);
      const pieceSymbol = tempBoard[move.from.row][move.from.col];
      tempBoard[move.to.row][move.to.col] = pieceSymbol;
      tempBoard[move.from.row][move.from.col] = null;
      if (!isKingInCheck(tempBoard, 'red')) {
        return move;
      }
    }
    // If no non-capturing moves, pick a random capture (lowest value first for passivity)
    captureMoves.sort((a, b) => a.value - b.value);
    for (const bestCapture of captureMoves) {
      const tempBoard = boardState.map(row => [...row]);
      const pieceSymbol = tempBoard[bestCapture.from.row][bestCapture.from.col];
      tempBoard[bestCapture.to.row][bestCapture.to.col] = pieceSymbol;
      tempBoard[bestCapture.from.row][bestCapture.from.col] = null;
      if (!isKingInCheck(tempBoard, 'red')) {
        return { from: bestCapture.from, to: bestCapture.to };
      }
    }
    return null;
  };

  // Game control functions
  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)));
    setCurrentPlayer('blue');
    setSelectedPiece(null);
    setGameState('active');
    setMoveHistory([]);
    setLegalMoves([]);
    setLastMove(null);
    setShowGame(false);
    setStatus('Select game mode');
    setPieceState({
      blueKingMoved: false,
      redKingMoved: false,
      blueRooksMove: { left: false, right: false },
      redRooksMove: { left: false, right: false },
      lastPawnDoubleMove: null
    });
    // Don't select chessboard here - let startGame() handle it
    if (isAIMovingRef.current) isAIMovingRef.current = false;
  };

  // Update startAIGame to show difficulty selection instead of starting the game immediately
  const startAIGame = () => {
    setShowDifficulty(true);
  };

  const startMultiplayerGame = () => {
    setShowGame(true);
    setStatus('Set wager and create/join game');
  };

  const startGame = () => {
    playStartSound();
    console.log('[DEBUG] startGame called, difficulty:', difficulty, 'gameMode:', gameMode);
    
    if (gameMode === 'online') {
      // For multiplayer, we'll show the multiplayer component instead
      setShowGame(false);
      setShowDifficulty(false);
      return;
    }
    
    setShowGame(true);
    setShowDifficulty(false);
    setStatus(`Game started! Your turn`);
    const newChessboard = selectRandomChessboard();
    setSelectedChessboard(newChessboard);
    console.log('[DEBUG] Game started with chessboard:', newChessboard);
  };

  // Multiplayer functionality moved to ChessMultiplayer component

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Render functions
  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
    const isLegalMove = legalMoves.some(move => move.row === row && move.col === col);
    const isLastMove = lastMove && (lastMove.from.row === row && lastMove.from.col === col || 
                                   lastMove.to.row === row && lastMove.to.col === col);

  return (
      <div
        key={`${row}-${col}`}
        className={`square ${isSelected ? 'selected' : ''} ${isLegalMove ? 'legal-move' : ''} ${isLastMove ? 'last-move' : ''}`}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && (
          <div
            className="piece"
              style={{
              backgroundImage: pieceImages[piece] ? `url(${pieceImages[piece]})` : undefined,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          />
        )}
        {isLegalMove && <div className="legal-move-indicator" />}
      </div>
    );
  };

  const renderPromotionDialog = () => {
    if (!showPromotion || !promotionMove) return null;
    
    const pieces = currentPlayer === 'blue' ? ['q', 'r', 'b', 'n'] : ['Q', 'R', 'B', 'N'];
    
    return (
      <div className="promotion-dialog">
        <div className="promotion-content">
          <h3>Choose promotion piece:</h3>
          <div className="promotion-pieces">
            {pieces.map(piece => (
              <div
                key={piece}
                className="promotion-piece"
                onClick={() => {
                  executeMove(promotionMove.from, promotionMove.to, piece);
                  setShowPromotion(false);
                  setPromotionMove(null);
                }}
            style={{
                  backgroundImage: pieceImages[piece] ? `url(${pieceImages[piece]})` : undefined,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}
              />
            ))}
        </div>
      </div>
      </div>
    );
  };

  const [selectedGalleryPiece, setSelectedGalleryPiece] = useState<string | null>(null);

  const renderPieceGallery = (small = false, tipText = 'Click a piece to learn more about it.') => (
    <div className={`piece-gallery${small ? ' piece-gallery-sm' : ''}`}>
      <h3 style={{color: '#32CD32'}}>Lawbstation Chess Pieces</h3>
      <div className="piece-gallery-grid">
        {pieceGallery.map(piece => (
          <div key={piece.key} className="piece-gallery-item" onClick={() => {
            // Toggle description - if already selected, deselect; otherwise select
            setSelectedGalleryPiece(selectedGalleryPiece === piece.key ? null : piece.key);
          }}>
            <img src={piece.img} alt={piece.name} className="piece-gallery-img" />
            <div className="piece-gallery-name">{piece.name}</div>
            {selectedGalleryPiece === piece.key && (
              <div className="piece-gallery-desc">{piece.desc}</div>
            )}
          </div>
        ))}
      </div>
      <div className="piece-gallery-tip">{tipText}</div>
    </div>
  );

  const renderDifficultySelection = () => (
    <div className="difficulty-selection-row" style={{ justifyContent: 'center' }}>
      <div className="difficulty-controls-col">
        <div className="difficulty-selection-panel" style={{background:'transparent',borderRadius:0,padding:'32px 24px',boxShadow:'none',textAlign:'center'}}>
          <h2 style={{fontWeight:700,letterSpacing:1,fontSize:'2rem',color:'#00ff00',marginBottom:16,textShadow:'0 0 6px #00ff00, 0 0 2px #00ff00'}}>Select Difficulty</h2>
          <p style={{fontSize:'1.1rem',color:'#00ff00',marginBottom:24,textShadow:'0 0 6px #00ff00, 0 0 2px #00ff00'}}>Compete against the computer to climb the leaderboard.</p>
          <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:24}}>
            <button
              className={`difficulty-btn${difficulty === 'easy' ? ' selected' : ''}`}
              style={{background:difficulty==='easy'?'#00ff00':'transparent',color:difficulty==='easy'?'#000':'#00ff00',fontWeight:'bold',fontSize:'1.1em',padding:'12px 32px',borderRadius:0,border:'1px solid #00ff00',cursor:'pointer',letterSpacing:1,boxShadow:difficulty==='easy'?'0 0 6px #00ff00, 0 0 2px #00ff00':'none'}}
              onClick={()=>setDifficulty('easy')}
            >Easy</button>
            <button
              className={`difficulty-btn${difficulty === 'hard' ? ' selected' : ''}`}
              style={{background:difficulty==='hard'?'#00ff00':'transparent',color:difficulty==='hard'?'#000':'#00ff00',fontWeight:'bold',fontSize:'1.1em',padding:'12px 32px',borderRadius:0,border:'1px solid #00ff00',cursor:'pointer',letterSpacing:1,boxShadow:difficulty==='hard'?'0 0 6px #00ff00, 0 0 2px #00ff00':'none'}}
              onClick={()=>setDifficulty('hard')}
            >Hard</button>
          </div>
          <button 
            className={`difficulty-btn start-btn`}
            onClick={() => { startGame(); }}
            style={{ 
              background: 'transparent',
              color: '#00ff00',
              fontWeight: 'bold',
              fontSize: '1.3em',
              padding: '18px 48px',
              borderRadius: 0,
              boxShadow: '0 0 6px #00ff00, 0 0 2px #00ff00',
              border: '1px solid #00ff00',
              cursor: 'pointer',
              letterSpacing: 1,
              marginBottom: 8
            }}
          >
            <span role="img" aria-label="chess">♟️</span> Start Game
          </button>
        </div>
      </div>
    </div>
  );

  // Helper functions for move execution
  const handleSpecialMoves = (newBoard: (string | null)[][], from: { row: number; col: number }, to: { row: number; col: number }, piece: string) => {
    // Handle pawn promotion
    if (piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
      const promotedPiece = getPieceColor(piece) === 'blue' ? 'q' : 'Q';
      newBoard[to.row][to.col] = promotedPiece;
    }
    
    // Handle castling
    if (piece.toLowerCase() === 'k' && Math.abs(from.col - to.col) === 2) {
      if (to.col === 6) { // Kingside
        newBoard[from.row][7] = null;
        newBoard[from.row][5] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
      } else if (to.col === 2) { // Queenside
        // Save the queen if it exists at d1/d8 before moving the rook
        const queenPiece = newBoard[from.row][3];
        newBoard[from.row][0] = null;
        newBoard[from.row][3] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
        // If there was a queen at d1/d8, move it to a safe position (e1/e8)
        if (queenPiece && queenPiece.toLowerCase() === 'q') {
          newBoard[from.row][4] = queenPiece;
        }
      }
    }
  };

  const getMoveNotation = (from: { row: number; col: number }, to: { row: number; col: number }, piece: string, board: (string | null)[][]) => {
    const fromSquare = coordsToAlgebraic(from.row, from.col);
    const toSquare = coordsToAlgebraic(to.row, to.col);
    return `${fromSquare}-${toSquare}`;
  };

  const updatePieceState = (from: { row: number; col: number }, to: { row: number; col: number }, piece: string) => {
    const newPieceState = { ...pieceState };
    
    if (piece.toLowerCase() === 'k') {
      if (getPieceColor(piece) === 'blue') {
        newPieceState.blueKingMoved = true;
      } else {
        newPieceState.redKingMoved = true;
      }
    } else if (piece.toLowerCase() === 'r') {
      if (getPieceColor(piece) === 'blue') {
        if (from.col === 0) newPieceState.blueRooksMove.left = true;
        if (from.col === 7) newPieceState.blueRooksMove.right = true;
      } else {
        if (from.col === 0) newPieceState.redRooksMove.left = true;
        if (from.col === 7) newPieceState.redRooksMove.right = true;
      }
    }
    
    // Handle pawn double move for en passant
    if (piece.toLowerCase() === 'p' && Math.abs(from.row - to.row) === 2) {
      newPieceState.lastPawnDoubleMove = { row: to.row, col: to.col };
    } else {
      newPieceState.lastPawnDoubleMove = null;
    }
    
    setPieceState(newPieceState);
  };

  // Execute move with capture animation
  const executeMove = (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q', isAIMove = false) => {
    const piece = board[from.row][from.col];
    const capturedPiece = board[to.row][to.col];
    
    // Check if this is a capture move
    const isCapture = capturedPiece !== null;
    
    // Play sound effects and create particle effects
    if (isCapture) {
      playSound('capture');
    } else {
      playSound('move');
    }
    
    // If it's a capture, show the explosion animation first
    if (isCapture) {
      setCaptureAnimation({ row: to.row, col: to.col, show: true });
      
      // Wait for animation to complete before executing the move
      setTimeout(() => {
        executeMoveAfterAnimation(from, to, isAIMove);
        setCaptureAnimation(null);
      }, 500); // Animation duration
      return;
    }
    
    // If not a capture, execute move immediately
    executeMoveAfterAnimation(from, to, isAIMove);
  };

  // Add epic sound effects and visual enhancements

  // Sound effects
  const playSound = (soundType: 'move' | 'capture' | 'check' | 'checkmate' | 'victory' | 'loser' | 'upgrade') => {
    if (!soundEnabled) return;
    let src = '';
    switch (soundType) {
      case 'move':
        src = '/images/move.mp3';
        break;
      case 'capture':
        src = '/images/capture.mp3';
        break;
      case 'check':
        src = '/images/play.mp3';
        break;
      case 'checkmate':
        src = '/images/victory.mp3';
        break;
      case 'victory':
        src = '/images/victory.mp3';
        break;
      case 'loser':
        src = '/images/loser.mp3';
        break;
      case 'upgrade':
        src = '/images/upgrade.mp3';
        break;
      default:
        src = '/images/move.mp3';
    }
    const audio = new Audio(src);
    audio.play().catch(() => {});
  };

  // Victory celebration
  const triggerVictoryCelebration = () => {
    playSound('victory');
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'][Math.floor(Math.random() * 5)]};
          left: ${Math.random() * window.innerWidth}px;
          top: -10px;
          z-index: 9999;
          animation: confetti-fall 3s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
      }, i * 100);
    }
    // Create balloon effect
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const balloon = document.createElement('div');
        const colors = ['#ff4444', '#4444ff', '#ffff44', '#ff44ff', '#ff8844'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        balloon.style.cssText = `
          position: fixed;
          width: 60px;
          height: 80px;
          background: ${color};
          border-radius: 50% 50% 50% 50% /60% 40% 60% 40%;
          left: ${Math.random() * window.innerWidth}px;
          bottom: -80px;
          z-index: 9998;
          animation: balloon-float 6s ease-out forwards;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(balloon);
        setTimeout(() => balloon.remove(), 6000);
      }, i * 200);
    }
    setTimeout(() => setVictoryCelebration(false), 5000);
  };

  // Add state for victory/defeat animation
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);

  // Helper to clear victory/defeat overlays
  const clearCelebration = () => {
    setShowVictory(false);
    setShowDefeat(false);
  };

  const handleNewGame = () => {
    clearCelebration();
    resetGame();
  };

  const handleBackToMenu = () => {
    clearCelebration();
    setShowGame(false);
  };

  // Play start.mp3 when a new game starts
  const playStartSound = () => {
    const audio = new Audio('/images/start.mp3');
    audio.play().catch(() => {});
  };

  // Workaround for TypeScript JSX type error
  const isOnline = gameMode === 'online';

  // Add state for sidebar view toggle
  const [sidebarView, setSidebarView] = useState<'leaderboard' | 'moves' | 'gallery'>('leaderboard');

  // In the promotion dialog handler, after a pawn is promoted, play the upgrade sound
  const handlePromotion = (promotionPiece: string) => {
    playSound('upgrade');
    // ... existing promotion logic ...
  };

  return (
    <div 
      className={`chess-game${fullscreen ? ' fullscreen' : ''}${darkMode ? ' chess-dark-mode' : ''}${showGame ? ' game-active' : ''}`}
    >
      {/* Streamlined Header - always show */}
      <div className="chess-header">
        <h2>LAWB CHESS TESTNET BETA 3000</h2>
        <div className="chess-controls">
          {onMinimize && <button onClick={onMinimize}>_</button>}
          <button onClick={onClose}>×</button>
        </div>
      </div>
      <div className="game-stable-layout">
          <>
            {/* Left Sidebar - Toggleable Views */}
            <div className="left-sidebar">
              {sidebarView === 'leaderboard' && (
                <div className="leaderboard-compact">
                  <h3>Leaderboard</h3>
                  <div className="leaderboard-table-compact">
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Player</th>
                          <th>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(leaderboardData) && leaderboardData.slice(0, 8).map((entry, index: number) => {
                          if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                            const typedEntry = entry as LeaderboardEntry;
                            return (
                              <tr key={typedEntry.username}>
                                <td>{index + 1}</td>
                                <td>{formatAddress(typedEntry.username)}</td>
                                <td>{typedEntry.points}</td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {sidebarView === 'moves' && showGame && (
                <div className="move-history-compact">
                  <div className="move-history-title">Moves</div>
                  <ul className="move-history-list-compact">
                    {moveHistory.slice().reverse().map((move, idx) => (
                      <li key={moveHistory.length - 1 - idx}>{move}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sidebarView === 'gallery' && (
                <div className="piece-gallery-compact">
                  {renderPieceGallery(true, 'Click pieces to learn more')}
                </div>
              )}
            </div>
            {/* Center Area - Always Show Chess Board */}
            <div className="center-area">
              {/* Game Info Bar - Compact */}
              {showGame && (
                <div className="game-info-compact">
                  <span className={currentPlayer === 'blue' ? 'current-blue' : 'current-red'}>
                    {currentPlayer === 'blue' ? 'Blue' : 'Red'} to move
                  </span>
                  {gameMode === GameMode.AI && (
                    <span className="mode-play">
                      {difficulty === 'easy' ? 'Easy' : 'Hard'} AI
                    </span>
                  )}
                  {isOnline && (
                    <span className="wager-display">
                      Wager: {wager} tDMT
                    </span>
                  )}
                </div>
              )}
              {/* Main Game Area */}
              {showGame ? (
                <div className="chess-main-area">
                  <div className="chessboard-container">
                    <div 
                      className="chessboard"
                      style={{
                        backgroundImage: `url(${selectedChessboard})`
                      }}
                    >
                      {Array.from({ length: 8 }, (_, row) => (
                        <div key={row} className="board-row">
                          {Array.from({ length: 8 }, (_, col) => renderSquare(row, col))}
                        </div>
                      ))}
                      {/* Capture Animation Overlay */}
                      {captureAnimation && captureAnimation.show && (
                        <div 
                          className="capture-animation"
                          style={{
                            position: 'absolute',
                            top: `${captureAnimation.row * 12.5}%`,
                            left: `${captureAnimation.col * 12.5}%`,
                            width: '12.5%',
                            height: '12.5%',
                            zIndex: 10
                          }}
                        >
                          <img 
                            src="/images/capture.gif" 
                            alt="capture" 
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Compact Game Controls */}
                  <div className="game-controls-compact">
                    <div className="sidebar-toggle-group">
                      <button
                        className={sidebarView === 'leaderboard' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                        onClick={() => setSidebarView('leaderboard')}
                      >Leaderboard</button>
                      <button
                        className={sidebarView === 'moves' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                        onClick={() => setSidebarView('moves')}
                      >Moves</button>
                      <button
                        className={sidebarView === 'gallery' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                        onClick={() => setSidebarView('gallery')}
                      >Gallery</button>
                    </div>
                    <button onClick={handleNewGame}>New Game</button>
                    <button onClick={handleBackToMenu}>Menu</button>
                  </div>
                </div>
              ) : showDifficulty ? (
                renderDifficultySelection()
              ) : isOnline ? (
                <ChessMultiplayer onClose={onClose} onMinimize={onMinimize} fullscreen={fullscreen} />
              ) : (
                <div className="game-mode-panel-streamlined">
                  {/* Lawbstation Game Image */}
                  <div style={{textAlign: 'center', marginBottom: '20px'}}>
                    <img 
                      src="/assets/lawbstationgame.png" 
                      alt="Lawbstation Chess" 
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '0px',
                        boxShadow: 'none'
                      }}
                    />
                  </div>
                  <div className="mode-selection-compact">
                    <button 
                      className={`mode-btn-compact ${gameMode === 'ai' ? 'selected' : ''}`}
                      onClick={() => setGameMode('ai')}
                    >
                      VS AI
                    </button>
                    <button 
                      className={`mode-btn-compact ${isOnline ? 'selected' : ''}`}
                      onClick={() => setGameMode('online')}
                    >
                      PvP
                    </button>
                  </div>
                  {gameMode === GameMode.AI && (
                    <button className="start-btn-compact" onClick={() => setShowDifficulty(true)}>
                      Start Game
                    </button>
                  )}
                  {isOnline && (
                    <div className="pvp-info">
                      <p>Challenge other players with tDMT wagers</p>
                      <p>Create or join games instantly</p>
                    </div>
                  )}
                  {/* Updated Help Section */}
                  <div className="help-section-compact">
                    <h4>How to Play</h4>
                    <div className="help-content">
                      <p><strong>Objective:</strong> Checkmate your opponent's king by placing it under attack with no legal moves to escape.</p>
                      
                      <p><strong>Game Setup:</strong> Blue pieces start at the bottom, Red pieces at the top. Blue always moves first.</p>
                      
                      <p><strong>Piece Movements:</strong></p>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                        <li><strong>Pawn:</strong> Moves forward one square (or two on first move), captures diagonally</li>
                        <li><strong>Knight:</strong> Moves in L-shape: 2 squares in one direction, then 1 square perpendicular</li>
                        <li><strong>Bishop:</strong> Moves any number of squares diagonally</li>
                        <li><strong>Rook:</strong> Moves any number of squares horizontally or vertically</li>
                        <li><strong>Queen:</strong> Moves any number of squares in any one direction</li>
                        <li><strong>King:</strong> Moves one square in any direction</li>
                      </ul>
                      
                      <p><strong>Special Rules:</strong></p>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                        <li><strong>Check:</strong> When your king is under attack - you must move to escape</li>
                        <li><strong>Checkmate:</strong> When your king is under attack with no legal moves to escape. endGame.</li>
                        <li><strong>Stalemate:</strong> When you have no legal moves but your king is not in check (draw). endGame.</li>
                        <li><strong>Pawn Promotion:</strong> When a pawn reaches the opposite end of chess board, Player chooses which chess piece to swap pawn out for.</li>
                      </ul>
                      
                      <p><strong>Game Modes:</strong></p>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                        <li><strong>Single Player:</strong> Practice against the computer (Easy/Hard difficulty)</li>
                        <li><strong>Multiplayer:</strong> wage tDMT and challenge other players on Sanko testnet. Winner takes the pot minus 5% house fee.</li>
                      </ul>
                      
                      <p><strong>Multiplayer Flow:</strong></p>
                      <ol style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                        <li>Connect your wallet to Sanko testnet</li>
                        <li>Create a game and set your wager amount in tDMT</li>
                        <li>Share your invite code with an opponent</li>
                        <li>Opponent joins and matches your wager</li>
                        <li>Game begins automatically - Blue (Player 1) moves first</li>
                        <li>Winner claims the pot minus 5% house fee</li>
                      </ol>
                      
                      <p><strong>Leaderboard:</strong> All games are tracked to your connected wallet. Win = 3 points, Draw = 1 point, Loss = 0 points.</p>
                      
                      <p><strong>Lawb Chess Testnet Contract:</strong> <a href="https://testnet.sankoscan.io/address/0x3112AF5728520F52FD1C6710dD7bD52285a68e47?tab=contract" target="_blank" rel="noopener noreferrer" style={{color: '#32CD32'}}>0x3112AF5728520F52FD1C6710dD7bD52285a68e47</a></p>
                      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#000000', borderRadius: '4px', fontSize: '12px' }}>
                        <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Network Name:</strong> Sanko Testnet</p>
                        <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>RPC URL:</strong> https://sanko-arb-sepolia.rpc.caldera.xyz/http</p>
                        <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Chain ID:</strong> 1992</p>
                        <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Currency Symbol:</strong> tDMT</p>
                      </div>
                    </div>
                  </div>
                  {/* Chessboards GIF */}
                  <div style={{textAlign: 'center', marginTop: '20px', marginBottom: '20px'}}>
                    <img 
                      src="/images/chessboards.gif" 
                      alt="Chessboards Animation" 
                      style={{
                        maxWidth: '100%',
                        width: '300px',
                        height: 'auto',
                        borderRadius: '0px',
                        boxShadow: 'none'
                      }}
                    />
                  </div>
                  {/* Sidebar Toggle Buttons for Home Page */}
                  <div className="sidebar-toggle-group" style={{marginTop: '20px', justifyContent: 'center'}}>
                    <button
                      className={sidebarView === 'leaderboard' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                      onClick={() => setSidebarView('leaderboard')}
                    >Leaderboard</button>
                    <button
                      className={sidebarView === 'gallery' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                      onClick={() => setSidebarView('gallery')}
                    >Gallery</button>
                  </div>
                </div>
              )}
            </div>
                      </>
        </div>
      {/* Gallery Modal */}
      {showGalleryModal && renderPieceGallery(true)}
      {/* Promotion Dialog */}
      {showPromotion && renderPromotionDialog()}
      {/* Leaderboard Updated Message */}
      {showLeaderboardUpdated && (
        <div className="leaderboard-updated-msg">
          Leaderboard updated!
        </div>
      )}
      {/* Victory/Defeat Overlays */}
      {showVictory && (
        <div className="victory-overlay">
          <div className="balloons-container" />
          <div className="victory-modal">
            <div className="victory-content">
              <img src="/images/victory.gif" alt="Victory" style={{ width: 120, marginBottom: 16 }} />
              <div>Victory!</div>
              <button onClick={handleNewGame}>New Game</button>
            </div>
          </div>
        </div>
      )}
      {showDefeat && (
        <div className="defeat-overlay">
          <div className="blood-overlay" />
          <div className="victory-modal">
            <div className="victory-content">
              <img src="/images/loser.gif" alt="Defeat" style={{ width: 120, marginBottom: 16 }} />
              <div>Defeat!</div>
              <button onClick={handleNewGame}>Try Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

// Utility to switch player color
function switchPlayer(player: 'blue' | 'red'): 'blue' | 'red' {
  return player === 'blue' ? 'red' : 'blue';
}

// CORRECT FEN conversion for Stockfish compatibility
// Stockfish expects White at bottom (a1-h1), Black at top (a8-h8)
// Our board has Red at top (Black in Stockfish) and Blue at bottom (White in Stockfish)
function boardToFEN(board: (string | null)[][], currentPlayer: 'blue' | 'red'): string {
  let fen = '';
  // Read board from top to bottom to match our coordinate system
  // Row 0 (top) = Stockfish row 8, Row 7 (bottom) = Stockfish row 1
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        // Map blue (lowercase) to white (uppercase), red (uppercase) to black (lowercase)
        if (piece >= 'a' && piece <= 'z') {
          fen += piece.toUpperCase(); // blue -> white
        } else if (piece >= 'A' && piece <= 'Z') {
          fen += piece.toLowerCase(); // red -> black
        } else {
          fen += piece;
        }
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }
  // Side to move: blue = w, red = b
  fen += ' ' + (currentPlayer === 'blue' ? 'w' : 'b');
  fen += ' - - 0 1';
  return fen;
}
