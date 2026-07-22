import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useAppKitSafe as useAppKit } from '../hooks/useAppKitSafe';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { 
  updateLeaderboardEntry, 
  getTopLeaderboardEntries,
  formatAddress as formatLeaderboardAddress,
  removeZeroAddressEntry,
  type LeaderboardEntry 
} from '../firebaseLeaderboard';
import { getDisplayName } from '../utils/displayName';
import { firebaseProfiles } from '../firebaseProfiles';
import { getOpenSeaNFTs, getCollectionNFTs } from '../mint';
// Removed blocking connection test - loading data directly with timeout
import { ChessMultiplayer } from './ChessMultiplayer';
import { firebaseChess } from '../firebaseChess';
import { CHESS_PIECE_SETS, getDefaultPieceSet, type ChessPieceSet } from '../config/chessPieceSets';
import { useChessPieceSet } from '../contexts/ChessPieceSetContext';
import { checkPixelawbsNFTOwnership } from '../utils/nftVerification';
import {
  EMPTY_NFT_INVENTORY,
  buildChessCollectionPerks,
  normalizeChessCollectionInventory,
} from '../utils/chessCollectionPerks';

// Clawb's wallet address for vs Clawb games
const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
import Popup from './Popup';
import { PlayerProfile } from './PlayerProfile';
import { HowToContent } from './HowToContent';
import { ChessTutorial } from './ChessTutorial';
import { ThemeToggle } from './ThemeToggle';
import { ChessChat } from './ChessChat';
import { debugIngest } from '../utils/debugIngest';
import { Chess } from 'chess.js';
import {
  boardFromChess,
  lawbBoardToFen,
  tryMoveOnChess,
  lawbLegalMoveDestinations,
  chessTurnToUi,
} from '../utils/lawbChessCore';
import { ipfsToHttp } from '../utils/ipfs';
import {
  chooseSinglePlayerAIMove,
  getSinglePlayerDifficultyProfile,
  type SinglePlayerDifficulty,
} from '../utils/singlePlayerEngine';
import {
  ENABLE_LICHESS_OPENING_EXPLORER,
  LICHESS_EXPLORER_PROXY_URL,
} from '../config/chessFeatureFlags';

import './ChessGame.css';
import './ChessGameModern.css';
import './ChessChat.css';

// Game modes
const GameMode = {
  AI: 'ai',
  ONLINE: 'online'
} as const;

// Sanko mainnet chain ID
const SANKO_CHAIN_ID = 1996;

// LeaderboardEntry interface is now imported from firebaseLeaderboard

// AI NFT collections for random profile picture (matching MemeGenerator logic)
const AI_NFT_COLLECTIONS = [
  { id: 'lawbsters', name: 'Lawbsters', api: 'opensea', slug: 'lawbsters', chain: 'ethereum' },
  { id: 'lawbstarz', name: 'Lawbstarz', api: 'opensea', slug: 'lawbstarz', chain: 'ethereum' },
  { id: 'pixelawbs', name: 'Pixelawbsters', api: 'scatter', slug: 'pixelawbs' },
  { id: 'halloween', name: 'Halloween Lawbsters', api: 'opensea', slug: 'a-lawbster-halloween', chain: 'base' },
  { id: 'asciilawbs', name: 'ASCII Lawbsters', api: 'opensea', slug: 'asciilawbs', chain: 'base' },
];

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
  onMenuToggle?: () => void;
}


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
  const lichessUnavailableRef = useRef(false);

  const buildExplorerUrl = useCallback((fen: string, move?: string) => {
    const params = new URLSearchParams({ fen });
    if (move) params.set('play', move);
    if (LICHESS_EXPLORER_PROXY_URL) {
      return `${LICHESS_EXPLORER_PROXY_URL}?${params.toString()}`;
    }
    return `https://explorer.lichess.ovh/lichess?${params.toString()}`;
  }, []);

  const getOpeningData = useCallback(async (fen: string) => {
    if (!ENABLE_LICHESS_OPENING_EXPLORER || lichessUnavailableRef.current) return null;
    try {
      setIsAnalyzing(true);
      // Get opening data from Lichess API (or optional proxy endpoint)
      const response = await fetch(buildExplorerUrl(fen));
      if (response.ok) {
        const data = await response.json();
        setOpeningData(data);
        return data;
      }
      if (response.status === 401 || response.status === 403) {
        lichessUnavailableRef.current = true;
      }
    } catch (error) {
      console.warn('[DEBUG] Lichess API error:', error);
    } finally {
      setIsAnalyzing(false);
    }
    return null;
  }, [buildExplorerUrl]);

  const getMoveAnalysis = useCallback(async (fen: string, move: string) => {
    if (!ENABLE_LICHESS_OPENING_EXPLORER || lichessUnavailableRef.current) return null;
    try {
      // Get move analysis from Lichess API (or optional proxy endpoint)
      const response = await fetch(buildExplorerUrl(fen, move));
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      if (response.status === 401 || response.status === 403) {
        lichessUnavailableRef.current = true;
      }
    } catch (error) {
      console.warn('[DEBUG] Lichess move analysis error:', error);
    }
    return null;
  }, [buildExplorerUrl]);

  return { openingData, isAnalyzing, getOpeningData, getMoveAnalysis };
};

