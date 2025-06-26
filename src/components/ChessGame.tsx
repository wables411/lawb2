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
}

// Piece gallery data
const pieceGallery = [
  { key: 'K', name: 'Red King', img: '/public/images/redking.png', desc: 'The King moves one square in any direction. Protect your King at all costs!' },
  { key: 'Q', name: 'Red Queen', img: '/public/images/redqueen.png', desc: 'The Queen moves any number of squares in any direction.' },
  { key: 'R', name: 'Red Rook', img: '/public/images/redrook.png', desc: 'The Rook moves any number of squares horizontally or vertically.' },
  { key: 'B', name: 'Red Bishop', img: '/public/images/redbishop.png', desc: 'The Bishop moves any number of squares diagonally.' },
  { key: 'N', name: 'Red Knight', img: '/public/images/redknight.png', desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
  { key: 'P', name: 'Red Pawn', img: '/public/images/redpawn.png', desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
  { key: 'k', name: 'Blue King', img: '/public/images/blueking.png', desc: 'The King moves one square in any direction. Protect your King at all costs!' },
  { key: 'q', name: 'Blue Queen', img: '/public/images/bluequeen.png', desc: 'The Queen moves any number of squares in any direction.' },
  { key: 'r', name: 'Blue Rook', img: '/public/images/bluerook.png', desc: 'The Rook moves any number of squares horizontally or vertically.' },
  { key: 'b', name: 'Blue Bishop', img: '/public/images/bluebishop.png', desc: 'The Bishop moves any number of squares diagonally.' },
  { key: 'n', name: 'Blue Knight', img: '/public/images/blueknight.png', desc: 'The Knight moves in an L-shape: two squares in one direction, then one square perpendicular.' },
  { key: 'p', name: 'Blue Pawn', img: '/public/images/bluepawn.png', desc: 'The Pawn moves forward one square, with the option to move two squares on its first move. Captures diagonally.' },
];

export const ChessGame: React.FC<ChessGameProps> = ({ onClose, onMinimize }) => {
  const { address: walletAddress } = useAccount();
  
  // Game state
  const [gameMode, setGameMode] = useState<typeof GameMode[keyof typeof GameMode]>(GameMode.AI);
  const [board, setBoard] = useState<(string | null)[][]>(() => JSON.parse(JSON.stringify(initialBoard)));
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [gameState, setGameState] = useState<'active' | 'checkmate' | 'stalemate'>('active');
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');
  const [status, setStatus] = useState<string>('Connect wallet to play');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [legalMoves, setLegalMoves] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // UI state
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // Multiplayer state
  const [inviteCode, setInviteCode] = useState<string>('');
  const [wager, setWager] = useState<number>(0.1);
  
  // Piece state tracking
  const [pieceState, setPieceState] = useState({
    blueKingMoved: false,
    redKingMoved: false,
    blueRooksMove: { left: false, right: false },
    redRooksMove: { left: false, right: false },
    lastPawnDoubleMove: null as { row: number; col: number } | null
  });
  
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
      setShowGame(false);
      setShowDifficulty(false);
      setShowMultiplayer(false);
          } else {
      setStatus('Select game mode');
    }
  }, [walletAddress]);

  // Initialize AI worker
  useEffect(() => {
    // Temporarily disable AI worker to test basic flow
    console.log('AI worker disabled for testing');
    setStatus('AI worker disabled for testing');
    
    // if (typeof Worker !== 'undefined') {
    //   try {
    //     aiWorkerRef.current = new Worker('/aiWorker.js');
    //     aiWorkerRef.current.onmessage = (e: MessageEvent) => {
    //       const { move } = e.data as { move?: { from: { row: number; col: number }; to: { row: number; col: number } } };
    //       if (move) {
    //         setStatus('AI made a move');
    //         isAIMovingRef.current = false;
    //         makeMove(move.from, move.to, true);
    //       } else {
    //         isAIMovingRef.current = false;
    //         setStatus('AI could not find a move');
    //       }
    //     };
    //     aiWorkerRef.current.onerror = (error: ErrorEvent) => {
    //       console.error('AI Worker error:', error);
    //       setStatus('AI worker error - using fallback mode');
    //       isAIMovingRef.current = false;
    //     };
    //   } catch (error) {
    //     console.error('Failed to initialize AI worker:', error);
    //     setStatus('AI worker failed to load - using fallback mode');
    //   }
    // }
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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error('Database timeout')), 10000)
      );

      const dataPromise = supabase
        .from('leaderboard')
        .select('*')
        .order('points', { ascending: false });
      
      type SupabaseLeaderboardResponse = {
        data: LeaderboardEntry[] | null;
        error: Error | null;
      };
      const { data, error } = (await Promise.race([dataPromise, timeoutPromise])) as SupabaseLeaderboardResponse;

      if (error) {
        setStatus('Failed to load leaderboard');
        console.error('Leaderboard error:', error);
        return;
      }
      if (data) {
        setLeaderboardData(data);
      }
    } catch (error) {
      setStatus('Failed to load leaderboard');
      console.error('Leaderboard error:', error);
    }
  };

  // Update score
  const updateScore = async (gameResult: 'win' | 'loss' | 'draw') => {
    if (!walletAddress) return;

    try {
      // Normalize wallet address to lowercase for consistent database queries
      const normalizedAddress = walletAddress.toLowerCase();
      
      const { data: existingRecord } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', normalizedAddress)
        .maybeSingle();

      const wins = (existingRecord?.wins || 0) + (gameResult === 'win' ? 1 : 0);
      const losses = (existingRecord?.losses || 0) + (gameResult === 'loss' ? 1 : 0);
      const draws = (existingRecord?.draws || 0) + (gameResult === 'draw' ? 1 : 0);
      const total_games = wins + losses + draws;
      const pointsToAdd = gameResult === 'win' ? (difficulty === 'hard' ? 5 : 3) : 
                         gameResult === 'draw' ? 1 : 0;
      const points = (existingRecord?.points || 0) + pointsToAdd;

      if (existingRecord) {
      await supabase
        .from('leaderboard')
          .update({
            wins,
            losses,
            draws,
            total_games,
            points,
            updated_at: new Date().toISOString()
          })
          .eq('username', normalizedAddress);
      } else {
        await supabase
          .from('leaderboard')
          .insert({
            username: normalizedAddress,
          chain_type: 'evm',
          wins,
          losses,
          draws,
          total_games,
          points,
            created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
          });
      }

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
    const piece = board[from.row][from.col];
    if (!piece) return;
    
    const pieceColor = getPieceColor(piece);
    const pieceType = piece.toLowerCase();
    
    // Check for pawn promotion
    if (pieceType === 'p' && ((pieceColor === 'blue' && to.row === 0) || (pieceColor === 'red' && to.row === 7))) {
      setPromotionMove({ from, to });
      setShowPromotion(true);
      return;
    }
    
    executeMove(from, to, 'q', isAIMove);
  };

  // Execute move
  const executeMove = (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q', isAIMove = false) => {
    const piece = board[from.row][from.col];
    const capturedPiece = board[to.row][to.col];
    const pieceColor = getPieceColor(piece);
    const pieceType = piece ? piece.toLowerCase() : '';
    
    // Create new board state
      const newBoard = board.map(row => [...row]);
    newBoard[to.row][to.col] = pieceType === 'p' && ((pieceColor === 'blue' && to.row === 0) || (pieceColor === 'red' && to.row === 7)) 
      ? (pieceColor === 'blue' ? promotionPiece : promotionPiece.toUpperCase())
      : piece;
    newBoard[from.row][from.col] = null;
    
    // Update piece state for castling
    const newPieceState = { ...pieceState };
    if (pieceType === 'k') {
      if (pieceColor === 'blue') {
        newPieceState.blueKingMoved = true;
      } else {
        newPieceState.redKingMoved = true;
      }
    } else if (pieceType === 'r') {
      if (pieceColor === 'blue') {
        if (from.col === 0) newPieceState.blueRooksMove.left = true;
        if (from.col === 7) newPieceState.blueRooksMove.right = true;
      } else {
        if (from.col === 0) newPieceState.redRooksMove.left = true;
        if (from.col === 7) newPieceState.redRooksMove.right = true;
      }
    }
    
    // Handle pawn double move for en passant
    if (pieceType === 'p' && Math.abs(from.row - to.row) === 2) {
      newPieceState.lastPawnDoubleMove = { row: to.row, col: to.col };
    } else {
      newPieceState.lastPawnDoubleMove = null;
    }
    
    // Handle castling
    if (pieceType === 'k' && Math.abs(from.col - to.col) === 2) {
      if (to.col === 6) { // Kingside
        newBoard[from.row][7] = null;
        newBoard[from.row][5] = pieceColor === 'blue' ? 'r' : 'R';
      } else if (to.col === 2) { // Queenside
        newBoard[from.row][0] = null;
        newBoard[from.row][3] = pieceColor === 'blue' ? 'r' : 'R';
      }
    }
    
    // Update state
    setBoard(newBoard);
    setPieceState(newPieceState);
    setSelectedPiece(null);
    setLegalMoves([]);
    setLastMove({ from, to });
    
    // Add to move history
    const moveNotation = `${coordsToAlgebraic(from.row, from.col)}-${coordsToAlgebraic(to.row, to.col)}`;
    setMoveHistory(prev => [...prev, moveNotation]);
    
    // Check game end
    const nextPlayer: 'blue' | 'red' = switchPlayer(currentPlayer);
    const gameEndResult = checkGameEnd(newBoard, nextPlayer);
    
    if (gameEndResult) {
      setGameState(gameEndResult);
      if (gameMode === GameMode.AI) {
        const result = gameEndResult === 'checkmate' ? (nextPlayer === 'blue' ? 'win' : 'loss') : 'draw';
        void updateScore(result);
      }
      return;
    }
    
    // Switch players
      setCurrentPlayer(nextPlayer);
    
    // AI move - only if it's AI's turn and we're in AI mode and this wasn't an AI move
    if (!isAIMove && gameMode === GameMode.AI && nextPlayer === 'red' && gameState === 'active') {
      setStatus('AI is thinking...');
      isAIMovingRef.current = true;
      
      // Use only fallback AI move for testing
      setTimeout(() => {
        // Use the updated board state for AI move calculation
        const aiMove = getRandomAIMove(newBoard);
        if (aiMove) {
          // Create a new executeMove function that works with the updated board
          const executeAIMove = (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q') => {
            const piece = newBoard[from.row][from.col];
            if (!piece) return;
            
            const pieceColor = getPieceColor(piece);
            const pieceType = piece.toLowerCase();
            
            // Create new board state from the updated board
            const aiBoard = newBoard.map(row => [...row]);
            aiBoard[to.row][to.col] = pieceType === 'p' && ((pieceColor === 'blue' && to.row === 0) || (pieceColor === 'red' && to.row === 7)) 
              ? (pieceColor === 'blue' ? promotionPiece : promotionPiece.toUpperCase())
              : piece;
            aiBoard[from.row][from.col] = null;
            
            // Update state
            setBoard(aiBoard);
      setSelectedPiece(null);
      setLegalMoves([]);
            setLastMove({ from, to });
            
            // Add to move history
            const moveNotation = `${coordsToAlgebraic(from.row, from.col)}-${coordsToAlgebraic(to.row, to.col)}`;
            setMoveHistory(prev => [...prev, moveNotation]);
            
            // Check game end
            const aiNextPlayer: 'blue' | 'red' = switchPlayer(nextPlayer);
            const gameEndResult = checkGameEnd(aiBoard, aiNextPlayer);
            
            if (gameEndResult) {
              setGameState(gameEndResult);
              if (gameMode === GameMode.AI) {
                const result = gameEndResult === 'checkmate' ? (aiNextPlayer === 'blue' ? 'win' : 'loss') : 'draw';
                void updateScore(result);
              }
              return;
            }
            
            // Switch players
            setCurrentPlayer(aiNextPlayer);
            setStatus(`Your turn (${aiNextPlayer})`);
          };
          
          executeAIMove(aiMove.from, aiMove.to, 'q');
        } else {
          setStatus('AI could not find a move');
        }
        isAIMovingRef.current = false;
      }, 1000);
    } else {
      setStatus(`Your turn (${nextPlayer})`);
    }
  };

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
    setShowDifficulty(false);
    setShowMultiplayer(false);
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

  const startAIGame = () => {
    console.log('startAIGame called');
    setShowDifficulty(true);
    setShowMultiplayer(false);
    setStatus('Select difficulty');
  };

  const startMultiplayerGame = () => {
    console.log('startMultiplayerGame called');
    setShowMultiplayer(true);
    setShowDifficulty(false);
    setStatus('Set wager and create/join game');
  };

  const startGame = () => {
    console.log('startGame called, difficulty:', difficulty, 'gameMode:', gameMode);
    setShowGame(true);
    setShowDifficulty(false);
    setShowMultiplayer(false);
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
    <div className="difficulty-selection-row">
      <div className="difficulty-gallery-col">
        {renderPieceGallery(true, 'click for chess piece movements')}
      </div>
      <div className="difficulty-controls-col">
        <div className="difficulty-selection-panel">
                  <h3>Select Difficulty</h3>
                  <button 
                    className={`difficulty-btn ${difficulty === 'easy' ? 'selected' : ''}`}
                    onClick={() => setDifficulty('easy')}
                  >
                    Easy
                  </button>
                  <button 
                    className={`difficulty-btn ${difficulty === 'hard' ? 'selected' : ''}`}
                    onClick={() => setDifficulty('hard')}
                  >
            Kinda Harder
                  </button>
          <button 
            className="start-btn"
            onClick={startGame}
          >
                    Start Game
                  </button>
        </div>
        <div className="difficulty-leaderboard-panel">
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
                  {leaderboardData.slice(0, 10).map((entry, index) => {
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Utility to switch player color
  const switchPlayer = (player: 'blue' | 'red'): 'blue' | 'red' => (player === 'blue' ? 'red' : 'blue');

  // Main render
  if (!walletAddress) {
    return (
      <div className="chess-game">
        <div className="chess-header">
          <h2>Lawb Chess</h2>
          <div className="chess-controls">
            {onMinimize && <button onClick={onMinimize}>_</button>}
            <button onClick={onClose}>×</button>
          </div>
        </div>
        <div className="chess-content">
          <div className="wallet-required">
            <p>Connect your wallet to play chess</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chess-game">
      <div className="chess-header">
        <h2>Lawb Chess</h2>
        <div className="chess-controls">
          {onMinimize && <button onClick={onMinimize}>_</button>}
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="chess-content">
        {!showGame && !showDifficulty && !showMultiplayer && (
          <div className="gallery-main-area">
            {renderPieceGallery(false)}
                </div>
              )}

        {!showGame && !showDifficulty && !showMultiplayer && (
          <div className="game-mode-selection">
            <h3>Select Game Mode</h3>
            <button 
              className={`mode-btn ${gameMode === GameMode.AI ? 'selected' : ''}`}
              onClick={() => setGameMode(GameMode.AI)}
            >
              VS the House
            </button>
            <button 
              className={`mode-btn ${gameMode === GameMode.ONLINE ? 'selected' : ''}`}
              onClick={() => setGameMode(GameMode.ONLINE)}
              disabled
            >
              PvP Under Construction
            </button>
            <button 
              className="start-btn"
              onClick={() => {
                if (gameMode === GameMode.AI) {
                  startAIGame();
                } else {
                  startMultiplayerGame();
                }
              }}
            >
              Continue
            </button>
          </div>
        )}

        {showDifficulty && renderDifficultySelection()}

              {showMultiplayer && (
          <div className="multiplayer-selection">
            <h3>Multiplayer</h3>
                  <div className="wager-input">
              <label>Wager (ETH):</label>
                    <input 
                      type="number" 
                      value={wager}
                onChange={(e) => setWager(parseFloat(e.target.value) || 0.1)}
                min="0.01"
                step="0.01"
                    />
                  </div>
            <button onClick={createGame}>Create Game</button>
                  <div className="join-game">
                    <input 
                      type="text" 
                      value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                    />
              <button onClick={joinGame}>Join Game</button>
                  </div>
            {status && status.includes('Game created!') && (
              <div className="game-created">
                <p>{status}</p>
              </div>
            )}
                </div>
              )}

        {showGame && (
          <div className="game-container">
            {/* Left Sidebar - Move History */}
            <div className="left-sidebar">
              <div className="move-history">
                <h4>Move History</h4>
                <div className="moves">
                  {moveHistory.slice().reverse().map((move, index) => (
                    <span key={moveHistory.length - 1 - index} className="move">
                      {Math.floor((moveHistory.length - 1 - index) / 2) + 1}.{(moveHistory.length - 1 - index) % 2 === 0 ? '' : ' '}{move}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Center - Main Game Area */}
            <div className="game-main">
                  <div className="game-info">
                <div className="status">{status}</div>
                <div className="current-player">
                  Current: {currentPlayer === 'blue' ? 'Blue' : 'Red'}
                </div>
                <div className="wager-display">
                  Wager: {gameMode === GameMode.AI ? 'NA' : `${wager} ETH`}
                </div>
                  </div>

              <div className="chessboard-container">
                  <div className="chessboard">
                  {Array.from({ length: 8 }, (_, row) => (
                    <div key={row} className="board-row">
                      {Array.from({ length: 8 }, (_, col) => renderSquare(row, col))}
                              </div>
                    ))}
                  </div>
                </div>
              
              <div className="game-controls">
                <button onClick={resetGame}>New Game</button>
                <button onClick={resetGame}>Back to Menu</button>
              </div>
            </div>
            
            {/* Right Sidebar - Leaderboard */}
            {!showGame && !showDifficulty && !showMultiplayer && (
              <div className="right-sidebar">
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
                        {leaderboardData.slice(0, 10).map((entry, index) => {
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
                        })}
                  </tbody>
                </table>
              </div>
                </div>
              </div>
          )}
        </div>
        )}
      </div>

      {renderPromotionDialog()}
    </div>
  );
}; 