import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useAppKitSafe as useAppKit } from '../hooks/useAppKitSafe';
import { 
  updateLeaderboardEntry, 
  getTopLeaderboardEntries,
  formatAddress as formatLeaderboardAddress,
  removeZeroAddressEntry,
  type LeaderboardEntry 
} from '../firebaseLeaderboard';
import { getDisplayName } from '../utils/displayName';
import { firebaseProfiles } from '../firebaseProfiles';
// Removed blocking connection test - loading data directly with timeout
import { BaseAppChessMultiplayer } from './BaseAppChessMultiplayer';
import { CHESS_PIECE_SETS, getDefaultPieceSet, type ChessPieceSet } from '../config/chessPieceSets';
import Popup from '../components/Popup';
import { PlayerProfile } from '../components/PlayerProfile';
import { HowToContent } from '../baseapp/HowToContent';
import { ThemeToggle } from '../components/ThemeToggle';

import '../components/ChessGame.css';

// Game modes
const GameMode = {
  AI: 'ai',
  ONLINE: 'online'
} as const;

// Sanko mainnet chain ID
const SANKO_CHAIN_ID = 1996;

// LeaderboardEntry interface is now imported from firebaseLeaderboard

// Chess piece images - will be set dynamically based on selected piece set
let pieceImages: { [key: string]: string } = {};

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
  onBackToModeSelect?: () => void;
  onGameStart?: (inviteCode?: string) => void;
  onChatToggle?: () => void;
  isChatMinimized?: boolean;
  isMobile?: boolean;
}

