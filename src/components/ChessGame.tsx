import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import './ChessGame.css';

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
type Difficulty = 'novice' | 'intermediate' | 'world-class';

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
        const { move } = e.data as { move?: { from: { row: number; col: number }; to: { row: number; col: number } } };
        // Only apply if it's still AI's turn and game is active
        if (move && isAIMovingRef.current && gameState === 'active') {
          console.log('[DEBUG] AI worker move is valid, executing:', move);
          isAIMovingRef.current = false;
          if (aiTimeoutRef.current) { window.clearTimeout(aiTimeoutRef.current); aiTimeoutRef.current = null; }
          if (makeMoveRef.current) {
            makeMoveRef.current(move.from, move.to, true);
          }
        } else {
          console.log('[DEBUG] AI worker move rejected:', {
            hasMove: !!move,
            isAIMoving: isAIMovingRef.current,
            gameState,
            currentPlayer
          });
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
      
      const { data: existingRecord } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', normalizedAddress)
        .maybeSingle();

      // Debug log for types
      console.log('[Leaderboard] existingRecord types:', {
        wins: typeof existingRecord?.wins,
        losses: typeof existingRecord?.losses,
        draws: typeof existingRecord?.draws,
        points: typeof existingRecord?.points,
        existingRecord
      });

      // Force integer conversion
      const wins = (parseInt((existingRecord && typeof existingRecord === 'object' && 'wins' in existingRecord && typeof (existingRecord as Record<string, unknown>).wins === 'string' ? (existingRecord as Record<string, string>).wins : '0'), 10) || 0) + (gameResult === 'win' ? 1 : 0);
      const losses = (parseInt((existingRecord && typeof existingRecord === 'object' && 'losses' in existingRecord && typeof (existingRecord as Record<string, unknown>).losses === 'string' ? (existingRecord as Record<string, string>).losses : '0'), 10) || 0) + (gameResult === 'loss' ? 1 : 0);
      const draws = (parseInt((existingRecord && typeof existingRecord === 'object' && 'draws' in existingRecord && typeof (existingRecord as Record<string, unknown>).draws === 'string' ? (existingRecord as Record<string, string>).draws : '0'), 10) || 0) + (gameResult === 'draw' ? 1 : 0);
      const total_games = wins + losses + draws;
      const pointsToAdd = gameResult === 'win' ? (difficulty === 'world-class' ? 5 : 3) : 
                         gameResult === 'draw' ? 1 : 0;
      const points = (parseInt((existingRecord && typeof existingRecord === 'object' && 'points' in existingRecord && typeof (existingRecord as Record<string, unknown>).points === 'string' ? (existingRecord as Record<string, string>).points : '0'), 10) || 0) + pointsToAdd;

      console.log('[Leaderboard] updateScore:', {
        normalizedAddress,
        gameResult,
        wins,
        losses,
        draws,
        total_games,
        points,
        existingRecord
      });

      // Use upsert with onConflict like the original working implementation
      const record = {
        username: normalizedAddress,
        chain_type: 'evm',
        wins,
        losses,
        draws,
        total_games,
        points,
        updated_at: new Date().toISOString()
      };

      const response = await supabase
        .from('leaderboard')
        .upsert(record, { onConflict: 'username' });

      console.log('[Leaderboard] Supabase response:', response);
      void loadLeaderboard();
    } catch (error) {
      console.error('Error updating score:', error);
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
          if (canPieceMove(piece, r, c, row, col, false, attackingColor, board)) {
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
    
    // En passant
    if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction) {
      const targetPiece = board[startRow][endCol];
      if (targetPiece && getPieceColor(targetPiece) !== color && targetPiece.toLowerCase() === 'p') {
        if (pieceState.lastPawnDoubleMove && 
            pieceState.lastPawnDoubleMove.row === startRow && 
            pieceState.lastPawnDoubleMove.col === endCol) {
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

  const canPieceMove = (piece: string, startRow: number, startCol: number, endRow: number, endCol: number, checkForCheck = true, playerColor = getPieceColor(piece), boardState = board): boolean => {
    if (!isWithinBoard(endRow, endCol)) return false;
    
    const targetPiece = boardState[endRow][endCol];
    if (targetPiece && getPieceColor(targetPiece) === playerColor) return false;
    
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
    
    if (isValid && checkForCheck) {
      return !wouldMoveExposeCheck(startRow, startCol, endRow, endCol, playerColor, boardState);
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
        if (canPieceMove(piece, from.row, from.col, row, col, true, player, boardState)) {
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
    lastAIMoveRef.current = !!isAIMove;
    const piece = board[from.row][from.col];
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

  // Execute move
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
        executeMoveAfterAnimation(from, to, promotionPiece, isAIMove, board);
        setCaptureAnimation(null);
      }, 500); // Animation duration
      return;
    }
    
    // If not a capture, execute move immediately
    executeMoveAfterAnimation(from, to, promotionPiece, isAIMove, board);
  };

  // Execute move after animation (or immediately if no animation)
  const executeMoveAfterAnimation = (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q', isAIMove = false, currentBoardState = board) => {
    const piece = currentBoardState[from.row][from.col];
    
    console.log('[DEBUG] executeMoveAfterAnimation called:', {
      from,
      to,
      piece,
      currentPlayer,
      isAIMove,
      gameMode,
      difficulty
    });
    
    // Create new board state from the passed board state
    const newBoard = currentBoardState.map(row => [...row]);
    
    // Handle pawn promotion
    if (piece && piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
      // Convert promotion piece to correct case based on player color
      const promotedPiece = getPieceColor(piece) === 'blue' ? promotionPiece.toLowerCase() : promotionPiece.toUpperCase();
      newBoard[to.row][to.col] = promotedPiece;
    } else {
      newBoard[to.row][to.col] = piece ? piece : '';
    }
    
    newBoard[from.row][from.col] = null;
    
    console.log('[DEBUG] Board state after move:', {
      fromPiece: currentBoardState[from.row][from.col],
      toPiece: currentBoardState[to.row][to.col],
      newFromPiece: newBoard[from.row][from.col],
      newToPiece: newBoard[to.row][to.col]
    });
    
    // Update piece state for castling
    const newPieceState = { ...pieceState };
    if (piece && piece.toLowerCase() === 'k') {
      if (getPieceColor(piece) === 'blue') {
        newPieceState.blueKingMoved = true;
      } else {
        newPieceState.redKingMoved = true;
      }
    } else if (piece && piece.toLowerCase() === 'r') {
      if (getPieceColor(piece) === 'blue') {
        if (from.col === 0) newPieceState.blueRooksMove.left = true;
        if (from.col === 7) newPieceState.blueRooksMove.right = true;
      } else {
        if (from.col === 0) newPieceState.redRooksMove.left = true;
        if (from.col === 7) newPieceState.redRooksMove.right = true;
      }
    }
    
    // Handle pawn double move for en passant
    if (piece && piece.toLowerCase() === 'p' && Math.abs(from.row - to.row) === 2) {
      newPieceState.lastPawnDoubleMove = { row: to.row, col: to.col };
    } else {
      newPieceState.lastPawnDoubleMove = null;
    }
    
    // Handle castling
    if (piece && piece.toLowerCase() === 'k' && Math.abs(from.col - to.col) === 2) {
      if (to.col === 6) { // Kingside
        newBoard[from.row][7] = null;
        newBoard[from.row][5] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
      } else if (to.col === 2) { // Queenside
        newBoard[from.row][0] = null;
        newBoard[from.row][3] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
      }
    }
    
    // Update state
    setBoard(newBoard);
    setPieceState(newPieceState);
    setSelectedPiece(null);
    setLegalMoves([]);
    setLastMove({ from, to });
    
    console.log('[DEBUG] State updated, currentPlayer before switch:', currentPlayer);
    
    // Add to move history
    const moveNotation = `${coordsToAlgebraic(from.row, from.col)}-${coordsToAlgebraic(to.row, to.col)}`;
    setMoveHistory(prev => [...prev, moveNotation]);
    
    // Check game end
    const nextPlayer: 'blue' | 'red' = switchPlayer(currentPlayer);
    const gameEndResult = checkGameEnd(newBoard, nextPlayer);
    
    if (gameEndResult) {
      console.log('[DEBUG] Game ended with result:', gameEndResult);
      setGameState(gameEndResult);
      if (gameMode === GameMode.AI) {
        console.log('[DEBUG] AI mode detected, calling updateScore');
        // Fix: Use the same logic as the original working implementation
        // winner is 'blue' when blue wins, 'red' when red wins, 'draw' for stalemate
        const winner = gameEndResult === 'checkmate' ? (nextPlayer === 'blue' ? 'red' : 'blue') : 'draw';
        const result = winner === 'blue' ? 'win' : winner === 'red' ? 'loss' : 'draw';
        console.log('[DEBUG] Calculated result for updateScore:', result);
        void updateScore(result).then(() => {
          setStatus(prev => prev + ' Leaderboard has been updated!');
          setShowLeaderboardUpdated(true);
          window.setTimeout(() => {
            setShowLeaderboardUpdated(false);
            console.log('Leaderboard updated!');
            setStatus(gameEndResult === 'checkmate'
              ? `Checkmate! ${nextPlayer === 'blue' ? 'Red' : 'Blue'} wins!`
              : 'Stalemate! Game is a draw.');
          }, 3000);
        });
      } else {
        console.log('[DEBUG] Not AI mode, gameMode is:', gameMode);
      }
      return;
    }
    
    // Switch players
    setCurrentPlayer(nextPlayer);
    console.log('[DEBUG] Player switched to:', nextPlayer);
    
    // Reset AI moving flag if this was an AI move
    if (isAIMove) {
      isAIMovingRef.current = false;
    }
  };

  // AI move effect - trigger AI move when it's red's turn
  useEffect(() => {
    if (!isAIMovingRef.current && gameMode === GameMode.AI && currentPlayer === 'red' && !lastAIMoveRef.current) {
      console.log('[DEBUG] Starting AI move for difficulty:', difficulty);
      // Set AI moving flag to prevent player moves during AI turn
      isAIMovingRef.current = true;
      
      if (difficulty === 'world-class') {
        // Use Stockfish API for world-class difficulty
        console.log('[DEBUG] Using Stockfish API for world-class difficulty');
        
        // Use async IIFE to handle the API call
        (async () => {
          try {
            const fen = boardToFEN(board, currentPlayer);
            console.log('[DEBUG] Sending FEN to Stockfish API:', fen);
            
            const response = await fetch('http://localhost:3001/api/stockfish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fen, movetime: 1200 })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[DEBUG] Stockfish API response:', data);
            
            if (data.bestmove) {
              // Convert Stockfish move format (e.g., "e2e4") to our format
              const stockfishMoveStr = data.bestmove;
              console.log('[DEBUG] Stockfish bestmove:', stockfishMoveStr);
              
              // Parse Stockfish move format (e.g., "e2e4" -> from: {row: 6, col: 4}, to: {row: 4, col: 4})
              const fromCol = stockfishMoveStr.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
              const fromRow = 8 - parseInt(stockfishMoveStr[1]); // '1' = 7, '2' = 6, etc.
              const toCol = stockfishMoveStr.charCodeAt(2) - 97;
              const toRow = 8 - parseInt(stockfishMoveStr[3]);
              
              const stockfishMove = {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol }
              };
              
              console.log('[DEBUG] Converted Stockfish move:', stockfishMove);
              
              // Validate the move using canPieceMove
              const piece = board[stockfishMove.from.row][stockfishMove.from.col];
              if (piece && getPieceColor(piece) === 'red' && canPieceMove(piece, stockfishMove.from.row, stockfishMove.from.col, stockfishMove.to.row, stockfishMove.to.col, true, 'red', board)) {
                console.log('[DEBUG] AI move is legal, executing');
                makeMove(stockfishMove.from, stockfishMove.to, true);
              } else {
                console.log('[DEBUG] AI move is illegal, using fallback');
                const fallbackMove = getRandomAIMove(board);
                if (fallbackMove) {
                  makeMove(fallbackMove.from, fallbackMove.to, true);
                }
              }
            } else {
              console.log('[DEBUG] No move from Stockfish, using fallback');
              const fallbackMove = getRandomAIMove(board);
              if (fallbackMove) {
                makeMove(fallbackMove.from, fallbackMove.to, true);
              }
            }
          } catch (error) {
            console.error('[DEBUG] Stockfish API error:', error);
            console.log('[DEBUG] Using fallback due to API error');
            const fallbackMove = getRandomAIMove(board);
            if (fallbackMove) {
              makeMove(fallbackMove.from, fallbackMove.to, true);
            }
          } finally {
            // Reset AI moving flag
            isAIMovingRef.current = false;
          }
        })();
      } else if (difficulty === 'intermediate' && aiWorkerRef.current) {
        // Use existing AI worker for 'intermediate' mode
        console.log('[DEBUG] Using AI worker for intermediate mode');
        aiWorkerRef.current.postMessage({
          board: board,
          currentPlayer: currentPlayer,
          difficulty,
          pieceState: pieceState
        });
        
        // Add timeout fallback in case worker doesn't respond
        aiTimeoutRef.current = window.setTimeout(() => {
          console.log('[DEBUG] AI worker timeout, using fallback');
          isAIMovingRef.current = false;
          const fallbackMove = getRandomAIMove(board);
          if (fallbackMove) {
            makeMove(fallbackMove.from, fallbackMove.to, true);
          }
        }, 3000); // 3 second timeout
      } else if (difficulty === 'novice') {
        // Use simple random moves for 'novice' mode
        console.log('[DEBUG] Using simple AI for novice mode');
        const fallbackMove = getRandomAIMove(board);
        if (fallbackMove) {
          makeMove(fallbackMove.from, fallbackMove.to, true);
        }
        // Reset AI moving flag
        isAIMovingRef.current = false;
      }
    }
  }, [currentPlayer, gameMode, difficulty, board, pieceState]);

  // Check game end
  const checkGameEnd = (boardState: (string | null)[][], playerToMove: 'blue' | 'red'): 'checkmate' | 'stalemate' | null => {
    console.log('Checking game end for player:', playerToMove);
    console.log('Is king in check:', isKingInCheck(boardState, playerToMove));
    
    if (isCheckmate(playerToMove, boardState)) {
      console.log('CHECKMATE detected!');
      setStatus(`Checkmate! ${playerToMove === 'blue' ? 'Red' : 'Blue'} wins!`);
      return 'checkmate';
    }
    
    if (isStalemate(playerToMove, boardState)) {
      console.log('STALEMATE detected!');
      setStatus('Stalemate! Game is a draw.');
      return 'stalemate';
    }
    
    if (isKingInCheck(boardState, playerToMove)) {
      console.log('CHECK detected!');
      setStatus(`${playerToMove === 'blue' ? 'Blue' : 'Red'} is in check!`);
    } else {
      setStatus(`Your turn (${playerToMove})`);
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
    
    for (const piece of aiPieces) {
      const legalMoves = getLegalMoves(piece, boardState, 'red');
      if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        // Double-check that this move doesn't put the AI's king in check
        const tempBoard = boardState.map(row => [...row]);
        const pieceSymbol = tempBoard[piece.row][piece.col];
        tempBoard[randomMove.row][randomMove.col] = pieceSymbol;
        tempBoard[piece.row][piece.col] = null;
        
        if (!isKingInCheck(tempBoard, 'red')) {
          return { from: piece, to: randomMove };
        }
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
    console.log('startGame called, difficulty:', difficulty, 'gameMode:', gameMode);
    setShowGame(true);
    setShowDifficulty(false);
    setStatus(`Your turn (${currentPlayer})`);
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
            onClick={() => { setDifficulty('novice'); setShowGame(true); setShowDifficulty(false); setStatus(`Your turn (${currentPlayer})`); }}
          >
            Novice
          </button>
          <button 
            className={`difficulty-btn${difficulty === 'intermediate' ? ' selected' : ''}`}
            onClick={() => { setDifficulty('intermediate'); setShowGame(true); setShowDifficulty(false); setStatus(`Your turn (${currentPlayer})`); }}
          >
            Intermediate
          </button>
          <button 
            className={`difficulty-btn${difficulty === 'world-class' ? ' selected' : ''}`}
            onClick={() => { setDifficulty('world-class'); setShowGame(true); setShowDifficulty(false); setStatus(`Your turn (${currentPlayer})`); }}
          >
            World-Class
          </button>
        </div>
      </div>
    </div>
  );

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
                <span className={difficulty === 'novice' ? 'mode-novice' : difficulty === 'intermediate' ? 'mode-intermediate' : 'mode-world-class'}>
                  Mode: {difficulty === 'novice' ? 'Novice' : difficulty === 'intermediate' ? 'Intermediate' : 'World-Class'}
                </span>
              )}
            </div>
          </div>
          {showGame ? (
            <div className="chess-main-area">
              <div className="chessboard-container">
                <div className="chessboard">
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
