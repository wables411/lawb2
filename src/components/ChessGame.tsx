import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import './ChessGame.css';

// Supabase configuration
const supabaseUrl = 'https://roxwocgknkiqnsgiojgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for leaderboard updates (bypasses RLS)
const supabaseService = createClient(
  supabaseUrl, 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDc2MzExMiwiZXhwIjoyMDQ2MzM5MTEyfQ.US6YTQfWVWNAfmEopBpD580jsaevKv_Ev7dGFeqFptA'
);

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

// Add 'world-class' to difficulty type
type Difficulty = 'novice' | 'intermediate' | 'world-class' | 'master-class';

// Stockfish integration for world-class AI
const useStockfish = () => {
  const [stockfishReady, setStockfishReady] = useState(false);
  const stockfishRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current || stockfishRef.current) {
      return; // Already initializing or already loaded
    }

    isInitializingRef.current = true;
    console.log('[DEBUG] Initializing LawbBot...');
    
    const loadStockfish = () => {
      try {
        // Try to load Stockfish directly without worker first
        const script = document.createElement('script');
        script.src = '/stockfish.js';
        script.onload = () => {
          console.log('[DEBUG] LawbBot script loaded, initializing...');
          
          // Initialize Stockfish directly
          if (typeof window !== 'undefined' && (window as any).Stockfish) {
            const Stockfish = (window as any).Stockfish;
            Stockfish().then((sf: any) => {
              console.log('[DEBUG] LawbBot initialized successfully');
              stockfishRef.current = sf;
              setStockfishReady(true);
              isInitializingRef.current = false;
              
              // Configure Stockfish for better performance
              sf.postMessage('setoption name Threads value 4');
              sf.postMessage('setoption name Hash value 128');
              sf.postMessage('setoption name MultiPV value 1');
            }).catch((error: any) => {
              console.error('[DEBUG] LawbBot initialization failed:', error);
              setStockfishReady(false);
              isInitializingRef.current = false;
            });
          } else {
            console.error('[DEBUG] LawbBot not found in window object');
            setStockfishReady(false);
            isInitializingRef.current = false;
          }
        };
        script.onerror = (error) => {
          console.error('[DEBUG] Failed to load LawbBot script:', error);
          setStockfishReady(false);
          isInitializingRef.current = false;
        };
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('[DEBUG] Failed to create LawbBot script:', error);
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

      const messageHandler = (message: string) => {
        console.log('[DEBUG] Stockfish message:', message);
        if (typeof message === 'string' && message.startsWith('bestmove ')) {
          const parts = message.split(' ');
          bestMove = parts[1] || null;
          console.log('[DEBUG] Stockfish bestmove found:', bestMove);
          if (!isResolved) {
            isResolved = true;
            stockfishRef.current?.removeMessageListener(messageHandler);
            resolve(bestMove);
          }
        }
      };

      try {
        stockfishRef.current.addMessageListener(messageHandler);

        // Set up Stockfish with higher depth for master-class
        stockfishRef.current.postMessage('uci');
        stockfishRef.current.postMessage('isready');
        stockfishRef.current.postMessage(`position fen ${fen}`);
        
        // Use longer time limits for master-class
        const adjustedTimeLimit = timeLimit > 5000 ? timeLimit * 1.5 : timeLimit;
        stockfishRef.current.postMessage(`go movetime ${adjustedTimeLimit} depth 20`);

        // Timeout fallback - longer for master-class
        const timeoutDuration = timeLimit > 5000 ? timeLimit * 2 : timeLimit + 1000;
        window.setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try {
              stockfishRef.current?.removeMessageListener(messageHandler);
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

  // Cloudflare Worker Stockfish API for production
  const getCloudflareStockfishMove = useCallback(async (fen: string, timeLimit: number = 4000): Promise<string | null> => {
    try {
      // Use Cloudflare Worker API (using the deployed worker URL)
      const cloudflareUrl = 'https://lawb.xyz/api/stockfish';
      
      // Add retry logic for CORS issues
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[DEBUG] Attempting API call ${attempt}/3`);
          
          const response = await fetch(cloudflareUrl, {
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
            const data = await response.json() as { bestmove?: string };
            console.log(`[DEBUG] API call successful on attempt ${attempt}`);
            return data.bestmove || null;
          } else {
            console.warn(`[DEBUG] Cloudflare API failed with status ${response.status} on attempt ${attempt}`);
            lastError = new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.warn(`[DEBUG] Cloudflare API error on attempt ${attempt}:`, error);
          lastError = error as Error;
          
          // Wait a bit before retrying
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      console.warn('[DEBUG] All API attempts failed, falling back to client-side Stockfish');
      return null;
    } catch (error) {
      console.warn('[DEBUG] Cloudflare API error:', error);
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
  const { address: walletAddress } = useAccount();
  
  // Game state
  const [gameMode, setGameMode] = useState<typeof GameMode[keyof typeof GameMode]>(GameMode.AI);
  const [board, setBoard] = useState<(string | null)[][]>(() => JSON.parse(JSON.stringify(initialBoard)));
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [gameState, setGameState] = useState<'active' | 'checkmate' | 'stalemate'>('active');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
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

  // Add dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('lawb_chess_dark_mode') === 'true';
    }
    return false;
  });
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('lawb_chess_dark_mode', String(!prev));
      }
      return !prev;
    });
  };

  // Add Stockfish integration
  const { stockfishReady, getStockfishMove, getCloudflareStockfishMove } = useStockfish();

  // Add Lichess API integration
  const { openingData, isAnalyzing, getOpeningData, getMoveAnalysis } = useLichessAPI();

  // Add state for Stockfish status
  const [stockfishStatus, setStockfishStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  // Add state for opening suggestions
  const [showOpeningSuggestions, setShowOpeningSuggestions] = useState(false);
  const [openingSuggestions, setOpeningSuggestions] = useState<any[]>([]);

  // Add state for random chessboard selection
  const [selectedChessboard, setSelectedChessboard] = useState<string>('/images/chessboard1.png');

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

  // Check wallet connection and update status
  useEffect(() => {
    if (!walletAddress) {
      setStatus('Connect wallet to play');
      setShowGame(false);
          } else {
      setStatus('Select game mode');
    }
  }, [walletAddress]);

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

  // Load leaderboard data
  const loadLeaderboard = async (): Promise<void> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error('Database timeout')), 10000)
      );
      const dataPromise = supabase
        .from('leaderboard')
        .select('*')
        .order('points', { ascending: false });
      type SupabaseLeaderboardResponse = {
        data: LeaderboardEntry[] | null;
        error: unknown;
      };
      const resp = await Promise.race([dataPromise, timeoutPromise]) as SupabaseLeaderboardResponse;
      if (resp.error) throw resp.error;
      if (resp.data) setLeaderboardData(resp.data);
      console.log('Leaderboard data loaded:', resp.data);
    } catch (err) {
        setStatus('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    }
  };

  // Update score
  const updateScore = async (gameResult: 'win' | 'loss' | 'draw') => {
    console.log('[DEBUG] updateScore called with:', gameResult);
    if (!walletAddress) {
      console.log('[DEBUG] No wallet address, returning');
      return;
    }

    try {
      // Normalize wallet address to lowercase for consistent database queries
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Use service role client to bypass RLS
      const { data: existingRecord } = await supabaseService
        .from('leaderboard')
        .select('*')
        .eq('username', normalizedAddress)
        .maybeSingle();

      console.log('[DEBUG] Existing record:', existingRecord);

      // Simplified integer conversion with fallbacks
      const currentWins = existingRecord?.wins ? Number(existingRecord.wins) : 0;
      const currentLosses = existingRecord?.losses ? Number(existingRecord.losses) : 0;
      const currentDraws = existingRecord?.draws ? Number(existingRecord.draws) : 0;
      const currentTotalGames = existingRecord?.total_games ? Number(existingRecord.total_games) : 0;
      const currentPoints = existingRecord?.points ? Number(existingRecord.points) : 0;

      console.log('[DEBUG] Score calculation:', {
        currentWins,
        currentLosses,
        currentDraws,
        currentTotalGames,
        currentPoints,
        gameResult
      });

      // Calculate new values
      const newWins = currentWins + (gameResult === 'win' ? 1 : 0);
      const newLosses = currentLosses + (gameResult === 'loss' ? 1 : 0);
      const newDraws = currentDraws + (gameResult === 'draw' ? 1 : 0);
      const newTotalGames = currentTotalGames + 1;
      
      // Calculate points based on difficulty and result
      let pointsToAdd = 0;
      if (gameResult === 'win') {
        switch (difficulty) {
          case 'novice': pointsToAdd = 1; break;
          case 'intermediate': pointsToAdd = 3; break;
          case 'world-class': pointsToAdd = 5; break;
          case 'master-class': pointsToAdd = 10; break;
          default: pointsToAdd = 1;
        }
      } else if (gameResult === 'draw') {
        pointsToAdd = 1; // 1 point for draw regardless of difficulty
      }
      // Loss = 0 points
      
      const newPoints = currentPoints + pointsToAdd;

      console.log('[DEBUG] New values:', {
        newWins,
        newLosses,
        newDraws,
        newTotalGames,
        newPoints,
        pointsToAdd
      });

      if (existingRecord) {
        // Update existing record
        const { error } = await supabaseService
          .from('leaderboard')
          .update({
            wins: newWins,
            losses: newLosses,
            draws: newDraws,
            total_games: newTotalGames,
            points: newPoints,
            updated_at: new Date().toISOString()
          })
          .eq('username', normalizedAddress);

        if (error) {
          console.error('[DEBUG] Error updating leaderboard:', error);
          return;
        }
      } else {
        // Insert new record
        const { error } = await supabaseService
          .from('leaderboard')
          .insert({
            username: normalizedAddress,
            chain_type: 'ethereum',
            wins: newWins,
            losses: newLosses,
            draws: newDraws,
            total_games: newTotalGames,
            points: newPoints,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('[DEBUG] Error inserting leaderboard record:', error);
          return;
        }
      }

      console.log('[DEBUG] Leaderboard updated successfully');
      
      // Reload leaderboard data
      await loadLeaderboard();
      
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
    
    console.log('[DEBUG] Pawn validation details:', JSON.stringify({
      color,
      startRow,
      startCol,
      endRow,
      endCol,
      direction,
      startingRow,
      isSameCol: startCol === endCol,
      isForwardOne: endRow === startRow + direction,
      isAtStartingRow: startRow === startingRow,
      isDoubleMove: endRow === startRow + 2 * direction,
      isDiagonal: Math.abs(startCol - endCol) === 1,
      targetSquare: board[endRow] && board[endRow][endCol]
    }, null, 2));
    
    // Forward move (1 square)
    if (startCol === endCol && endRow === startRow + direction) {
      console.log('[DEBUG] Pawn forward move (1 square) - target square:', board[endRow][endCol]);
      return board[endRow][endCol] === null;
    }
    
    // Initial 2-square move
    if (startCol === endCol && startRow === startingRow && endRow === startRow + 2 * direction) {
      console.log('[DEBUG] Pawn double move - checking path:', {
        intermediateSquare: board[startRow + direction][startCol],
        targetSquare: board[endRow][endCol]
      });
      return board[startRow + direction][startCol] === null && board[endRow][endCol] === null;
    }
    
    // Capture move (diagonal)
    if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction) {
      const targetPiece = board[endRow][endCol];
      console.log('[DEBUG] Pawn capture move - target piece:', targetPiece);
      return targetPiece !== null && getPieceColor(targetPiece) !== color;
    }
    
    // En passant
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
    
    console.log('[DEBUG] Pawn move validation failed - no valid move pattern matched');
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
        if (!isValid && !silent) {
          console.log('[DEBUG] Pawn move validation failed:', {
            piece, startRow, startCol, endRow, endCol, playerColor,
            direction: playerColor === 'blue' ? -1 : 1,
            startingRow: playerColor === 'blue' ? 6 : 1,
            targetPiece: boardState[endRow][endCol],
            isForwardMove: startCol === endCol && endRow === startRow + (playerColor === 'blue' ? -1 : 1),
            isDoubleMove: startCol === endCol && startRow === (playerColor === 'blue' ? 6 : 1) && endRow === startRow + 2 * (playerColor === 'blue' ? -1 : 1),
            isCapture: Math.abs(startCol - endCol) === 1 && endRow === startRow + (playerColor === 'blue' ? -1 : 1)
          });
        }
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

  // Get legal moves for a piece
  const getLegalMoves = (from: { row: number; col: number }, boardState = board, player = currentPlayer): { row: number; col: number }[] => {
    const moves: { row: number; col: number }[] = [];
    const piece = boardState[from.row][from.col];
    
    if (!piece || getPieceColor(piece) !== player) return moves;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (canPieceMove(piece, from.row, from.col, row, col, true, player, boardState, true)) {
          moves.push({ row, col });
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
    console.log('[DEBUG] executeMoveAfterAnimation called:', { from, to, isAIMove });
    
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    
    if (!piece) return;
    
    // Execute the move
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    // Handle special moves (castling, en passant, pawn promotion)
    handleSpecialMoves(newBoard, from, to, piece);
    
    console.log('[DEBUG] Board state after move:', newBoard);
    
    // Update board state
    setBoard(newBoard);
    
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
    
    console.log('[DEBUG] State updated, currentPlayer before switch:', currentPlayer);
    
    // Switch players
    setCurrentPlayer(prev => {
      const newPlayer = prev === 'blue' ? 'red' : 'blue';
      console.log('[DEBUG] Player switched to:', newPlayer);
      return newPlayer;
    });
    
    // Check game end conditions
    checkGameEnd(newBoard, currentPlayer === 'blue' ? 'red' : 'blue');
    
    // Reset AI moving flag
    isAIMovingRef.current = false;
    lastAIMoveRef.current = false;
    apiCallInProgressRef.current = false;
  }, [board, currentPlayer, moveHistory, getOpeningData]);

  // AI move effect - trigger AI move when it's red's turn
  useEffect(() => {
    if (!isAIMovingRef.current && gameMode === GameMode.AI && currentPlayer === 'red' && !lastAIMoveRef.current) {
      console.log('[DEBUG] Starting AI move for difficulty:', difficulty);
      isAIMovingRef.current = true;

      if (difficulty === 'world-class' || difficulty === 'master-class') {
        // Always use Cloudflare Worker API in production for strongest AI
        const useWorkerAPI = import.meta.env.PROD;
        const timeLimit = difficulty === 'master-class' ? 12000 : 8000;
        setStatus(`${difficulty === 'master-class' ? 'Master-class' : 'World-class'} AI is calculating...`);
        console.log(`[DEBUG] Using ${useWorkerAPI ? 'Cloudflare Worker API' : 'LawbBot (WASM)'} for ${difficulty} difficulty`);

        // Generate FEN and log it for debugging
        const fen = boardToFEN(board, currentPlayer);
        console.log('[DEBUG] Sending FEN to API:', fen);
        console.log('[DEBUG] Current board state:', JSON.stringify(board));
        console.log('[DEBUG] Current player:', currentPlayer);

        // Prevent multiple simultaneous API calls
        if (apiCallInProgressRef.current) {
          console.log('[DEBUG] API call already in progress, skipping');
          return;
        }
        
        apiCallInProgressRef.current = true;
        const getMove = useWorkerAPI ? getCloudflareStockfishMove : getStockfishMove;
        getMove(fen, timeLimit).then(move => {
          console.log('[DEBUG] API returned move:', move);
          if (move && move !== '(none)' && move.length === 4) {
            const fromCol = move.charCodeAt(0) - 97;
            const fromRow = 8 - parseInt(move[1]);
            const toCol = move.charCodeAt(2) - 97;
            const toRow = 8 - parseInt(move[3]);
            
            // Validate move coordinates
            console.log('[DEBUG] Move coordinates:', {
              move,
              fromCol, fromRow, toCol, toRow,
              fromColValid: fromCol >= 0 && fromCol < 8,
              fromRowValid: fromRow >= 0 && fromRow < 8,
              toColValid: toCol >= 0 && toCol < 8,
              toRowValid: toRow >= 0 && toRow < 8
            });
            
            if (fromCol >= 0 && fromCol < 8 && fromRow >= 0 && fromRow < 8 && 
                toCol >= 0 && toCol < 8 && toRow >= 0 && toRow < 8) {
              const moveObj = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
              console.log('[DEBUG] Stockfish move:', move, 'converted to:', moveObj);
              
              // Validate that the move is legal
              const piece = board[fromRow][fromCol];
              console.log('[DEBUG] Validating move:', JSON.stringify({
                piece,
                fromRow,
                fromCol,
                toRow,
                toCol,
                pieceColor: piece ? getPieceColor(piece) : 'null',
                isRedPiece: piece && getPieceColor(piece) === 'red',
                canMove: piece ? canPieceMove(piece, fromRow, fromCol, toRow, toCol, true, 'red', board) : false
              }, null, 2));
              
              if (piece && getPieceColor(piece) === 'red' && canPieceMove(piece, fromRow, fromCol, toRow, toCol, true, 'red', board)) {
                console.log('[DEBUG] Move is legal, executing...');
                makeMove(moveObj.from, moveObj.to, true);
              } else {
                console.log('[DEBUG] Move is not legal, using fallback');
                const fallbackMove = getRandomAIMove(board);
                if (fallbackMove) {
                  makeMove(fallbackMove.from, fallbackMove.to, true);
                }
                isAIMovingRef.current = false;
                apiCallInProgressRef.current = false;
              }
            } else {
              console.log('[DEBUG] Invalid move coordinates, using fallback');
              const fallbackMove = getRandomAIMove(board);
              if (fallbackMove) {
                makeMove(fallbackMove.from, fallbackMove.to, true);
              }
              isAIMovingRef.current = false;
              apiCallInProgressRef.current = false;
            }
          } else {
            console.log('[DEBUG] Stockfish returned no valid move, using fallback');
            const fallbackMove = getRandomAIMove(board);
            if (fallbackMove) {
              makeMove(fallbackMove.from, fallbackMove.to, true);
            }
            isAIMovingRef.current = false;
            apiCallInProgressRef.current = false;
          }
        }).catch(error => {
          console.error('[DEBUG] Stockfish error:', error);
          console.log('[DEBUG] Falling back to simple AI for', difficulty, 'difficulty');
          const fallbackMove = getRandomAIMove(board);
          if (fallbackMove) {
            makeMove(fallbackMove.from, fallbackMove.to, true);
          }
          isAIMovingRef.current = false;
          apiCallInProgressRef.current = false;
        });
      } else if (difficulty === 'intermediate' && aiWorkerRef.current) {
        console.log('[DEBUG] Using AI worker for intermediate difficulty');
        setStatus('Intermediate AI is calculating...');
        aiWorkerRef.current.postMessage({
          board: board,
          currentPlayer: currentPlayer,
          difficulty: difficulty,
          pieceState: pieceState
        });
        aiTimeoutRef.current = window.setTimeout(() => {
          console.log('[DEBUG] AI worker timeout, using simple fallback');
          isAIMovingRef.current = false;
          aiTimeoutRef.current = null;
          const fallbackMove = getRandomAIMove(board);
          if (fallbackMove) {
            makeMove(fallbackMove.from, fallbackMove.to, true);
          }
        }, 5000);
      } else if (difficulty === 'novice') {
        console.log('[DEBUG] Using simple AI for novice difficulty');
        setStatus('Novice AI is thinking...');
        setTimeout(() => {
          const fallbackMove = getRandomAIMove(board);
          if (fallbackMove) {
            makeMove(fallbackMove.from, fallbackMove.to, true);
          }
          isAIMovingRef.current = false;
        }, 1000);
      } else {
        console.log('[DEBUG] No AI method available, using simple fallback');
        const fallbackMove = getRandomAIMove(board);
        if (fallbackMove) {
          makeMove(fallbackMove.from, fallbackMove.to, true);
        }
        isAIMovingRef.current = false;
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
        // Update leaderboard for player win
        void updateScore('win');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      } else {
        setStatus(`Checkmate! ${winner === 'red' ? 'AI' : 'Opponent'} wins!`);
        // Update leaderboard for player loss
        void updateScore('loss');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      }
      
      return 'checkmate';
    }
    
    if (isStalemate(playerToMove, boardState)) {
      console.log('[GAME END] STALEMATE', { board: JSON.parse(JSON.stringify(boardState)), moveHistory });
      setGameState('stalemate');
      setStatus('Stalemate! Game is a draw.');
      
      // Update leaderboard for draw
      void updateScore('draw');
      setShowLeaderboardUpdated(true);
      setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      
      return 'stalemate';
    }
    
    if (isKingInCheck(boardState, playerToMove)) {
      console.log('CHECK detected!');
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
    
    // First, look for captures
    const captureMoves: { from: { row: number; col: number }; to: { row: number; col: number }; value: number }[] = [];
    const regularMoves: { from: { row: number; col: number }; to: { row: number; col: number } }[] = [];
    
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
          regularMoves.push({ from: piece, to: move });
        }
      }
    }
    
    // Sort capture moves by value (highest first)
    captureMoves.sort((a, b) => b.value - a.value);
    
    // If we have captures, prefer the highest value capture
    if (captureMoves.length > 0) {
      const bestCapture = captureMoves[0];
      // Double-check that this move doesn't put the AI's king in check
      const tempBoard = boardState.map(row => [...row]);
      const pieceSymbol = tempBoard[bestCapture.from.row][bestCapture.from.col];
      tempBoard[bestCapture.to.row][bestCapture.to.col] = pieceSymbol;
      tempBoard[bestCapture.from.row][bestCapture.from.col] = null;
      
      if (!isKingInCheck(tempBoard, 'red')) {
        return { from: bestCapture.from, to: bestCapture.to };
      }
    }
    
    // If no good captures, use regular moves
    for (const move of regularMoves) {
      // Double-check that this move doesn't put the AI's king in check
      const tempBoard = boardState.map(row => [...row]);
      const pieceSymbol = tempBoard[move.from.row][move.from.col];
      tempBoard[move.to.row][move.to.col] = pieceSymbol;
      tempBoard[move.from.row][move.from.col] = null;
      
      if (!isKingInCheck(tempBoard, 'red')) {
        return move;
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
    // Select a new random chessboard for the next game
    setSelectedChessboard(selectRandomChessboard());
    // Cancel any AI move in progress
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
    console.log('[DEBUG] startGame called, difficulty:', difficulty, 'gameMode:', gameMode);
    setShowGame(true);
    setShowDifficulty(false);
    setStatus(`Game started! Your turn`);
    // Select a random chessboard for this game
    const newChessboard = selectRandomChessboard();
    setSelectedChessboard(newChessboard);
    console.log('[DEBUG] Game started with chessboard:', newChessboard);
  };

  const createGame = async () => {
    if (!walletAddress) return;
    
    try {
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase
        .from('chess_games')
        .insert({
          game_id: gameId,
          blue_player: walletAddress,
          board: JSON.stringify({ positions: board, piece_state: pieceState }),
          current_player: 'blue',
          game_state: 'waiting',
          bet_amount: wager,
          chain: 'evm',
          is_public: true
        });
      
      if (error) throw error;
      
      setStatus(`Game created! Share code: ${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setStatus('Failed to create game');
    }
  };

  const joinGame = async () => {
    if (!walletAddress || !inviteCode) return;
    
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('game_id', inviteCode)
        .eq('game_state', 'waiting')
        .single();
      
      if (error || !data) {
        setStatus('Game not found or already full');
      return;
    }

      const { error: updateError } = await supabase
        .from('chess_games')
        .update({
          red_player: walletAddress,
          game_state: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('game_id', inviteCode);
      
      if (updateError) throw updateError;
      
      setStatus('Joined game! Waiting for opponent...');
      startGame();
    } catch (error) {
      console.error('Error joining game:', error);
      setStatus('Failed to join game');
    }
  };

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
      <h3>Lawbstation Chess Pieces</h3>
      <div className="piece-gallery-grid">
        {pieceGallery.map(piece => (
          <div key={piece.key} className="piece-gallery-item" onClick={() => setSelectedGalleryPiece(piece.key)}>
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
        <div className="difficulty-selection-panel">
                  <h3>Select Difficulty</h3>
                  <button 
            className={`difficulty-btn${difficulty === 'novice' ? ' selected' : ''}`}
            onClick={() => { setDifficulty('novice'); startGame(); }}
                  >
            Novice
                  </button>
                  <button 
            className={`difficulty-btn${difficulty === 'intermediate' ? ' selected' : ''}`}
            onClick={() => { setDifficulty('intermediate'); startGame(); }}
                  >
            Intermediate
                  </button>
          <button 
            className={`difficulty-btn${difficulty === 'world-class' ? ' selected' : ''}`}
            onClick={() => { setDifficulty('world-class'); startGame(); }}
          >
            World-Class
                  </button>
          <button 
            className={`difficulty-btn${difficulty === 'master-class' ? ' selected' : ''}`}
            onClick={() => { setDifficulty('master-class'); startGame(); }}
          >
            Master-Class
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
        newBoard[from.row][0] = null;
        newBoard[from.row][3] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
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

  return (
    <div className={`chess-game${fullscreen ? ' fullscreen' : ''}${darkMode ? ' chess-dark-mode' : ''}`}>
      {/* Always show header at the top */}
      {!fullscreen && (
        <div className="chess-header">
          <h2>Lawb Chess</h2>
          <div className="chess-controls">
            {onMinimize && <button onClick={onMinimize}>_</button>}
            <button onClick={onClose}>×</button>
            <button
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ marginLeft: 12 }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      )}
      <div className="game-stable-layout">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          {/* Only show Move History and status when a game is active */}
          {showGame && (
            <>
              <div className="move-history-status">{status}</div>
              <div className="move-history">
                <div className="move-history-title">Move History</div>
                <ul className="move-history-list">
                  {moveHistory.slice().reverse().map((move, idx) => (
                    <li key={moveHistory.length - 1 - idx}>{move}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {/* Only show leaderboard in left sidebar when no game is active */}
          {!showGame && (
          <div className="leaderboard">
            <h3>Leaderboard</h3>
            <div className="leaderboard-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>W</th>
                    <th>L</th>
                    <th>D</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                    {Array.isArray(leaderboardData) && leaderboardData.slice(0, 10).map((entry, index: number) => {
                      if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                    const typedEntry = entry as LeaderboardEntry;
                    return (
                      <tr key={typedEntry.username}>
                        <td>{index + 1}</td>
                        <td>{formatAddress(typedEntry.username)}</td>
                        <td>{typedEntry.wins}</td>
                        <td>{typedEntry.losses}</td>
                        <td>{typedEntry.draws}</td>
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
          </div>

        {/* Center Area */}
        <div className="center-area">
                  <div className="game-info">
            <div className="game-info-bar">
              <span className={currentPlayer === 'blue' ? 'current-blue' : 'current-red'}>
                  Current: {currentPlayer === 'blue' ? 'Blue' : 'Red'}
              </span>
              <span className="wager-label">Wager:</span> <span>{gameMode === GameMode.AI ? 'NA' : `${wager} ETH`}</span>
              {showGame && !showDifficulty && (
                <span className={difficulty === 'novice' ? 'mode-novice' : difficulty === 'intermediate' ? 'mode-intermediate' : difficulty === 'world-class' ? 'mode-world-class' : 'mode-master-class'}>
                  Mode: {difficulty === 'novice' ? 'Novice' : difficulty === 'intermediate' ? 'Intermediate' : difficulty === 'world-class' ? 'World-Class' : 'Master-Class'}
                </span>
              )}
              {(difficulty === 'world-class' || difficulty === 'master-class') && (
                <span className={`stockfish-status ${stockfishStatus}`}>
                  LawbBot: {stockfishStatus === 'loading' ? 'Loading...' : stockfishStatus === 'ready' ? 'Ready' : 'Failed'}
                </span>
              )}
              {showOpeningSuggestions && openingSuggestions.length > 0 && (
                <div className="opening-suggestions">
                  <span className="opening-label">Opening:</span>
                  {openingSuggestions.map((move, index) => (
                    <span key={index} className="opening-move">
                      {move.san} ({Math.round(move.white + move.draws + move.black)} games)
                    </span>
                  ))}
                </div>
              )}
                </div>
                </div>
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
              <div className="game-controls">
                <button onClick={() => setShowGalleryModal(true)}>Chess Piece Info</button>
                <button onClick={resetGame}>New Game</button>
                <button onClick={resetGame}>Back to Menu</button>
              </div>
            </div>
          ) : showDifficulty ? (
            renderDifficultySelection()
          ) : (
            <div className="game-mode-panel">
              <h3 className="game-mode-title">Select Game Mode</h3>
              <button 
                className={`mode-btn ${gameMode === GameMode.AI ? 'selected' : ''}`}
                onClick={() => setGameMode(GameMode.AI)}
              >
                VS THE HOUSE
              </button>
              <div className="pvp-under-construction">
                <button className="mode-btn" disabled>PVP UNDER CONSTRUCTION</button>
                <img src="/images/chessboard4.png" alt="Chessboard" style={{ display: 'block', margin: '16px auto 0 auto', width: '180px', maxWidth: '90%' }} />
              </div>
              <button className="start-btn continue-btn" onClick={() => setShowDifficulty(true)}>Continue</button>
              
              <div className="how-to-section">
                <h4>How to Play</h4>
                <div className="how-to-content">
                  <p><strong>Chess Basics:</strong> Move pieces to capture your opponent's king. Each piece moves differently - pawns forward, knights in L-shapes, bishops diagonally, rooks horizontally/vertically, queens in all directions, kings one square at a time.</p>
                  
                  <p><strong>Wallet Connection:</strong> Connect your wallet to track your progress and compete on the leaderboard. Your wallet address serves as your username.</p>
                  
                  <p><strong>Points System:</strong> Win points by defeating the AI - Novice (1pt), Intermediate (3pts), World-Class (5pts), Master-Class (10pts). Draws earn 1 point regardless of difficulty.</p>
                  
                  <p><strong>AI Difficulty:</strong> Novice=Easy, Intermediate=kinda harder, World-Class= harder than Intermediate, Master-Class=currently most difficult lawbBot.</p>
                </div>
              </div>
            </div>
          )}
            </div>
            
        {/* Right Sidebar */}
              <div className="right-sidebar">
          {showGame ? (
              <div className="leaderboard">
                <h3>Leaderboard</h3>
                  <div className="leaderboard-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                          <th>W</th>
                          <th>L</th>
                          <th>D</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(leaderboardData) && leaderboardData.slice(0, 10).map((entry, index: number) => {
                      if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                          const typedEntry = entry as LeaderboardEntry;
                          return (
                            <tr key={typedEntry.username}>
                        <td>{index + 1}</td>
                              <td>{formatAddress(typedEntry.username)}</td>
                              <td>{typedEntry.wins}</td>
                              <td>{typedEntry.losses}</td>
                              <td>{typedEntry.draws}</td>
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
          ) : (
            <div className="piece-gallery-panel">
              {renderPieceGallery(false)}
              </div>
          )}
        </div>
      </div>
      {showGalleryModal && (
        <div className="gallery-modal-overlay" onClick={() => setShowGalleryModal(false)}>
          <div className="gallery-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowGalleryModal(false)}>×</button>
            {renderPieceGallery(false)}
          </div>
        </div>
      )}
      {renderPromotionDialog()}
      {showLeaderboardUpdated && (
        <div className="leaderboard-updated-msg">Leaderboard updated!</div>
      )}
    </div>
  );
}; 

// Utility to switch player color
function switchPlayer(player: 'blue' | 'red'): 'blue' | 'red' {
  return player === 'blue' ? 'red' : 'blue';
}

// Update boardToFEN to map custom codes to standard FEN
function boardToFEN(board: (string | null)[][], currentPlayer: 'blue' | 'red'): string {
  let fen = '';
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