// Piece gallery data - will be updated dynamically based on selected piece set
let pieceGallery = [
  { key: 'K', name: 'Red King', img: '/images/lawbstation/redking.png', desc: 'The King moves one square in any direction. Protect your King at all costs!' },
  { key: 'Q', name: 'Red Queen', img: '/images/lawbstation/redqueen.png', desc: 'The Queen moves any number of squares in any direction.' },
  { key: 'R', name: 'Red Rook', img: '/images/lawbstation/redrook.png', desc: 'The Rook moves any number of squares horizontally or vertically.' },
  { key: 'B', name: 'Red Bishop', img: '/images/lawbstation/redbishop.png', desc: 'The Bishop moves any number of squares diagonally.' },
  { key: 'N', name: 'Red Knight', img: '/images/lawbstation/redknight.png', desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
  { key: 'P', name: 'Red Pawn', img: '/images/lawbstation/redpawn.png', desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
  { key: 'k', name: 'Blue King', img: '/images/lawbstation/blueking.png', desc: 'The King moves one square in any direction. Protect your King at all costs!' },
  { key: 'q', name: 'Blue Queen', img: '/images/lawbstation/bluequeen.png', desc: 'The Queen moves any number of squares in any direction.' },
  { key: 'r', name: 'Blue Rook', img: '/images/lawbstation/bluerook.png', desc: 'The Rook moves any number of squares horizontally or vertically.' },
  { key: 'b', name: 'Blue Bishop', img: '/images/lawbstation/bluebishop.png', desc: 'The Bishop moves any number of squares diagonally.' },
  { key: 'n', name: 'Blue Knight', img: '/images/lawbstation/blueknight.png', desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
  { key: 'p', name: 'Blue Pawn', img: '/images/lawbstation/bluepawn.png', desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
];

// Updated difficulty levels
type Difficulty = 'easy' | 'hard';

// Stockfish integration for chess AI
const useStockfish = () => {
  const [stockfishReady, setStockfishReady] = useState(false);
  const stockfishEngineRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const dnsFailureRef = useRef(false);

  useEffect(() => {
    // Stockfish WASM worker is no longer used - we use the API endpoint instead
    // This avoids SharedArrayBuffer/COEP issues and works more reliably
    // Keeping this hook for API compatibility but not initializing WASM
    console.log('[STOCKFISH] Using API endpoint (chess.lawb.xyz) - WASM worker disabled');
    setStockfishReady(true); // Mark as ready since API doesn't need initialization
    
    return () => {
      // Cleanup not needed for API approach
    };
  }, []);

  const getStockfishMove = useCallback((fen: string, timeLimit: number = 4000): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!stockfishEngineRef.current) {
        console.warn('[DEBUG] Stockfish not ready, using fallback');
        resolve(null);
        return;
      }

      console.log('[STOCKFISH] Starting calculation for FEN:', fen, 'timeLimit:', timeLimit);
      let bestMove: string | null = null;
      let isResolved = false;

      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        if (typeof message === 'string' && message.startsWith('bestmove ')) {
          const parts = message.split(' ');
          bestMove = parts[1] || null;
          console.log('[STOCKFISH] Bestmove found:', bestMove);
          if (!isResolved) {
            isResolved = true;
            stockfishEngineRef.current?.removeEventListener('message', messageHandler);
            resolve(bestMove);
          }
        }
      };

      try {
        stockfishEngineRef.current.addEventListener('message', messageHandler);

        // Set up Stockfish with higher depth
        stockfishEngineRef.current.postMessage('uci');
        stockfishEngineRef.current.postMessage('isready');
        stockfishEngineRef.current.postMessage(`position fen ${fen}`);
        
        // Use optimized time limits and depth for Hard mode
        // For Hard mode: use depth 8-10 (strong but not too slow)
        // Reduce timeout to 5-6 seconds for better UX
        const adjustedTimeLimit = Math.min(timeLimit, 6000); // Cap at 6 seconds
        const searchDepth = 18; // High depth for maximum Stockfish strength (can go up to 20+)
        stockfishEngineRef.current.postMessage(`go movetime ${adjustedTimeLimit} depth ${searchDepth}`);

        // Timeout fallback - reduced for better UX
        const timeoutDuration = Math.min(adjustedTimeLimit + 2000, 8000); // Max 8 seconds total
        window.setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try {
              stockfishEngineRef.current?.removeEventListener('message', messageHandler);
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

  // Stockfish API hosted on chess.lawb.xyz for production
  const getCloudflareStockfishMove = useCallback(async (fen: string, timeLimit: number = 4000): Promise<string | null> => {
    // Reset DNS failure flag on each attempt (DNS might be fixed now)
    // if (dnsFailureRef.current) {
    //   console.warn('[STOCKFISH] Skipping API call - DNS previously failed. chess.lawb.xyz not configured.');
    //   return null;
    // }
    
    try {
      // Use chess.lawb.xyz subdomain for Stockfish API
      const apiUrl = 'https://chess.lawb.xyz/api/stockfish';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen,
          movetime: timeLimit,
          difficulty: 'play' // Use maximum strength
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json() as { bestmove?: string; move?: string };
        console.log(`[STOCKFISH] API call successful:`, data);
        // Handle both 'bestmove' and 'move' response formats
        return data.bestmove || data.move || null;
      } else {
        console.warn(`[STOCKFISH] API failed with status ${response.status}`);
        return null;
      }
    } catch (error: any) {
      // Check if it's a DNS/network error
      const isDnsError = error?.message?.includes('Failed to fetch') || 
                         error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                         error?.name === 'TypeError' ||
                         error?.code === 'ENOTFOUND';
      
      if (isDnsError) {
        // Only mark DNS failure temporarily - don't permanently block (DNS might be fixed)
        // dnsFailureRef.current = true;
        console.warn('[STOCKFISH] DNS error detected - chess.lawb.xyz not resolving. Will retry on next move.');
      } else {
        console.warn('[STOCKFISH] API error:', error?.message || error);
      }
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

export const BaseAppChessGame: React.FC<ChessGameProps> = ({ onClose, onMinimize, fullscreen = false, onBackToModeSelect, onGameStart, onChatToggle, isChatMinimized, isMobile = false }) => {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();
  
  // Detect Base Mini App - should always show desktop menu
  const isBaseMiniAppDetected = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();
  
  // In Base Mini App, treat as desktop (not mobile) for menu purposes
  const shouldShowDesktopMenu = !isMobile || isBaseMiniAppDetected;
  
  // Detect current theme mode for menu styling
  const isDarkMode = typeof document !== 'undefined' && 
    (document.body.classList.contains('lawb-app-dark-mode') || 
     document.documentElement.classList.contains('lawb-app-dark-mode'));
  
  // Mobile wallet connection handler
  const handleMobileWalletConnection = async () => {
    try {
      if (isMobile) {
        await open({ view: 'Connect' });
      } else {
        await open({ view: 'Connect' });
      }
    } catch (error) {
      try {
        await open({ view: 'Connect' });
      } catch (fallbackError) {
        alert('Unable to connect wallet. Please try again or check if your wallet app is installed.');
      }
    }
  };
  
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
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardDisplayNames, setLeaderboardDisplayNames] = useState<Record<string, string>>({});
  const [viewingProfileAddress, setViewingProfileAddress] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ row: number; col: number }[]>([]);
  
  // Debug: log when viewingProfileAddress changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[LEADERBOARD] viewingProfileAddress changed to:', viewingProfileAddress);
    }
  }, [viewingProfileAddress]);
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

  // Timer state for 60-minute move timeout
  const GAME_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
  const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());



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

  // Add piece set selection state
  const [selectedPieceSet, setSelectedPieceSet] = useState<ChessPieceSet>(getDefaultPieceSet());
  const [showPieceSetSelector, setShowPieceSetSelector] = useState(false);
  const [showPieceSetDropdown, setShowPieceSetDropdown] = useState(false);

  // Update piece images when selected piece set changes
  useEffect(() => {
    pieceImages = selectedPieceSet.pieceImages;
    
    // Update piece gallery with new piece set images
    pieceGallery = [
      { key: 'K', name: 'Red King', img: selectedPieceSet.pieceImages['K'], desc: 'The King moves one square in any direction. Protect your King at all costs!' },
      { key: 'Q', name: 'Red Queen', img: selectedPieceSet.pieceImages['Q'], desc: 'The Queen moves any number of squares in any direction.' },
      { key: 'R', name: 'Red Rook', img: selectedPieceSet.pieceImages['R'], desc: 'The Rook moves any number of squares horizontally or vertically.' },
      { key: 'B', name: 'Red Bishop', img: selectedPieceSet.pieceImages['B'], desc: 'The Bishop moves any number of squares diagonally.' },
      { key: 'N', name: 'Red Knight', img: selectedPieceSet.pieceImages['N'], desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
      { key: 'P', name: 'Red Pawn', img: selectedPieceSet.pieceImages['P'], desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
      { key: 'k', name: 'Blue King', img: selectedPieceSet.pieceImages['k'], desc: 'The King moves one square in any direction. Protect your King at all costs!' },
      { key: 'q', name: 'Blue Queen', img: selectedPieceSet.pieceImages['q'], desc: 'The Queen moves any number of squares in any direction.' },
      { key: 'r', name: 'Blue Rook', img: selectedPieceSet.pieceImages['r'], desc: 'The Rook moves any number of squares horizontally or vertically.' },
      { key: 'b', name: 'Blue Bishop', img: selectedPieceSet.pieceImages['b'], desc: 'The Bishop moves any number of squares diagonally.' },
      { key: 'n', name: 'Blue Knight', img: selectedPieceSet.pieceImages['n'], desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
      { key: 'p', name: 'Blue Pawn', img: selectedPieceSet.pieceImages['p'], desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
    ];
  }, [selectedPieceSet]);

  // Check wallet connection - any EVM chain is fine for single-player
  // Chain switching is only required when joining multiplayer games on different chains
  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setStatus('Connect wallet to play');
      setShowGame(false);
      setShowDifficulty(false);
      // Trigger Reown appkit popup for wallet connection
      void open();
    } else {
      setStatus('Select chess mode');
    }
  }, [isConnected, walletAddress, open]);

  // Chain switching is no longer required for single-player mode
  // It's only needed when joining multiplayer games on different chains (handled in ChessMultiplayer)

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
    // Also reload periodically to ensure data is fresh
    const interval = setInterval(() => {
      void loadLeaderboard();
    }, 30000); // Reload every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load leaderboard data from Firebase
  const loadLeaderboard = async (): Promise<void> => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    
    // Set timeout - if loading takes more than 8 seconds, show error
    let timeoutFired = false;
    const timeout = setTimeout(() => {
      timeoutFired = true;
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
      setLeaderboardError(`Firebase connection timeout (8s). Current domain: ${currentDomain}. Mobile issue: Check 1) Firebase Console → Authentication → Authorized domains (must include ${currentDomain}), 2) Try WiFi instead of cellular. Tap "Retry".`);
      setLeaderboardLoading(false);
      setLeaderboardData([]);
    }, 8000);
    
    try {
      
      // First, try to remove any zero address entry
      await removeZeroAddressEntry();
      
      const data = await getTopLeaderboardEntries(20);
      
      // Only update if timeout hasn't fired
      if (!timeoutFired) {
        clearTimeout(timeout);
        setLeaderboardData(data || []);
        setLeaderboardLoading(false);
        
        // Fetch display names for all leaderboard entries
        const displayNames: Record<string, string> = {};
        await Promise.all((data || []).map(async (entry) => {
          try {
            const displayName = await getDisplayName(entry.username);
            displayNames[entry.username] = displayName;
          } catch (error) {
            // Fallback to truncated address if profile fetch fails
            displayNames[entry.username] = formatLeaderboardAddress(entry.username);
          }
        }));
        setLeaderboardDisplayNames(displayNames);
        
        // If no data, that's fine - just show empty state
      }
    } catch (error: any) {
      // Only update if timeout hasn't fired
      if (!timeoutFired) {
        clearTimeout(timeout);
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        const errorCode = error?.code || 'unknown';
        setLeaderboardError(`Error: ${error?.message || 'Unknown error'} (Code: ${errorCode}). Current domain: ${currentDomain}. Check Firebase Console authorized domains. Tap "Retry".`);
        setLeaderboardLoading(false);
        setLeaderboardData([]);
      }
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

  const getOppositeColor = (color: 'blue' | 'red'): 'blue' | 'red' => {
    return color === 'blue' ? 'red' : 'blue';
  };

  const isValidKingMove = (color: 'blue' | 'red', startRow: number, startCol: number, endRow: number, endCol: number, boardState = board): boolean => {
    const rowDiff = Math.abs(startRow - endRow);
    const colDiff = Math.abs(startCol - endCol);
    
    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) return true;
    
    // Castling
    if (rowDiff === 0 && colDiff === 2) {
      // Check if king is currently in check - castling is not allowed when king is in check
      if (isKingInCheck(boardState, color)) {
        return false;
      }
      
      if (color === 'blue' && !pieceState.blueKingMoved) {
        if (endCol === 6 && !pieceState.blueRooksMove.right) {
          // Kingside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][5] === null && boardState[startRow][6] === null) {
            // Check if king moves through check
            const attackingColor: 'blue' | 'red' = getOppositeColor(color);
            if (!isSquareUnderAttack(startRow, 5, attackingColor, boardState) &&
                !isSquareUnderAttack(startRow, 6, attackingColor, boardState)) {
              return true;
            }
          }
        }
        if (endCol === 2 && !pieceState.blueRooksMove.left) {
          // Queenside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][1] === null && boardState[startRow][2] === null && boardState[startRow][3] === null) {
            // Check if king moves through check
            const attackingColor: 'blue' | 'red' = getOppositeColor(color);
            if (!isSquareUnderAttack(startRow, 2, attackingColor, boardState) &&
                !isSquareUnderAttack(startRow, 3, attackingColor, boardState)) {
              return true;
            }
          }
        }
      } else if (color === 'red' && !pieceState.redKingMoved) {
        if (endCol === 6 && !pieceState.redRooksMove.right) {
          // Kingside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][5] === null && boardState[startRow][6] === null) {
            // Check if king moves through check
            const attackingColor: 'blue' | 'red' = getOppositeColor(color);
            if (!isSquareUnderAttack(startRow, 5, attackingColor, boardState) &&
                !isSquareUnderAttack(startRow, 6, attackingColor, boardState)) {
              return true;
            }
          }
        }
        if (endCol === 2 && !pieceState.redRooksMove.left) {
          // Queenside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][1] === null && boardState[startRow][2] === null && boardState[startRow][3] === null) {
            // Check if king moves through check
            const attackingColor: 'blue' | 'red' = getOppositeColor(color);
            if (!isSquareUnderAttack(startRow, 2, attackingColor, boardState) &&
                !isSquareUnderAttack(startRow, 3, attackingColor, boardState)) {
              return true;
            }
          }
        }
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
        isValid = isValidKingMove(playerColor, startRow, startCol, endRow, endCol, boardState);
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
  const executeMoveAfterAnimation = useCallback((from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q', isAIMove: boolean = false) => {
    
    
    // Set flag to prevent AI validation during board update
    setIsUpdatingBoard(true);
    
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    
    if (!piece) return;
    
    // Handle pawn promotion BEFORE moving the piece to avoid display delay
    let pieceToPlace = piece;
    if (piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
      pieceToPlace = promotionPiece;
    }
    
    // Execute the move with the correct piece (promoted if applicable)
    newBoard[to.row][to.col] = pieceToPlace;
    newBoard[from.row][from.col] = null;
    
    // Handle special moves (castling, en passant) - but NOT pawn promotion since we handled it above
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
    
    // CRITICAL FIX: Set lastAIMoveRef BEFORE updatePieceState to prevent race condition
    // The AI useEffect depends on pieceState, so when updatePieceState triggers setPieceState,
    // it can cause the useEffect to run. We must set the blocking flag FIRST.
    if (isAIMove) {
      lastAIMoveRef.current = true; // Block useEffect from triggering again
      isAIMovingRef.current = false; // Allow player to move
    } else {
      // Player made a move - reset all flags so AI can move next
      isAIMovingRef.current = false;
      lastAIMoveRef.current = false;
    }
    
    // Update piece state
    updatePieceState(from, to, piece);
    
    
    
    // Switch players
    setCurrentPlayer(prev => {
      const newPlayer = prev === 'blue' ? 'red' : 'blue';
      console.log('[DEBUG] Player switched to:', newPlayer);
      // Check game end for the player who is about to move (after switch)
      checkGameEnd(newBoard, newPlayer);
      
      // Reset timer for the new player's turn - reset to 60 minutes
      const now = Date.now();
      setLastMoveTime(now);
      setTimeoutCountdown(GAME_TIMEOUT_MS / 1000); // Reset to full 60 minutes
      console.log('[TIMER] Move completed, timer reset for', newPlayer, 'turn');
      
      return newPlayer;
    });
    
    // Check game end conditions
    checkGameEnd(newBoard, currentPlayer === 'blue' ? 'red' : 'blue');
    
    // Update board state IMMEDIATELY to ensure AI validation uses correct state
    setBoard(newBoard);
    apiCallInProgressRef.current = false;
    setIsUpdatingBoard(false);
  }, [board, currentPlayer, moveHistory, getOpeningData]);

  // Reset lastAIMoveRef when it becomes player's turn (blue)
  // This ensures the flag is cleared after the state updates from AI move
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'blue' && lastAIMoveRef.current) {
      // Player's turn now - reset the flag that was blocking double AI moves
      lastAIMoveRef.current = false;
    }
  }, [currentPlayer, gameMode]);

  // AI move effect - trigger AI move when it's red's turn
  useEffect(() => {
    // CRITICAL: Check lastAIMoveRef to prevent double moves
    // When AI moves, setCurrentPlayer is async. The useEffect might run again before
    // currentPlayer updates from 'red' to 'blue'. lastAIMoveRef blocks this.
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
        // Hard: Use Stockfish API directly (chess.lawb.xyz) for strong play
        // Using API avoids COEP/SharedArrayBuffer issues with wallet connections
        setStatus('AI is thinking...');
        const fen = boardToFEN(boardRef.current, currentPlayer);
        if (apiCallInProgressRef.current) return;
        apiCallInProgressRef.current = true;
        
        // Use the Stockfish API directly for hard mode (stronger and more reliable)
        getCloudflareStockfishMove(fen, 5000).then(move => {
          if (move && move.length === 4) {
            const fromCol = move.charCodeAt(0) - 97;
            const fromRowStockfish = parseInt(move[1]);
            const toCol = move.charCodeAt(2) - 97;
            const toRowStockfish = parseInt(move[3]);
            const fromRow = 8 - fromRowStockfish;
            const toRow = 8 - toRowStockfish;
            console.log('[STOCKFISH] API move:', { fromCol, fromRowStockfish, toCol, toRowStockfish, fromRow, toRow });
            if (fromCol >= 0 && fromCol < 8 && fromRow >= 0 && fromRow < 8 && toCol >= 0 && toCol < 8 && toRow >= 0 && toRow < 8) {
              const moveObj = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
              const piece = boardRef.current[fromRow][fromCol];
              console.log('[DEBUG] Move validation:', { piece, moveObj, isValid: piece && getPieceColor(piece) === 'red' && canPieceMove(piece, fromRow, fromCol, toRow, toCol, true, 'red', boardRef.current) });
              if (piece && getPieceColor(piece) === 'red' && canPieceMove(piece, fromRow, fromCol, toRow, toCol, true, 'red', boardRef.current)) {
                console.log('[STOCKFISH] Executing API move:', moveObj);
                makeMove(moveObj.from, moveObj.to, true);
              } else {
                console.warn('[DEBUG] Invalid Stockfish move, falling back to random');
                const fallbackMove = getRandomAIMove(boardRef.current);
                if (fallbackMove) {
                  makeMove(fallbackMove.from, fallbackMove.to, true);
                }
                isAIMovingRef.current = false;
                apiCallInProgressRef.current = false;
              }
            } else {
              console.warn('[DEBUG] Invalid move coordinates, falling back to random');
              const fallbackMove = getRandomAIMove(boardRef.current);
              if (fallbackMove) {
                makeMove(fallbackMove.from, fallbackMove.to, true);
              }
              isAIMovingRef.current = false;
              apiCallInProgressRef.current = false;
            }
          } else {
            console.warn('[DEBUG] Invalid move format from Stockfish, falling back to random');
            const fallbackMove = getRandomAIMove(boardRef.current);
            if (fallbackMove) {
              makeMove(fallbackMove.from, fallbackMove.to, true);
            }
            isAIMovingRef.current = false;
            apiCallInProgressRef.current = false;
          }
        }).catch(async (error) => {
          console.error('[STOCKFISH] API error:', error);
          // Check if it's a DNS/network error
          const isNetworkError = error?.message?.includes('Failed to fetch') || 
                                 error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                                 error?.name === 'TypeError';
          
          if (isNetworkError) {
            setStatus('Stockfish API unavailable (DNS/network error). Check chess.lawb.xyz configuration. Using fallback.');
          } else {
            setStatus('Stockfish unavailable. Using fallback.');
          }
          
          // Last resort: random move
          const fallbackMove = getRandomAIMove(boardRef.current);
          if (fallbackMove) {
            makeMove(fallbackMove.from, fallbackMove.to, true);
          }
          isAIMovingRef.current = false;
          apiCallInProgressRef.current = false;
        });
      }
    }
  }, [currentPlayer, gameMode, difficulty, pieceState, stockfishReady, getStockfishMove, getCloudflareStockfishMove]);

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
    setStatus('Select chess mode');
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
    setShowPieceSetSelector(true);
  };

  const startMultiplayerGame = () => {
    setShowGame(true);
    setStatus('Set wager and create/join match');
  };

  const startGame = () => {
    playStartSound();
    console.log('[DEBUG] startGame called, difficulty:', difficulty, 'gameMode:', gameMode);
    
    if (gameMode === 'online') {
      // For multiplayer, we'll show the multiplayer component instead
      setShowGame(false);
      setShowDifficulty(false);
      setShowPieceSetSelector(false);
      return;
    }
    
    setShowGame(true);
    setShowDifficulty(false);
    setShowPieceSetSelector(false);
    setStatus(`Match started! Your turn`);
    const newChessboard = selectRandomChessboard();
    setSelectedChessboard(newChessboard);
    console.log('[DEBUG] Match started with chessboard:', newChessboard);
    // Start timer when game starts
    const now = Date.now();
    setLastMoveTime(now);
    setTimeoutCountdown(GAME_TIMEOUT_MS / 1000); // Initialize countdown to full time
    console.log('[TIMER] Game started, setting lastMoveTime to:', now, 'initial countdown:', GAME_TIMEOUT_MS / 1000);
  };

  // Timer functions
  const startTimeoutTimer = () => {
    if (timeoutTimer) return; // Already running
    const timer = setInterval(() => {}, 1000);
    setTimeoutTimer(timer);
  };

  const stopTimeoutTimer = () => {
    if (timeoutTimer) {
      clearInterval(timeoutTimer);
      setTimeoutTimer(null);
    }
    setTimeoutCountdown(0);
  };

  // Format countdown timer for display (MM:SS or HH:MM:SS)
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update countdown timer - counts down for whichever player's turn it is
  useEffect(() => {
    if (showGame && gameState === 'active' && gameMode === 'ai') {
      // Timer counts down for both players' turns
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastMoveTime;
        const remaining = Math.max(0, GAME_TIMEOUT_MS - elapsed);
        const seconds = Math.ceil(remaining / 1000);
        setTimeoutCountdown(seconds);
        
        // End game if timeout - current player loses
        if (remaining <= 0) {
          setGameState('checkmate');
          if (currentPlayer === 'blue') {
            setStatus('Time out! You lost.');
          } else {
            setStatus('AI timed out! You won!');
          }
          stopTimeoutTimer();
        }
      }, 1000);
      
      return () => {
        clearInterval(interval);
      };
    } else {
      setTimeoutCountdown(0);
    }
  }, [showGame, gameState, lastMoveTime, currentPlayer, gameMode]);

  // Debug timer display state
  useEffect(() => {
    if (showGame && gameState === 'active' && gameMode === 'ai') {
      console.log('[TIMER DISPLAY]', { showGame, gameState, gameMode, timeoutCountdown, currentPlayer });
    }
  }, [showGame, gameState, gameMode, timeoutCountdown, currentPlayer]);

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
        onTouchStart={(e) => handleTouchStart(row, col, e)}
        onTouchMove={handleTouchMove}
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

  const renderPieceGallery = (small = false, tipText = 'Click a piece to learn more about it.') => {
    // Organize pieces into pairs: red and blue side by side
    const redPieces = pieceGallery.filter(p => p.name.toLowerCase().includes('red'));
    const bluePieces = pieceGallery.filter(p => p.name.toLowerCase().includes('blue'));
    const piecePairs = redPieces.map((redPiece, index) => ({
      red: redPiece,
      blue: bluePieces[index]
    }));

    return (
    <div className={`piece-gallery${small ? ' piece-gallery-sm' : ''}`}>
              <h3 style={{color: '#ff0000'}}>{selectedPieceSet.name}</h3>
      <div className="piece-gallery-grid">
          {piecePairs.map((pair, index) => (
            <React.Fragment key={`pair-${index}`}>
              {/* Red piece */}
          <div 
            className="piece-gallery-item" 
                data-piece-color="red"
            onClick={() => {
                  setSelectedGalleryPiece(selectedGalleryPiece === pair.red.key ? null : pair.red.key);
            }}
          >
                <img src={pair.red.img} alt={pair.red.name} className="piece-gallery-img" />
                <div className="piece-gallery-name">{pair.red.name}</div>
                {selectedGalleryPiece === pair.red.key && (
                  <div className="piece-gallery-desc">{pair.red.desc}</div>
            )}
          </div>
              {/* Blue piece */}
              <div 
                className="piece-gallery-item" 
                data-piece-color="blue"
                onClick={() => {
                  setSelectedGalleryPiece(selectedGalleryPiece === pair.blue.key ? null : pair.blue.key);
                }}
              >
                <img src={pair.blue.img} alt={pair.blue.name} className="piece-gallery-img" />
                <div className="piece-gallery-name">{pair.blue.name}</div>
                {selectedGalleryPiece === pair.blue.key && (
                  <div className="piece-gallery-desc">{pair.blue.desc}</div>
                )}
              </div>
            </React.Fragment>
        ))}
      </div>
      <div className="piece-gallery-tip">{tipText}</div>
    </div>
  );
  };

  const renderPieceSetSelector = () => {
    const handlePieceSetSelect = (pieceSet: ChessPieceSet) => {
      setSelectedPieceSet(pieceSet);
      setShowPieceSetDropdown(false);
    };

    const getPieceSetDisplayName = (pieceSetId: string) => {
      if (pieceSetId === 'lawbstation') return 'Lawbstation Chess Set';
      if (pieceSetId === 'pixelawbs') return 'Pixelawbs Chess Set';
      return 'Select Chess Set';
    };

    return (
      <div className="piece-set-selection-row" style={{ justifyContent: 'center' }}>
        <div className="piece-set-controls-col">
          <div className="piece-set-selection-panel" style={{background:'transparent',borderRadius:0,padding: isMobile ? '8px 12px' : '32px 24px',paddingTop: isMobile ? '4px' : undefined,marginTop: isMobile ? '0' : undefined,boxShadow:'none',textAlign:'center'}}>
            <h2 style={{fontWeight:700,letterSpacing:1,fontSize: isMobile ? '1.5rem' : '2rem',color:'#ff0000',marginBottom: isMobile ? '8px' : 16,marginTop: isMobile ? '0' : undefined,textShadow:'0 0 6px #ff0000, 0 0 2px #ff0000'}}>Select Chess Set</h2>
            <p style={{fontSize:'1.1rem',color:'#ff0000',marginBottom:24,textShadow:'0 0 6px #ff0000, 0 0 2px #ff0000'}}>Choose your preferred chess set.</p>
            
            {/* Piece Set Dropdown */}
            <div style={{display:'flex',justifyContent:'center',marginBottom:24}}>
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <button
                  type="button"
                  onClick={() => setShowPieceSetDropdown(!showPieceSetDropdown)}
                  style={{
                    padding: '12px 16px',
                    border: '2px outset #fff',
                    background: '#000000',
                    color: '#ff0000',
                    cursor: 'pointer',
                    minWidth: '200px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '1em'
                  }}
                >
                  {getPieceSetDisplayName(selectedPieceSet.id)}
                  <span style={{ float: 'right' }}>▲</span>
                </button>
                
                {showPieceSetDropdown && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    background: '#000000',
                    border: '2px outset #fff',
                    zIndex: 10,
                    minWidth: '200px'
                  }}>
                    {CHESS_PIECE_SETS.map((pieceSet) => (
                      <div
                        key={pieceSet.id}
                        onClick={() => handlePieceSetSelect(pieceSet)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #333',
                          fontSize: '1em',
                          color: '#ff0000',
                          background: '#000000'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#000000'}
                      >
                        {getPieceSetDisplayName(pieceSet.id)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              className={`piece-set-btn start-btn`}
              onClick={() => { setShowPieceSetSelector(false); setShowDifficulty(true); }}
              style={{ 
                background: 'transparent',
                color: '#ff0000',
                fontWeight: 'bold',
                fontSize: '1.3em',
                padding: '18px 48px',
                borderRadius: 0,
                boxShadow: '0 0 6px #ff0000, 0 0 2px #ff0000',
                border: '1px solid #ff0000',
                cursor: 'pointer',
                letterSpacing: 1,
                marginBottom: 8
              }}
            >
              <span role="img" aria-label="chess">♟️🦞</span> Continue
            </button>

            {/* Back to Chess Button */}
            <div style={{marginTop: '16px', justifyContent: 'center'}}>
              <button
                onClick={() => window.location.href = '/chess'}
                style={{ 
                  background: 'transparent',
                  color: '#ff0000',
                  fontWeight: 'bold',
                  fontSize: '1.1em',
                  padding: '12px 24px',
                  borderRadius: 0,
                  boxShadow: '0 0 6px #ff0000, 0 0 2px #ff0000',
                  border: '1px solid #ff0000',
                  cursor: 'pointer',
                  letterSpacing: 1
                }}
              >
                ← Back to Chess Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDifficultySelection = () => (
    <div className="difficulty-selection-row" style={{ justifyContent: 'center' }}>
      <div className="difficulty-controls-col">
        <div className="difficulty-selection-panel" style={{background:'transparent',borderRadius:0,padding: isMobile ? '8px 12px' : '32px 24px',paddingTop: isMobile ? '4px' : undefined,marginTop: isMobile ? '0' : undefined,boxShadow:'none',textAlign:'center'}}>
          <h2 style={{fontWeight:700,letterSpacing:1,fontSize: isMobile ? '1.5rem' : '2rem',color:'#ff0000',marginBottom: isMobile ? '8px' : 16,marginTop: isMobile ? '0' : undefined,textShadow:'0 0 6px #ff0000, 0 0 2px #ff0000'}}>Select Difficulty</h2>
          <p style={{fontSize:'1.1rem',color:'#ff0000',marginBottom:24,textShadow:'0 0 6px #ff0000, 0 0 2px #ff0000'}}>Compete against the computer to climb the leaderboard.</p>
          <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:24}}>
            <button
              className={`difficulty-btn${difficulty === 'easy' ? ' selected' : ''}`}
              style={{background:difficulty==='easy'?'#ff0000':'transparent',color:difficulty==='easy'?'#fff':'#ff0000',fontWeight:'bold',fontSize:'1.1em',padding:'12px 32px',borderRadius:0,border:'1px solid #ff0000',cursor:'pointer',letterSpacing:1,boxShadow:difficulty==='easy'?'0 0 6px #ff0000, 0 0 2px #ff0000':'none'}}
              onClick={()=>setDifficulty('easy')}
            >Easy</button>
            <button
              className={`difficulty-btn${difficulty === 'hard' ? ' selected' : ''}`}
              style={{background:difficulty==='hard'?'#ff0000':'transparent',color:difficulty==='hard'?'#fff':'#ff0000',fontWeight:'bold',fontSize:'1.1em',padding:'12px 32px',borderRadius:0,border:'1px solid #ff0000',cursor:'pointer',letterSpacing:1,boxShadow:difficulty==='hard'?'0 0 6px #ff0000, 0 0 2px #ff0000':'none'}}
              onClick={()=>setDifficulty('hard')}
            >Hard</button>
          </div>
          <button 
            className={`difficulty-btn start-btn`}
            onClick={() => { startGame(); }}
            style={{ 
              background: 'transparent',
              color: '#ff0000',
              fontWeight: 'bold',
              fontSize: '1.3em',
              padding: '18px 48px',
              borderRadius: 0,
              boxShadow: '0 0 6px #ff0000, 0 0 2px #ff0000',
              border: '1px solid #ff0000',
              cursor: 'pointer',
              letterSpacing: 1,
              marginBottom: 8
            }}
          >
            <span role="img" aria-label="chess">♟️</span> Start Match
          </button>

          {/* Sidebar toggle buttons removed - use menu button instead */}

          {/* Back to Chess Button */}
          <div style={{marginTop: '16px', justifyContent: 'center'}}>
            <button
              onClick={() => window.location.href = '/chess'}
              style={{ 
                background: 'transparent',
                color: '#ff0000',
                fontWeight: 'bold',
                fontSize: '1.1em',
                padding: '12px 24px',
                borderRadius: 0,
                boxShadow: '0 0 6px #ff0000, 0 0 2px #ff0000',
                border: '1px solid #ff0000',
                cursor: 'pointer',
                letterSpacing: 1
              }}
            >
              ← Back to Chess
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  // Helper functions for move execution
  const handleSpecialMoves = (newBoard: (string | null)[][], from: { row: number; col: number }, to: { row: number; col: number }, piece: string) => {
    // Handle castling
    if (piece.toLowerCase() === 'k' && Math.abs(from.col - to.col) === 2) {
      if (to.col === 6) { // Kingside
        newBoard[from.row][7] = null;
        newBoard[from.row][5] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
      } else if (to.col === 2) { // Queenside
        // Save the queen if it exists at d1/d8 before moving the rook
        const queenPiece = newBoard[from.row][3];
        // If there was a queen at d1/d8, move it to a safe position (e1/e8) FIRST
        if (queenPiece && queenPiece.toLowerCase() === 'q') {
          newBoard[from.row][4] = queenPiece;
        }
        // Now move the rook
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
      playSound('capture');
      setCaptureAnimation({ row: to.row, col: to.col, show: true });
      
      // Wait for animation to complete before executing the move
      // Use requestAnimationFrame to ensure animation renders before board update
      requestAnimationFrame(() => {
      setTimeout(() => {
        executeMoveAfterAnimation(from, to, promotionPiece, isAIMove);
          // Clear animation after board has updated
          setTimeout(() => {
        setCaptureAnimation(null);
          }, 100);
      }, 500); // Animation duration
      });
      return;
    }
    
    // If not a capture, play move sound and execute move immediately
    playSound('move');
    executeMoveAfterAnimation(from, to, promotionPiece, isAIMove);
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

  // Play start.mp3 when a new match starts
  const playStartSound = () => {
    const audio = new Audio('/images/start.mp3');
    audio.play().catch(() => {});
  };

  // Workaround for TypeScript JSX type error
  const isOnline = gameMode === 'online';

  // Desktop menu and window state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState<Set<'leaderboard' | 'gallery' | 'chat' | 'moves' | 'profile' | 'howto'>>(new Set());
  
  // Window positions and sizes (for draggable windows)
  const [windowPositions, setWindowPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  
  // Helper functions for window management
  const openWindow = (windowType: 'leaderboard' | 'gallery' | 'chat' | 'moves' | 'profile' | 'howto') => {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[OPEN WINDOW] Opening window:', windowType);
    }
    setIsMenuOpen(false);
    // Set default position if not set - position windows to avoid covering chessboard
    // Calculate position BEFORE opening window to ensure it's available on first render
    if (!windowPositions[windowType]) {
      const windowWidth =
        windowType === 'gallery' ? 380 :
        windowType === 'moves' ? 300 :
        windowType === 'profile' ? 400 :
        windowType === 'howto' ? 420 : 400;
      const windowHeight =
        windowType === 'gallery' ? 480 :
        windowType === 'moves' ? 400 :
        windowType === 'profile' ? 500 :
        windowType === 'howto' ? 520 : 500;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const headerHeight = 60; // Account for header
      
      // Position windows on the left side to avoid center chessboard
      // Stagger them vertically to avoid overlap
      const openCount = Object.keys(windowPositions).length;
      const leftMargin = 20;
      const topMargin = headerHeight + 20;
      const staggerOffset = openCount * 40;
      
      const newPosition = { 
        x: leftMargin, 
        y: Math.min(topMargin + staggerOffset, screenHeight - windowHeight - 20),
        width: windowWidth, 
        height: windowHeight 
      };
      
      // Set position synchronously before opening window
      setWindowPositions(prev => ({
        ...prev,
        [windowType]: newPosition
      }));
      
      // Then open the window
      setOpenWindows(prev => {
        const newSet = new Set(prev);
        newSet.add(windowType);
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[OPEN WINDOW] Added window to set:', windowType, 'New set:', Array.from(newSet));
        }
        return newSet;
      });
    } else {
      // Position already set, just open window
      setOpenWindows(prev => {
        const newSet = new Set(prev);
        newSet.add(windowType);
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[OPEN WINDOW] Added window to set (existing position):', windowType, 'New set:', Array.from(newSet));
        }
        return newSet;
      });
    }
  };
  
  const closeWindow = (windowType: 'leaderboard' | 'gallery' | 'chat' | 'moves' | 'profile' | 'howto') => {
    setOpenWindows(prev => {
      const newSet = new Set(prev);
      newSet.delete(windowType);
      return newSet;
    });
  };

  const openHowToGuide = useCallback(() => {
    if (isMobile) {
      setSidebarView('howto');
      setIsSidebarOpen(false);
    } else {
      openWindow('howto');
    }
  }, [isMobile, openWindow]);
  
  // Mobile sidebar state (unchanged)
  const [sidebarView, setSidebarView] = useState<'leaderboard' | 'moves' | 'gallery' | 'chat' | 'profile' | 'howto' | null>(isMobile ? null : null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Debug menu state
  useEffect(() => {
    if (isMobile) {
      console.log('[MENU] Menu state', { isSidebarOpen, sidebarView, isMobile });
      if (isSidebarOpen) {
        console.log('[MENU RENDER] Menu is open, rendering buttons');
      }
      if (sidebarView) {
        console.log('[POPUP] SidebarView is set, should render popup:', sidebarView);
      }
    }
  }, [isMobile, isSidebarOpen, sidebarView]);

  // In the promotion dialog handler, after a pawn is promoted, play the upgrade sound
  const handlePromotion = (promotionPiece: string) => {
    playSound('upgrade');
    // ... existing promotion logic ...
  };

  // Mobile touch handling for better piece selection
  const handleTouchStart = (row: number, col: number, event: React.TouchEvent) => {
    // Prevent default to avoid double-tap zoom on mobile
    event.preventDefault();
    handleSquareClick(row, col);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    // Prevent scrolling when touching the chessboard
    event.preventDefault();
  };

  if (isOnline) {
    return (
      <BaseAppChessMultiplayer 
        onClose={onClose} 
        onMinimize={onMinimize} 
        fullscreen={fullscreen}
        onChatToggle={onChatToggle}
        isChatMinimized={isChatMinimized}
      />
    );
  }

  // Show home/mode selection UI if not in a game and not picking difficulty or piece set
  if (!showGame && !showDifficulty && !showPieceSetSelector) {
    return (
      <div className={`chess-game ${isBaseMiniAppDetected ? 'baseapp' : (isMobile ? 'mobile mobile-device' : 'desktop')}`}>
        <div className="chess-header">
          <h2>LAWB CHESS MAINNET BETA 3000</h2>
          <div className="chess-controls">
            {onMinimize && <button onClick={onMinimize}>_</button>}
            {/* Desktop menu button - show in Base Mini App even if detected as mobile */}
            {shouldShowDesktopMenu && (
            <button 
              className="menu-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== 'undefined' && window.console) {
                  window.console.log('[MENU] Home view button clicked, current isMenuOpen:', isMenuOpen);
                }
                setIsMenuOpen(prev => !prev);
              }}
              title="Menu"
              type="button"
            >
              ☰
            </button>
            )}
            {/* Mobile menu button */}
            {isMobile && (
              <button 
                className="sidebar-menu-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen(prev => !prev);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen(prev => !prev);
                }}
                title="Toggle Menu"
                type="button"
                aria-label="Toggle Menu"
              >
                ☰
              </button>
            )}
            {isMobile && isChatMinimized && onChatToggle && (
              <button 
                className="chat-bubble-btn"
                onClick={onChatToggle}
                title="Open Chat"
              >
                💬
              </button>
            )}
            <button onClick={onClose}>×</button>
          </div>
        </div>
        <div className={`game-stable-layout home-view ${isBaseMiniAppDetected ? 'baseapp' : (isMobile ? 'mobile' : 'desktop')}`}>
          {/* Desktop sidebar removed - using menu popup and windows instead */}
          <div className="center-area">
            <div className="game-mode-panel-streamlined">
              {/* Status Display and Network Switching */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                borderRadius: '4px',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}>
                <div style={{ 
                  color: isDarkMode ? '#00ff00' : '#ff0000', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  {status}
                </div>
                {showGame && gameState === 'active' && gameMode === 'ai' && timeoutCountdown > 0 && (
                  <div className={`timer-display ${timeoutCountdown < 300 ? 'timer-warning' : ''} ${timeoutCountdown < 60 ? 'timer-critical' : ''}`} style={{
                    color: timeoutCountdown < 60 ? '#ff0000' : timeoutCountdown < 300 ? '#ff8800' : '#000080',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'Courier New, monospace',
                    marginTop: '5px'
                  }}>
                    {isMobile ? formatCountdown(timeoutCountdown) : `Time: ${formatCountdown(timeoutCountdown)}`}
                  </div>
                )}
                {/* Chain switching no longer required for single-player - any EVM chain works */}
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
                <button className="start-btn-compact" onClick={() => setShowPieceSetSelector(true)}>
                  Start Match
                </button>
              )}
              {isOnline && (
                <div className="pvp-info">
                  <p>Challenge other players with tDMT wagers</p>
                  <p>Create or join matches instantly</p>
                </div>
              )}
              {/* Chessboards GIF */}
              <div style={{textAlign: 'center', marginTop: '20px', marginBottom: '20px'}}>
                <img 
                  src="/images/chessboards.gif" 
                  alt="Chessboards Animation" 
                  style={{
                    maxWidth: '100%',
                    width: '100%',
                    height: 'auto',
                    borderRadius: '0px',
                    boxShadow: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {/* Sidebar toggle buttons removed - use menu button instead */}
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Popup - Home View */}
        {isMobile && (
          <>
            {/* Mobile Popup Overlay */}
            {isSidebarOpen && (
              <div 
                className="sidebar-popup-overlay"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
              />
            )}
            
            <div 
              className={`mobile-menu-popup ${isSidebarOpen ? 'popup-open' : 'popup-closed'}`}
              style={{ display: isSidebarOpen ? 'flex' : 'none' }}
            >
              {/* Close button */}
              <button
                className="mobile-menu-close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
                aria-label="Close menu"
              >
                ×
              </button>
            
              {/* Simple button menu */}
              <div className="mobile-menu-buttons">
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarView('leaderboard');
                    setTimeout(() => { setIsSidebarOpen(false); }, 50);
                  }}
                >
                  Leaderboard
                </button>
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarView('gallery');
                    setTimeout(() => { setIsSidebarOpen(false); }, 50);
                  }}
                >
                  Gallery
                </button>
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarView('howto');
                    setTimeout(() => { setIsSidebarOpen(false); }, 50);
                  }}
                >
                  How To
                </button>
                {onChatToggle && (
                  <button 
                    className="mobile-menu-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsSidebarOpen(false);
                      if (onChatToggle) {
                        onChatToggle();
                      }
                    }}
                  >
                    Chat
                  </button>
                )}
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarView('profile');
                    setTimeout(() => { setIsSidebarOpen(false); }, 50);
                  }}
                >
                  Profile
                </button>
                <div style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  textAlign: 'left',
                  minHeight: '44px',
                  fontSize: '16px'
                }}>
                  <ThemeToggle />
                </div>
                {onBackToModeSelect && (
                  <button 
                    className="mobile-menu-btn"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      onBackToModeSelect();
                    }}
                  >
                    Chess Home
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile Content Popup - Home View */}
        {isMobile && sidebarView && (
          <>
            {/* Overlay */}
            <div 
              className="mobile-content-overlay"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSidebarView(null);
              }}
            />
            
            {/* Content Popup */}
            <div className="mobile-content-popup">
              {/* Close button */}
              <button
                className="mobile-content-close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSidebarView(null);
                }}
                aria-label="Close"
              >
                ×
              </button>
              
              {/* Content */}
              {sidebarView === 'leaderboard' && (
                <div className="leaderboard-compact mobile-content-view">
                  <div className="leaderboard-title">Leaderboard</div>
                  {Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
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
                          {leaderboardData.slice(0, 10).map((entry, index: number) => {
                            if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                              const typedEntry = entry as LeaderboardEntry;
                              const displayName = leaderboardDisplayNames[typedEntry.username] || formatAddress(typedEntry.username);
                              return (
                                <tr key={typedEntry.username}>
                                  <td>{index + 1}</td>
                                  <td 
                                    style={{ cursor: 'pointer', color: '#0000ff', textDecoration: 'underline' }}
                                    onClick={() => setViewingProfileAddress(typedEntry.username)}
                                  >
                                    {displayName}
                                  </td>
                                  <td>{typedEntry.points}</td>
                                </tr>
                              );
                            }
                            return null;
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mobile-empty-state" style={{ padding: '20px', textAlign: 'center' }}>
                      {leaderboardLoading ? (
                        <div>Loading leaderboard...</div>
                      ) : leaderboardError ? (
                        <div style={{ padding: '15px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
                          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#d00' }}>{leaderboardError}</div>
                          <button
                            onClick={() => void loadLeaderboard()}
                            style={{
                              padding: '8px 16px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : leaderboardData.length === 0 ? (
                        <div>No leaderboard entries yet</div>
                      ) : (
                        <div>Loading leaderboard...</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {sidebarView === 'gallery' && (
                <div className="piece-gallery-compact mobile-content-view">
                  <div className="gallery-title">Piece Gallery</div>
                  {renderPieceGallery(true, 'Click pieces to learn more')}
                </div>
              )}
              
              {sidebarView === 'profile' && (
                <div className="profile-compact mobile-content-view">
                  <PlayerProfile isMobile={true} />
                </div>
              )}

              {sidebarView === 'howto' && (
                <div className="how-to-compact mobile-content-view">
                  <HowToContent variant="mobile" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Menu Popup - Home View (Desktop Only, or Base Mini App) */}
        {(() => {
          const shouldRender = isMenuOpen && !showGame && shouldShowDesktopMenu;
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[MENU RENDER] Home view menu check:', JSON.stringify({
              isMobile,
              isBaseMiniAppDetected,
              shouldShowDesktopMenu,
              isMenuOpen,
              showGame,
              shouldRender
            }));
          }
          return shouldRender;
        })() && (
        <div 
          className="chess-menu-popup-overlay"
          onClick={() => {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('Menu overlay clicked, closing menu');
            }
            setIsMenuOpen(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10003,
            background: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
            pointerEvents: 'all',
            display: 'block'
          }}
        >
          <div 
            className="chess-menu-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '60px',
              right: '20px',
              background: isDarkMode ? '#000000' : '#c0c0c0',
              border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
              padding: '10px',
              minWidth: '200px',
              zIndex: 10004,
              boxShadow: isDarkMode ? '4px 4px 8px rgba(0, 255, 0, 0.3)' : '4px 4px 8px rgba(0, 0, 0, 0.3)',
              display: 'block',
              color: isDarkMode ? '#00ff00' : '#000000'
            }}
          >
            <div style={{ 
              marginBottom: '8px', 
              fontWeight: 'bold', 
              borderBottom: isDarkMode ? '1px solid #00ff00' : '1px solid #000', 
              paddingBottom: '4px',
              color: isDarkMode ? '#00ff00' : '#000000'
            }}>
              Menu
            </div>
                <button
              onClick={() => {
                openWindow('leaderboard');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Leaderboard
            </button>
                <button
              onClick={() => {
                openWindow('gallery');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Gallery
            </button>
            <button
              onClick={() => {
                openWindow('howto');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              How To
            </button>
            <button
              onClick={() => {
                if (onChatToggle) {
                  onChatToggle();
                }
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Chat
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== 'undefined' && window.console) {
                  window.console.log('[MENU] Profile button clicked (home view)');
                }
                openWindow('profile');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Profile
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger theme toggle by clicking the ThemeToggle component
                const toggleBtn = e.currentTarget.querySelector('button');
                if (toggleBtn) {
                  toggleBtn.click();
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              <ThemeToggle asMenuItem={true} />
            </button>
            {onBackToModeSelect && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (showGame) {
                    clearCelebration();
                    setShowGame(false);
                    resetGame();
                  }
                  onBackToModeSelect();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginTop: '8px',
                  background: isDarkMode ? '#000000' : '#c0c0c0',
                  border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: isDarkMode ? '1px solid #00ff00' : '1px solid #000',
                  paddingTop: '12px',
                  color: isDarkMode ? '#00ff00' : '#000000'
                }}
              >
                Chess Home
              </button>
            )}
          </div>
        </div>
        )}

        {/* Desktop Windows - Home View */}
        {!isMobile && openWindows.has('leaderboard') && (
        <Popup
          id="leaderboard-window"
          isOpen={true}
          onClose={() => closeWindow('leaderboard')}
          title="Leaderboard"
          initialPosition={windowPositions['leaderboard'] ? { x: windowPositions['leaderboard'].x, y: windowPositions['leaderboard'].y } : { x: 20, y: 80 }}
          initialSize={{ width: 400, height: 500 }}
          zIndex={1000}
        >
          <div className="leaderboard-compact">
            {Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
              <div className="leaderboard-table-compact">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.slice(0, 20).map((entry, index: number) => {
                      if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                        const typedEntry = entry as LeaderboardEntry;
                        const displayName = leaderboardDisplayNames[typedEntry.username] || formatAddress(typedEntry.username);
                        return (
                          <tr key={typedEntry.username}>
                            <td>{index + 1}</td>
                            <td 
                              style={{ cursor: 'pointer', color: '#0000ff', textDecoration: 'underline' }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== 'undefined' && window.console) {
                                  window.console.log('[LEADERBOARD] Clicked profile:', typedEntry.username);
                                }
                                setViewingProfileAddress(typedEntry.username);
                              }}
                            >
                              {displayName}
                            </td>
                            <td>{typedEntry.points}</td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#000080', textAlign: 'center', padding: '20px', fontSize: '12px' }}>
                No leaderboard data available
            </div>
            )}
          </div>
        </Popup>
        )}

        {!isMobile && openWindows.has('gallery') && (
        <Popup
          id="gallery-window"
          isOpen={true}
          onClose={() => closeWindow('gallery')}
          title="Piece Gallery"
          initialPosition={windowPositions['gallery'] ? { x: windowPositions['gallery'].x, y: windowPositions['gallery'].y } : { x: 20, y: 100 }}
          initialSize={{ width: 380, height: 480 }}
          zIndex={1000}
        >
          <div className="piece-gallery-compact">
            {renderPieceGallery(true, 'Click pieces to learn more')}
        </div>
        </Popup>
        )}

        {!isMobile && openWindows.has('profile') && (
        <Popup
          id="profile-window"
          isOpen={true}
          onClose={() => closeWindow('profile')}
          title="Profile"
          initialPosition={windowPositions['profile'] ? { x: windowPositions['profile'].x, y: windowPositions['profile'].y } : { x: 20, y: 180 }}
          initialSize={{ width: 400, height: 500 }}
          zIndex={1000}
        >
          <PlayerProfile isMobile={false} />
        </Popup>
        )}
        
        {!isMobile && openWindows.has('howto') && (
        <Popup
          id="howto-window"
          isOpen={true}
          onClose={() => closeWindow('howto')}
          title="How To Play"
          initialPosition={windowPositions['howto'] ? { x: windowPositions['howto'].x, y: windowPositions['howto'].y } : { x: 40, y: 160 }}
          initialSize={{ width: 420, height: 520 }}
          zIndex={1000}
        >
          <HowToContent />
        </Popup>
        )}
        
        {/* Profile popup from leaderboard - rendered in home view */}
        {!isMobile && viewingProfileAddress && (
          <Popup
            id="view-profile-window"
            isOpen={true}
            onClose={() => {
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[LEADERBOARD] Closing profile popup for:', viewingProfileAddress);
              }
              setViewingProfileAddress(null);
            }}
            title="Player Profile"
            initialPosition={{ x: 100, y: 100 }}
            initialSize={{ width: 400, height: 500 }}
            zIndex={10000}
          >
            {(() => {
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[LEADERBOARD] Rendering profile popup for:', viewingProfileAddress);
              }
              return null;
            })()}
            <PlayerProfile isMobile={false} address={viewingProfileAddress} />
          </Popup>
        )}
      </div>
    );
  }

  // Single player game UI
  return (
    <div className={`chess-game${fullscreen ? ' fullscreen' : ''}${showGame ? ' game-active' : ''} ${isBaseMiniAppDetected ? 'baseapp' : (isMobile ? 'mobile mobile-device' : 'desktop')}`}>
      {/* Streamlined Header - always show */}
      <div className="chess-header">
        <h2>LAWB CHESS MAINNET BETA 3000</h2>
        <div className="chess-controls">
          {onMinimize && <button onClick={onMinimize}>_</button>}
          {shouldShowDesktopMenu && (
            <button 
              className="menu-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== 'undefined' && window.console) {
                  window.console.log('Menu button clicked (game view), current isMenuOpen:', isMenuOpen);
                }
                setIsMenuOpen(prev => !prev);
              }}
              title="Menu"
              type="button"
            >
              ☰
            </button>
          )}
          {isMobile && (
            <button 
              className="sidebar-menu-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[MENU BUTTON] Clicked, current isSidebarOpen:', isSidebarOpen);
                setIsSidebarOpen(!isSidebarOpen);
              }}
              title="Toggle Menu"
              type="button"
              aria-label="Toggle Menu"
            >
              ☰
            </button>
          )}
          <button onClick={onClose}>×</button>
        </div>
      </div>
      <div className={`game-stable-layout ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
        {/* Mobile Sidebar Popup - Always available on mobile via menu button */}
        {isMobile && (
          <>
            {/* Mobile Popup Overlay */}
            {isSidebarOpen && (
              <div 
                className="sidebar-popup-overlay"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
              />
            )}
            
            <div 
              className={`mobile-menu-popup ${isSidebarOpen ? 'popup-open' : 'popup-closed'}`}
              style={{ display: isSidebarOpen ? 'flex' : 'none' }}
            >
              {/* Close button */}
              <button
                className="mobile-menu-close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
                aria-label="Close menu"
              >
                ×
              </button>
            
              {/* Simple button menu - just 4 buttons */}
              <div className="mobile-menu-buttons">
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Set sidebarView first, then close menu after a tiny delay to ensure state updates
                    setSidebarView('leaderboard');
                    // Use setTimeout to ensure state update happens before closing menu
                    setTimeout(() => {
                    setIsSidebarOpen(false);
                    }, 50);
                  }}
                >
                  Leaderboard
                </button>
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Set sidebarView first, then close menu after a tiny delay to ensure state updates
                    setSidebarView('gallery');
                    // Use setTimeout to ensure state update happens before closing menu
                    setTimeout(() => {
                    setIsSidebarOpen(false);
                    }, 50);
                  }}
                >
                  Gallery
                </button>
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openHowToGuide();
                  }}
                >
                  How To
                </button>
                {onChatToggle && (
                  <button 
                    className="mobile-menu-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsSidebarOpen(false);
                      // Open chat window on mobile
                        if (onChatToggle) {
                          onChatToggle();
                        }
                    }}
                  >
                    Chat
                  </button>
                )}
                <button 
                  className="mobile-menu-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Set sidebarView first, then close menu after a tiny delay to ensure state updates
                    setSidebarView('profile');
                    // Use setTimeout to ensure state update happens before closing menu
                    setTimeout(() => {
                    setIsSidebarOpen(false);
                    }, 50);
                  }}
                >
                  Profile
                </button>
                {showGame && (
                  <button 
                    className="mobile-menu-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Set sidebarView first, then close menu after a tiny delay to ensure state updates
                      setSidebarView('moves');
                      // Use setTimeout to ensure state update happens before closing menu
                      setTimeout(() => {
                      setIsSidebarOpen(false);
                      }, 50);
                    }}
                  >
                    Move History
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Mobile Content Popup - Shows content when a menu button is clicked */}
        {isMobile && sidebarView && (
          <>
            {/* Overlay */}
            <div 
              className="mobile-content-overlay"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[POPUP] Overlay clicked, closing popup');
                setSidebarView(null);
              }}
            />
            
            {/* Content Popup */}
            <div className="mobile-content-popup">
              {/* Close button */}
              <button
                className="mobile-content-close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSidebarView(null);
                }}
                aria-label="Close"
              >
                ×
              </button>
              
              {/* Content */}
              {sidebarView === 'leaderboard' && (
                <div className="leaderboard-compact mobile-content-view">
                  <div className="leaderboard-title">Leaderboard</div>
                  {Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
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
                          {leaderboardData.slice(0, 10).map((entry, index: number) => {
                            if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                              const typedEntry = entry as LeaderboardEntry;
                              const displayName = leaderboardDisplayNames[typedEntry.username] || formatAddress(typedEntry.username);
                              return (
                                <tr key={typedEntry.username}>
                                  <td>{index + 1}</td>
                                  <td 
                                    style={{ cursor: 'pointer', color: '#0000ff', textDecoration: 'underline' }}
                                    onClick={() => setViewingProfileAddress(typedEntry.username)}
                                  >
                                    {displayName}
                                  </td>
                                  <td>{typedEntry.points}</td>
                                </tr>
                              );
                            }
                            return null;
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mobile-empty-state" style={{ padding: '20px', textAlign: 'center' }}>
                      {leaderboardLoading ? (
                        <div>Loading leaderboard...</div>
                      ) : leaderboardError ? (
                        <div style={{ padding: '15px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
                          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#d00' }}>{leaderboardError}</div>
                          <button
                            onClick={() => void loadLeaderboard()}
                            style={{
                              padding: '8px 16px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : leaderboardData.length === 0 ? (
                        <div>No leaderboard entries yet</div>
                      ) : (
                        <div>Loading leaderboard...</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {sidebarView === 'moves' && showGame && (
                <div className="move-history-compact mobile-content-view">
                  <div className="move-history-title">Move History</div>
                  {moveHistory.length > 0 ? (
                    <ul className="move-history-list-compact">
                      {moveHistory.slice().reverse().map((move, idx) => (
                        <li key={moveHistory.length - 1 - idx}>{move}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mobile-empty-state">No moves yet</div>
                  )}
                </div>
              )}
              
              {sidebarView === 'gallery' && (
                <div className="piece-gallery-compact mobile-content-view">
                  <div className="gallery-title">Piece Gallery</div>
                  {renderPieceGallery(true, 'Click pieces to learn more')}
                </div>
              )}
              
              {sidebarView === 'chat' && (
                <div className="chat-compact mobile-content-view">
                  <div className="mobile-empty-state">
                    {onChatToggle ? (
                      <div>
                        <div style={{ marginBottom: '16px', fontSize: '14px' }}>Chat is available in the main chat window</div>
                        <button 
                          className="mobile-menu-btn"
                          onClick={() => {
                            setSidebarView(null);
                            if (onChatToggle) onChatToggle();
                          }}
                          style={{ marginTop: '16px' }}
                        >
                          Open Chat Window
                        </button>
                      </div>
                    ) : (
                      'Chat is available in the main chat window'
                    )}
                  </div>
                </div>
              )}
              
              {sidebarView === 'profile' && (
                <div className="profile-compact mobile-content-view">
                  <PlayerProfile isMobile={true} />
                </div>
              )}

              {sidebarView === 'howto' && (
                <div className="how-to-compact mobile-content-view">
                  <HowToContent variant="mobile" />
                </div>
              )}
              
              {viewingProfileAddress && (
                <div className="profile-compact mobile-content-view" style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  zIndex: 10000, 
                  background: isDarkMode ? '#000000' : '#ffffff'
                }}>
                  <button onClick={() => setViewingProfileAddress(null)} style={{ margin: '10px', padding: '5px 10px' }}>Close</button>
                  <PlayerProfile isMobile={true} address={viewingProfileAddress} />
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Desktop Sidebar removed - using menu popup and windows instead */}
        {/* Center Area - Always Show Chess Board */}
        <div className="center-area">
          {/* Game Info Bar - Compact */}
          {showGame && (
            <div className="game-info-compact">
              <span className={currentPlayer === 'blue' ? 'current-blue' : 'current-red'}>
                {currentPlayer === 'blue' ? 'Blue' : 'Red'} to move
              </span>
              {gameMode === GameMode.AI && gameState === 'active' && timeoutCountdown > 0 && (
                <span className={`timer-display ${timeoutCountdown < 300 ? 'timer-warning' : ''} ${timeoutCountdown < 60 ? 'timer-critical' : ''}`}>
                  {isMobile ? formatCountdown(timeoutCountdown) : `Time: ${formatCountdown(timeoutCountdown)}`}
                </span>
              )}
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
                        zIndex: 1000
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
              {/* Desktop game controls removed - use menu button instead */}
            </div>
          ) : showPieceSetSelector ? (
            renderPieceSetSelector()
          ) : showDifficulty ? (
            renderDifficultySelection()
          ) : (
            <div className="game-mode-panel-streamlined">
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
                <button className="start-btn-compact" onClick={() => setShowPieceSetSelector(true)}>
                  Start Game
                </button>
              )}
              {isOnline && (
                <div className="pvp-info">
                  <p>Challenge other players with tDMT wagers</p>
                  <p>Create or join games instantly</p>
                </div>
              )}
              {/* Help Section - Use Base App HowToContent component */}
              <div className="help-section-compact">
                <HowToContent />
              </div>
              {/* Chessboards GIF */}
              <div style={{textAlign: 'center', marginTop: '20px', marginBottom: '20px'}}>
                <img 
                  src="/images/chessboards.gif" 
                  alt="Chessboards Animation" 
                  style={{
                    maxWidth: '100%',
                    width: '100%',
                    height: 'auto',
                    borderRadius: '0px',
                    boxShadow: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {/* Sidebar toggle buttons removed - use menu button instead */}
            </div>
          )}
        </div>
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
              <button onClick={handleNewGame}>New Match</button>
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
      
      {/* Desktop Menu Popup - Show for both home and game views */}
      {(() => {
        const shouldRender = shouldShowDesktopMenu && isMenuOpen;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[MENU RENDER] Menu check:', JSON.stringify({
            isMobile,
            isBaseMiniAppDetected,
            shouldShowDesktopMenu,
            isMenuOpen,
            showGame,
            shouldRender
          }));
        }
        return shouldRender;
      })() && (
        <div 
          className="chess-menu-popup-overlay"
          onClick={() => {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('Menu overlay clicked, closing menu');
            }
            setIsMenuOpen(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10003,
            background: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
            pointerEvents: 'all',
            display: 'block'
          }}
        >
          <div 
            className="chess-menu-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '60px',
              right: '20px',
              background: isDarkMode ? '#000000' : '#c0c0c0',
              border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
              padding: '10px',
              minWidth: '200px',
              zIndex: 10004,
              boxShadow: isDarkMode ? '4px 4px 8px rgba(0, 255, 0, 0.3)' : '4px 4px 8px rgba(0, 0, 0, 0.3)',
              display: 'block',
              color: isDarkMode ? '#00ff00' : '#000000'
            }}
          >
            <div style={{ 
              marginBottom: '8px', 
              fontWeight: 'bold', 
              borderBottom: isDarkMode ? '1px solid #00ff00' : '1px solid #000', 
              paddingBottom: '4px',
              color: isDarkMode ? '#00ff00' : '#000000'
            }}>
              Menu
            </div>
            <button
              onClick={() => openWindow('leaderboard')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Leaderboard
            </button>
            <button
              onClick={() => openWindow('gallery')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Gallery
            </button>
            <button
              onClick={() => {
                if (onChatToggle) {
                  onChatToggle();
                }
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Chat
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== 'undefined' && window.console) {
                  window.console.log('[MENU] Profile button clicked (game view)');
                }
                openWindow('profile');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              Profile
            </button>
            {showGame && (
              <button
                onClick={() => openWindow('moves')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginBottom: '4px',
                  background: isDarkMode ? '#000000' : '#c0c0c0',
                  border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: isDarkMode ? '#00ff00' : '#000000'
                }}
              >
                Move History
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger theme toggle by clicking the ThemeToggle component
                const toggleBtn = e.currentTarget.querySelector('button');
                if (toggleBtn) {
                  toggleBtn.click();
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginBottom: '4px',
                background: isDarkMode ? '#000000' : '#c0c0c0',
                border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                color: isDarkMode ? '#00ff00' : '#000000'
              }}
            >
              <ThemeToggle asMenuItem={true} />
            </button>
            {onBackToModeSelect && showGame && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  clearCelebration();
                  setShowGame(false);
                  resetGame();
                  onBackToModeSelect();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginTop: '8px',
                  background: isDarkMode ? '#000000' : '#c0c0c0',
                  border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: isDarkMode ? '1px solid #00ff00' : '1px solid #000',
                  paddingTop: '12px',
                  color: isDarkMode ? '#00ff00' : '#000000'
                }}
              >
                Chess Home
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Desktop Windows */}
      {!isMobile && openWindows.has('leaderboard') && (
        <Popup
          id="leaderboard-window"
          isOpen={true}
          onClose={() => closeWindow('leaderboard')}
          title="Leaderboard"
          initialPosition={windowPositions['leaderboard'] ? { x: windowPositions['leaderboard'].x, y: windowPositions['leaderboard'].y } : { x: 20, y: 80 }}
          initialSize={{ width: 400, height: 500 }}
          zIndex={1000}
        >
          <div className="leaderboard-compact">
            {Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
              <div className="leaderboard-table-compact">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.slice(0, 20).map((entry, index: number) => {
                      if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                        const typedEntry = entry as LeaderboardEntry;
                        const displayName = leaderboardDisplayNames[typedEntry.username] || formatAddress(typedEntry.username);
                        return (
                          <tr key={typedEntry.username}>
                            <td>{index + 1}</td>
                            <td 
                              style={{ cursor: 'pointer', color: '#0000ff', textDecoration: 'underline' }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== 'undefined' && window.console) {
                                  window.console.log('[LEADERBOARD] Clicked profile:', typedEntry.username);
                                }
                                setViewingProfileAddress(typedEntry.username);
                              }}
                            >
                              {displayName}
                            </td>
                            <td>{typedEntry.points}</td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#000080', textAlign: 'center', padding: '20px', fontSize: '12px' }}>
                No leaderboard data available
              </div>
            )}
          </div>
        </Popup>
      )}
      
      {!isMobile && openWindows.has('gallery') && (
        <Popup
          id="gallery-window"
          isOpen={true}
          onClose={() => closeWindow('gallery')}
          title="Piece Gallery"
          initialPosition={windowPositions['gallery'] ? { x: windowPositions['gallery'].x, y: windowPositions['gallery'].y } : { x: 20, y: 100 }}
          initialSize={{ width: 380, height: 480 }}
          zIndex={1000}
        >
          <div className="piece-gallery-compact">
            {renderPieceGallery(true, 'Click pieces to learn more')}
          </div>
        </Popup>
      )}
      
      {!isMobile && openWindows.has('moves') && showGame && (
        <Popup
          id="moves-window"
          isOpen={true}
          onClose={() => closeWindow('moves')}
          title="Move History"
          initialPosition={windowPositions['moves'] ? { x: windowPositions['moves'].x, y: windowPositions['moves'].y } : { x: 20, y: 140 }}
          initialSize={{ width: 300, height: 400 }}
          zIndex={1000}
        >
          <div className="move-history-compact">
            <div className="move-history-title">Moves</div>
            <ul className="move-history-list-compact" style={{ listStyle: 'none', padding: 0 }}>
              {moveHistory.slice().reverse().map((move, idx) => (
                <li key={moveHistory.length - 1 - idx} style={{ padding: '4px 0' }}>{move}</li>
              ))}
            </ul>
          </div>
        </Popup>
      )}
      
      {(() => {
        if (!isMobile && typeof window !== 'undefined' && window.console) {
          window.console.log('[DEBUG] openWindows:', Array.from(openWindows), 'has profile:', openWindows.has('profile'));
        }
        return null;
      })()}
      {!isMobile && openWindows.has('profile') && (
        <Popup
          id="profile-window"
          isOpen={true}
          onClose={() => {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE WINDOW] Closing profile window');
            }
            closeWindow('profile');
          }}
          title="Profile"
          initialPosition={windowPositions['profile'] ? { x: windowPositions['profile'].x, y: windowPositions['profile'].y } : { x: 20, y: 180 }}
          initialSize={{ width: 400, height: 500 }}
          zIndex={1000}
        >
          <PlayerProfile isMobile={false} />
        </Popup>
      )}

      {!isMobile && openWindows.has('howto') && (
        <Popup
          id="howto-window"
          isOpen={true}
          onClose={() => closeWindow('howto')}
          title="How To Play"
          initialPosition={windowPositions['howto'] ? { x: windowPositions['howto'].x, y: windowPositions['howto'].y } : { x: 40, y: 160 }}
          initialSize={{ width: 420, height: 520 }}
          zIndex={1000}
        >
          <HowToContent />
        </Popup>
      )}
      
      {(() => {
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[LEADERBOARD] Checking popup render condition:', {
            isMobile,
            viewingProfileAddress,
            shouldRender: !isMobile && !!viewingProfileAddress
          });
        }
        return null;
      })()}
      
      {/* Profile popup - rendered in home view */}
      {!isMobile && viewingProfileAddress && (
        <Popup
          id="view-profile-window"
          isOpen={true}
          onClose={() => {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[LEADERBOARD] Closing profile popup for:', viewingProfileAddress);
            }
            setViewingProfileAddress(null);
          }}
          title="Player Profile"
          initialPosition={{ x: 100, y: 100 }}
          initialSize={{ width: 400, height: 500 }}
          zIndex={10000}
        >
          {(() => {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[LEADERBOARD] Rendering profile popup for:', viewingProfileAddress);
            }
            return null;
          })()}
          <PlayerProfile isMobile={false} address={viewingProfileAddress} />
        </Popup>
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