export const ChessGame: React.FC<ChessGameProps> = ({ onClose, onMinimize, fullscreen = false, onBackToModeSelect, onGameStart, onChatToggle, isChatMinimized, isMobile = false, onMenuToggle }) => {
  const { address: walletAddress, isConnected } = useAccount();
  const connectionDisplay = useConnectionDisplay();
  const leaderboardWalletAddress = connectionDisplay.address;
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();
  
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
  const [difficulty, setDifficulty] = useState<SinglePlayerDifficulty>('hard');
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
  const [showPieceHoverLabels, setShowPieceHoverLabels] = useState(false);
  const [hoveredPieceLabel, setHoveredPieceLabel] = useState<string | null>(null);
  
  // Profile picture state
  const [playerProfilePic, setPlayerProfilePic] = useState<string | null>(null);
  const [aiProfilePic, setAiProfilePic] = useState<string | null>(null);
  const [loadingAiPic, setLoadingAiPic] = useState(false);
  
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
  /** Single source of truth for legality / AI (synced with `board` after each move). */
  const chessRef = useRef(new Chess());
  const checkGameEndFromChessRef = useRef<(chess: Chess) => 'checkmate' | 'stalemate' | 'draw' | null>(() => null);
  const makeMoveRef = useRef<((from: { row: number; col: number }, to: { row: number; col: number }, isAIMove?: boolean) => void) | null>(null);
  const aiTimeoutRef = useRef<number | null>(null);
  const lastAIMoveRef = useRef(false);
  const apiCallInProgressRef = useRef(false);
  const playerMoveInProgressRef = useRef(false);
  const hardAICooldownUntilRef = useRef(0);

  // Add showDifficulty state
  const [showDifficulty, setShowDifficulty] = useState(false);
  
  // vs Clawb Firebase game tracking
  const [vsClawbInviteCode, setVsClawbInviteCode] = useState<string | null>(null);


  // Add state for leaderboard updated message
  const [showLeaderboardUpdated, setShowLeaderboardUpdated] = useState(false);

  // Timer state for per-turn 5-minute move timeout (resets after every move)
  const GAME_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per turn
  const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());



  // Add Stockfish integration
  const { stockfishReady, getCloudflareStockfishMove } = useStockfish();

  // Add Lichess API integration
  const { openingData, isAnalyzing, getOpeningData, getMoveAnalysis } = useLichessAPI();

  // Add state for Stockfish status
  const [stockfishStatus, setStockfishStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [hardEngineHealth, setHardEngineHealth] = useState<'idle' | 'thinking' | 'healthy' | 'degraded' | 'offline'>('idle');
  const [hardFallbackCount, setHardFallbackCount] = useState(0);

  // Add state for opening suggestions
  const [showOpeningSuggestions, setShowOpeningSuggestions] = useState(false);
  const [openingSuggestions, setOpeningSuggestions] = useState<any[]>([]);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);

  // Mobile debug log - visible in overlay for screenshot debugging
  const [mobileDebugLog, setMobileDebugLog] = useState<string[]>([]);
  const mobileDebugSeqRef = useRef(0);
  const addMobileDebug = useCallback((msg: string) => {
    if (!isMobile) return;
    mobileDebugSeqRef.current += 1;
    const ts = new Date().toISOString().slice(11, 23);
    setMobileDebugLog(prev => [`${ts} #${mobileDebugSeqRef.current} ${msg}`, ...prev].slice(0, 18));
  }, [isMobile]);

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

  useEffect(() => {
    if (!showGame || typeof window === 'undefined') return;
    const boardEl = chessboardRef.current;
    if (!boardEl) {
      // #region agent log
      debugIngest({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'ChessGame.tsx:chessboard-ref-missing',message:'chessboard ref missing',data:{showGame,selectedChessboard},timestamp:Date.now()});
      // #endregion
      return;
    }
    const boardStyle = window.getComputedStyle(boardEl);
    // #region agent log
    debugIngest({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'ChessGame.tsx:chessboard-style',message:'chessboard computed style',data:{selectedChessboard,inlineBg:boardEl.style.backgroundImage,cssVarBg:boardEl.style.getPropertyValue('--chessboard-bg-image'),bg:boardStyle.backgroundImage,bgSize:boardStyle.backgroundSize,bgRepeat:boardStyle.backgroundRepeat,boxSizing:boardStyle.boxSizing,border:boardStyle.borderTopWidth,padding:boardStyle.paddingTop,width:boardEl.clientWidth,height:boardEl.clientHeight},timestamp:Date.now()});
    // #endregion
    const squares = boardEl.querySelectorAll('.square');
    const squareWithBg = Array.from(squares).filter((el) => window.getComputedStyle(el as Element).backgroundImage !== 'none').length;
    const firstSquare = squares[0] as HTMLElement | undefined;
    const firstSquareStyle = firstSquare ? window.getComputedStyle(firstSquare) : null;
    // #region agent log
    debugIngest({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'ChessGame.tsx:square-style',message:'square background sampling',data:{squareCount:squares.length,squareWithBg,sampleBg:firstSquareStyle?.backgroundImage,bgSize:firstSquareStyle?.backgroundSize,bgRepeat:firstSquareStyle?.backgroundRepeat},timestamp:Date.now()});
    // #endregion
  }, [showGame, selectedChessboard]);

  // Add sound and celebration state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [victoryCelebration, setVictoryCelebration] = useState(false);

  // Add piece set selection state
  const [selectedPieceSet, setSelectedPieceSet] = useState<ChessPieceSet>(getDefaultPieceSet());
  const [showPieceSetSelector, setShowPieceSetSelector] = useState(false);
  const [showPieceSetDropdown, setShowPieceSetDropdown] = useState(false);
  const [collectionInventory, setCollectionInventory] = useState(EMPTY_NFT_INVENTORY);
  const [isLoadingCollectionPerks, setIsLoadingCollectionPerks] = useState(false);
  const [collectionPerksError, setCollectionPerksError] = useState<string | null>(null);
  const chessboardRef = useRef<HTMLDivElement | null>(null);
  const collectionPerks = useMemo(
    () => buildChessCollectionPerks(collectionInventory),
    [collectionInventory],
  );

  // #region agent log (hypothesis H3: home-view layout/padding or parent flex rules are pushing buttons down)
  useEffect(() => {
    if (showGame || showDifficulty || showPieceSetSelector) return;
    if (!isMobile) return;
    const emit = (phase: string) => {
      debugIngest({sessionId:'debug-session',runId:'mobile-topspace-pre',hypothesisId:'H3',location:'ChessGame.tsx:useEffect(home-view)',message:`Home view mobile layout snapshot (${phase})`,data:(()=>{const home=document.querySelector('.game-stable-layout.home-view') as HTMLElement|null;const panel=document.querySelector('.game-mode-panel-streamlined') as HTMLElement|null;const btn=document.querySelector('.mode-selection-compact button') as HTMLElement|null;const cs=(el:HTMLElement|null)=>el?window.getComputedStyle(el):null;const rect=(el:HTMLElement|null)=>el?{top:Math.round(el.getBoundingClientRect().top),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}:null;const hcs=cs(home);const pcs=cs(panel);return{bodyClass:document.body.className,home:rect(home),panel:rect(panel),btn:rect(btn),homeStyles:hcs?{display:hcs.display,alignItems:(hcs as any).alignItems,justifyContent:(hcs as any).justifyContent,paddingTop:hcs.paddingTop,marginTop:hcs.marginTop}:null,panelStyles:pcs?{display:pcs.display,alignItems:(pcs as any).alignItems,justifyContent:(pcs as any).justifyContent,paddingTop:pcs.paddingTop,marginTop:pcs.marginTop}:null,scrollY:window.scrollY,innerH:window.innerHeight}})(),timestamp:Date.now()});
    };
    emit('immediate');
    requestAnimationFrame(() => emit('rAF'));
  }, [showGame, showDifficulty, showPieceSetSelector, isMobile]);
  // #endregion agent log

  // Initialize pieceImages immediately (not in useEffect) to ensure it's available on first render
  pieceImages = selectedPieceSet.pieceImages;

  // Update piece images when selected piece set changes
  useEffect(() => {
    pieceImages = selectedPieceSet.pieceImages;
  }, [selectedPieceSet]);
  
  // Update context when selected piece set changes
  const { setCurrentPieceSet } = useChessPieceSet();
  useEffect(() => {
    setCurrentPieceSet(selectedPieceSet);
  }, [selectedPieceSet, setCurrentPieceSet]);

  useEffect(() => {
    if (!showPieceSetSelector) return;
    if (!leaderboardWalletAddress) {
      setCollectionInventory(EMPTY_NFT_INVENTORY);
      setCollectionPerksError(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setIsLoadingCollectionPerks(true);
      setCollectionPerksError(null);
      try {
        const primary = await firebaseProfiles.getPrimaryWallet(leaderboardWalletAddress);
        let profile = await firebaseProfiles.getProfile(primary);
        if (!profile && primary !== leaderboardWalletAddress) {
          profile = await firebaseProfiles.getProfile(leaderboardWalletAddress);
        }

        let resolvedInventory = normalizeChessCollectionInventory(profile?.nft_inventory);

        // Safety fallback for stale profile inventory: verify Pixelawbs ownership directly.
        if (resolvedInventory.pixelawbs.length === 0) {
          try {
            const pixelawbsCheck = await checkPixelawbsNFTOwnership(leaderboardWalletAddress);
            if (pixelawbsCheck.hasPixelawbsNFT && pixelawbsCheck.balance > 0) {
              resolvedInventory = {
                ...resolvedInventory,
                pixelawbs: Array.from(
                  { length: pixelawbsCheck.balance },
                  (_, i) => `pixelawbs-fallback-${i}`,
                ),
              };
            }
          } catch (error) {
            console.warn('[CHESS_PERKS] Pixelawbs fallback check failed:', error);
          }
        }

        if (!cancelled) {
          setCollectionInventory(resolvedInventory);
        }
      } catch (error) {
        console.error('[CHESS_PERKS] Failed to load collection perks:', error);
        if (!cancelled) {
          setCollectionInventory(EMPTY_NFT_INVENTORY);
          setCollectionPerksError('Unable to load collection perks right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCollectionPerks(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showPieceSetSelector, leaderboardWalletAddress]);

  useEffect(() => {
    if (!showPieceSetSelector) return;
    if (!collectionPerks.unlockedPieceSetIds.includes(selectedPieceSet.id)) {
      setSelectedPieceSet(getDefaultPieceSet());
    }
  }, [showPieceSetSelector, collectionPerks.unlockedPieceSetIds, selectedPieceSet.id]);

  // Wallet is optional for AI play, but required if user wants leaderboard/profile tracking.
  useEffect(() => {
    if (!leaderboardWalletAddress) {
      setStatus('Select chess mode (connect wallet to save leaderboard/profile)');
      setShowGame(false);
      setShowDifficulty(false);
    } else {
      setStatus('Select chess mode');
    }
  }, [leaderboardWalletAddress]);

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

  useEffect(() => {
    if (difficulty !== 'hard') {
      setHardEngineHealth('idle');
      setHardFallbackCount(0);
    }
  }, [difficulty]);

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

  // Load leaderboard (single policy: 60s poll, pause when tab hidden, refresh on focus)
  useEffect(() => {
    void loadLeaderboard();
    const onVisible = () => {
      if (!document.hidden) void loadLeaderboard();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => {
      if (!document.hidden) void loadLeaderboard();
    }, 60000);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
    if (!leaderboardWalletAddress) {
      console.log('[DEBUG] No wallet address, returning');
      return;
    }

    try {
      console.log('[DEBUG] Updating score for address:', formatLeaderboardAddress(leaderboardWalletAddress));
      
      // Update leaderboard entry using Firebase
      const success = await updateLeaderboardEntry(leaderboardWalletAddress, gameResult);
      
      if (success) {
        console.log('[DEBUG] Successfully updated score for:', formatLeaderboardAddress(leaderboardWalletAddress));
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

  // Legal moves — chess.js only (matches Stockfish FEN orientation via lawbBoardToFen).
  const getLegalMoves = (from: { row: number; col: number }, boardState = board, player = currentPlayer): { row: number; col: number }[] => {
    const piece = boardState[from.row][from.col];
    if (!piece || getPieceColor(piece) !== player) return [];
    try {
      const tmp = new Chess();
      tmp.load(lawbBoardToFen(boardState, player));
      return lawbLegalMoveDestinations(tmp, from.row, from.col);
    } catch {
      return [];
    }
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
    addMobileDebug(`click r${row}c${col} cp=${currentPlayer} aiM=${isAIMovingRef.current} lastAI=${lastAIMoveRef.current}`);
    const logData = {row,col,gameState,isAIMovingRef:isAIMovingRef.current,gameMode,currentPlayer,isUpdatingBoard,apiCallInProgress:apiCallInProgressRef.current,lastAIMoveRef:lastAIMoveRef.current};
    console.log('[DEBUG] handleSquareClick entry', logData);
    // #region agent log
    debugIngest({location:'ChessGame.tsx:1007',message:'handleSquareClick entry',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    if (gameState !== 'active' || isAIMovingRef.current || playerMoveInProgressRef.current) {
      addMobileDebug(`BLOCKED: gs=${gameState} aiM=${isAIMovingRef.current} playerM=${playerMoveInProgressRef.current}`);
      console.log('[DEBUG] handleSquareClick BLOCKED: gameState or isAIMovingRef', {gameState,isAIMovingRef:isAIMovingRef.current});
      // #region agent log
      debugIngest({location:'ChessGame.tsx:1008',message:'handleSquareClick blocked: gameState or isAIMovingRef',data:{gameState,isAIMovingRef:isAIMovingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
      // #endregion
      return;
    }
    
    // CRITICAL FIX: In AI mode, player (blue) should only be able to move when it's their turn
    // Prevent player from clicking when it's AI's turn (red)
    if (gameMode === 'ai' && currentPlayer !== 'blue') {
      addMobileDebug(`BLOCKED: not blue turn cp=${currentPlayer}`);
      console.log('[DEBUG] handleSquareClick BLOCKED: currentPlayer not blue', {gameMode,currentPlayer});
      // #region agent log
      debugIngest({location:'ChessGame.tsx:1012',message:'handleSquareClick blocked: currentPlayer not blue',data:{gameMode,currentPlayer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
      // #endregion
      return;
    }
    
    const piece = board[row][col];
    const pieceColor = piece ? getPieceColor(piece) : null;
    
    // If a piece is selected and we click on a legal move
    if (selectedPiece && legalMoves.some(move => move.row === row && move.col === col)) {
      addMobileDebug(`MOVE ${selectedPiece.row}${selectedPiece.col}->${row}${col}`);
      playerMoveInProgressRef.current = true;
      makeMove(selectedPiece, { row, col });
      return;
    }
    
    // If we click on a piece of the current player
    if (piece && pieceColor === currentPlayer) {
      addMobileDebug(`SELECT r${row}c${col} ${piece}`);
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
      // If it's an AI move, automatically promote to queen without showing dialog
      if (isAIMove) {
        executeMove(from, to, 'Q', isAIMove);
        return;
      }
      // For player moves, show promotion dialog
      setPromotionMove({ from, to });
      setShowPromotion(true);
      return;
    }
    
    executeMove(from, to, 'q', isAIMove);
  };

  // Store makeMove in ref for AI worker access
  makeMoveRef.current = makeMove;

  // Move execution — chess.js mutates `chessRef` (single source of truth for rules).
  const executeMoveAfterAnimation = useCallback((from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q', isAIMove: boolean = false) => {
    setIsUpdatingBoard(true);
    const ch = chessRef.current;
    const piece = board[from.row][from.col];
    if (!piece) {
      addMobileDebug(`ERR: executeMove no piece at ${from.row}${from.col}`);
      playerMoveInProgressRef.current = false;
      setIsUpdatingBoard(false);
      return;
    }
    const needPromo =
      piece.toLowerCase() === 'p' &&
      ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7));
    const mv = tryMoveOnChess(ch, from, to, needPromo ? promotionPiece : undefined);
    if (!mv) {
      addMobileDebug('ERR: chess.js rejected move');
      playerMoveInProgressRef.current = false;
      setIsUpdatingBoard(false);
      return;
    }
    const newBoard = boardFromChess(ch);
    const moveNotation = mv.san;
    setMoveHistory((prev) => {
      const updated = [...prev, moveNotation];
      if (ENABLE_LICHESS_OPENING_EXPLORER && updated.length <= 10 && !isAIMove) {
        void getOpeningData(ch.fen()).then((data) => {
          if (data && data.moves && data.moves.length > 0) {
            setOpeningSuggestions(data.moves.slice(0, 3));
            setShowOpeningSuggestions(true);
            setTimeout(() => setShowOpeningSuggestions(false), 5000);
          }
        });
      }
      return updated;
    });
    setLastMove({ from, to });
    setSelectedPiece(null);
    setLegalMoves([]);

    const flagDataBefore = { isAIMove, isAIMovingRef: isAIMovingRef.current, lastAIMoveRef: lastAIMoveRef.current, apiCallInProgress: apiCallInProgressRef.current, isUpdatingBoard, currentPlayer };
    console.log('[DEBUG] executeMoveAfterAnimation before flag update', flagDataBefore);
    debugIngest({ location: 'ChessGame.tsx:1121', message: 'executeMoveAfterAnimation before flag update', data: flagDataBefore, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
    if (isAIMove) {
      lastAIMoveRef.current = true;
      isAIMovingRef.current = false;
      addMobileDebug(`AI MOVE done lastAI=T`);
      debugIngest({ location: 'ChessGame.tsx:1123', message: 'executeMoveAfterAnimation AI move flags set', data: { isAIMovingRef: isAIMovingRef.current, lastAIMoveRef: lastAIMoveRef.current }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
    } else {
      addMobileDebug(`PLAYER MOVE`);
      isAIMovingRef.current = false;
      lastAIMoveRef.current = false;
      playerMoveInProgressRef.current = false;
    }

    const doSwitch = () => {
      const next = chessTurnToUi(ch.turn());
      setCurrentPlayer(next);
      addMobileDebug(`setCP ->${next}`);
      debugIngest({ location: 'ChessGame.tsx:1137', message: 'setCurrentPlayer from chess', data: { next, isAIMove }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
      checkGameEndFromChessRef.current(ch);
      const now = Date.now();
      setLastMoveTime(now);
      setTimeoutCountdown(GAME_TIMEOUT_MS / 1000);
    };
    if (isAIMove) {
      flushSync(doSwitch);
    } else {
      doSwitch();
    }

    setBoard(newBoard);
    boardRef.current = newBoard;
    apiCallInProgressRef.current = false;
    setIsUpdatingBoard(false);

    if (vsClawbInviteCode && difficulty === 'hard') {
      firebaseChess
        .updateGame(vsClawbInviteCode, {
          board: { positions: boardToPositions(newBoard), rows: 8, cols: 8 },
          current_player: chessTurnToUi(ch.turn()),
          last_move: { from: { row: from.row, col: from.col }, to: { row: to.row, col: to.col } },
          last_move_timestamp: Date.now(),
        })
        .catch((err: any) => console.warn('[VS-CLAWB] Firebase sync failed:', err));
    }
    debugIngest({ location: 'ChessGame.tsx:1157', message: 'executeMoveAfterAnimation end', data: { isAIMove }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' });
  }, [board, currentPlayer, getOpeningData, addMobileDebug, vsClawbInviteCode, difficulty]);

  // Reset lastAIMoveRef when it becomes player's turn (blue)
  // This ensures the flag is cleared after the state updates from AI move
  useEffect(() => {
    addMobileDebug(`lastAI effect cp=${currentPlayer} lastAI=${lastAIMoveRef.current}`);
    const resetData = {gameMode,currentPlayer,lastAIMoveRef:lastAIMoveRef.current,isAIMovingRef:isAIMovingRef.current};
    console.log('[DEBUG] lastAIMoveRef reset useEffect', resetData);
    // #region agent log
    debugIngest({location:'ChessGame.tsx:1162',message:'lastAIMoveRef reset useEffect',data:resetData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
    // #endregion
    if (gameMode === 'ai' && currentPlayer === 'blue' && lastAIMoveRef.current) {
      addMobileDebug(`lastAI RESET->false (blue turn)`);
      // Player's turn now - reset the flag that was blocking double AI moves
      lastAIMoveRef.current = false;
      console.log('[DEBUG] lastAIMoveRef reset to false', {lastAIMoveRef:lastAIMoveRef.current});
      // #region agent log
      debugIngest({location:'ChessGame.tsx:1165',message:'lastAIMoveRef reset to false',data:{lastAIMoveRef:lastAIMoveRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
      // #endregion
    }
    // RECOVERY: Stuck state - AI moved (lastAIMoveRef true) but setCurrentPlayer never committed
    // Force turn to blue so player can move. Do NOT reset lastAIMoveRef here - the AI effect
    // runs in the same pass and would see lastAI=false + cp=red and start another move.
    // The normal block above will reset lastAIMoveRef once currentPlayer commits to blue.
    if (gameMode === 'ai' && currentPlayer === 'red' && lastAIMoveRef.current && !isAIMovingRef.current && !apiCallInProgressRef.current) {
      addMobileDebug(`RECOVERY: forcing cp=blue (stuck state)`);
      setCurrentPlayer('blue');
    }
  }, [currentPlayer, gameMode, addMobileDebug]);

  // AI move effect - trigger AI move when it's red's turn
  useEffect(() => {
    addMobileDebug(`AI effect cp=${currentPlayer} lastAI=${lastAIMoveRef.current} aiM=${isAIMovingRef.current}`);
    const aiEffectData = {isAIMovingRef:isAIMovingRef.current,gameMode,currentPlayer,lastAIMoveRef:lastAIMoveRef.current,isUpdatingBoard,apiCallInProgress:apiCallInProgressRef.current};
    console.log('[DEBUG] AI useEffect triggered', aiEffectData);
    // #region agent log
    debugIngest({location:'ChessGame.tsx:1170',message:'AI useEffect triggered',data:aiEffectData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion
    // CRITICAL: Check lastAIMoveRef to prevent double moves
    // When AI moves, setCurrentPlayer is async. The useEffect might run again before
    // currentPlayer updates from 'red' to 'blue'. lastAIMoveRef blocks this.
    if (!isAIMovingRef.current && gameMode === 'ai' && currentPlayer === 'red' && !lastAIMoveRef.current && !isUpdatingBoard) {
      const profile = getSinglePlayerDifficultyProfile(difficulty);
      addMobileDebug(`AI START move (${profile.label})`);
      isAIMovingRef.current = true;
      console.log('[DEBUG] AI useEffect starting AI move', {difficulty,isAIMovingRef:isAIMovingRef.current});
      // #region agent log
      debugIngest({location:'ChessGame.tsx:1175',message:'AI useEffect starting AI move',data:{difficulty,isAIMovingRef:isAIMovingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      const runAIMove = async () => {
        const isHardMode = difficulty === 'hard';
        let didExecuteMove = false;
        try {
          if (isHardMode) {
            const now = Date.now();
            if (now < hardAICooldownUntilRef.current) {
              isAIMovingRef.current = false;
              return;
            }
            if (apiCallInProgressRef.current) {
              isAIMovingRef.current = false;
              return;
            }
            apiCallInProgressRef.current = true;
            setStatus('Hard mode engine thinking...');
            setHardEngineHealth('thinking');
          } else {
            setStatus('Easy Mode thinking...');
          }

          const decision = await chooseSinglePlayerAIMove({
            chess: chessRef.current,
            difficulty,
            requestEngineMove: getCloudflareStockfishMove,
          });

          setStatus(decision.statusMessage);
          hardAICooldownUntilRef.current = decision.cooldownUntilMs;
          if (isHardMode) {
            if (decision.source === 'stockfish') {
              setHardEngineHealth('healthy');
            } else if (decision.source === 'hard-fallback') {
              setHardEngineHealth('degraded');
              setHardFallbackCount((prev) => prev + 1);
            } else {
              setHardEngineHealth('offline');
            }
          }

          if (decision.move) {
            didExecuteMove = true;
            executeMove(
              decision.move.from,
              decision.move.to,
              (decision.move.promotion || 'q').toLowerCase(),
              true,
            );
            return;
          }

          isAIMovingRef.current = false;
        } catch (error) {
          addMobileDebug(`ERR: AI move ${(error as Error)?.message?.slice(0, 30) || 'unknown'}`);
          console.error('[AI] Single-player move failure:', error);
          setStatus('AI move failed. Please try again.');
          if (isHardMode) setHardEngineHealth('offline');
          isAIMovingRef.current = false;
        } finally {
          if (isHardMode && !didExecuteMove) {
            apiCallInProgressRef.current = false;
          }
        }
      };

      if (profile.thinkDelayMs > 0) {
        window.setTimeout(() => {
          void runAIMove();
        }, profile.thinkDelayMs);
      } else {
        void runAIMove();
      }
    }
  }, [currentPlayer, gameMode, difficulty, isUpdatingBoard, getCloudflareStockfishMove, addMobileDebug]);

  // Game control functions
  const resetGame = () => {
    // Clean up vs Clawb Firebase game if it was active but not finished
    if (vsClawbInviteCode && gameState === 'active') {
      firebaseChess.updateGame(vsClawbInviteCode, {
        game_state: 'cancelled',
      }).catch(() => {});
    }
    setVsClawbInviteCode(null);
    chessRef.current = new Chess();
    setBoard(boardFromChess(chessRef.current));
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
    setHardEngineHealth('idle');
    setHardFallbackCount(0);
  };

  // Update startAIGame to show difficulty selection instead of starting the game immediately
  const startAIGame = () => {
    setShowPieceSetSelector(true);
  };

  const startMultiplayerGame = () => {
    setShowGame(true);
    setStatus('Set wager and create/join match');
  };

  // Fetch random AI NFT for profile picture
  const fetchRandomAINFT = useCallback(async () => {
    if (loadingAiPic) return; // Prevent multiple simultaneous fetches
    setLoadingAiPic(true);
    try {
      const preferredCollections = AI_NFT_COLLECTIONS.filter((collection) =>
        collectionPerks.preferredAiCollectionIds.includes(collection.id),
      );
      const aiCollectionPool = preferredCollections.length > 0 ? preferredCollections : AI_NFT_COLLECTIONS;
      const randomCollection = aiCollectionPool[Math.floor(Math.random() * aiCollectionPool.length)];
      console.log('[AI_PROFILE] Fetching random NFT from collection:', randomCollection);
      
      let nfts;
      if (randomCollection.api === 'opensea') {
        console.log('[AI_PROFILE] Using OpenSea API for:', randomCollection.slug);
        const resp = await getOpenSeaNFTs(randomCollection.slug, 50, undefined, randomCollection.chain as 'ethereum' | 'base');
        nfts = resp.data;
        console.log('[AI_PROFILE] OpenSea response:', resp);
      } else {
        console.log('[AI_PROFILE] Using Scatter API for:', randomCollection.slug);
        const resp = await getCollectionNFTs(randomCollection.slug, 1, 50);
        nfts = resp.data;
        console.log('[AI_PROFILE] Scatter response:', resp);
      }
      
      if (nfts && nfts.length > 0) {
        const randomNft = nfts[Math.floor(Math.random() * nfts.length)];
        const rawImageUrl = randomNft.image || randomNft.image_url || randomNft.image_url_shrunk;
        const imageUrl = typeof rawImageUrl === 'string' ? ipfsToHttp(rawImageUrl) : '';
        console.log('[AI_PROFILE] Selected NFT:', randomNft);
        console.log('[AI_PROFILE] Image URL:', imageUrl);
        setAiProfilePic(imageUrl);
      } else {
        console.log('[AI_PROFILE] No NFTs found in collection');
      }
    } catch (err) {
      console.error('[AI_PROFILE] Error fetching NFTs:', err);
    } finally {
      setLoadingAiPic(false);
    }
  }, [collectionPerks.preferredAiCollectionIds, loadingAiPic]);

  // Fetch player profile picture when game starts in AI mode
  useEffect(() => {
    if (leaderboardWalletAddress && gameMode === GameMode.AI && showGame && gameState === 'active') {
      void (async () => {
        try {
          const primary = await firebaseProfiles.getPrimaryWallet(leaderboardWalletAddress);
          let profile = await firebaseProfiles.getProfile(primary);
          if (!profile?.profile_picture?.image_url && primary !== leaderboardWalletAddress) {
            profile = await firebaseProfiles.getProfile(leaderboardWalletAddress);
          }
          if (profile?.profile_picture?.image_url) {
            const normalizedProfileImage = ipfsToHttp(profile.profile_picture.image_url);
            setPlayerProfilePic(normalizedProfileImage);
            console.log('[PROFILE] Loaded player profile picture:', normalizedProfileImage);
          } else {
            setPlayerProfilePic(null);
          }
        } catch (err) {
          console.error('[PROFILE] Error fetching player profile:', err);
          setPlayerProfilePic(null);
        }
      })();
    } else {
      setPlayerProfilePic(null);
    }
  }, [leaderboardWalletAddress, gameMode, showGame, gameState]);

  // Fetch random AI NFT when game starts in AI mode
  useEffect(() => {
    if (gameMode === GameMode.AI && showGame && gameState === 'active' && !aiProfilePic && !loadingAiPic) {
      fetchRandomAINFT();
    }
  }, [gameMode, showGame, gameState, aiProfilePic, loadingAiPic, fetchRandomAINFT]);

  const startGame = () => {
    playStartSound();
    console.log('[DEBUG] startGame called, difficulty:', difficulty, 'gameMode:', gameMode);

    if (gameMode === 'online') {
      // Wallet connection is only required for online/PvP flows.
      if (!isConnected || !walletAddress) {
        setStatus('Connect wallet to play PvP');
        void open({ view: 'Connect' });
        return;
      }
      // For multiplayer, we'll show the multiplayer component instead
      setShowGame(false);
      setShowDifficulty(false);
      setShowPieceSetSelector(false);
      return;
    }
    
    setShowGame(true);
    setShowDifficulty(false);
    setShowPieceSetSelector(false);
    chessRef.current = new Chess();
    setBoard(boardFromChess(chessRef.current));
    setCurrentPlayer('blue');
    setGameState('active');
    setStatus(`Match started! Your turn`);
    setMobileDebugLog([]);
    mobileDebugSeqRef.current = 0;
    addMobileDebug(`GAME START AI ${difficulty}`);
    const newChessboard = selectRandomChessboard();
    setSelectedChessboard(newChessboard);
    console.log('[DEBUG] Match started with chessboard:', newChessboard);
    // Start timer when game starts
    const now = Date.now();
    setLastMoveTime(now);
    setGameStartTime(now); // Track game start time for stats
    setTimeoutCountdown(GAME_TIMEOUT_MS / 1000); // Initialize countdown to full time
    console.log('[TIMER] Game started, setting lastMoveTime to:', now, 'initial countdown:', GAME_TIMEOUT_MS / 1000);
    setHardEngineHealth(difficulty === 'hard' ? (stockfishStatus === 'ready' ? 'healthy' : 'idle') : 'idle');
    setHardFallbackCount(0);
    
    // Create Firebase game for "vs Clawb" mode so Clawb is tracked as a player
    if (difficulty === 'hard' && leaderboardWalletAddress) {
      const inviteCode = generateVsClawbInviteCode();
      setVsClawbInviteCode(inviteCode);
      console.log('[VS-CLAWB] Creating Firebase game:', inviteCode);
      firebaseChess.createGame({
        invite_code: inviteCode,
        game_title: `vs Clawb — ${inviteCode.slice(-6)}`,
        game_type: 'vs_clawb',
        game_state: 'active',
        blue_player: leaderboardWalletAddress,
        red_player: CLAWB_WALLET,
        red_is_agent: true,
        board: {
          positions: boardToPositions(JSON.parse(JSON.stringify(initialBoard))),
          rows: 8,
          cols: 8,
        },
        current_player: 'blue',
        is_public: false,
      }).catch((err: any) => console.error('[VS-CLAWB] Failed to create Firebase game:', err));
    }
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

  // Multiplayer functionality moved to ChessMultiplayer component

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPieceHoverLabel = (piece: string | null): string | null => {
    if (!piece) return null;
    const code = piece.toLowerCase();
    const color = piece === piece.toLowerCase() ? 'Blue' : 'Red';
    const nameMap: Record<string, string> = {
      k: 'King',
      q: 'Queen',
      r: 'Rook',
      b: 'Bishop',
      n: 'Knight',
      p: 'Pawn',
    };
    const pieceName = nameMap[code];
    return pieceName ? `${color} ${pieceName}` : null;
  };

  const getHardEngineIndicator = () => {
    if (difficulty !== 'hard' || gameMode !== GameMode.AI) return null;
    if (stockfishStatus === 'failed') {
      return {
        label: 'Engine Offline',
        dotColor: '#ff8c8c',
        glow: 'rgba(255, 103, 103, 0.7)',
      };
    }
    if (hardEngineHealth === 'thinking') {
      return {
        label: 'Engine Thinking',
        dotColor: '#f4d27a',
        glow: 'rgba(244, 210, 122, 0.72)',
      };
    }
    if (hardEngineHealth === 'degraded') {
      return {
        label: `Engine Fallback x${hardFallbackCount}`,
        dotColor: '#ffd08a',
        glow: 'rgba(255, 181, 71, 0.7)',
      };
    }
    if (hardEngineHealth === 'offline') {
      return {
        label: 'Engine Recovering',
        dotColor: '#ff9aa0',
        glow: 'rgba(255, 110, 128, 0.7)',
      };
    }
    return {
      label: 'Engine Ready',
      dotColor: '#83efae',
      glow: 'rgba(93, 255, 161, 0.72)',
    };
  };

  // Render functions
  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const pieceHoverLabel = getPieceHoverLabel(piece);
    const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
    const isLegalMove = legalMoves.some(move => move.row === row && move.col === col);
    const isLastMove = lastMove && (lastMove.from.row === row && lastMove.from.col === col || 
                                   lastMove.to.row === row && lastMove.to.col === col);
    
    // Debug: log if piece exists but no image
    if (piece && !pieceImages[piece]) {
      console.warn('[PIECE RENDER] Piece exists but no image:', piece, 'pieceImages keys:', Object.keys(pieceImages));
    }

    const pieceImageUrl = piece && pieceImages[piece] ? pieceImages[piece] : null;

  return (
      <div
        key={`${row}-${col}`}
        className={`square ${isSelected ? 'selected' : ''} ${isLegalMove ? 'legal-move' : ''} ${isLastMove ? 'last-move' : ''}`}
        onClick={() => handleSquareClick(row, col)}
        onMouseEnter={() => {
          if (showPieceHoverLabels && pieceHoverLabel) setHoveredPieceLabel(pieceHoverLabel);
        }}
        onMouseLeave={() => {
          if (hoveredPieceLabel) setHoveredPieceLabel(null);
        }}
        title={showPieceHoverLabels && pieceHoverLabel ? pieceHoverLabel : undefined}
        style={isMobile ? { touchAction: 'manipulation' } : undefined}
      >
        {piece && pieceImageUrl && (
          <img
            src={pieceImageUrl}
            alt={piece}
            className="piece"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 10,
              pointerEvents: 'none',
              margin: 0,
              padding: 0
            }}
            onError={(e) => {
              console.error('[PIECE IMAGE ERROR] Failed to load:', pieceImageUrl, 'for piece:', piece);
            }}
          />
        )}
        {isLegalMove && <div className="legal-move-indicator" />}
        {captureAnimation?.show && captureAnimation.row === row && captureAnimation.col === col && (
          // Rendered inside the square itself so it can only ever appear on the capture square
          <div className="capture-animation" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
            <img src="/images/capture.gif" alt="capture" style={{ width: '100%', height: '100%' }} />
          </div>
        )}
      </div>
    );
  };

  const renderPromotionDialog = () => {
    if (!showPromotion || !promotionMove) return null;
    
    const pieces = currentPlayer === 'blue' ? ['q', 'r', 'b', 'n'] : ['Q', 'R', 'B', 'N'];
    const pieceLabelByType: Record<string, string> = {
      q: 'Queen',
      r: 'Rook',
      b: 'Bishop',
      n: 'Knight',
    };
    
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
                  cursor: 'pointer',
                  padding: isMobile ? '8px' : '10px',
                  border: '2px solid white',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minWidth: isMobile ? '60px' : 'auto',
                  minHeight: isMobile ? '60px' : 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '4px' : '6px',
                }}
                aria-label={`Promote pawn to ${pieceLabelByType[piece.toLowerCase()] || piece}`}
              >
                <img 
                  src={pieceImages[piece]} 
                  alt={piece} 
                  style={{ 
                    width: isMobile ? '32px' : '40px', 
                    height: isMobile ? '32px' : '40px',
                    pointerEvents: 'none'
                  }} 
                  onError={(e) => {
                    console.error('[PROMOTION] Failed to load piece image:', pieceImages[piece], 'for piece:', piece);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span
                  style={{
                    color: '#fff',
                    fontSize: isMobile ? '10px' : '11px',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    textAlign: 'center',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  }}
                >
                  {pieceLabelByType[piece.toLowerCase()] || piece.toUpperCase()}
                </span>
              </div>
            ))}
        </div>
      </div>
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

    const availablePieceSets = CHESS_PIECE_SETS.filter((pieceSet) =>
      collectionPerks.unlockedPieceSetIds.includes(pieceSet.id),
    );
    const lockedPieceSets = CHESS_PIECE_SETS.filter(
      (pieceSet) => !collectionPerks.unlockedPieceSetIds.includes(pieceSet.id),
    );

    return (
      <div className="piece-set-selection-row" style={{ justifyContent: 'center' }}>
        <div className="piece-set-controls-col">
          <div className="piece-set-selection-panel single-setup-panel">
            <h2 className="single-setup-title">Single Player Setup</h2>
            <p className="single-setup-subtitle">
              {isMobile ? 'Pick your set and difficulty, then start.' : 'Pick your chess set, choose difficulty, and start your match.'}
            </p>

            <div className="single-setup-perks">
              <div className="single-setup-perks-title">Chess Title: {collectionPerks.playerTitle}</div>
              {!isMobile && (
                <div>
                  Collection score: {collectionPerks.weightedHoldingsScore} | Total NFTs tracked: {collectionPerks.totalNfts}
                </div>
              )}
              {isLoadingCollectionPerks && (
                <div className="single-setup-perks-note">Syncing collection perks...</div>
              )}
              {collectionPerksError && (
                <div className="single-setup-perks-error">{collectionPerksError}</div>
              )}
            </div>

            <div className="single-setup-block">
              <h3>Select Chess Set</h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', minWidth: '220px', width: '100%', maxWidth: '320px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPieceSetDropdown(!showPieceSetDropdown)}
                    className="single-setup-dropdown-btn"
                  >
                    {getPieceSetDisplayName(selectedPieceSet.id)}
                    <span style={{ float: 'right' }}>{showPieceSetDropdown ? '▲' : '▼'}</span>
                  </button>

                  {showPieceSetDropdown && (
                    <div className="single-setup-dropdown-menu">
                      {availablePieceSets.map((pieceSet) => (
                        <div
                          key={pieceSet.id}
                          onClick={() => handlePieceSetSelect(pieceSet)}
                          className="single-setup-dropdown-item"
                        >
                          {getPieceSetDisplayName(pieceSet.id)}
                        </div>
                      ))}
                      {lockedPieceSets.map((pieceSet) => (
                        <div
                          key={`locked-${pieceSet.id}`}
                          className="single-setup-dropdown-item locked"
                        >
                          {getPieceSetDisplayName(pieceSet.id)} (NFT Required)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="single-setup-block">
              <h3>Select Difficulty</h3>
              <div className="single-setup-difficulty-row">
                <button
                  className={`single-setup-difficulty-btn ${difficulty === 'easy' ? 'selected' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy Mode
                </button>
                <button
                  className={`single-setup-difficulty-btn ${difficulty === 'hard' ? 'selected' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard Mode
                </button>
              </div>
            </div>

            <div className={`single-setup-actions ${isMobile ? 'single-setup-actions-mobile' : ''}`}>
              <button className="single-setup-start-btn" onClick={() => { startGame(); }}>
                Start Match
              </button>
              <button className="single-setup-back-btn" onClick={() => { setShowPieceSetSelector(false); }}>
                Back to Chess Home
              </button>
              <button className="single-setup-howto-btn" onClick={openHowToGuide}>
                How To + Piece Key
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
        <div className="difficulty-selection-panel" style={{background:'rgba(0, 0, 0, 0.8)',borderRadius:0,padding: isMobile ? '8px 12px' : '32px 24px',paddingTop: isMobile ? '4px' : undefined,marginTop: isMobile ? '0' : undefined,boxShadow:'0 0 20px rgba(255, 0, 0, 0.5)',textAlign:'center',border:'2px solid #ff0000'}}>
          <h2 style={{fontWeight:700,letterSpacing:1,fontSize: isMobile ? '1.5rem' : '2rem',color:'#ffffff',marginBottom: isMobile ? '8px' : 16,marginTop: isMobile ? '0' : undefined,textShadow:'0 0 10px #ff0000, 0 0 5px #ff0000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Select Difficulty</h2>
          <p style={{fontSize:'1.1rem',color:'#ffffff',marginBottom:24,textShadow:'0 0 8px #ff0000, 0 0 4px #ff0000, 1px 1px 2px rgba(0,0,0,0.8)'}}>Compete against the computer to climb the leaderboard.</p>
          <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:24}}>
            <button
              className={`difficulty-btn${difficulty === 'easy' ? ' selected' : ''}`}
              style={{background:difficulty==='easy'?'#ff0000':'transparent',color:difficulty==='easy'?'#fff':'#ff0000',fontWeight:'bold',fontSize:'1.1em',padding:'12px 32px',borderRadius:0,border:'1px solid #ff0000',cursor:'pointer',letterSpacing:1,boxShadow:difficulty==='easy'?'0 0 6px #ff0000, 0 0 2px #ff0000':'none'}}
              onClick={()=>setDifficulty('easy')}
            >Easy Mode</button>
            <button
              className={`difficulty-btn${difficulty === 'hard' ? ' selected' : ''}`}
              style={{background:difficulty==='hard'?'#ff0000':'transparent',color:difficulty==='hard'?'#fff':'#ff0000',fontWeight:'bold',fontSize:'1.1em',padding:'12px 32px',borderRadius:0,border:'1px solid #ff0000',cursor:'pointer',letterSpacing:1,boxShadow:difficulty==='hard'?'0 0 6px #ff0000, 0 0 2px #ff0000':'none'}}
              onClick={()=>setDifficulty('hard')}
            >Hard Mode</button>
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
          <div style={{marginTop: '16px', display: 'flex', justifyContent: 'center', width: 'auto', maxWidth: '100%'}}>
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
                letterSpacing: 1,
                width: 'auto',
                maxWidth: 'none',
                whiteSpace: 'nowrap'
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
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [defeatDelayActive, setDefeatDelayActive] = useState(false);

  const handleVsClawbGameEnd = (winner: 'blue' | 'red' | 'draw', endReason: string) => {
    if (difficulty !== 'hard') return;
    const clawbResult = winner === 'red' ? 'win' : winner === 'blue' ? 'loss' : 'draw';
    void updateLeaderboardEntry(CLAWB_WALLET, clawbResult as 'win' | 'loss' | 'draw');
    console.log('[VS-CLAWB] Updated Clawb leaderboard:', clawbResult);
    if (vsClawbInviteCode) {
      firebaseChess
        .updateGame(vsClawbInviteCode, {
          game_state: 'finished',
          winner,
          end_reason: endReason,
        })
        .catch((err: any) => console.warn('[VS-CLAWB] Firebase game end update failed:', err));
    }
  };

  checkGameEndFromChessRef.current = (chess: Chess): 'checkmate' | 'stalemate' | 'draw' | null => {
    if (chess.isCheckmate()) {
      const loser = chess.turn() === 'w' ? 'blue' : 'red';
      const winner = loser === 'blue' ? 'red' : 'blue';
      console.log('[GAME END] CHECKMATE', { loser, winner });
      setGameState('checkmate');
      const isPlayerWin = winner === 'blue';
      if (isPlayerWin) {
        setStatus(`Checkmate! You win!`);
        playSound('victory');
        setShowVictory(true);
        setVictoryCelebration(true);
        triggerVictoryCelebration();
        void updateScore('win');
        handleVsClawbGameEnd('blue', 'checkmate');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      } else {
        setStatus(`Checkmate! ${winner === 'red' ? (difficulty === 'hard' ? 'Hard AI' : 'AI') : 'Opponent'} wins!`);
        playSound('loser');
        setDefeatDelayActive(true);
        setTimeout(() => {
          setShowDefeat(true);
          setDefeatDelayActive(false);
        }, 3000);
        void updateScore('loss');
        handleVsClawbGameEnd('red', 'checkmate');
        setShowLeaderboardUpdated(true);
        setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      }
      return 'checkmate';
    }
    if (chess.isStalemate() || chess.isDraw()) {
      console.log('[GAME END] DRAW', { stalemate: chess.isStalemate(), draw: chess.isDraw() });
      setGameState('stalemate');
      setStatus('Draw.');
      void updateScore('draw');
      handleVsClawbGameEnd('draw', chess.isStalemate() ? 'stalemate' : 'draw');
      setShowLeaderboardUpdated(true);
      setTimeout(() => setShowLeaderboardUpdated(false), 3000);
      return chess.isStalemate() ? 'stalemate' : 'draw';
    }
    const side = chessTurnToUi(chess.turn());
    if (chess.isCheck()) {
      playSound('check');
      setStatus(`${side === 'blue' ? 'You' : difficulty === 'hard' ? 'Hard AI' : 'AI'} are in check!`);
    } else {
      setStatus(side === 'blue' ? 'Your turn' : `${difficulty === 'hard' ? 'Hard AI' : 'AI'} thinking…`);
    }
    return null;
  };

  // Helper to clear victory/defeat overlays
  const clearCelebration = () => {
    setShowVictory(false);
    setShowDefeat(false);
    setDefeatDelayActive(false);
    setGameStartTime(null);
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

  // Calculate game stats for defeat screen
  const getGameStats = () => {
    if (!gameStartTime) return null;
    
    const gameDuration = Date.now() - gameStartTime;
    const minutes = Math.floor(gameDuration / 60000);
    const seconds = Math.floor((gameDuration % 60000) / 1000);
    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Get player names
    const playerName = leaderboardWalletAddress ? `${leaderboardWalletAddress.slice(0, 6)}...${leaderboardWalletAddress.slice(-4)}` : 'Player';
    const opponentName = gameMode === GameMode.AI 
      ? (difficulty === 'easy' ? 'Easy Mode' : 'Hard Mode')
      : 'Opponent';
    
    // Determine winner (the one who didn't lose - red wins when blue loses)
    const winner = currentPlayer === 'blue' ? 'red' : 'blue';
    const winnerName = winner === 'blue' ? playerName : opponentName;
    const winnerProfilePic = winner === 'blue' ? playerProfilePic : aiProfilePic;
    
    return {
      playerName,
      opponentName,
      winnerName,
      winnerProfilePic,
      winnerColor: winner,
      moves: moveHistory,
      duration: durationText,
      wager: isOnline ? wager : null
    };
  };

  // Desktop menu and window state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState<Set<'leaderboard' | 'chat' | 'moves' | 'profile' | 'howto'>>(new Set());
  
  // Window positions and sizes (for draggable windows)
  const [windowPositions, setWindowPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  
  // Helper functions for window management
  const openWindow = (windowType: 'leaderboard' | 'chat' | 'moves' | 'profile' | 'howto') => {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[OPEN WINDOW] Opening window:', windowType, 'isMobile:', isMobile);
    }
    setIsMenuOpen(false);
    
    // On mobile, use sidebar view instead of popup windows
    if (isMobile) {
      setSidebarView(windowType);
      setIsSidebarOpen(true);
      return;
    }
    
      // Set default position if not set - position windows to avoid covering chessboard
      // Calculate position BEFORE opening window to ensure it's available on first render
      if (!windowPositions[windowType]) {
        const windowWidth =
          windowType === 'moves' ? 300 :
          windowType === 'profile' ? 400 :
          windowType === 'howto' ? 420 : 400;
        const windowHeight =
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
  
  const closeWindow = (windowType: 'leaderboard' | 'chat' | 'moves' | 'profile' | 'howto') => {
    setOpenWindows(prev => {
      const newSet = new Set(prev);
      newSet.delete(windowType);
      return newSet;
    });
  };

  // Expose menu toggle and window functions to parent/global scope
  useEffect(() => {
    if (onMenuToggle) {
      // Store the toggle function so parent can call it
      (window as any).__chessMenuToggle = () => setIsMenuOpen(prev => !prev);
    }
    // Expose window functions for Linux menu
    (window as any).__chessOpenWindow = openWindow;
    (window as any).__chessOpenLeaderboard = () => openWindow('leaderboard');
    (window as any).__chessOpenMoves = () => openWindow('moves');
    (window as any).__chessOpenChat = () => openWindow('chat');
    (window as any).__chessOpenProfile = () => openWindow('profile');
    (window as any).__chessOpenHowTo = () => openWindow('howto');
    return () => {
      delete (window as any).__chessOpenWindow;
      delete (window as any).__chessOpenLeaderboard;
      delete (window as any).__chessOpenMoves;
      delete (window as any).__chessOpenChat;
      delete (window as any).__chessOpenProfile;
      delete (window as any).__chessOpenHowTo;
    };
  }, [onMenuToggle, openWindow]);

  const openHowToGuide = useCallback(() => {
    if (isMobile) {
      setSidebarView('howto');
      setIsSidebarOpen(false);
    } else {
      openWindow('howto');
    }
  }, [isMobile, openWindow]);
  
  // Mobile sidebar state (unchanged)
  const [sidebarView, setSidebarView] = useState<'leaderboard' | 'moves' | 'chat' | 'profile' | 'howto' | null>(isMobile ? null : null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lawbster Chess School (interactive tutorial) overlay
  const [showTutorial, setShowTutorial] = useState(false);

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

  if (isOnline) {
    return (
      <ChessMultiplayer 
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
      <div className={`chess-game ${isMobile ? 'mobile mobile-device' : 'desktop'}`}>
        {showTutorial && (
          <ChessTutorial
            onClose={() => setShowTutorial(false)}
            onPlayClawb={() => {
              setShowTutorial(false);
              setGameMode('ai');
              setDifficulty('easy');
              setShowPieceSetSelector(true);
            }}
          />
        )}
        <div className={`game-stable-layout home-view ${isMobile ? 'mobile' : 'desktop'}`}>
          {/* Desktop sidebar removed - using menu popup and windows instead */}
          <div className="center-area">
          </div>
          <div className={`game-mode-panel-streamlined ${isMobile ? 'mobile-pregame-panel' : ''}`}>
            {/* Status Display and Network Switching - Visible on mobile with compact styling */}
            <div className="home-status-card" style={{ 
              textAlign: 'center', 
              marginBottom: isMobile ? '4px' : '20px',
              marginTop: isMobile ? '0px' : '0px',
              padding: isMobile ? '4px 8px' : '10px',
              backgroundColor: '#000000',
              border: '2px outset #fff',
              borderRadius: '4px',
              display: 'block', /* Always visible */
              fontSize: isMobile ? '11px' : '14px',
              lineHeight: isMobile ? '1.2' : 'normal'
            }}>
              <div className="home-status-text" style={{ 
                color: '#ff0000', 
                fontSize: isMobile ? '11px' : '14px', 
                fontWeight: 'bold',
                marginBottom: isMobile ? '4px' : '10px',
                lineHeight: isMobile ? '1.2' : 'normal'
              }}>
                {status}
              </div>
              {showGame && gameState === 'active' && gameMode === 'ai' && timeoutCountdown > 0 && (
                <div className={`timer-display ${timeoutCountdown < 60 ? 'timer-warning' : ''} ${timeoutCountdown < 15 ? 'timer-critical' : ''}`} style={{
                  color: timeoutCountdown < 15 ? '#ff0000' : timeoutCountdown < 60 ? '#ff8800' : '#000080',
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

            {isMobile ? (
              <div className="setup-quick-guide setup-quick-guide-mobile">
                <p>Choose mode, then continue to setup. PvP opens the Base wager lobby.</p>
                <button
                  type="button"
                  className="setup-guide-btn"
                  onClick={() => setShowTutorial(true)}
                >
                  🎓 Learn Chess
                </button>
                <button
                  type="button"
                  className="setup-guide-btn"
                  onClick={openHowToGuide}
                >
                  How To + Piece Key
                </button>
              </div>
            ) : (
              <div className="setup-quick-guide">
                <div className="setup-quick-guide-header">
                  <h3>Lawb Chess Beta 3000 Setup</h3>
                  <button
                    type="button"
                    className="setup-guide-btn"
                    onClick={() => setShowTutorial(true)}
                  >
                    🎓 Learn Chess
                  </button>
                  <button
                    type="button"
                    className="setup-guide-btn"
                    onClick={openHowToGuide}
                  >
                    Open Full How To
                  </button>
                </div>
                <p>Play VS AI immediately, or switch to PvP for Base chain wager matches.</p>
              </div>
            )}
            
            <div className={`mode-selection-compact ${isMobile ? 'mobile-stack' : ''}`}>
              <button 
                className={`mode-btn-compact chess-primary-btn ${gameMode === 'ai' ? 'selected' : ''}`}
                onClick={() => setGameMode('ai')}
              >
                VS AI
              </button>
              <button 
                className={`mode-btn-compact chess-primary-btn ${isOnline ? 'selected' : ''}`}
                onClick={() => setGameMode('online')}
              >
                PvP
              </button>
            </div>
            {gameMode === GameMode.AI && (
              <button className="start-btn-compact chess-primary-btn" onClick={() => {
                // Show unified setup screen
                setShowPieceSetSelector(true);
              }}>
                Start Match
              </button>
            )}
            {isOnline && (
              <div className="pvp-info">
                {isMobile ? (
                  <p>Base-only PvP wager lobby.</p>
                ) : (
                  <>
                    <p>Base-only PvP wager lobby</p>
                    <p>Create or join token matches on Base mainnet</p>
                  </>
                )}
              </div>
            )}
            {!isMobile && (
              <>
                <div className="help-section-compact visible-howto-panel">
                  <HowToContent onStartTutorial={() => setShowTutorial(true)} />
                </div>
                {/* Chessboards GIF */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '8px',
                  marginBottom: '20px',
                  paddingBottom: '0px'
                }}>
                  <img
                    src="/images/chessboards.gif"
                    alt="Chessboards Animation"
                    style={{
                      maxWidth: '60%',
                      width: '60%',
                      height: 'auto',
                      borderRadius: '0px',
                      boxShadow: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}
            {/* Sidebar toggle buttons removed - use menu button instead */}
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
                <div onClick={(e) => e.stopPropagation()}>
                  <ThemeToggle asMenuItem={true} />
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
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
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

        {/* Menu Popup - Home View (Desktop Only) */}
        {!isMobile && isMenuOpen && !showGame && (
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
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div 
            className="chess-menu-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '60px',
              right: '20px',
              background: '#c0c0c0',
              border: '2px outset #fff',
              padding: '10px',
              minWidth: '200px',
              zIndex: 10004,
              boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
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
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation'
              }}
            >
              Leaderboard
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
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation'
              }}
            >
              How To
            </button>
            <button
              onClick={() => {
                openWindow('chat');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: isMobile ? '12px 16px' : '8px',
                marginBottom: '4px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation'
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
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: isMobile ? '44px' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                touchAction: 'manipulation'
              }}
            >
              Profile
            </button>
            <div onClick={(e) => e.stopPropagation()}>
              <ThemeToggle asMenuItem={true} />
            </div>
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
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid #000',
                  paddingTop: '12px'
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
            zIndex={999998}
          >
            <PlayerProfile isMobile={false} address={viewingProfileAddress} />
          </Popup>
        )}
      </div>
    );
  }

  // Single player game UI
  return (
    <div className={`chess-game${fullscreen ? ' fullscreen' : ''}${showGame ? ' game-active' : ''}${isMobile ? ' mobile' : ' desktop'}`}>
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
                <div onClick={(e) => e.stopPropagation()}>
                  <ThemeToggle asMenuItem={true} />
                </div>
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
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
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
                <div className="profile-compact mobile-content-view" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999998, background: '#fff' }}>
                  <button onClick={() => setViewingProfileAddress(null)} style={{ margin: '10px', padding: '5px 10px' }}>Close</button>
                  <PlayerProfile isMobile={true} address={viewingProfileAddress} />
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Desktop Sidebar removed - using menu popup and windows instead */}
        {/* Center Area - Always Show Chess Board */}
        <div className="center-area" style={{ paddingTop: 0, marginTop: 0 }}>
          {/* Game Info Bar - Compact */}
          {showGame && (
            <div
              className="game-info-compact"
              style={{
                marginTop: '0px',
                marginBottom: '4px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                justifyContent: 'flex-start',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                gap: isMobile ? '4px' : '6px',
              }}
            >
              {playerProfilePic && gameMode === GameMode.AI && !isMobile && (
                <img 
                  src={playerProfilePic} 
                  alt="Player" 
                  className="profile-pic-mini"
                  style={{ 
                    width: isMobile ? '20px' : '24px', 
                    height: isMobile ? '20px' : '24px', 
                    borderRadius: '4px', 
                    marginRight: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('[PROFILE] Failed to load player profile picture:', playerProfilePic);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className={currentPlayer === 'blue' ? 'current-blue' : 'current-red'}>
                {currentPlayer === 'blue' ? 'Blue' : 'Red'}
              </span>
              {moveHistory.length >= 1 && (
                <span className="move-history-display">
                  {isMobile
                    ? `Last: ${moveHistory[moveHistory.length - 1]}`
                    : moveHistory.length >= 2
                    ? `Last: ${moveHistory[moveHistory.length - 2]} ${moveHistory[moveHistory.length - 1]}`
                    : `Last: ${moveHistory[moveHistory.length - 1]}`
                  }
                </span>
              )}
              {showGame && (
                <button
                  onClick={() => {
                    setShowPieceHoverLabels((prev) => !prev);
                    if (showPieceHoverLabels) setHoveredPieceLabel(null);
                  }}
                  type="button"
                  aria-pressed={showPieceHoverLabels}
                  aria-label={`Piece name labels ${showPieceHoverLabels ? 'enabled' : 'disabled'}. Toggle piece name labels on hover.`}
                  style={{
                    marginLeft: isMobile ? '2px' : '8px',
                    padding: '2px 6px',
                    fontSize: isMobile ? '10px' : '11px',
                    border: '1px solid rgba(255,255,255,0.4)',
                    background: 'rgba(0,0,0,0.25)',
                    color: '#fff',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                  title="Toggle piece name labels on hover"
                >
                  Labels: {showPieceHoverLabels ? 'ON' : 'OFF'}
                </button>
              )}
              {showPieceHoverLabels && hoveredPieceLabel && (
                <span className="move-history-display" style={{ marginLeft: '8px' }}>
                  Hover: {hoveredPieceLabel}
                </span>
              )}
              {gameMode === GameMode.AI && gameState === 'active' && timeoutCountdown > 0 && (
                <span className={`timer-display ${timeoutCountdown < 60 ? 'timer-warning' : ''} ${timeoutCountdown < 15 ? 'timer-critical' : ''}`}>
                  {isMobile ? `T:${formatCountdown(timeoutCountdown)}` : `Time: ${formatCountdown(timeoutCountdown)}`}
                </span>
              )}
              {gameMode === GameMode.AI && (
                <span className="mode-play">
                  {difficulty === 'easy' ? 'Easy' : 'Hard'}
                </span>
              )}
              {(() => {
                const indicator = getHardEngineIndicator();
                if (!indicator) return null;
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '2px',
                    }}
                    title={indicator.label}
                    aria-label={indicator.label}
                  >
                    <span
                      className={`engine-health-dot ${hardEngineHealth === 'thinking' ? 'thinking' : ''}`}
                      style={{
                        backgroundColor: indicator.dotColor,
                        boxShadow: `0 0 6px ${indicator.glow}`,
                      }}
                    />
                  </span>
                );
              })()}
              {isOnline && (
                <span className="wager-display">
                  Wager: {wager} tDMT
                </span>
              )}
              {aiProfilePic && gameMode === GameMode.AI && !isMobile && (
                <img 
                  src={aiProfilePic} 
                  alt="AI" 
                  className="profile-pic-mini"
                  style={{ 
                    width: isMobile ? '20px' : '24px', 
                    height: isMobile ? '20px' : '24px', 
                    borderRadius: '4px', 
                    marginLeft: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('[AI_PROFILE] Failed to load AI profile picture:', aiProfilePic);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          )}
          {/* Main Game Area */}
          {showGame ? (
            <div className="chess-main-area" style={{ 
              height: isMobile ? 'auto' : 'calc(100vh - 100px)', 
              minHeight: isMobile ? 'auto' : 'calc(100vh - 100px)', 
              paddingTop: '0px', 
              paddingBottom: isMobile ? '16px' : '40px',
              ...(isMobile && gameMode === 'ai' ? { display: 'flex', flexDirection: 'column', overflowY: 'auto', alignItems: 'center' } : {})
            }}>
              <div className="chessboard-container" style={{ 
                width: isMobile ? 'min(94vw, 94vh, 520px)' : 'min(85vh, 85vw, 700px)',
                height: isMobile ? 'min(94vw, 94vh, 520px)' : 'min(85vh, 85vw, 700px)',
                minWidth: isMobile ? '280px' : '400px',
                minHeight: isMobile ? '280px' : '400px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(isMobile && gameMode === 'ai' ? { flexShrink: 0 } : {})
              }}>
                <div 
                  className="chessboard"
                  style={{
                    backgroundImage: `url(${selectedChessboard})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gridTemplateRows: 'repeat(8, 1fr)',
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%',
                    position: 'relative',
                    zIndex: 1,
                    margin: 0,
                    padding: 0,
                    '--chessboard-bg-image': `url(${selectedChessboard})` as any
                  } as React.CSSProperties}
                  ref={chessboardRef}
                >
                  {Array.from({ length: 8 }, (_, row) => (
                    Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
                  ))}
                </div>
              </div>
              {/* Debug Log - Mobile Only, below chessboard, zero overlap */}
              {isMobile && gameMode === 'ai' && (
                <div style={{
                  width: '100%',
                  maxWidth: 'min(85vh, 85vw, 700px)',
                  margin: '8px auto 0',
                  padding: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  border: '2px solid #ff0000',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#00ff00',
                  fontFamily: 'monospace',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  lineHeight: '1.3',
                  flexShrink: 0
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff0000' }}>DEBUG FLAGS:</div>
                  <div>isAIMovingRef: {isAIMovingRef.current ? 'TRUE' : 'false'}</div>
                  <div>currentPlayer: {currentPlayer}</div>
                  <div>gameState: {gameState}</div>
                  <div>isUpdatingBoard: {isUpdatingBoard ? 'TRUE' : 'false'}</div>
                  <div>lastAIMoveRef: {lastAIMoveRef.current ? 'TRUE' : 'false'}</div>
                  <div>apiCallInProgress: {apiCallInProgressRef.current ? 'TRUE' : 'false'}</div>
                  <div>gameMode: {gameMode}</div>
                  <div style={{ fontWeight: 'bold', marginTop: '6px', marginBottom: '2px', color: '#ffaa00' }}>EVENT LOG (newest first):</div>
                  {mobileDebugLog.length === 0 ? (
                    <div style={{ color: '#888', fontSize: '9px' }}>no events yet</div>
                  ) : (
                    mobileDebugLog.map((line, i) => (
                      <div key={i} style={{ fontSize: '9px', color: line.startsWith('ERR') ? '#ff6666' : line.startsWith('BLOCKED') ? '#ffaa00' : '#00ff00' }}>{line}</div>
                    ))
                  )}
                </div>
              )}
              {/* Desktop game controls removed - use menu button instead */}
            </div>
          ) : showPieceSetSelector ? (
            renderPieceSetSelector()
          ) : (
            <div className={`game-mode-panel-streamlined ${isMobile ? 'mobile-pregame-panel' : ''}`}>
              <div className={`mode-selection-compact ${isMobile ? 'mobile-stack' : ''}`}>
                <button 
                  className={`mode-btn-compact chess-primary-btn ${gameMode === 'ai' ? 'selected' : ''}`}
                  onClick={() => setGameMode('ai')}
                >
                  VS AI
                </button>
                <button
                  className={`mode-btn-compact chess-primary-btn ${isOnline ? 'selected' : ''}`}
                  onClick={() => setGameMode('online')}
                >
                  PvP
                </button>
              </div>
              {gameMode === GameMode.AI && (
                <button className="start-btn-compact chess-primary-btn" onClick={() => setShowPieceSetSelector(true)}>
                  Start Game
                </button>
              )}
              {isOnline && (
                <div className="pvp-info">
                  {isMobile ? (
                    <p>Base-only PvP wager lobby.</p>
                  ) : (
                    <>
                      <p>Base-only PvP wager lobby</p>
                      <p>Create or join token matches on Base mainnet</p>
                    </>
                  )}
                </div>
              )}
              {!isMobile && (
                <>
                  {/* Help Section - Use HowToContent component */}
                  <div className="help-section-compact">
                    <HowToContent />
                  </div>
                  {/* Chessboards GIF */}
                  <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '20px' }}>
                    <img
                      src="/images/chessboards.gif"
                      alt="Chessboards Animation"
                      style={{
                        maxWidth: '60%',
                        width: '60%',
                        height: 'auto',
                        borderRadius: '0px',
                        boxShadow: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              )}
              {/* Sidebar toggle buttons removed - use menu button instead */}
            </div>
          )}
        </div>
      </div>
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
      {showDefeat && (() => {
        const stats = getGameStats();
        return (
          <div className="defeat-overlay">
            <div className="blood-overlay" />
            <div className="victory-modal">
              <div className="victory-content">
                <img src="/images/loser.gif" alt="Defeat" style={{ width: 120, marginBottom: 16 }} />
                <div>Defeat!</div>
                {stats && (
                  <div className="game-stats-container" style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '12px' : '14px',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                  }}>
                    <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px', textAlign: 'center' }}>
                      Game Stats
                    </div>
                    
                    {/* Players */}
                    <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', paddingBottom: '8px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Player:</strong> {stats.playerName}
                      </div>
                      <div>
                        <strong>Opponent:</strong> {stats.opponentName}
                      </div>
                    </div>
                    
                    {/* Winner */}
                    <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>Winner:</strong>
                      {stats.winnerProfilePic && (
                        <img 
                          src={stats.winnerProfilePic} 
                          alt="Winner" 
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span>{stats.winnerName}</span>
                    </div>
                    
                    {/* Duration */}
                    <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', paddingBottom: '8px' }}>
                      <strong>Duration:</strong> {stats.duration}
                    </div>
                    
                    {/* Wager */}
                    {stats.wager !== null && (
                      <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', paddingBottom: '8px' }}>
                        <strong>Wager:</strong> {stats.wager} tDMT
                      </div>
                    )}
                    
                    {/* Move History */}
                    <div style={{ marginTop: '12px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Move History ({stats.moves.length} moves):</strong>
                      <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: isMobile ? '10px' : '12px',
                        fontFamily: 'monospace'
                      }}>
                        {stats.moves.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {stats.moves.map((move: string, idx: number) => (
                              <span key={idx} style={{ marginRight: '4px' }}>
                                {move}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div>No moves recorded</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={handleNewGame} style={{ marginTop: '16px' }}>Try Again</button>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Desktop Menu Popup - Show for both home and game views */}
      {!isMobile && isMenuOpen && (
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
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div 
            className="chess-menu-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '60px',
              right: '20px',
              background: '#c0c0c0',
              border: '2px outset #fff',
              padding: '10px',
              minWidth: '200px',
              zIndex: 10004,
              boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
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
                padding: '8px',
                marginBottom: '4px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Leaderboard
            </button>
            <button
              onClick={() => {
                openWindow('chat');
                setIsMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginBottom: '4px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left'
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
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Profile
            </button>
            <div onClick={(e) => e.stopPropagation()}>
              <ThemeToggle asMenuItem={true} />
            </div>
            {showGame && (
              <button
                onClick={() => {
                  openWindow('moves');
                  setIsMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginBottom: '4px',
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                Move History
              </button>
            )}
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
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid #000',
                  paddingTop: '12px'
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
          <div className="chess-chat-window desktop" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="leaderboard-compact" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
                <div className="leaderboard-table-compact">
                  <table style={{ width: '100%', color: '#e2e8f0' }}>
                    <thead>
                      <tr>
                        <th style={{ color: '#e2e8f0', padding: '8px', textAlign: 'left' }}>Rank</th>
                        <th style={{ color: '#e2e8f0', padding: '8px', textAlign: 'left' }}>Player</th>
                        <th style={{ color: '#e2e8f0', padding: '8px', textAlign: 'left' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.slice(0, 20).map((entry, index: number) => {
                        if (typeof entry === 'object' && entry !== null && 'username' in entry && 'wins' in entry && 'losses' in entry && 'draws' in entry && 'points' in entry) {
                          const typedEntry = entry as LeaderboardEntry;
                          const displayName = leaderboardDisplayNames[typedEntry.username] || formatAddress(typedEntry.username);
                          return (
                            <tr key={typedEntry.username}>
                              <td style={{ padding: '4px 8px', color: '#e2e8f0' }}>{index + 1}</td>
                              <td 
                                style={{ cursor: 'pointer', color: '#90cdf4', textDecoration: 'underline', padding: '4px 8px' }}
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
                              <td style={{ padding: '4px 8px', color: '#e2e8f0' }}>{typedEntry.points}</td>
                            </tr>
                          );
                        }
                        return null;
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: '#e2e8f0', textAlign: 'center', padding: '20px', fontSize: '12px' }}>
                  No leaderboard data available
                </div>
              )}
            </div>
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
          <div className="chess-chat-window desktop" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="move-history-compact" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              <div className="move-history-title" style={{ marginBottom: '8px', fontWeight: 'bold' }}>Moves</div>
              <ul className="move-history-list-compact" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {moveHistory.slice().reverse().map((move, idx) => (
                  <li key={moveHistory.length - 1 - idx} style={{ padding: '4px 0', color: '#e2e8f0' }}>{move}</li>
                ))}
              </ul>
            </div>
          </div>
        </Popup>
      )}
      
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
          <div className="chess-chat-window desktop" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              <PlayerProfile isMobile={false} />
            </div>
          </div>
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
          <div className="chess-chat-window desktop" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', color: '#e2e8f0' }}>
              <HowToContent />
            </div>
          </div>
        </Popup>
      )}

      {!isMobile && openWindows.has('chat') && (
        <Popup
          id="chat-window"
          isOpen={true}
          onClose={() => closeWindow('chat')}
          title="Chat"
          initialPosition={windowPositions['chat'] ? { x: windowPositions['chat'].x, y: windowPositions['chat'].y } : { x: 20, y: 120 }}
          initialSize={{ width: 400, height: 500 }}
          zIndex={1000}
        >
          <ChessChat
            isOpen={true}
            onMinimize={() => closeWindow('chat')}
            currentInviteCode={vsClawbInviteCode || undefined}
            isDraggable={false}
            isResizable={false}
            isMobile={false}
          />
        </Popup>
      )}
      
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
          <div className="chess-chat-window desktop" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              <PlayerProfile isMobile={false} address={viewingProfileAddress} />
            </div>
          </div>
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

// Convert board array to Firebase positions format
function boardToPositions(board: (string | null)[][]): Record<string, string> {
  const positions: Record<string, string> = {};
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        positions[`${row}_${col}`] = piece;
      }
    }
  }
  return positions;
}

// Generate a random invite code for vs Clawb games
function generateVsClawbInviteCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

