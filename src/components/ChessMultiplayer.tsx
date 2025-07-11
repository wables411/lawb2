import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { supabase } from '../supabaseClient';
import './ChessMultiplayer.css';

// Smart contract ABI for the endGame function
const CHESS_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes6",
        "name": "inviteCode",
        "type": "bytes6"
      },
      {
        "internalType": "address",
        "name": "winner",
        "type": "address"
      }
    ],
    "name": "endGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const CHESS_CONTRACT_ADDRESS = '0x3112AF5728520F52FD1C6710dD7bD52285a68e47';

// Game modes
const GameMode = {
  LOBBY: 'lobby',
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished'
} as const;

// Leaderboard data type
interface LeaderboardEntry {
  id: number;
  username: string;
  chain_type: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  points: number;
  created_at: string;
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

interface ChessMultiplayerProps {
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

export const ChessMultiplayer: React.FC<ChessMultiplayerProps> = ({ onClose, onMinimize, fullscreen = false }) => {
  const { address, isConnected } = useAccount();
  
  // Smart contract integration
  const [contractInviteCode, setContractInviteCode] = useState<string>('');
  const [contractWinner, setContractWinner] = useState<string>('');
  const [isResolvingGame, setIsResolvingGame] = useState(false); // Prevent duplicate resolution
  const [canClaimWinnings, setCanClaimWinnings] = useState(false);
  const [isClaimingWinnings, setIsClaimingWinnings] = useState(false);
  
  // Contract write hook for endGame function
  const { writeContract, isPending: isEndingGame, data: hash } = useWriteContract();
  const { isLoading: isWaitingForReceipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Claim winnings function for winners
  const claimWinnings = async () => {
    if (!address || !gameId || !playerColor) {
      console.error('[CLAIM] Missing required data for claiming winnings');
      return;
    }

    try {
      setIsClaimingWinnings(true);
      console.log('[CLAIM] Claiming winnings for game:', gameId, 'Player:', playerColor);
      
      // Get game data to determine winner
      const { data: gameData, error } = await supabase
        .from('chess_games')
        .select('blue_player, red_player, winner')
        .eq('game_id', gameId)
        .single();
      
      if (error || !gameData) {
        console.error('[CLAIM] Error fetching game data:', error);
        alert('Failed to fetch game data. Please try again.');
        return;
      }

      // Verify this player is the winner
      const winnerAddress = gameData.winner === 'blue' ? gameData.blue_player : gameData.red_player;
      if (winnerAddress !== address) {
        console.error('[CLAIM] Player is not the winner');
        alert('Only the winner can claim winnings.');
        return;
      }

      // Convert gameId to bytes6 format for contract
      const bytes6InviteCode = '0x' + gameId.slice(0, 12);
      
      console.log('[CLAIM] Calling contract with:', {
        inviteCode: bytes6InviteCode,
        winner: winnerAddress
      });

      // Call the contract
      writeContract({
        address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'endGame',
        args: [bytes6InviteCode as `0x${string}`, winnerAddress as `0x${string}`],
      });

    } catch (error) {
      console.error('[CLAIM] Error claiming winnings:', error);
      alert('Failed to claim winnings. Please try again.');
    } finally {
      setIsClaimingWinnings(false);
    }
  };

  // Note: Contract payouts are now handled by backend service
  // This function is kept for house wallet manual resolution only
  const callEndGame = async (inviteCode: string, winner: string, bluePlayer: string, redPlayer: string) => {
    try {
      console.log('[CONTRACT] Manual payout call with:', { inviteCode, winner, bluePlayer, redPlayer });
      
      // Convert gameId to bytes6 format for contract
      const bytes6InviteCode = inviteCode.padEnd(6, '0').slice(0, 6);
      const winnerAddress = winner === 'blue' ? bluePlayer : redPlayer;
      
      if (!winnerAddress) {
        console.error('[CONTRACT] No winner address found');
        return;
      }

      // Call the contract (only for house wallet manual resolution)
      writeContract({
        address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'endGame',
        args: [bytes6InviteCode as `0x${string}`, winnerAddress as `0x${string}`],
      });
    } catch (error) {
      console.error('[CONTRACT] Error calling endGame:', error);
    }
  };
  
  // Game state
  const [board, setBoard] = useState<(string | null)[][]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Waiting for opponent...');
  const [gameMode, setGameMode] = useState<typeof GameMode[keyof typeof GameMode]>(GameMode.LOBBY);
  
  // Multiplayer state
  const [gameId, setGameId] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<'blue' | 'red' | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [wager, setWager] = useState<number>(0);
  const [openGames, setOpenGames] = useState<any[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [gameWager, setGameWager] = useState<number>(0);
  
  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [showPieceGallery, setShowPieceGallery] = useState(false);
  const [promotionDialog, setPromotionDialog] = useState<{ show: boolean; from: { row: number; col: number }; to: { row: number; col: number } }>({ show: false, from: { row: 0, col: 0 }, to: { row: 0, col: 0 } });
  const [victoryCelebration, setVictoryCelebration] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // Refs
  const gameChannel = useRef<any>(null);
  const celebrationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('chess-dark-mode');
      document.body.classList.add('chess-dark-mode');
    } else {
      document.documentElement.classList.remove('chess-dark-mode');
      document.body.classList.remove('chess-dark-mode');
    }
  };

  // Load leaderboard
  const loadLeaderboard = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('points', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }

      if (data) {
        setLeaderboard(data as LeaderboardEntry[]);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Update score
  const updateScore = async (gameResult: 'win' | 'loss' | 'draw') => {
    if (!address) return;

    try {
      const formattedAddress = formatAddress(address);
      
      // Get current user stats
      const { data: existingUser } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', formattedAddress)
        .single();

      const now = new Date().toISOString();
      
      if (existingUser) {
        // Update existing user
        const updates = {
          wins: existingUser.wins + (gameResult === 'win' ? 1 : 0),
          losses: existingUser.losses + (gameResult === 'loss' ? 1 : 0),
          draws: existingUser.draws + (gameResult === 'draw' ? 1 : 0),
          total_games: existingUser.total_games + 1,
          points: existingUser.points + (gameResult === 'win' ? 3 : gameResult === 'draw' ? 1 : 0),
          updated_at: now
        };

        const { error } = await supabase
          .from('leaderboard')
          .update(updates)
          .eq('username', formattedAddress);

        if (error) {
          console.error('Error updating score:', error);
        }
      } else {
        // Create new user
        const newUser = {
          username: formattedAddress,
          chain_type: 'ethereum',
          wins: gameResult === 'win' ? 1 : 0,
          losses: gameResult === 'loss' ? 1 : 0,
          draws: gameResult === 'draw' ? 1 : 0,
          total_games: 1,
          points: gameResult === 'win' ? 3 : gameResult === 'draw' ? 1 : 0,
          updated_at: now
        };

        const { error } = await supabase
          .from('leaderboard')
          .insert([newUser]);

        if (error) {
          console.error('Error creating new user score:', error);
        }
      }

      // Reload leaderboard
      await loadLeaderboard();
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  // Load open games
  const loadOpenGames = async () => {
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('game_state', 'waiting')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading open games:', error);
        return;
      }

      setOpenGames(data || []);
    } catch (error) {
      console.error('Error loading open games:', error);
    }
  };

  // Create game
  const createGame = async () => {
    if (!address || !gameTitle || gameWager < 0) return;

    setIsCreatingGame(true);
    try {
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const gameData = {
        game_id: gameId,
        game_title: gameTitle,
        bet_amount: gameWager.toString(),
        blue_player: address,
        game_state: 'waiting',
        board: JSON.stringify({ positions: initialBoard }),
        current_player: 'blue',
        chain: 'sanko',
        contract_address: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47'
      };

      const { data, error } = await supabase
        .from('chess_games')
        .insert([gameData])
        .select()
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return;
      }

      setGameId(gameId);
      setPlayerColor('blue');
      setWager(gameWager);
      setGameMode(GameMode.WAITING);
      setGameStatus('Waiting for opponent to join...');
      
      // Subscribe to game updates
      subscribeToGame(gameId);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  // Join game
  const joinGame = async (gameId: string) => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from('chess_games')
        .update({
          red_player: address,
          game_state: 'active'
        })
        .eq('game_id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error joining game:', error);
        return;
      }

      setGameId(gameId);
      setPlayerColor('red');
      setWager(parseFloat(data.bet_amount));
      setOpponent(data.blue_player);
      setGameMode(GameMode.ACTIVE);
      setGameStatus('Game started!');
      
      // Subscribe to game updates
      subscribeToGame(gameId);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  // Subscribe to game updates
  const subscribeToGame = (gameId: string) => {
    if (gameChannel.current) {
      supabase.removeChannel(gameChannel.current);
    }

    const channel = supabase
      .channel(`chess_game_${gameId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chess_games', 
        filter: `game_id=eq.${gameId}` 
      }, (payload: any) => {
        console.log('Game update received:', payload);
        
        if (payload.new) {
        const boardObj = JSON.parse(payload.new.board);
        const newBoard = Array.isArray(boardObj.positions) ? boardObj.positions as (string | null)[][] : initialBoard;
        setBoard(newBoard);
          setCurrentPlayer(payload.new.current_player || 'blue');
          
          if (payload.new.game_state === 'active') {
            setGameMode(GameMode.ACTIVE);
            setGameStatus('Game in progress');
          } else if (payload.new.game_state === 'finished') {
            setGameMode(GameMode.FINISHED);
            setGameStatus('Game finished');
          }
          
          if (payload.new.blue_player && payload.new.red_player) {
            setOpponent(playerColor === 'blue' ? payload.new.red_player : payload.new.blue_player);
          }
        }
      })
      .subscribe();

    gameChannel.current = channel;
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Chess game logic functions (same as ChessGame)
  const getPieceColor = (piece: string | null): 'blue' | 'red' => {
    return piece && piece === piece.toUpperCase() ? 'red' : 'blue';
  };

  const isWithinBoard = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  };

  const coordsToAlgebraic = (row: number, col: number): string => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return `${files[col]}${ranks[row]}`;
  };

  const isKingInCheck = (board: (string | null)[][], player: 'blue' | 'red'): boolean => {
    // Find the king
    const kingPiece = player === 'red' ? 'K' : 'k';
    let kingRow = -1, kingCol = -1;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === kingPiece) {
          kingRow = row;
          kingCol = col;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
    
    if (kingRow === -1) return false;
    
    // Check if any opponent piece can attack the king
    const opponentColor = player === 'red' ? 'blue' : 'red';
    return isSquareUnderAttack(kingRow, kingCol, opponentColor, board);
  };

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

  const wouldMoveExposeCheck = (startRow: number, startCol: number, endRow: number, endCol: number, player: 'blue' | 'red', boardState = board): boolean => {
    const piece = boardState[startRow][startCol];
    if (!piece) return false;
    
    const newBoard = boardState.map(row => [...row]);
    newBoard[endRow][endCol] = piece;
    newBoard[startRow][startCol] = null;
    
    return isKingInCheck(newBoard, player);
  };

  const isValidPawnMove = (color: 'blue' | 'red', startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    const direction = color === 'red' ? -1 : 1;
    const startRank = color === 'red' ? 6 : 1;
    
    // Forward move
    if (startCol === endCol && endRow === startRow + direction) {
      return board[endRow][endCol] === null;
    }
    
    // Initial two-square move
    if (startCol === endCol && startRow === startRank && endRow === startRow + 2 * direction) {
      return board[startRow + direction][startCol] === null && board[endRow][endCol] === null;
    }
    
    // Capture move
    if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction) {
      return board[endRow][endCol] !== null && getPieceColor(board[endRow][endCol]!) !== color;
    }
    
    return false;
  };

  const isValidRookMove = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    return startRow === endRow || startCol === endCol;
  };

  const isValidKnightMove = (startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
    const rowDiff = Math.abs(startRow - endRow);
    const colDiff = Math.abs(startCol - endCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  const isValidBishopMove = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    return Math.abs(startRow - endRow) === Math.abs(startCol - endCol);
  };

  const isValidQueenMove = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    return isValidRookMove(startRow, startCol, endRow, endCol, board) || 
           isValidBishopMove(startRow, startCol, endRow, endCol, board);
  };

  const isValidKingMove = (color: 'blue' | 'red', startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
    const rowDiff = Math.abs(startRow - endRow);
    const colDiff = Math.abs(startCol - endCol);
    return rowDiff <= 1 && colDiff <= 1;
  };

  const isPathClear = (startRow: number, startCol: number, endRow: number, endCol: number, board: (string | null)[][]): boolean => {
    const rowStep = startRow === endRow ? 0 : (endRow - startRow) / Math.abs(endRow - startRow);
    const colStep = startCol === endCol ? 0 : (endCol - startCol) / Math.abs(endCol - startCol);
    
    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;
    
    while (currentRow !== endRow || currentCol !== endCol) {
      if (board[currentRow][currentCol] !== null) {
        return false;
      }
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const canPieceMove = (piece: string, startRow: number, startCol: number, endRow: number, endCol: number, checkForCheck = true, playerColor = getPieceColor(piece), boardState = board, silent = false): boolean => {
    if (!piece) return false;
    
    const targetPiece = boardState[endRow][endCol];
    
    // Can't capture own piece
    if (targetPiece && getPieceColor(targetPiece) === playerColor) {
      return false;
    }
    
    let isValidMove = false;
    
    switch (piece.toUpperCase()) {
      case 'P': // Pawn
        isValidMove = isValidPawnMove(playerColor, startRow, startCol, endRow, endCol, boardState);
        break;
      case 'R': // Rook
        isValidMove = isValidRookMove(startRow, startCol, endRow, endCol, boardState) && 
                     isPathClear(startRow, startCol, endRow, endCol, boardState);
        break;
      case 'N': // Knight
        isValidMove = isValidKnightMove(startRow, startCol, endRow, endCol);
        break;
      case 'B': // Bishop
        isValidMove = isValidBishopMove(startRow, startCol, endRow, endCol, boardState) && 
                     isPathClear(startRow, startCol, endRow, endCol, boardState);
        break;
      case 'Q': // Queen
        isValidMove = isValidQueenMove(startRow, startCol, endRow, endCol, boardState) && 
                     isPathClear(startRow, startCol, endRow, endCol, boardState);
        break;
      case 'K': // King
        isValidMove = isValidKingMove(playerColor, startRow, startCol, endRow, endCol);
        break;
    }
    
    if (!isValidMove) return false;
    
    // Check if move would expose king to check
    if (checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, playerColor, boardState)) {
      return false;
    }
    
    return true;
  };

  const getLegalMoves = (from: { row: number; col: number }, boardState = board, player = currentPlayer): { row: number; col: number }[] => {
    const piece = boardState[from.row][from.col];
    if (!piece || getPieceColor(piece) !== player) return [];
    
    const legalMoves: { row: number; col: number }[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (canPieceMove(piece, from.row, from.col, row, col, true, player, boardState)) {
          legalMoves.push({ row, col });
        }
      }
    }
    
    return legalMoves;
  };

  const isCheckmate = (player: 'blue' | 'red', boardState = board): boolean => {
    if (!isKingInCheck(boardState, player)) return false;
    
    // Check if any piece can make a legal move
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && getPieceColor(piece) === player) {
          const legalMoves = getLegalMoves({ row, col }, boardState, player);
          if (legalMoves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const isStalemate = (player: 'blue' | 'red', boardState = board): boolean => {
    if (isKingInCheck(boardState, player)) return false;
    
    // Check if any piece can make a legal move
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && getPieceColor(piece) === player) {
          const legalMoves = getLegalMoves({ row, col }, boardState, player);
          if (legalMoves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (gameMode !== GameMode.ACTIVE || !playerColor) return;
    
    const piece = board[row][col];
    const pieceColor = piece ? getPieceColor(piece) : null;
    
    // If it's not the player's turn, don't allow moves
    if (currentPlayer !== playerColor) return;
    
    // If clicking on own piece, select it
    if (piece && pieceColor === playerColor) {
      setSelectedSquare({ row, col });
      const moves = getLegalMoves({ row, col });
      setValidMoves(moves);
      return;
    }
    
    // If a piece is selected and clicking on a valid move square
    if (selectedSquare && validMoves.some(move => move.row === row && move.col === col)) {
      makeMove(selectedSquare, { row, col });
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    // Deselect if clicking elsewhere
    setSelectedSquare(null);
    setValidMoves([]);
  };

  // Make move
  const makeMove = async (from: { row: number; col: number }, to: { row: number; col: number }) => {
    if (!playerColor || currentPlayer !== playerColor) return;
    
    const piece = board[from.row][from.col];
    if (!piece) return;
    
    // Check for pawn promotion
    if (piece.toUpperCase() === 'P' && ((playerColor === 'red' && to.row === 0) || (playerColor === 'blue' && to.row === 7))) {
      setPromotionDialog({ show: true, from, to });
      return;
    }
    
    await executeMove(from, to);
  };

  // Execute move
  const executeMove = async (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q') => {
    if (!playerColor || currentPlayer !== playerColor) return;
    
    const piece = board[from.row][from.col];
    if (!piece) return;
    
    const newBoard = board.map(row => [...row]);
    let movedPiece = piece;
    
    // Handle pawn promotion
    if (piece.toUpperCase() === 'P' && ((playerColor === 'red' && to.row === 0) || (playerColor === 'blue' && to.row === 7))) {
      movedPiece = playerColor === 'red' ? promotionPiece.toUpperCase() : promotionPiece.toLowerCase();
    }
    
    newBoard[to.row][to.col] = movedPiece;
    newBoard[from.row][from.col] = null;
    
    const nextPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    
    // Check for game end
    let gameState = 'active';
    let winner = null;
    if (isCheckmate(nextPlayer, newBoard)) {
      gameState = 'finished';
      winner = currentPlayer;
      setGameStatus(`${currentPlayer === 'red' ? 'Red' : 'Blue'} wins by checkmate!`);
      triggerVictoryCelebration();
      await updateScore(currentPlayer === playerColor ? 'win' : 'loss');
    } else if (isStalemate(nextPlayer, newBoard)) {
      gameState = 'finished';
      setGameStatus('Game ended in stalemate');
      await updateScore('draw');
    }
    
    // Update database
    try {
      const { error } = await supabase
        .from('chess_games')
        .update({
          board: JSON.stringify({ positions: newBoard }),
          current_player: nextPlayer,
          game_state: gameState,
          winner: winner,
          last_move: JSON.stringify({ from, to }),
          updated_at: new Date().toISOString()
        })
        .eq('game_id', gameId);
      
      if (error) {
        console.error('Error updating game:', error);
      }
    } catch (error) {
      console.error('Error updating game:', error);
    }
    
    setLastMove({ from, to });
    setPromotionDialog({ show: false, from: { row: 0, col: 0 }, to: { row: 0, col: 0 } });
  };

  // Victory celebration
  const triggerVictoryCelebration = () => {
    setVictoryCelebration(true);
    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current);
    }
    celebrationTimeout.current = setTimeout(() => {
      setVictoryCelebration(false);
    }, 5000);
  };

  // Play sound
  const playSound = (soundType: 'move' | 'capture' | 'check' | 'checkmate' | 'victory') => {
    try {
      const audio = new Audio(`/images/${soundType}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(e => console.warn('Audio play failed:', e));
    } catch (error) {
      console.warn('Sound play failed:', error);
    }
  };

  // Force resolve stuck game
  const forceResolveGame = async (gameId: string, resolution: 'blue_win' | 'red_win' | 'draw' | 'refund') => {
    if (!address) return;

    try {
      let gameState = 'finished';
      let winner = null;
      let gameStatus = '';

      switch (resolution) {
        case 'blue_win':
          winner = 'blue';
          gameStatus = 'Blue wins (forced resolution)';
          break;
        case 'red_win':
          winner = 'red';
          gameStatus = 'Red wins (forced resolution)';
          break;
        case 'draw':
          gameStatus = 'Game ended in draw (forced resolution)';
          break;
        case 'refund':
          gameState = 'refunded';
          gameStatus = 'Game refunded (forced resolution)';
          break;
      }

      const { error } = await supabase
        .from('chess_games')
        .update({
          game_state: gameState,
          winner: winner,
          updated_at: new Date().toISOString()
        })
        .eq('game_id', gameId);

      if (error) {
        console.error('Error forcing game resolution:', error);
        return;
      }

      // Update scores if not refund
      if (resolution !== 'refund') {
        if (resolution === 'blue_win') {
          await updateScore(address === '0xF8A323e916921b0a82Ebcb562a3441e46525822E' ? 'win' : 'loss');
        } else if (resolution === 'red_win') {
          await updateScore(address === '0x9CCa475416BC3448A539E30369792A090859De9d' ? 'win' : 'loss');
        } else if (resolution === 'draw') {
          await updateScore('draw');
        }
      }

      alert(`Game resolved: ${gameStatus}`);
      loadOpenGames(); // Refresh the games list
    } catch (error) {
      console.error('Error forcing game resolution:', error);
    }
  };

  // Resume existing game
  const resumeGame = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (error) {
        console.error('Error loading game:', error);
        return;
      }

      if (!data) {
        alert('Game not found');
        return;
      }

      // Set up the game state
      setGameId(gameId);
      setPlayerColor(address === data.blue_player ? 'blue' : 'red');
      setWager(parseFloat(data.bet_amount));
      setOpponent(address === data.blue_player ? data.red_player : data.blue_player);
      setGameMode(GameMode.ACTIVE);
      setGameStatus('Game resumed');

      // Parse board state
      console.log('[DEBUG] Resuming game with board data:', data.board, 'Type:', typeof data.board);
      
      let boardObj;
      try {
        // Try to parse as JSON string first
        boardObj = typeof data.board === 'string' ? JSON.parse(data.board) : data.board;
        console.log('[DEBUG] Parsed board object:', boardObj);
      } catch (e) {
        // If parsing fails, use the data as-is
        console.log('[DEBUG] JSON parse failed, using data as-is:', e);
        boardObj = data.board;
      }
      
      const newBoard = Array.isArray(boardObj?.positions) ? boardObj.positions as (string | null)[][] : 
                      Array.isArray(boardObj) ? boardObj as (string | null)[][] : 
                      initialBoard;
      console.log('[DEBUG] Final board state:', newBoard);
      setBoard(newBoard);
      setCurrentPlayer(data.current_player || 'blue');

      // Check for checkmate/stalemate after resuming
      const currentPlayerColor = data.current_player || 'blue';
      console.log('[DEBUG] Checking game state for player:', currentPlayerColor);
      
      // Only process game resolution if the game is still active and not already being resolved
      if (data.game_state === 'active' && !isResolvingGame) {
        if (isCheckmate(currentPlayerColor, newBoard)) {
          console.log('[DEBUG] Checkmate detected for', currentPlayerColor);
          const winner = currentPlayerColor === 'blue' ? 'red' : 'blue';
          setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins by checkmate!`);
          setGameMode(GameMode.FINISHED);
          
          // Set resolving flag to prevent duplicate calls
          setIsResolvingGame(true);

          try {
            // Update game state in database - only do this once
            const { error: updateError } = await supabase
              .from('chess_games')
              .update({ 
                game_state: 'finished',
                winner: winner,
                updated_at: new Date().toISOString()
              })
              .eq('game_id', gameId)
              .eq('game_state', 'active'); // Only update if still active
                
            if (updateError) {
              console.error('Error updating game state:', updateError);
              
              // Check if the game was already updated by the other player
              const { data: currentGameState } = await supabase
                .from('chess_games')
                .select('game_state, winner')
                .eq('game_id', gameId)
                .single();
              
              if (currentGameState?.game_state === 'finished') {
                console.log('[INFO] Game was already finished by other player');
                // Game was already resolved by the other player, just update scores
                await updateScore(winner === playerColor ? 'win' : 'loss');
                await loadLeaderboard();
                triggerVictoryCelebration();
                
                // Enable claiming winnings for the winner
                if (winner === playerColor) {
                  setCanClaimWinnings(true);
                  setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins! Click "Claim Winnings" to receive your payout.`);
                } else {
                  setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins!`);
                }
              } else {
                // Show manual resolution option
                console.log('[INFO] Database update failed. Manual resolution required.');
                if (confirm('Game resolution failed. Would you like to manually resolve the game?')) {
                  await forceResolveGame(gameId, winner === 'blue' ? 'blue_win' : 'red_win');
                }
              }
            } else {
              console.log('[DEBUG] Game state updated successfully');
              // Update scores
              await updateScore(winner === playerColor ? 'win' : 'loss');
              await loadLeaderboard();
              triggerVictoryCelebration();
              
              // Enable claiming winnings for the winner
              if (winner === playerColor) {
                setCanClaimWinnings(true);
                setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins! Click "Claim Winnings" to receive your payout.`);
              } else {
                setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins!`);
              }
            }
          } catch (error) {
            console.error('Error in game resolution:', error);
            // Reset resolving flag on error
            setIsResolvingGame(false);
          }
          return;
        }
        
        if (isStalemate(currentPlayerColor, newBoard)) {
          console.log('[DEBUG] Stalemate detected');
          setGameStatus('Game ended in stalemate');
          setGameMode(GameMode.FINISHED);
          
          try {
            // Update game state in database - only do this once
            const { error: updateError } = await supabase
              .from('chess_games')
              .update({ 
                game_state: 'finished',
                game_result: 'draw',
                updated_at: new Date().toISOString()
              })
              .eq('game_id', gameId)
              .eq('game_state', 'active'); // Only update if still active
                
            if (updateError) {
              console.error('Error updating game state:', updateError);
              
              // Check if the game was already updated by the other player
              const { data: currentGameState } = await supabase
                .from('chess_games')
                .select('game_state')
                .eq('game_id', gameId)
                .single();
              
              if (currentGameState?.game_state === 'finished') {
                console.log('[INFO] Game was already finished by other player');
                // Game was already resolved by the other player, just update scores
                await updateScore('draw');
                await loadLeaderboard();
              }
            } else {
              console.log('[DEBUG] Game state updated successfully');
              // Update scores
              await updateScore('draw');
              await loadLeaderboard();
            }
          } catch (error) {
            console.error('Error in stalemate resolution:', error);
          }
          return;
        }
      } else if (data.game_state === 'finished') {
        // Game is already finished, just show the result
        console.log('[DEBUG] Game already finished, showing result');
        setGameMode(GameMode.FINISHED);
        if (data.winner) {
          // Check if current player is the winner
          const winnerAddress = data.winner === 'blue' ? data.blue_player : data.red_player;
          if (winnerAddress === address) {
            setCanClaimWinnings(true);
            setGameStatus(`${data.winner === 'red' ? 'Red' : 'Blue'} wins! Click "Claim Winnings" to receive your payout.`);
          } else {
            setGameStatus(`${data.winner === 'red' ? 'Red' : 'Blue'} wins!`);
          }
        } else if (data.game_result === 'draw') {
          setGameStatus('Game ended in draw');
        }
        return;
      }

      // Subscribe to game updates
      subscribeToGame(gameId);
    } catch (error) {
      console.error('Error resuming game:', error);
    }
  };

  // Check for stuck games
  const checkStuckGames = async () => {
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('game_state', 'active')
        .or(`blue_player.eq.${address},red_player.eq.${address}`);

      if (error) {
        console.error('Error checking stuck games:', error);
        return;
      }

      if (data && data.length > 0) {
        const stuckGame = data[0];
        const isInGame = stuckGame.blue_player === address || stuckGame.red_player === address;
        
        if (isInGame) {
          const shouldResume = confirm(`You have an active game (${stuckGame.game_id}). Would you like to resume it?`);
          if (shouldResume) {
            resumeGame(stuckGame.game_id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking stuck games:', error);
    }
  };

  // House admin functions
  const isHouseWallet = address === '0xF8A323e916921b0a82Ebcb562a3441e46525822E'; // Replace with actual house wallet address
  
  const houseResolveGame = async (gameId: string, winner: string) => {
    if (!isHouseWallet) return;
    
    try {
      console.log('[HOUSE] Resolving game:', gameId, 'Winner:', winner);
      
      // Get game data first
      const { data: gameData, error } = await supabase
        .from('chess_games')
        .select('blue_player, red_player')
        .eq('game_id', gameId)
        .single();
      
      if (error || !gameData) {
        console.error('[HOUSE] Error fetching game data:', error);
        alert('Failed to fetch game data. Please try again.');
        return;
      }
      
      // Call contract as house wallet
      await callEndGame(gameId, winner, gameData.blue_player, gameData.red_player);
      
      // Update database
      await forceResolveGame(gameId, winner === 'blue' ? 'blue_win' : 'red_win');
      
      alert('Game resolved by house wallet. Payout processed.');
    } catch (error) {
      console.error('[HOUSE] Error resolving game:', error);
      alert('Failed to resolve game. Please try again.');
    }
  };

  // Render square
  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
    const isValidMove = validMoves.some(move => move.row === row && move.col === col);
    const isLastMove = lastMove && ((lastMove.from.row === row && lastMove.from.col === col) || (lastMove.to.row === row && lastMove.to.col === col));
    const isInCheck = piece && piece.toUpperCase() === 'K' && isKingInCheck(board, getPieceColor(piece));
    
    return (
      <div
        key={`${row}-${col}`}
        className={`square ${isSelected ? 'selected' : ''} ${isValidMove ? 'legal-move' : ''} ${isLastMove ? 'last-move' : ''} ${isInCheck ? 'square-in-check' : ''}`}
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
        {isValidMove && <div className="legal-move-indicator" />}
      </div>
    );
  };

  // Render promotion dialog
  const renderPromotionDialog = () => {
    if (!promotionDialog.show) return null;
    
    const promotionPieces = playerColor === 'red' ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];

  return (
      <div className="promotion-dialog">
        <div className="promotion-content">
          <h3>Choose promotion piece</h3>
          <div className="promotion-pieces">
            {promotionPieces.map(piece => (
              <div
                key={piece}
                className="promotion-piece"
                onClick={() => executeMove(promotionDialog.from, promotionDialog.to, piece.toLowerCase())}
              >
                <img src={pieceImages[piece]} alt={piece} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render piece gallery
  const renderPieceGallery = () => (
    <div className="piece-gallery">
      <h3>Chess Pieces</h3>
      <div className="piece-gallery-grid">
        {pieceGallery.map(piece => (
          <div key={piece.key} className="piece-gallery-item">
            <img src={piece.img} alt={piece.name} className="piece-gallery-img" />
            <div className="piece-gallery-name">{piece.name}</div>
            <div className="piece-gallery-desc">{piece.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render lobby
  const renderLobby = () => (
    <div className="chess-multiplayer-lobby">
      <h2>Multiplayer Chess Lobby</h2>
      
      {!isConnected ? (
        <div className="wallet-notice">
          Please connect your wallet to play multiplayer chess
        </div>
      ) : (
        <>
          <div className="status-bar">
            Connected: {formatAddress(address!)}
          </div>
          
          <div className="lobby-content">
            <div className="open-games">
              <h3>Open Games</h3>
              <div className="games-list">
                {openGames.map(game => (
                  <div key={game.game_id} className="game-item">
                    <div className="game-info">
                      <div className="game-id">{game.game_title || 'Untitled Game'}</div>
                      <div className="wager">Wager: {parseFloat(game.bet_amount)} ETH</div>
                      <div className="title">Created by: {formatAddress(game.blue_player)}</div>
                    </div>
                    <button 
                      className="join-btn"
                      onClick={() => joinGame(game.game_id)}
                    >
                      Join Game
                    </button>
                  </div>
                ))}
                {openGames.length === 0 && (
                  <div className="no-games">No open games available</div>
                )}
              </div>
            </div>
            
                      <div className="actions">
            <button 
              className="create-btn"
              onClick={() => setIsCreatingGame(true)}
              disabled={isCreatingGame}
            >
              Create New Game
            </button>
            <button 
              className="resume-btn"
              onClick={checkStuckGames}
              style={{ 
                marginTop: '10px',
                background: 'rgba(0, 255, 0, 0.1)',
                border: '2px solid #00ff00',
                color: '#00ff00',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              Check for Active Games
            </button>
          </div>
            
            {isCreatingGame && (
              <div className="create-form">
                <h3>Create New Game</h3>
                <div className="form-group">
                  <label>Game Title:</label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    placeholder="Enter game title"
                  />
                </div>
                <div className="form-group">
                  <label>Wager (ETH):</label>
                  <input
                    type="number"
                    value={gameWager}
                    onChange={(e) => setGameWager(Number(e.target.value))}
                    placeholder="0.01"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="create-confirm-btn"
                    onClick={createGame}
                    disabled={!gameTitle || gameWager < 0}
                  >
                    Create Game
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setIsCreatingGame(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // Render waiting screen
  const renderWaiting = () => (
    <div className="chess-multiplayer-waiting">
      <h2>Waiting for Opponent</h2>
      <div className="game-code">
        Game ID: <strong>{gameId}</strong>
      </div>
      <div className="game-info">
        <p>Wager: {wager} ETH</p>
        <p>Share this game ID with your opponent</p>
      </div>
    </div>
  );

  // Render game board
  const renderGameBoard = () => (
    <div className="chess-game">
      <div className="chess-header">
        <h2>Multiplayer Chess</h2>
        <div className="chess-controls">
          <button onClick={toggleDarkMode}>🌙</button>
          {onMinimize && <button onClick={onMinimize}>_</button>}
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="game-info">
        <span className="status">{gameStatus}</span>
        <span className="current-player">Current: {currentPlayer === 'red' ? 'Red' : 'Blue'}</span>
        <span className="wager-display">Wager: {wager} ETH</span>
        {opponent && <span>Opponent: {formatAddress(opponent)}</span>}
      </div>
      
      <div className="game-stable-layout">
        <div className="left-sidebar">
          <div className="move-history">
            <h4>Move History</h4>
            <div className="moves">
              {moveHistory.slice().reverse().map((move, idx) => (
                <div key={moveHistory.length - 1 - idx} className="move">{move}</div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="center-area">
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
            <button onClick={() => setShowPieceGallery(!showPieceGallery)}>
              {showPieceGallery ? 'Hide' : 'Show'} Piece Gallery
            </button>
            {canClaimWinnings && (
              <button 
                className="claim-winnings-btn"
                onClick={claimWinnings}
                disabled={isClaimingWinnings || isEndingGame || isWaitingForReceipt}
              >
                {isClaimingWinnings || isEndingGame || isWaitingForReceipt 
                  ? 'Claiming...' 
                  : 'Claim Winnings'}
              </button>
            )}
          </div>
        </div>
        
        <div className="right-sidebar">
          <div className="leaderboard">
            <h3>Leaderboard</h3>
            <div className="leaderboard-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>W</th>
                    <th>L</th>
                    <th>D</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.username}>
                      <td>{index + 1}</td>
                      <td>{entry.username}</td>
                      <td>{entry.wins}</td>
                      <td>{entry.losses}</td>
                      <td>{entry.draws}</td>
                      <td>{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {showPieceGallery && (
        <div className="piece-gallery-panel">
          {renderPieceGallery()}
        </div>
      )}
      
      {renderPromotionDialog()}
      
      {victoryCelebration && (
        <div className="victory-celebration">
          <div className="victory-content">
            <h2>🎉 Victory! 🎉</h2>
            <p>Congratulations on your win!</p>
          </div>
        </div>
      )}
    </div>
  );

  // Load initial data
  useEffect(() => {
    loadLeaderboard();
    loadOpenGames();
    checkStuckGames(); // Check for stuck games on load
    
    // Set up polling for open games
    const interval = setInterval(loadOpenGames, 5000);
    
    return () => {
      clearInterval(interval);
      if (gameChannel.current) {
        supabase.removeChannel(gameChannel.current);
      }
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
    };
  }, []);

  // Render based on game mode
  switch (gameMode) {
    case GameMode.LOBBY:
      return renderLobby();
    case GameMode.WAITING:
      return renderWaiting();
    case GameMode.ACTIVE:
    case GameMode.FINISHED:
      return renderGameBoard();
    default:
      return renderLobby();
  }
};

export default ChessMultiplayer; 