import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { 
  updateLeaderboardEntry, 
  updateBothPlayersScores, 
  getTopLeaderboardEntries,
  formatAddress as formatLeaderboardAddress,
  type LeaderboardEntry 
} from '../firebaseLeaderboard';
import { firebaseChess } from '../firebaseChess';
import './ChessMultiplayer.css';
import { BrowserProvider, Contract } from 'ethers';

// Smart contract ABI for chess functions
const CHESS_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "playerToGame",
    "outputs": [{"internalType": "bytes6", "name": "", "type": "bytes6"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes6", "name": "", "type": "bytes6"}],
    "name": "games",
    "outputs": [
      {"internalType": "address", "name": "player1", "type": "address"},
      {"internalType": "address", "name": "player2", "type": "address"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "address", "name": "winner", "type": "address"},
      {"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
      {"internalType": "uint256", "name": "wagerAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes6", "name": "", "type": "bytes6"}],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes6", "name": "", "type": "bytes6"}],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
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

// Add at the top, after imports
function generateBytes6InviteCode() {
  // Generate 6 random bytes and return as 0x-prefixed hex string
  const arr = new Uint8Array(6);
  window.crypto.getRandomValues(arr);
  return '0x' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getPlayerInviteCodeFromContract(address: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Ethereum provider found. Please connect your wallet.');
    }
    const provider = new BrowserProvider(window.ethereum as any);
    const contract = new Contract(
      CHESS_CONTRACT_ADDRESS,
      CHESS_CONTRACT_ABI,
      provider
    );
    const inviteCode = await contract.playerToGame(address);
    return inviteCode;
  } catch (error) {
    console.error('Error fetching invite code from contract:', error);
    return null;
  }
}

export const ChessMultiplayer: React.FC<ChessMultiplayerProps> = ({ onClose, onMinimize, fullscreen = false }) => {
  const { address, isConnected } = useAccount();
  
  // Smart contract integration
  const [contractInviteCode, setContractInviteCode] = useState<string>('');
  const [contractWinner, setContractWinner] = useState<string>('');
  const [isResolvingGame, setIsResolvingGame] = useState(false); // Prevent duplicate resolution
  const [canClaimWinnings, setCanClaimWinnings] = useState(false);
  const [isClaimingWinnings, setIsClaimingWinnings] = useState(false);
  const [hasLoadedGame, setHasLoadedGame] = useState(false); // Prevent duplicate game loading
  
  // Contract write hooks for different operations
  const { writeContract: writeCreateGame, isPending: isCreatingGameContract, data: createGameHash } = useWriteContract();
  const { writeContract: writeJoinGame, isPending: isJoiningGameContract, data: joinGameHash, error: joinGameError } = useWriteContract();
  const { writeContract: writeEndGame, isPending: isEndingGame, data: endGameHash } = useWriteContract();
  
  // Public client for contract reads
  const publicClient = usePublicClient();
  
  // Transaction receipt hooks
  const { isLoading: isWaitingForCreateReceipt } = useWaitForTransactionReceipt({
    hash: createGameHash,
  });
  
  const { isLoading: isWaitingForJoinReceipt, data: joinReceipt } = useWaitForTransactionReceipt({
    hash: joinGameHash,
  });
  
  const { isLoading: isWaitingForEndReceipt } = useWaitForTransactionReceipt({
    hash: endGameHash,
  });

  // Contract read hook for checking player's game state
  const { data: playerGameInviteCode } = useReadContract({
    address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
    abi: CHESS_CONTRACT_ABI,
    functionName: 'playerToGame',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Contract read hook for getting game details
  const { data: contractGameData } = useReadContract({
    address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
    abi: CHESS_CONTRACT_ABI,
    functionName: 'games',
    args: playerGameInviteCode ? [playerGameInviteCode] : undefined,
    query: {
      enabled: !!playerGameInviteCode && playerGameInviteCode !== '0x000000000000',
    },
  });

  // Remove all game_id state and replace with inviteCode
  const [inviteCode, setInviteCode] = useState<string>('');

  // Claim winnings function for winners
  const claimWinnings = async () => {
    if (!address || !inviteCode || !playerColor) {
      console.error('[CLAIM] Missing required data for claiming winnings');
      return;
    }

    try {
      setIsClaimingWinnings(true);
      console.log('[CLAIM] Claiming winnings for game:', inviteCode, 'Player:', playerColor, 'Address:', address);
      
      // Get game data to determine winner and invite_code
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData) {
        console.error('[CLAIM] Error fetching game data:', 'Game data not found');
        alert('Failed to fetch game data. Please try again.');
        return;
      }
      
      console.log('[CLAIM] Firebase game data:', gameData);

      // Verify this player is the winner
      // FIX: Use contract data as fallback when Firebase data is incomplete
      let winnerAddress = null;
      
      // First try to get winner from Firebase data
      if (gameData.winner && (gameData.blue_player || gameData.red_player)) {
        winnerAddress = gameData.winner === 'blue' ? gameData.blue_player : gameData.red_player;
        console.log('[CLAIM] Using Firebase winner data:', { winner: gameData.winner, winnerAddress });
      }
      
      // If Firebase data is missing player addresses, use contract data
      if (!winnerAddress && contractGameData) {
        // Also try using Firebase winner color with contract player addresses
        if (gameData.winner && (gameData.winner === 'blue' || gameData.winner === 'red')) {
          console.log('[CLAIM] Using Firebase winner color with contract player addresses');
          let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
          if (Array.isArray(contractGameData)) {
            [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = contractGameData;
          } else {
            console.error('[CLAIM] Unexpected contract data format:', contractGameData);
            alert('Failed to verify winner. Please try again.');
            return;
          }
          winnerAddress = gameData.winner === 'blue' ? player1 : player2;
          console.log('[CLAIM] Winner from Firebase color + contract addresses:', { 
            winnerColor: gameData.winner, 
            winnerAddress, 
            player1, 
            player2 
          });
        } else {
          console.log('[CLAIM] Using contract data for winner verification');
          console.log('[CLAIM] Full contract data:', contractGameData);
          let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
          if (Array.isArray(contractGameData)) {
            [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = contractGameData;
          } else {
            console.error('[CLAIM] Unexpected contract data format:', contractGameData);
            alert('Failed to verify winner. Please try again.');
            return;
          }
          
          // Map winner to player address
          // Contract winner could be: address, color string, or number
          const winnerStr = String(winner);
          if (winnerStr.startsWith('0x')) {
            // Winner is already an address
            winnerAddress = winnerStr;
          } else if (winnerStr === 'blue' || winnerStr === 'red') {
            // Winner is a color string
            winnerAddress = winnerStr === 'blue' ? player1 : player2;
          } else if (winnerStr === '1' || winnerStr === '2') {
            // Winner is a number (1=blue, 2=red)
            winnerAddress = winnerStr === '1' ? player1 : player2;
          } else {
            // Unknown winner format
            console.error('[CLAIM] Unknown winner format:', winner, 'as string:', winnerStr);
            alert('Failed to verify winner. Please try again.');
            return;
          }
          
          console.log('[CLAIM] Winner from contract:', { 
            winner, 
            winnerAddress, 
            player1, 
            player2, 
            winnerType: typeof winner,
            winnerValue: winner,
            address,
            addressType: typeof address
          });
        }
      }
      
      if (!winnerAddress) {
        console.error('[CLAIM] Could not determine winner address');
        alert('Failed to verify winner. Please try again.');
        return;
      }
      
      console.log('[CLAIM] Winner verification details:', {
        winnerAddress,
        address,
        playerColor,
        winnerAddressType: typeof winnerAddress,
        addressType: typeof address,
        addressesMatch: winnerAddress === address,
        winnerAddressLength: winnerAddress?.length,
        addressLength: address?.length
      });
      
      if (winnerAddress !== address) {
        console.error('[CLAIM] Player is not the winner', { winnerAddress, address, playerColor });
        alert('Only the winner can claim winnings.');
        return;
      }
      
      console.log('[CLAIM] ✅ Winner verification passed! Proceeding with contract call...');
      
      // Use the real invite code from the game data or contract data
      let bytes6InviteCode = gameData.invite_code;
      
      // If Firebase data is missing invite_code, use contract data
      if (!bytes6InviteCode && contractGameData) {
        console.log('[CLAIM] Using invite code from contract data');
        let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
        if (Array.isArray(contractGameData)) {
          [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = contractGameData;
          bytes6InviteCode = inviteCodeContract;
        } else {
          console.error('[CLAIM] Unexpected contract data format for invite code:', contractGameData);
          alert('Failed to get invite code. Please try again.');
          return;
        }
      }
      
      if (!bytes6InviteCode || typeof bytes6InviteCode !== 'string' || !bytes6InviteCode.startsWith('0x') || bytes6InviteCode.length !== 14) {
        console.error('[CLAIM] Invalid invite code for contract claim:', bytes6InviteCode);
        alert('Invalid invite code for contract claim.');
        return;
      }
      
      console.log('[CLAIM] Calling contract with:', {
        inviteCode: bytes6InviteCode,
        winner: winnerAddress,
        functionName: 'endGame',
        inviteCodeSource: gameData.invite_code ? 'Firebase' : 'Contract'
      });

      // Call the contract
      writeEndGame({
        address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'endGame',
        args: [bytes6InviteCode as `0x${string}`, winnerAddress as `0x${string}`],
      });
      
      console.log('[CLAIM] Contract call initiated successfully');
      
      // Check for immediate errors
      if (isEndingGame) {
        console.log('[CLAIM] Contract call is pending...');
      } else {
        console.log('[CLAIM] Contract call status:', { isEndingGame, endGameHash });
      }

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
      writeEndGame({
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
  const [playerColor, setPlayerColor] = useState<'blue' | 'red' | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [wager, setWager] = useState<number>(0);
  const [openGames, setOpenGames] = useState<any[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [pendingGameData, setPendingGameData] = useState<any>(null);
  const [pendingJoinGameData, setPendingJoinGameData] = useState<any>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [gameWager, setGameWager] = useState<number>(0);
  
  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [showPieceGallery, setShowPieceGallery] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [victoryCelebration, setVictoryCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [captureAnimation, setCaptureAnimation] = useState<{ row: number; col: number; show: boolean } | null>(null);
  
  // Piece state tracking for castling and en passant
  const [pieceState, setPieceState] = useState({
    blueKingMoved: false,
    redKingMoved: false,
    blueRooksMove: { left: false, right: false },
    redRooksMove: { left: false, right: false },
    lastPawnDoubleMove: null as { row: number; col: number } | null
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // Refs
  const gameChannel = useRef<any>(null);
  const celebrationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add after address is defined
  const addressRef = useRef(address);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  // Handle transaction receipt for game joining
  useEffect(() => {
    console.log('[JOIN RECEIPT DEBUG] - joinGameHash:', joinGameHash);
    console.log('[JOIN RECEIPT DEBUG] - isWaitingForJoinReceipt:', isWaitingForJoinReceipt);
    console.log('[JOIN RECEIPT DEBUG] - pendingJoinGameData:', pendingJoinGameData);
    console.log('[JOIN RECEIPT DEBUG] - condition:', joinGameHash && !isWaitingForJoinReceipt && pendingJoinGameData);
    
    if (joinGameHash && !isWaitingForJoinReceipt && pendingJoinGameData) {
      console.log('[CONTRACT] Join transaction confirmed:', joinGameHash);
      
      // Ensure playerColor is set correctly for the joining player
      if (address === pendingJoinGameData.address) {
        console.log('[CONTRACT] Setting playerColor to red for confirmed join transaction');
        setPlayerColor('red');
        setOpponent(pendingJoinGameData.gameData.blue_player);
      }
      
      // Update database to mark game as active
      firebaseChess
        .updateGame(pendingJoinGameData.inviteCode, {
          ...pendingJoinGameData.gameData,
          red_player: pendingJoinGameData.address,
          game_state: 'active'
        })
        .then(() => {
          console.log('[CONTRACT] Firebase updated successfully after join confirmation');
          setGameMode(GameMode.ACTIVE);
          setGameStatus('Game started!');
          subscribeToGame(pendingJoinGameData.inviteCode);
          
          // Clear pending data
          console.log('[CONTRACT] Clearing pending join data');
          setPendingJoinGameData(null);
        })
        .catch((error) => {
          console.error('Error updating game in database:', error);
          setGameStatus('Joined game on contract but failed to update database');
          setPendingJoinGameData(null);
        });
    }
  }, [joinGameHash, isWaitingForJoinReceipt, pendingJoinGameData, address]);

  // Handle transaction receipt for claim winnings
  useEffect(() => {
    if (endGameHash && !isWaitingForEndReceipt) {
      console.log('[CLAIM] End game transaction confirmed:', endGameHash);
      setGameStatus('Winnings claimed successfully! Transaction hash: ' + endGameHash.slice(0, 10) + '...');
      
      // Reset claiming state
      setIsClaimingWinnings(false);
    }
  }, [endGameHash, isWaitingForEndReceipt]);

  // Handle transaction rejection for claim winnings
  useEffect(() => {
    if (isEndingGame === false && isClaimingWinnings && !endGameHash) {
      console.log('[CLAIM] End game transaction rejected or failed');
      setGameStatus('Claim transaction was rejected. Please try again.');
      setIsClaimingWinnings(false);
    }
  }, [isEndingGame, isClaimingWinnings, endGameHash]);

  // Handle transaction receipt for game creation
  useEffect(() => {
    console.log('[CREATE DEBUG] Transaction receipt handler - createGameHash:', createGameHash);
    console.log('[CREATE DEBUG] Transaction receipt handler - isWaitingForCreateReceipt:', isWaitingForCreateReceipt);
    console.log('[CREATE DEBUG] Transaction receipt handler - pendingGameData:', pendingGameData);
    console.log('[CREATE DEBUG] Transaction receipt handler - inviteCode:', inviteCode);
    console.log('[CREATE DEBUG] Transaction receipt handler - condition:', createGameHash && !isWaitingForCreateReceipt && pendingGameData && !inviteCode);
    
    if (createGameHash && !isWaitingForCreateReceipt && pendingGameData && !inviteCode) {
      console.log('[CONTRACT] Create game transaction confirmed:', createGameHash);
      
      // Create the game in Firebase
      firebaseChess.createGame(pendingGameData).then(() => {
        console.log('[FIREBASE] Game created successfully after transaction confirmation');
        
        // Update UI
        setInviteCode(pendingGameData.invite_code);
        setPlayerColor('blue');
        setWager(gameWager);
        setGameMode(GameMode.WAITING);
        setGameStatus('Waiting for opponent to join...');
        
        // Subscribe to game updates
        subscribeToGame(pendingGameData.invite_code);
        
        // Refresh lobby to show the new game
        setTimeout(() => {
          loadOpenGames();
        }, 1000);
        
        // Clear pending data
        setPendingGameData(null);
        setIsCreatingGame(false);
      }).catch((error) => {
        console.error('[FIREBASE] Error creating game after transaction:', error);
        setGameStatus('Transaction confirmed but failed to create game in database');
        setPendingGameData(null);
        setIsCreatingGame(false);
      });
    }
  }, [createGameHash, isWaitingForCreateReceipt, pendingGameData, gameWager]);

  // Handle transaction rejection for game creation
  useEffect(() => {
    console.log('[CREATE REJECTION DEBUG] - isCreatingGameContract:', isCreatingGameContract);
    console.log('[CREATE REJECTION DEBUG] - pendingGameData:', pendingGameData);
    console.log('[CREATE REJECTION DEBUG] - createGameHash:', createGameHash);
    console.log('[CREATE REJECTION DEBUG] - condition:', isCreatingGameContract === false && pendingGameData && !createGameHash);
    
    if (isCreatingGameContract === false && pendingGameData && !createGameHash) {
      // Transaction was rejected or failed
      console.log('[CONTRACT] Create game transaction rejected or failed');
      setGameStatus('Transaction was rejected. Please try again.');
      setPendingGameData(null);
      setIsCreatingGame(false);
    }
  }, [isCreatingGameContract, pendingGameData, createGameHash]);

  // Handle transaction rejection for game joining
  useEffect(() => {
    if (isJoiningGameContract === false && pendingJoinGameData && !joinGameHash) {
      // Transaction was rejected or failed
      console.log('[CONTRACT] Join game transaction rejected or failed');
      console.log('[CONTRACT] Rejection details - isJoiningGameContract:', isJoiningGameContract);
      console.log('[CONTRACT] Rejection details - pendingJoinGameData:', pendingJoinGameData);
      console.log('[CONTRACT] Rejection details - joinGameHash:', joinGameHash);
      console.log('[CONTRACT] Rejection details - address:', address);
      console.log('[CONTRACT] Rejection details - playerGameInviteCode:', playerGameInviteCode);
      setGameStatus('Transaction was rejected. Please try again.');
      
      // Reset state and go back to lobby
      setInviteCode('');
      setPlayerColor(null);
      setWager(0);
      setOpponent(null);
      setGameMode(GameMode.LOBBY);
      setGameStatus('');
      setPendingJoinGameData(null);
    }
  }, [isJoiningGameContract, pendingJoinGameData, joinGameHash, address, playerGameInviteCode]);

  // Check player game state when contract data changes
  useEffect(() => {
    if (address && playerGameInviteCode !== undefined) {
      // Reset game loading flag when address changes
      if (!hasLoadedGame) {
        // Only check if we have both the invite code and the contract data, or if we have no invite code
        if ((playerGameInviteCode !== '0x000000000000' && contractGameData) || playerGameInviteCode === '0x000000000000') {
          checkPlayerGameState();
        }
      }
    }
  }, [address, playerGameInviteCode, contractGameData, hasLoadedGame]);

  // Reset game loading flag when address changes
  useEffect(() => {
    setHasLoadedGame(false);
  }, [address]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFallback();
      // Clean up Firebase subscription
      if (gameChannel.current) {
        // Just call the unsubscribe function
        gameChannel.current();
      }
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
    };
  }, []);

  // Check if player has an active game and load it
  const checkPlayerGameState = async () => {
    if (!address) return;
    try {
      console.log('[GAME_STATE] Checking for active games for player:', address);
      if (playerGameInviteCode && playerGameInviteCode !== '0x000000000000' && !contractGameData) {
        console.log('[GAME_STATE] Waiting for contract data...');
        return;
      }
      if (playerGameInviteCode && playerGameInviteCode !== '0x000000000000') {
        console.log('[GAME_STATE] Found game in contract:', playerGameInviteCode);
        if (contractGameData) {
          let player1, player2, isActive, winner, inviteCode, wagerAmount;
          if (Array.isArray(contractGameData)) {
            [player1, player2, isActive, winner, inviteCode, wagerAmount] = contractGameData;
          } else {
            console.error('[GAME_STATE] Unexpected contract data format:', contractGameData);
            return;
          }
          console.log('[GAME_STATE] Parsed contract game data:', { player1, player2, isActive, winner, inviteCode, wagerAmount });
          // Use the full inviteCode (bytes6 string) for all Firebase lookups and subscriptions
          if (!inviteCode) {
            console.error('[GAME_STATE] Invalid invite code:', inviteCode);
            return;
          }
          const playerColor = player1 === address ? 'blue' : 'red';
          const opponent = player1 === address ? player2 : player1;
          console.log('[GAME_STATE] Player is', playerColor, 'opponent is', opponent);
          console.log('[DEBUG] Contract address comparison:');
          console.log('[DEBUG] - player1 (blue):', player1);
          console.log('[DEBUG] - player2 (red):', player2);
          console.log('[DEBUG] - current address:', address);
          console.log('[DEBUG] - player1 === address:', player1 === address);
          console.log('[DEBUG] - player2 === address:', player2 === address);
          const firebaseGame = await firebaseChess.getGame(inviteCode);
          if (firebaseGame) {
            console.log('[GAME_STATE] Found game in Firebase:', firebaseGame);
            setInviteCode(inviteCode);
            setPlayerColor(playerColor as 'blue' | 'red');
            setWager(parseFloat(firebaseGame.bet_amount) / 1e18);
            setOpponent(opponent);
            if (firebaseGame.game_state === 'waiting') {
              setGameMode(GameMode.WAITING);
              setGameStatus('Waiting for opponent to join...');
              console.log('[GAME_STATE] Setting game mode to WAITING');
            } else if (firebaseGame.game_state === 'active' || firebaseGame.game_state === 'test_update') {
              setGameMode(GameMode.ACTIVE);
              setGameStatus('Game in progress');
              console.log('[GAME_STATE] Setting game mode to ACTIVE (from state:', firebaseGame.game_state, ')');
              if (firebaseGame.board) {
                const boardData = firebaseGame.board;
                setBoard(reconstructBoard(boardData));
                setCurrentPlayer(firebaseGame.current_player || 'blue');
              }
            } else {
              console.log('[GAME_STATE] Unknown game state:', firebaseGame.game_state, '- treating as active');
              setGameMode(GameMode.ACTIVE);
              setGameStatus('Game in progress');
              if (firebaseGame.board) {
                const boardData = firebaseGame.board;
                setBoard(reconstructBoard(boardData));
                setCurrentPlayer(firebaseGame.current_player || 'blue');
              }
            }
            // Subscribe to game updates using the full inviteCode
            subscribeToGame(inviteCode);
            setHasLoadedGame(true);
            console.log('[GAME_STATE] Game state loaded from Firebase');
            console.log('[GAME_STATE] Current game mode:', gameMode);
            console.log('[GAME_STATE] Game state from Firebase:', firebaseGame.game_state);
            return;
          } else {
            // Game exists in contract but not in Firebase - sync it
            console.log('[GAME_STATE] Game exists in contract but not in Firebase, syncing...');
            const gameData = {
              invite_code: inviteCode,
              game_title: `Game ${inviteCode.slice(-6)}`,
              bet_amount: wagerAmount ? wagerAmount.toString() : '0',
              blue_player: player1,
              red_player: player2,
              game_state: isActive ? 'active' : 'waiting',
              board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
              current_player: 'blue',
              chain: 'sanko',
              contract_address: CHESS_CONTRACT_ADDRESS,
              is_public: true
            };
            await firebaseChess.createGame(gameData);
            console.log('[GAME_STATE] Successfully synced game to Firebase:', gameData);
            setInviteCode(inviteCode);
            setPlayerColor(playerColor as 'blue' | 'red');
            setWager(parseFloat(gameData.bet_amount) / 1e18);
            setOpponent(opponent);
            if (isActive) {
              setGameMode(GameMode.ACTIVE);
              setGameStatus('Game in progress');
            } else {
              setGameMode(GameMode.WAITING);
              setGameStatus('Waiting for opponent to join...');
            }
            if (gameData.board) {
              const boardData = gameData.board;
              setBoard(reconstructBoard(boardData));
              setCurrentPlayer((gameData.current_player as 'blue' | 'red') || 'blue');
            }
            // Subscribe to game updates using the full inviteCode
            subscribeToGame(inviteCode);
            setHasLoadedGame(true);
            console.log('[GAME_STATE] Game state loaded after sync');
            return;
          }
        }
      }
      // If no contract game found, check Firebase for any active games
      console.log('[GAME_STATE] No contract game found, checking Firebase...');
      const allGames = await firebaseChess.getActiveGames();
      const activeGames = allGames.filter((game: any) => 
        game.chain === 'sanko' && 
        (game.blue_player === address || game.red_player === address) &&
        ['waiting', 'active'].includes(game.game_state)
      );
      if (activeGames && activeGames.length > 0) {
        const game = activeGames[0] as any;
        console.log('[GAME_STATE] Found active game in Firebase:', game);
        console.log('[DEBUG] Firebase fallback address comparison:');
        console.log('[DEBUG] - blue_player:', game.blue_player);
        console.log('[DEBUG] - red_player:', game.red_player);
        console.log('[DEBUG] - current address:', address);
        console.log('[DEBUG] - blue_player === address:', game.blue_player === address);
        console.log('[DEBUG] - red_player === address:', game.red_player === address);
        setInviteCode(game.invite_code);
        setPlayerColor(game.blue_player === address ? 'blue' : 'red');
        setWager(parseFloat(game.bet_amount) / 1e18);
        setOpponent(game.blue_player === address ? game.red_player : game.blue_player);
        if (game.game_state === 'waiting') {
          setGameMode(GameMode.WAITING);
          setGameStatus('Waiting for opponent to join...');
        } else if (game.game_state === 'active' || game.game_state === 'test_update') {
          setGameMode(GameMode.ACTIVE);
          setGameStatus('Game in progress');
          if (game.board) {
            const boardData = game.board;
            setBoard(reconstructBoard(boardData));
            setCurrentPlayer(game.current_player || 'blue');
          }
        } else {
          console.log('[GAME_STATE] Unknown game state in Firebase check:', game.game_state, '- treating as active');
          setGameMode(GameMode.ACTIVE);
          setGameStatus('Game in progress');
          if (game.board) {
            const boardData = game.board;
            setBoard(reconstructBoard(boardData));
            setCurrentPlayer(game.current_player || 'blue');
          }
        }
        // Subscribe to game updates using the full inviteCode
        subscribeToGame(game.invite_code);
        setHasLoadedGame(true);
        console.log('[GAME_STATE] Game state loaded successfully from Firebase');
        return;
      }
      console.log('[GAME_STATE] No active games found');
      setGameMode(GameMode.LOBBY);
      setIsCreatingGame(false);
      setHasLoadedGame(true);
    } catch (error) {
      console.error('[GAME_STATE] Error in checkPlayerGameState:', error);
    }
  };

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

  // Load leaderboard from Firebase
  const loadLeaderboard = async (): Promise<void> => {
    try {
      const data = await getTopLeaderboardEntries(20);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Update score using Firebase
  const updateScore = async (gameResult: 'win' | 'loss' | 'draw') => {
    console.log('[SCORE] updateScore called with:', gameResult, 'for address:', address);
    if (!address) {
      console.error('[SCORE] No address available for score update');
      return;
    }

    try {
      console.log('[SCORE] Updating score for address:', formatLeaderboardAddress(address));
      
      // Update leaderboard entry using Firebase
      const success = await updateLeaderboardEntry(address, gameResult);
      
      if (success) {
        console.log('[SCORE] Successfully updated score for:', formatLeaderboardAddress(address));
      } else {
        console.error('[SCORE] Failed to update score');
      }

      // Note: Leaderboard will be reloaded after both players' scores are updated
      console.log('[SCORE] updateScore completed successfully');
    } catch (error) {
      console.error('[SCORE] Error updating score:', error);
    }
  };

  // Update score for a specific player using Firebase
  const updateScoreForPlayer = async (result: 'win' | 'loss' | 'draw', playerAddress: string) => {
    try {
      console.log('[SCORE] Updating score for player:', formatLeaderboardAddress(playerAddress), 'Result:', result);
      
      const success = await updateLeaderboardEntry(playerAddress, result);
      
      if (success) {
        console.log('[SCORE] Successfully updated score for player:', formatLeaderboardAddress(playerAddress));
      } else {
        console.error('[SCORE] Failed to update score for player:', formatLeaderboardAddress(playerAddress));
      }
    } catch (error) {
      console.error('[SCORE] Error updating score for player:', playerAddress, error);
    }
  };

  // Update both players' scores when game ends using Firebase
  const updateBothPlayersScoresLocal = async (winner: 'blue' | 'red', bluePlayer: string, redPlayer: string) => {
    try {
      console.log('[SCORE] Updating both players scores:', { winner, bluePlayer, redPlayer });
      
      if (!bluePlayer || !redPlayer) {
        console.error('[SCORE] Missing player addresses from contract');
        return;
      }

      // Use Firebase function to update both players
      const success = await updateBothPlayersScores(winner, bluePlayer, redPlayer);
      
      if (success) {
        console.log('[SCORE] Successfully updated both players scores');
        // Reload leaderboard only after both players' scores are updated
        await loadLeaderboard();
      } else {
        console.error('[SCORE] Failed to update both players scores');
      }
    } catch (error) {
      console.error('[SCORE] Error updating both players scores:', error);
    }
  };

  // Load open games
  const loadOpenGames = async () => {
    try {
      const games = await firebaseChess.getOpenGames();
      console.log('[FIREBASE] Loaded open games:', games);
      
      // Clean up ghost games (games in Firebase but not in contract)
      await cleanupGhostGames(games);
      
      setOpenGames(games);
    } catch (error) {
      console.error('Error loading open games:', error);
    }
  };

  // Clean up ghost games that exist in Firebase but not in the smart contract
  const cleanupGhostGames = async (games: any[]) => {
    console.log('[CLEANUP] Checking for ghost games...');
    
    if (!publicClient) {
      console.log('[CLEANUP] Public client not available, skipping cleanup');
      return;
    }
    
    for (const game of games) {
      try {
        const bytes6InviteCode = game.invite_code;
        if (!bytes6InviteCode || typeof bytes6InviteCode !== 'string' || !bytes6InviteCode.startsWith('0x') || bytes6InviteCode.length !== 14) {
          console.warn('[CLEANUP] Invalid invite code for game:', game.invite_code, bytes6InviteCode);
          continue;
        }
        // Check if game exists in smart contract
        const contractGame = await publicClient.readContract({
          address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'games',
          args: [bytes6InviteCode as `0x${string}`],
        });
        
        if (!contractGame || (Array.isArray(contractGame) && contractGame[0] === '0x0000000000000000000000000000000000000000')) {
          // Game doesn't exist in contract - it's a ghost game
          console.log('[CLEANUP] Found ghost game:', game.invite_code, '- removing from Firebase');
          
          // Remove from Firebase
          await firebaseChess.deleteGame(game.invite_code);
          console.log('[CLEANUP] Ghost game removed:', game.invite_code);
        }
      } catch (error) {
        console.error('[CLEANUP] Error checking game:', game.invite_code, error);
      }
    }
  };

  // Create game
  const createGame = async () => {
    if (!address || gameWager <= 0) return;
    console.log('[CREATE] Starting game creation - address:', address, 'wager:', gameWager);
    setIsCreatingGame(true);
    try {
      const newInviteCode = generateBytes6InviteCode();
      console.log('[CREATE] Generated invite code:', newInviteCode);
      setInviteCode(newInviteCode);
      const gameData = {
        invite_code: newInviteCode,
        game_title: `Chess Game ${newInviteCode.slice(-6)}`,
        bet_amount: (gameWager * 1e18).toString(), // Store in wei format
        blue_player: address,
        game_state: 'waiting',
        board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
        current_player: 'blue',
        chain: 'sanko',
        contract_address: CHESS_CONTRACT_ADDRESS,
        is_public: true,
        created_at: new Date().toISOString()
      };
      console.log('[CREATE] Game data prepared:', gameData);
      console.log('[CREATE] Calling contract with args:', [newInviteCode, BigInt(Math.floor(gameWager * 1e18))]);
      
      // Call contract to create game
      writeCreateGame({
        address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'createGame',
        args: [newInviteCode as `0x${string}`],
        value: BigInt(Math.floor(gameWager * 1e18)),
      });
      console.log('[CREATE] Contract call initiated, setting pending data');
      setPendingGameData(gameData);
      setGameStatus('Creating game... Please confirm transaction in your wallet.');
    } catch (error) {
      console.error('[CREATE] Error creating game:', error);
      setGameStatus('Failed to create game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  // Join game
  const joinGame = async (inviteCode: string) => {
    if (!address) return;
    try {
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData || gameData.game_state !== 'waiting') {
        setGameStatus('Game not found or already full');
        return;
      }
      const wagerAmountWei = parseFloat(gameData.bet_amount);
      const wagerAmountTDMT = wagerAmountWei / 1e18;
      setInviteCode(inviteCode);
      setPlayerColor('red');
      setWager(wagerAmountTDMT);
      setOpponent(gameData.blue_player);
      
      console.log('[JOIN] Setting up join game with data:', {
        inviteCode,
        playerColor: 'red',
        wagerAmountTDMT,
        opponent: gameData.blue_player,
        address
      });
      
      // Check if player is trying to join their own game
      if (address === gameData.blue_player) {
        console.error('[JOIN] Player cannot join their own game');
        setGameStatus('You cannot join your own game');
        return;
      }
      
      // Check if player already has an active game
      if (playerGameInviteCode && playerGameInviteCode !== '0x000000000000') {
        console.error('[JOIN] Player already has an active game:', playerGameInviteCode);
        setGameStatus('You already have an active game');
        return;
      }
      
      // Check wallet connection and network
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
          const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
          console.log('[JOIN] Wallet state check - chainId:', chainId);
          console.log('[JOIN] Wallet state check - connectedAccounts:', accounts);
          console.log('[JOIN] Wallet state check - currentAddress:', address);
          console.log('[JOIN] Wallet state check - isConnected:', isConnected);
        } catch (error) {
          console.error('[JOIN] Error checking wallet state:', error);
        }
      }
      
      console.log('[JOIN] Contract call parameters - contractAddress:', CHESS_CONTRACT_ADDRESS);
      console.log('[JOIN] Contract call parameters - functionName: joinGame');
      console.log('[JOIN] Contract call parameters - args:', [inviteCode]);
      // The wager amount from Firebase is already in wei format (as a string)
      const wagerValue = BigInt(wagerAmountWei);
      console.log('[JOIN] Contract call parameters - wagerAmount from Firebase (wei):', wagerAmountWei);
      console.log('[JOIN] Contract call parameters - wagerValue (wei):', wagerValue);
      console.log('[JOIN] Contract call parameters - value as hex:', '0x' + wagerValue.toString(16));
      console.log('[JOIN] Contract call parameters - value in wei:', wagerValue.toString());
      
      setGameStatus('Joining game... Please confirm transaction in your wallet.');
      
      // Add a small delay to ensure wallet is ready
      setTimeout(() => {
        console.log('[JOIN] About to call writeJoinGame...');
        console.log('[JOIN] Final contract call parameters:');
        console.log('[JOIN] - address:', CHESS_CONTRACT_ADDRESS);
        console.log('[JOIN] - functionName: joinGame');
        console.log('[JOIN] - args:', [inviteCode]);
        console.log('[JOIN] - value:', wagerValue);
        console.log('[JOIN] - value as BigInt:', wagerValue.toString());
        
        writeJoinGame({
          address: CHESS_CONTRACT_ADDRESS as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'joinGame',
          args: [inviteCode as `0x${string}`],
          value: wagerValue,
        });
        console.log('[JOIN] writeJoinGame called, setting pending data...');
        // Store game data for after transaction confirmation
        setPendingJoinGameData({ inviteCode, gameData, address });
        console.log('[JOIN] Pending data set');
        console.log('[JOIN] Transaction initiated - waiting for user confirmation in MetaMask...');
      }, 500);
    } catch (error) {
      console.error('[JOIN] Error joining game:', error);
      setGameStatus('Failed to join game. Please try again.');
      setInviteCode('');
      setPlayerColor(null);
      setWager(0);
      setOpponent(null);
    }
  };

  // Subscribe to game updates
  // Efficient fallback for when real-time fails
  const [fallbackTimeout, setFallbackTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastKnownUpdate, setLastKnownUpdate] = useState<string>('');
  const [realTimeWorking, setRealTimeWorking] = useState<boolean>(true);

  // Firebase real-time updates are sufficient, no fallback needed
  const startEfficientFallback = (inviteCode: string) => {
    console.log('[FIREBASE] Real-time updates active, no fallback needed for game:', inviteCode);
  };

  const stopFallback = () => {
    console.log('[FIREBASE] No fallback to stop');
  };

  // Update subscribeToGame to use addressRef.current
  const subscribeToGame = (inviteCode: string) => {
    console.log('[FIREBASE] Setting up Firebase real-time subscription for game:', inviteCode);
    if (gameChannel.current) {
      console.log('[FIREBASE] Removing existing subscription');
      gameChannel.current();
    }
    const unsubscribe = firebaseChess.subscribeToGame(inviteCode, (gameData) => {
      const currentAddress = addressRef.current;
      
      // DEBUG: Comprehensive logging for address comparison
      console.log('=== [DEBUG] FIREBASE SUBSCRIPTION CALLBACK ===');
      console.log('[DEBUG] Current wallet address (from addressRef):', currentAddress);
      console.log('[DEBUG] Current wallet address (from useAccount):', address);
      console.log('[DEBUG] Game data received:', gameData);
      console.log('[DEBUG] Blue player from Firebase:', gameData?.blue_player);
      console.log('[DEBUG] Red player from Firebase:', gameData?.red_player);
      console.log('[DEBUG] Blue player type:', typeof gameData?.blue_player);
      console.log('[DEBUG] Red player type:', typeof gameData?.red_player);
      console.log('[DEBUG] Current address type:', typeof currentAddress);
      console.log('[DEBUG] Current playerColor state:', playerColor);
      console.log('[DEBUG] Pending join game data:', !!pendingJoinGameData);
      
      if (!gameData) {
        console.log('[DEBUG] No game data received');
        return;
      }
      
      // FIX: Enhanced logic to handle pending join transactions
      // If we have pending join data, preserve the playerColor that was set during join
      if (pendingJoinGameData && currentAddress === pendingJoinGameData.address) {
        console.log('[DEBUG] Pending join transaction detected - preserving playerColor:', playerColor);
        // Don't change playerColor, but update other data
        if (gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
          setOpponent(gameData.blue_player === currentAddress ? gameData.red_player : gameData.blue_player);
        }
      } else if (currentAddress && gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
        // Both players are set and red player is not zero address
        console.log('[DEBUG] Both players present, comparing addresses...');
        
        const blueMatch = currentAddress.toLowerCase() === gameData.blue_player.toLowerCase();
        const redMatch = currentAddress.toLowerCase() === gameData.red_player.toLowerCase();
        
        console.log('[DEBUG] Blue player match:', blueMatch);
        console.log('[DEBUG] Red player match:', redMatch);
        console.log('[DEBUG] Blue comparison:', `${currentAddress.toLowerCase()} === ${gameData.blue_player.toLowerCase()}`);
        console.log('[DEBUG] Red comparison:', `${currentAddress.toLowerCase()} === ${gameData.red_player.toLowerCase()}`);
        
        if (blueMatch && playerColor !== 'blue') {
          console.log('[DEBUG] Setting player color to BLUE');
          setPlayerColor('blue');
          setOpponent(gameData.red_player);
        } else if (redMatch && playerColor !== 'red') {
          console.log('[DEBUG] Setting player color to RED');
          setPlayerColor('red');
          setOpponent(gameData.blue_player);
        } else if (!blueMatch && !redMatch && playerColor !== null) {
          console.log('[DEBUG] No address match found - setting playerColor to null');
          setPlayerColor(null);
          setOpponent(null);
        } else {
          console.log('[DEBUG] Player color already correctly set to:', playerColor);
        }
      } else {
        // Missing player data or red player is still zero address
        console.log('[DEBUG] Missing player data or red player is zero address - using contract data as fallback');
        console.log('[DEBUG] - currentAddress:', !!currentAddress);
        console.log('[DEBUG] - blue_player:', !!gameData.blue_player);
        console.log('[DEBUG] - red_player:', gameData?.red_player);
        console.log('[DEBUG] - Current playerColor state:', playerColor);
        console.log('[DEBUG] - Contract game data available:', !!contractGameData);
        
        // FIX: More aggressive preservation of playerColor to prevent race conditions
        if (playerColor && (playerColor === 'blue' || playerColor === 'red')) {
          // If we have a valid playerColor, preserve it and don't change it
          console.log('[DEBUG] Preserving existing valid playerColor:', playerColor);
          // Don't call setPlayerColor at all to prevent re-renders
          return; // Exit early to prevent any further processing
        } else if (contractGameData && Array.isArray(contractGameData) && currentAddress) {
          // Use contract data as fallback only if we don't have a valid playerColor
          const [player1, player2] = contractGameData;
          if (player1 && player2) {
            const playerColorFromContract = player1.toLowerCase() === currentAddress.toLowerCase() ? 'blue' : 'red';
            const opponentFromContract = player1.toLowerCase() === currentAddress.toLowerCase() ? player2 : player1;
            
            console.log('[DEBUG] Setting playerColor from contract fallback:', playerColorFromContract);
            setPlayerColor(playerColorFromContract as 'blue' | 'red');
            setOpponent(opponentFromContract);
          }
        } else {
          // No valid data available, but don't set to null if we have a valid playerColor from elsewhere
          console.log('[DEBUG] No valid data available, but preserving existing playerColor if valid');
          // Only set to null if we really don't have any valid playerColor
          if (!playerColor || (playerColor !== 'blue' && playerColor !== 'red')) {
            console.log('[DEBUG] Setting playerColor to null');
            setPlayerColor(null);
          }
        }
        
        // Only update opponent if we have both players and red player is not zero
        if (gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
          setOpponent(gameData.blue_player === currentAddress ? gameData.red_player : gameData.blue_player);
        }
      }
      
      console.log('=== [DEBUG] END FIREBASE SUBSCRIPTION CALLBACK ===');
      
      // Debug wager setting
      console.log('[WAGER DEBUG] bet_amount from Firebase:', gameData.bet_amount);
      console.log('[WAGER DEBUG] bet_amount type:', typeof gameData.bet_amount);
      console.log('[WAGER DEBUG] Full gameData:', gameData);
      console.log('[WAGER DEBUG] parsed value:', gameData.bet_amount ? parseFloat(gameData.bet_amount) : 'null');
      console.log('[WAGER DEBUG] converted to TDMT:', gameData.bet_amount ? parseFloat(gameData.bet_amount) / 1e18 : 'null');
      
      // Try to get wager from contract data if Firebase doesn't have it
      let wagerValue = 0;
      if (gameData.bet_amount && !isNaN(parseFloat(gameData.bet_amount))) {
        wagerValue = parseFloat(gameData.bet_amount) / 1e18;
        console.log('[WAGER DEBUG] Setting wager from Firebase:', wagerValue);
      } else if (contractGameData && Array.isArray(contractGameData) && contractGameData[5]) {
        // Get wager from contract data (index 5 is wager amount in wei)
        wagerValue = parseFloat(contractGameData[5].toString()) / 1e18;
        console.log('[WAGER DEBUG] Setting wager from contract data:', wagerValue);
      } else {
        console.log('[WAGER DEBUG] Setting wager to 0 (no valid bet_amount found)');
      }
      setWager(wagerValue);
      if (gameData.board) setBoard(reconstructBoard(gameData.board));
      if (gameData.current_player) setCurrentPlayer(gameData.current_player);
      if (gameData.game_state === 'active') {
        setGameMode(GameMode.ACTIVE);
        setGameStatus('Game in progress');
      } else if (gameData.game_state === 'finished') {
        setGameMode(GameMode.FINISHED);
        setGameStatus('Game finished');
      } else if (gameData.game_state === 'waiting') {
        setGameMode(GameMode.WAITING);
        setGameStatus('Waiting for opponent to join...');
      }
    });
    gameChannel.current = unsubscribe;
    console.log('[FIREBASE] Firebase subscription setup complete for game:', inviteCode);
  };

  // Add useEffect to re-subscribe on address or inviteCode change
  useEffect(() => {
    if (inviteCode) {
      subscribeToGame(inviteCode);
    }
    return () => {
      if (gameChannel.current) {
        gameChannel.current();
      }
    };
  }, [inviteCode, address]);

  // FIX: Add fallback mechanism to ensure playerColor is set correctly
  useEffect(() => {
    // If we have contract data but no playerColor, set it from contract
    if (contractGameData && !playerColor && address) {
      console.log('[FALLBACK] Setting playerColor from contract data');
      let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
      if (Array.isArray(contractGameData)) {
        [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = contractGameData;
      } else {
        console.error('[FALLBACK] Unexpected contract data format:', contractGameData);
        return;
      }
      
      const playerColorFromContract = player1 === address ? 'blue' : 'red';
      const opponentFromContract = player1 === address ? player2 : player1;
      
      console.log('[FALLBACK] Contract-based player assignment:');
      console.log('[FALLBACK] - player1 (blue):', player1);
      console.log('[FALLBACK] - player2 (red):', player2);
      console.log('[FALLBACK] - current address:', address);
      console.log('[FALLBACK] - assigned color:', playerColorFromContract);
      console.log('[FALLBACK] - opponent:', opponentFromContract);
      console.log('[FALLBACK] - inviteCode from contract:', inviteCodeContract);
      
      setPlayerColor(playerColorFromContract as 'blue' | 'red');
      setOpponent(opponentFromContract);
      
      // Also set the inviteCode if it's missing
      if (!inviteCode && inviteCodeContract) {
        console.log('[FALLBACK] Setting missing inviteCode:', inviteCodeContract);
        setInviteCode(inviteCodeContract);
      }
      
      // Auto-fix missing player data in Firebase if we detect it
      if (inviteCode) {
        firebaseChess.getGame(inviteCode).then(gameData => {
          if (gameData && (!gameData.blue_player || !gameData.red_player)) {
            console.log('[AUTO-FIX] Detected missing player data, attempting to fix...');
            fixMissingPlayerData();
          }
        }).catch(error => {
          console.error('[AUTO-FIX] Error checking game data for auto-fix:', error);
        });
      }
    }
  }, [contractGameData, playerColor, address, inviteCode]);

  // Handle join transaction receipt
  useEffect(() => {
    if (joinReceipt && pendingJoinGameData) {
      console.log('[RECEIPT] Join transaction confirmed!');
      console.log('[RECEIPT] Transaction hash:', joinReceipt.transactionHash);
      console.log('[RECEIPT] Pending data:', pendingJoinGameData);
      
      // Update Firebase with the confirmed transaction
      const { inviteCode: confirmedInviteCode, gameData, address: playerAddress } = pendingJoinGameData;
      
      // Update the game in Firebase to reflect the confirmed join
      firebaseChess.updateGame(confirmedInviteCode, {
        red_player: playerAddress,
        blue_player: gameData.blue_player, // Preserve the blue player
        bet_amount: gameData.bet_amount, // Preserve the bet amount
        game_state: 'active',
        last_move: null, // Reset last move for new game
        board: {
          positions: flattenBoard(initialBoard),
          rows: 8,
          cols: 8
        },
        current_player: 'blue' // Blue always starts
      }).then(() => {
        console.log('[RECEIPT] Firebase updated successfully after join confirmation');
        setGameStatus('Game started! You are the red player.');
        setGameMode(GameMode.ACTIVE);
        
        // Clear pending data
        setPendingJoinGameData(null);
      }).catch((error) => {
        console.error('[RECEIPT] Error updating Firebase after join confirmation:', error);
        setGameStatus('Game joined but failed to update game state. Please refresh.');
      });
    }
  }, [joinReceipt, pendingJoinGameData]);

  // Handle join transaction errors
  useEffect(() => {
    if (joinGameError) {
      console.error('[ERROR] Join transaction failed:', joinGameError);
      setGameStatus(`Failed to join game: ${joinGameError.message || 'Transaction rejected'}`);
      setInviteCode('');
      setPlayerColor(null);
      setWager(0);
      setOpponent(null);
      setPendingJoinGameData(null);
    }
  }, [joinGameError]);

  // Helper function to convert board to flat structure for Firebase
  const flattenBoard = (board: (string | null)[][]): { [key: string]: string | null } => {
    const flatBoard: { [key: string]: string | null } = {};
    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        flatBoard[`${rowIndex}_${colIndex}`] = piece;
      });
    });
    return flatBoard;
  };

  // Helper function to reconstruct board from Firebase data
  const reconstructBoard = (boardData: any): (string | null)[][] => {
    if (!boardData || !boardData.positions) {
      console.warn('[BOARD] No board data available, using initial board');
      return initialBoard;
    }
    
    console.log('[BOARD] Attempting to reconstruct board from:', boardData);
    console.log('[BOARD] Positions type:', typeof boardData.positions);
    console.log('[BOARD] Positions is array:', Array.isArray(boardData.positions));
    console.log('[BOARD] Positions value:', boardData.positions);
    
    // Check if it's the new flat structure
    if (typeof boardData.positions === 'object' && !Array.isArray(boardData.positions)) {
      const flatBoard = boardData.positions as { [key: string]: string | null };
      const rows = boardData.rows || 8;
      const cols = boardData.cols || 8;
      
      const newBoard = Array(rows).fill(null).map(() => Array(cols).fill(null));
      
      // Reconstruct the 2D array from flat structure
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const key = `${row}_${col}`;
          newBoard[row][col] = flatBoard[key] || null;
        }
      }
      
      console.log('[BOARD] Reconstructed from flat structure:', newBoard);
      return newBoard;
    }
    
    // Check if it's the legacy array structure
    if (Array.isArray(boardData.positions)) {
      console.log('[BOARD] Found array structure, length:', boardData.positions.length);
      
      if (boardData.positions.length === 8) {
        const isValidBoard = boardData.positions.every((row: any, index: number) => {
          const isValid = Array.isArray(row) && row.length === 8;
          if (!isValid) {
            console.warn(`[BOARD] Row ${index} is invalid:`, row, 'Type:', typeof row, 'Length:', row?.length);
          }
          return isValid;
        });
        
        if (isValidBoard) {
          console.log('[BOARD] Using legacy array structure');
          return boardData.positions as (string | null)[][];
        } else {
          console.warn('[BOARD] Legacy array structure is malformed, using initial board');
          return initialBoard;
        }
      } else {
        console.warn('[BOARD] Array has wrong length:', boardData.positions.length, 'expected 8');
        return initialBoard;
      }
    }
    
    console.warn('[BOARD] Unknown board structure, using initial board:', boardData);
    return initialBoard;
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
    // Safety check for board structure
    if (!board || !Array.isArray(board) || board.length !== 8) {
      console.warn('[SAFETY] Invalid board structure in isSquareUnderAttack:', board);
      return false;
    }
    
    for (let r = 0; r < 8; r++) {
      if (!board[r] || !Array.isArray(board[r]) || board[r].length !== 8) {
        console.warn('[SAFETY] Invalid board row structure:', board[r]);
        return false;
      }
      
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
    const direction = color === 'blue' ? -1 : 1;
    const startingRow = color === 'blue' ? 6 : 1;
    
    // Check if target square is within board bounds
    if (!isWithinBoard(endRow, endCol)) {
      return false;
    }
    
    // Early validation - pawns can only move forward
    if (color === 'blue' && endRow >= startRow) return false; // Blue pawns move up (decreasing row)
    if (color === 'red' && endRow <= startRow) return false;  // Red pawns move down (increasing row)
    
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
      if (targetPiece !== null && getPieceColor(targetPiece) !== color) {
        return true;
      }
      
      // En passant (only if no regular capture is possible)
      if (targetPiece === null && pieceState.lastPawnDoubleMove) {
        const { row: lastPawnRow, col: lastPawnCol } = pieceState.lastPawnDoubleMove;
        if (lastPawnRow === startRow && lastPawnCol === endCol) {
          const enPassantPawn = board[startRow][endCol];
          if (enPassantPawn && enPassantPawn.toLowerCase() === 'p' && getPieceColor(enPassantPawn) !== color) {
            return true;
          }
        }
      }
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
    
    if (!isWithinBoard(endRow, endCol)) {
      return false;
    }
    
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
    
    if (!isValidMove) {
      return false;
    }
    
    // Check if move would expose king to check
    if (checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, playerColor, boardState)) {
      return false;
    }
    
    return true;
  };

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
    console.log('[CLICK] Square clicked:', { row, col });
    console.log('[CLICK] Game mode:', gameMode, 'Player color:', playerColor);
    console.log('[CLICK] Current player:', currentPlayer, 'Player color:', playerColor);
    
    if (gameMode !== GameMode.ACTIVE || !playerColor) {
      console.log('[CLICK] Game not active or no player color');
      return;
    }
    
    const piece = board[row][col];
    const pieceColor = piece ? getPieceColor(piece) : null;
    console.log('[CLICK] Piece at square:', piece, 'Piece color:', pieceColor);
    
    // If it's not the player's turn, don't allow moves
    if (currentPlayer !== playerColor) {
      console.log('[CLICK] Not player\'s turn. Current:', currentPlayer, 'Player:', playerColor);
      return;
    }
    
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
    console.log('[PROMOTION DEBUG] makeMove called with:', { from, to, playerColor, currentPlayer });
    if (!playerColor || currentPlayer !== playerColor) {
      console.log('[PROMOTION DEBUG] Early return - playerColor:', playerColor, 'currentPlayer:', currentPlayer);
      return;
    }
    
    const piece = board[from.row][from.col];
    if (!piece) {
      console.log('[PROMOTION DEBUG] No piece at position:', from);
      return;
    }
    
    console.log('[PROMOTION DEBUG] Piece:', piece, 'isPawn:', piece.toUpperCase() === 'P');
    console.log('[PROMOTION DEBUG] Current player:', currentPlayer, 'to.row:', to.row);
    console.log('[PROMOTION DEBUG] Player color:', playerColor);
    console.log('[PROMOTION DEBUG] Promotion condition check:');
    console.log('[PROMOTION DEBUG] - piece.toUpperCase() === P:', piece.toUpperCase() === 'P');
    console.log('[PROMOTION DEBUG] - currentPlayer === red && to.row === 7:', currentPlayer === 'red' && to.row === 7);
    console.log('[PROMOTION DEBUG] - currentPlayer === blue && to.row === 0:', currentPlayer === 'blue' && to.row === 0);
    console.log('[PROMOTION DEBUG] - Full condition:', piece.toUpperCase() === 'P' && ((currentPlayer === 'red' && to.row === 7) || (currentPlayer === 'blue' && to.row === 0)));
    
    // Check for pawn promotion - show dialog for user choice
    // FIX: Blue pawns promote when reaching row 0 (top), red pawns promote when reaching row 7 (bottom)
    if (piece.toUpperCase() === 'P' && ((currentPlayer === 'red' && to.row === 7) || (currentPlayer === 'blue' && to.row === 0))) {
      console.log('[PROMOTION] Showing promotion dialog for piece:', piece, 'at position:', to);
      setPromotionMove({ from, to });
      setShowPromotion(true);
      return;
    }
    
    await executeMove(from, to);
  };

  // Execute move with capture animation
  const executeMove = async (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q') => {
    if (!playerColor || currentPlayer !== playerColor) return;
    
    const piece = board[from.row][from.col];
    if (!piece) return;
    
    const capturedPiece = board[to.row][to.col];
    const isCapture = capturedPiece !== null;
    
    // Play sound effects
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
        executeMoveAfterAnimation(from, to, promotionPiece);
        setCaptureAnimation(null);
      }, 500); // Animation duration
      return;
    }
    
    // If not a capture, execute move immediately
    executeMoveAfterAnimation(from, to, promotionPiece);
  };

  // Enhanced move execution with special moves
  const executeMoveAfterAnimation = async (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q') => {
    if (!playerColor || currentPlayer !== playerColor) return;
    
    const piece = board[from.row][from.col];
    if (!piece) return;
    
    const newBoard = board.map(row => [...row]);
    let movedPiece = piece;
    
    // Handle pawn promotion
    console.log('[PROMOTION DEBUG] executeMoveAfterAnimation - checking promotion:');
    console.log('[PROMOTION DEBUG] - piece:', piece, 'isPawn:', piece.toUpperCase() === 'P');
    console.log('[PROMOTION DEBUG] - playerColor:', playerColor, 'to.row:', to.row);
    console.log('[PROMOTION DEBUG] - promotion condition:', piece.toUpperCase() === 'P' && ((playerColor === 'red' && to.row === 7) || (playerColor === 'blue' && to.row === 0)));
    console.log('[PROMOTION DEBUG] - promotionPiece:', promotionPiece);
    
    if (piece.toUpperCase() === 'P' && ((playerColor === 'red' && to.row === 7) || (playerColor === 'blue' && to.row === 0))) {
      movedPiece = playerColor === 'red' ? promotionPiece.toUpperCase() : promotionPiece.toLowerCase();
      console.log('[PROMOTION DEBUG] - Promoting pawn to:', movedPiece);
    }
    
    // Handle special moves (castling, en passant)
    handleSpecialMoves(newBoard, from, to, piece);
    
    newBoard[to.row][to.col] = movedPiece;
    newBoard[from.row][from.col] = null;
    
    // Update piece state
    updatePieceState(from, to, piece);
    
    const nextPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    
    // Check for check
    if (isKingInCheck(newBoard, nextPlayer)) {
      playSound('check');
    }
    
    // Check for game end
    let gameState = 'active';
    let winner = null;
    if (isCheckmate(nextPlayer, newBoard)) {
      gameState = 'finished';
      winner = currentPlayer;
      setGameStatus(`${currentPlayer === 'red' ? 'Red' : 'Blue'} wins by checkmate!`);
      playSound('checkmate');
      triggerVictoryCelebration();
      
      // Update scores for both players
      console.log('[SCORE] Updating scores - Winner:', currentPlayer, 'Loser:', nextPlayer);
      console.log('[SCORE] Contract game data:', contractGameData);
      console.log('[SCORE] Player game invite code:', playerGameInviteCode);
      
      if (contractGameData && contractGameData.length >= 2) {
        console.log('[SCORE] Using contract data for both players update');
        await updateBothPlayersScoresLocal(currentPlayer, contractGameData[0], contractGameData[1]);
      } else {
        console.log('[SCORE] Contract data not available, falling back to single player update');
        // Fallback to single player update if contract data not available
        await updateScore(currentPlayer === playerColor ? 'win' : 'loss');
        // Reload leaderboard after single player update
        await loadLeaderboard();
      }
      
      // Trigger contract payout for the winner
      if (winner === playerColor) {
        console.log('[CONTRACT] Triggering automatic payout for winner:', winner);
        setTimeout(() => {
          claimWinnings();
        }, 2000); // Small delay to ensure UI updates first
      }
    } else if (isStalemate(nextPlayer, newBoard)) {
      gameState = 'finished';
      setGameStatus('Game ended in stalemate');
      console.log('[SCORE] Updating scores for draw');
      await updateScore('draw');
    }
    
    // Update database
    try {
      if (!inviteCode) {
        console.error('[BUG] inviteCode is missing when trying to update game!');
        setGameStatus('Game code missing. Please reload or rejoin the game.');
        return;
      }
      console.log('[DEBUG] About to update game. inviteCode:', inviteCode, 'gameData:', {
        board: { positions: newBoard },
        current_player: nextPlayer,
        game_state: gameState,
        winner: winner,
        last_move: { from, to }
      });
      // Update Firebase database (real-time that actually works)
      // FIX: Preserve existing game data and only update the fields that change
      const currentGameData = await firebaseChess.getGame(inviteCode);
      const firebaseData = {
        ...currentGameData, // Preserve all existing data including player addresses
        board: { 
          positions: flattenBoard(newBoard),
          rows: 8,
          cols: 8
        },
        current_player: nextPlayer,
        game_state: gameState,
        winner: winner,
        last_move: { from, to }
      };
      console.log('[FIREBASE] Storing data in Firebase:', firebaseData);
      await firebaseChess.updateGame(inviteCode, firebaseData);
      console.log('[FIREBASE] Game updated successfully');
      console.log('[FIREBASE] Real-time event should be delivered immediately');
    } catch (error) {
      console.error('[DATABASE] Error updating game:', error);
    }
    setBoard(newBoard);
    setCurrentPlayer(nextPlayer);
    setLastMove({ from, to });
    setShowPromotion(false);
    setPromotionMove(null);
  };

  // Victory celebration
  const triggerVictoryCelebration = () => {
    setVictoryCelebration(true);
    playSound('victory');
    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current);
    }
    celebrationTimeout.current = setTimeout(() => {
      setVictoryCelebration(false);
    }, 5000);
  };

  // Handle special moves (castling, en passant, pawn promotion)
  const handleSpecialMoves = (newBoard: (string | null)[][], from: { row: number; col: number }, to: { row: number; col: number }, piece: string) => {
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
    
    // Handle en passant
    if (piece.toLowerCase() === 'p' && Math.abs(from.col - to.col) === 1 && newBoard[to.row][to.col] === null) {
      if (pieceState.lastPawnDoubleMove && pieceState.lastPawnDoubleMove.row === from.row && pieceState.lastPawnDoubleMove.col === to.col) {
        newBoard[from.row][to.col] = null; // Remove the captured pawn
      }
    }
  };

  // Update piece state for castling and en passant
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

  // Play sound
  const playSound = (soundType: 'move' | 'capture' | 'check' | 'checkmate' | 'victory') => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(`/images/${soundType}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(e => console.warn('Audio play failed:', e));
    } catch (error) {
      console.warn('Sound play failed:', error);
    }
  };

  // Reset corrupted game data
  const resetGameData = async () => {
    if (!inviteCode) return;
    
    try {
      console.log('[RESET] Resetting corrupted game data for:', inviteCode);
      
      const resetData = {
        board: { 
          positions: flattenBoard(initialBoard),
          rows: 8,
          cols: 8
        },
        current_player: 'blue',
        game_state: 'active',
        winner: null,
        last_move: null
      };
      
      await firebaseChess.updateGame(inviteCode, resetData);
      console.log('[RESET] Successfully reset game data');
      setGameStatus('Game reset successfully. You can now make moves.');
      
    } catch (error) {
      console.error('[RESET] Error resetting game data:', error);
      setGameStatus('Failed to reset game. Please try again.');
    }
  };

  // Force resolve stuck game
  const forceResolveGame = async (resolution: 'blue_win' | 'red_win' | 'draw' | 'refund') => {
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
      await firebaseChess.updateGame(inviteCode, {
        game_state: gameState,
        winner: winner,
        updated_at: new Date().toISOString()
      });
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

  // Resume existing game using Firebase
  const resumeGame = async () => {
    if (!address) return;
    // Use contract to get inviteCode
    const playerInviteCode = await getPlayerInviteCodeFromContract(address);
    if (!playerInviteCode || playerInviteCode === '0x000000000000') {
      setGameStatus('No active game found');
      return;
    }
    setInviteCode(playerInviteCode);
    const gameData = await firebaseChess.getGame(playerInviteCode);
    if (!gameData) {
      setGameStatus('Game not found');
      return;
    }
    setPlayerColor(address === gameData.blue_player ? 'blue' : 'red');
    setWager(parseFloat(gameData.bet_amount) / 1e18);
    setOpponent(address === gameData.blue_player ? gameData.red_player : gameData.blue_player);
    setGameMode(GameMode.ACTIVE);
    setGameStatus('Game resumed');
    setBoard(reconstructBoard(gameData.board));
    setCurrentPlayer(gameData.current_player || 'blue');
    subscribeToGame(playerInviteCode);
  };

  // Check for stuck games
  const checkStuckGames = async () => {
    try {
      // This function previously used firebaseChess.getGames, which does not exist.
      // You can use getActiveGames or getOpenGames instead, or remove this check if not needed.
      // For now, we'll just log that this is a stub.
      console.warn('[STUCK GAMES] checkStuckGames is not implemented.');
    } catch (error) {
      console.error('Error checking stuck games:', error);
    }
  };

  // House admin functions
  const isHouseWallet = address === '0xF8A323e916921b0a82Ebcb562a3441e46525822E'; // Replace with actual house wallet address
  
  // Function to handle game state inconsistency
  const handleGameStateInconsistency = async () => {
    if (!inviteCode) return;
    
    try {
      console.log('[INCONSISTENCY] Handling game state inconsistency for:', inviteCode);
      
      // Check if the game exists in Firebase but not in contract
      const firebaseGame = await firebaseChess.getGame(inviteCode);
      if (!firebaseGame) {
        console.log('[INCONSISTENCY] Game not found in Firebase, resetting state');
        setGameMode(GameMode.LOBBY);
        setInviteCode('');
        setPlayerColor(null);
        setWager(0);
        setOpponent(null);
        setGameStatus('');
        return;
      }
      
      // If game is active in Firebase but player 2 never confirmed transaction
      if (firebaseGame.game_state === 'active' && firebaseGame.red_player && firebaseGame.red_player !== '0x0000000000000000000000000000000000000000') {
        // Check if the current player is the red player
        if (address === firebaseGame.red_player) {
          console.log('[INCONSISTENCY] Player 2 found in Firebase but transaction not confirmed');
          setGameStatus('Game state inconsistent. Please try joining again or contact support.');
          
          // Reset the game state in Firebase to allow re-joining
          await firebaseChess.updateGame(inviteCode, {
            red_player: '0x0000000000000000000000000000000000000000',
            game_state: 'waiting'
          });
          
          // Reset local state
          setGameMode(GameMode.LOBBY);
          setInviteCode('');
          setPlayerColor(null);
          setWager(0);
          setOpponent(null);
          setGameStatus('Game reset. You can now try joining again.');
        }
      }
    } catch (error) {
      console.error('[INCONSISTENCY] Error handling game state inconsistency:', error);
      setGameStatus('Error handling game state. Please reload the page.');
    }
  };

  // Fix missing player data in Firebase
  const fixMissingPlayerData = async () => {
    console.log('[FIX] Attempting to fix missing player data...');
    if (!inviteCode || !address) {
      console.log('[FIX] Missing inviteCode or address');
      return;
    }
    
    try {
      // Get current game data
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData) {
        console.log('[FIX] No game data found');
        return;
      }
      
      console.log('[FIX] Current game data:', gameData);
      
      // Check if we have contract data to fix missing player data
      if (contractGameData && Array.isArray(contractGameData)) {
        const [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = contractGameData;
        
        console.log('[FIX] Contract data for fixing:');
        console.log('[FIX] - Contract player1 (blue):', player1);
        console.log('[FIX] - Contract player2 (red):', player2);
        console.log('[FIX] - Contract isActive:', isActive);
        console.log('[FIX] - Firebase blue_player:', gameData.blue_player);
        console.log('[FIX] - Firebase red_player:', gameData.red_player);
        console.log('[FIX] - Firebase game_state:', gameData.game_state);
        
        let needsUpdate = false;
        const updateData: any = {};
        
        // Check if we need to fix the red player (most common issue)
        if (player2 && player2 !== '0x0000000000000000000000000000000000000000' && 
            (!gameData.red_player || gameData.red_player === '0x0000000000000000000000000000000000000000')) {
          console.log('[FIX] Fixing red player address in Firebase');
          updateData.red_player = player2;
          needsUpdate = true;
        }
        
        // Check if we need to fix the blue player
        if (player1 && player1 !== '0x0000000000000000000000000000000000000000' && 
            (!gameData.blue_player || gameData.blue_player === '0x0000000000000000000000000000000000000000')) {
          console.log('[FIX] Fixing blue player address in Firebase');
          updateData.blue_player = player1;
          needsUpdate = true;
        }
        
        // If both players are set in contract but game is still waiting, activate it
        if (player1 && player2 && 
            player1 !== '0x0000000000000000000000000000000000000000' && 
            player2 !== '0x0000000000000000000000000000000000000000' &&
            (gameData.game_state === 'waiting' || !gameData.game_state)) {
          console.log('[FIX] Activating game in Firebase');
          updateData.game_state = 'active';
          updateData.current_player = 'blue';
          needsUpdate = true;
        }
        
        // If contract shows game is active but Firebase doesn't, sync the state
        if (isActive && gameData.game_state !== 'active') {
          console.log('[FIX] Syncing game state to active');
          updateData.game_state = 'active';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          console.log('[FIX] Updating Firebase with:', updateData);
          await firebaseChess.updateGame(inviteCode, updateData);
          console.log('[FIX] Firebase updated successfully');
        } else {
          console.log('[FIX] No missing player data to fix');
        }
      } else {
        console.log('[FIX] No contract data available for fixing');
      }
    } catch (error) {
      console.error('[FIX] Error fixing missing player data:', error);
    }
  };
  
  const houseResolveGame = async (winner: string) => {
    if (!isHouseWallet) return;
    
    try {
      console.log('[HOUSE] Resolving game:', inviteCode, 'Winner:', winner);
      
      // Get game data first
      const { data: gameData, error } = await firebaseChess.getGame(inviteCode);
      
      if (error || !gameData) {
        console.error('[HOUSE] Error fetching game data:', error);
        alert('Failed to fetch game data. Please try again.');
        return;
      }
      
      // Call contract as house wallet
      await callEndGame(inviteCode, winner, gameData.blue_player, gameData.red_player);
      
      // Update database
      await forceResolveGame(winner === 'blue' ? 'blue_win' : 'red_win');
      
      alert('Game resolved by house wallet. Payout processed.');
    } catch (error) {
      console.error('[HOUSE] Error resolving game:', error);
      alert('Failed to resolve game. Please try again.');
    }
  };

  // Sync missing games from contract to Firebase
  const syncMissingGames = async () => {
    if (!address) return;
    
    try {
      console.log('[SYNC] Checking for missing games for player:', address);
      
      // Get player's current game from contract
      const playerGameInviteCode = await getPlayerInviteCodeFromContract(address);
      console.log('[SYNC] Player game invite code from contract:', playerGameInviteCode);
      
      if (playerGameInviteCode && playerGameInviteCode !== '0x000000000000') {
        // Check if this game exists in Firebase
        const firebaseGame = await firebaseChess.getGame(playerGameInviteCode);
        
        if (!firebaseGame) {
          console.log('[SYNC] Game exists in contract but not in Firebase, syncing...');
          
          // Get game data from contract
          if (typeof window !== 'undefined' && window.ethereum) {
            const provider = new BrowserProvider(window.ethereum as any);
            const contract = new Contract(
              CHESS_CONTRACT_ADDRESS,
              CHESS_CONTRACT_ABI,
              provider
            );
            
            const gameData = await contract.games(playerGameInviteCode);
            console.log('[SYNC] Contract game data:', gameData);
            
            const [player1, player2, isActive, winner, inviteCode, wagerAmount] = gameData;
            
            // Create Firebase game data
            const firebaseGameData = {
              invite_code: playerGameInviteCode,
              game_title: `Game ${playerGameInviteCode.slice(-6)}`,
              bet_amount: wagerAmount ? wagerAmount.toString() : '0',
              blue_player: player1,
              red_player: player2,
              game_state: isActive ? 'active' : 'waiting',
              board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
              current_player: 'blue',
              chain: 'sanko',
              contract_address: CHESS_CONTRACT_ADDRESS,
              is_public: true,
              created_at: new Date().toISOString()
            };
            
            console.log('[SYNC] Creating Firebase game data:', firebaseGameData);
            await firebaseChess.createGame(firebaseGameData);
            console.log('[SYNC] Successfully synced game to Firebase');
            
            // Refresh lobby
            setTimeout(() => {
              loadOpenGames();
            }, 1000);
          }
        } else {
          console.log('[SYNC] Game already exists in Firebase');
        }
      } else {
        console.log('[SYNC] No active game found in contract');
      }
    } catch (error) {
      console.error('[SYNC] Error syncing missing games:', error);
    }
  };

  // Render square
  const renderSquare = (row: number, col: number) => {
    // Safety check for board structure
    if (!board || !Array.isArray(board) || board.length !== 8 || !board[row] || !Array.isArray(board[row]) || board[row].length !== 8) {
      console.warn('[SAFETY] Invalid board structure in renderSquare:', { row, col, board });
      return (
        <div key={`${row}-${col}`} className="square error">
          <div className="error-indicator">!</div>
        </div>
      );
    }
    
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
    console.log('[PROMOTION DEBUG] renderPromotionDialog called - showPromotion:', showPromotion, 'promotionMove:', promotionMove);
    if (!showPromotion || !promotionMove) {
      console.log('[PROMOTION DEBUG] Not rendering dialog - showPromotion:', showPromotion, 'promotionMove:', promotionMove);
      return null;
    }
    
    const pieces = currentPlayer === 'blue' ? ['q', 'r', 'b', 'n'] : ['Q', 'R', 'B', 'N'];
    
    return (
      <div className="promotion-dialog" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid gold',
        borderRadius: '8px',
        padding: '20px',
        zIndex: 1000
      }}>
        <div className="promotion-content">
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Choose promotion piece:</h3>
          <div className="promotion-pieces" style={{ display: 'flex', gap: '10px' }}>
            {pieces.map(piece => (
              <div
                key={piece}
                className="promotion-piece"
                onClick={() => {
                  console.log('[PROMOTION] Selected piece:', piece);
                  executeMove(promotionMove.from, promotionMove.to, piece);
                  setShowPromotion(false);
                  setPromotionMove(null);
                }}
                style={{
                  cursor: 'pointer',
                  padding: '10px',
                  border: '2px solid white',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <img src={pieceImages[piece]} alt={piece} style={{ width: '40px', height: '40px' }} />
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
                  <div key={game.invite_code} className="game-item">
                    <div className="game-info">
                      <div className="game-id">{game.game_title || 'Untitled Game'}</div>
                      <div className="wager">Wager: {parseFloat(game.bet_amount)} tDMT</div>
                      <div className="title">Created by: {formatAddress(game.blue_player)}</div>
                    </div>
                    <button 
                      className="join-btn"
                      onClick={() => joinGame(game.invite_code)}
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
            <button 
              onClick={loadOpenGames}
              style={{ 
                marginTop: '10px',
                background: 'rgba(0, 123, 255, 0.1)',
                border: '2px solid #007bff',
                color: '#007bff',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              🔄 Refresh Lobby
            </button>
          </div>
            
            {isCreatingGame && (
              <div className="create-form">
                <h3>Create New Game</h3>
                <div className="form-group">
                  <label>Wager (tDMT):</label>
                  <input
                    type="number"
                    value={gameWager}
                    onChange={(e) => setGameWager(Number(e.target.value))}
                    placeholder="0.1"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="create-confirm-btn"
                    onClick={createGame}
                    disabled={gameWager <= 0}
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
        Invite Code: <strong>{inviteCode}</strong>
      </div>
      <div className="game-info">
        <p>Wager: {wager} tDMT</p>
        <p>Share this invite code with your opponent</p>
      </div>
    </div>
  );

  // Render game board
  const renderGameBoard = () => (
    <div className="chess-game">
      <div className="chess-header">
        <h2>♔ Multiplayer Chess</h2>
        <div className="chess-controls">
          <button 
            onClick={toggleDarkMode}
            className="theme-toggle-btn"
            title="Toggle Dark Mode"
          >
            🌙
          </button>
          {onMinimize && (
            <button 
              onClick={onMinimize}
              className="minimize-btn"
              title="Minimize"
            >
              _
            </button>
          )}
          <button 
            onClick={onClose}
            className="close-btn"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="game-info">
        <div className="game-status-section">
          <span className={`status ${gameStatus.includes('Check') ? 'check-status' : ''}`}>
            {gameStatus}
          </span>
          <span className={`current-player ${currentPlayer === 'red' ? 'red-turn' : 'blue-turn'}`}>
            Current: {currentPlayer === 'red' ? '♔ Red' : '♔ Blue'}
          </span>
        </div>
        <div className="game-details-section">
          <span className="wager-display">💰 {wager} tDMT</span>
          {opponent && (
            <span className="opponent-info">
              vs {formatAddress(opponent)}
            </span>
          )}
        </div>
        {gameMode === GameMode.FINISHED && (
          <button 
            onClick={claimWinnings}
            disabled={isClaimingWinnings}
            className="claim-winnings-btn"
          >
            {isClaimingWinnings ? '⏳ Claiming...' : '🏆 Claim Winnings'}
          </button>
        )}
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
                  pointerEvents: 'none',
                  zIndex: 1000
                }}
              >
                <div className="explosion-effect">💥</div>
              </div>
            )}
          </div>
          
          <div className="game-controls">
            <div className="control-section">
              <button 
                onClick={() => setShowPieceGallery(!showPieceGallery)}
                className="gallery-toggle-btn"
              >
                {showPieceGallery ? '📚 Hide Gallery' : '📚 Show Gallery'}
              </button>
              
              {gameStatus.includes('corrupted') && (
                <button 
                  className="reset-game-btn"
                  onClick={resetGameData}
                >
                  🔄 Reset Game
                </button>
              )}
            </div>
            
            <div className="settings-section">
              <div className="sound-controls">
                <label className="control-label">
                  <input
                    type="checkbox"
                    id="sound-toggle"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="control-checkbox"
                  />
                  <span className="control-text">🎵 Sound Effects</span>
                </label>
                <label className="control-label">
                  <input
                    type="checkbox"
                    id="victory-toggle"
                    checked={victoryCelebration}
                    onChange={(e) => setVictoryCelebration(e.target.checked)}
                    className="control-checkbox"
                  />
                  <span className="control-text">🎉 Victory Celebration</span>
                </label>
              </div>
            </div>
            
            {canClaimWinnings && (
              <button 
                className="claim-winnings-btn"
                onClick={claimWinnings}
                disabled={isClaimingWinnings || isEndingGame || isWaitingForEndReceipt}
              >
                {isClaimingWinnings || isEndingGame || isWaitingForEndReceipt 
                  ? '⏳ Claiming...' 
                  : '🏆 Claim Winnings'}
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

  // Debug panel component for diagnosing Player 2 issues
  const renderDebugPanel = () => {
    // Always show debug panel for now to help with troubleshooting
    // if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999,
        fontFamily: 'monospace'
      }}>
        <h4 style={{margin: '0 0 10px 0'}}>🔧 Debug Panel</h4>
        <div><strong>Wallet Address:</strong> {address || 'Not connected'}</div>
        <div><strong>Player Color:</strong> {playerColor || 'null'}</div>
        <div><strong>Game Mode:</strong> {gameMode}</div>
        <div><strong>Invite Code:</strong> {inviteCode || 'none'}</div>
        <div><strong>Wager:</strong> {wager}</div>
        <div><strong>Opponent:</strong> {opponent || 'none'}</div>
        <div><strong>Current Player:</strong> {currentPlayer}</div>
        <div><strong>Contract Invite Code:</strong> {playerGameInviteCode || 'none'}</div>
        <div><strong>Contract Game Data:</strong> {contractGameData ? 'Available' : 'None'}</div>
        <div><strong>Has Loaded Game:</strong> {hasLoadedGame ? 'Yes' : 'No'}</div>
        <button 
          onClick={() => {
            console.log('=== MANUAL DEBUG TRIGGER ===');
            console.log('Current state:', {
              address,
              playerColor,
              gameMode,
              inviteCode,
              wager,
              opponent,
              currentPlayer,
              playerGameInviteCode,
              contractGameData,
              hasLoadedGame
            });
            if (inviteCode) {
              firebaseChess.getGame(inviteCode).then(game => {
                console.log('Current Firebase game data:', game);
              });
            }
          }}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Log State
        </button>
        <button 
          onClick={handleGameStateInconsistency}
          style={{
            marginTop: '5px',
            padding: '5px 10px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Fix Game State
        </button>
        <button 
          onClick={fixMissingPlayerData}
          style={{
            marginTop: '5px',
            padding: '5px 10px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Fix Player Data
        </button>
        <button 
          onClick={() => {
            console.log('[MANUAL FIX] Manually triggering fix for current game...');
            if (inviteCode) {
              fixMissingPlayerData();
            } else {
              console.log('[MANUAL FIX] No inviteCode available');
            }
          }}
          style={{
            marginTop: '5px',
            padding: '5px 10px',
            background: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Manual Fix Current Game
        </button>
        <button 
          onClick={syncMissingGames}
          style={{
            marginTop: '5px',
            padding: '5px 10px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Sync Missing Games
        </button>
        <button 
          onClick={() => {
            console.log('[MANUAL CLEAR] Clearing pending join data manually');
            setPendingJoinGameData(null);
            console.log('[MANUAL CLEAR] Pending join data cleared');
          }}
          style={{
            marginTop: '5px',
            padding: '5px 10px',
            background: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear Pending Join Data
        </button>
      </div>
    );
  };

  // Load initial data
  useEffect(() => {
    loadLeaderboard();
    loadOpenGames();
    checkStuckGames(); // Check for stuck games on load
    // Set up polling for open games - reduced frequency to prevent excessive calls
    const interval = setInterval(loadOpenGames, 30000); // Changed from 5s to 30s
    return () => {
      clearInterval(interval);
      if (gameChannel.current) {
        // Just call the unsubscribe function
        gameChannel.current();
      }
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
    };
  }, []);

  // Render based on game mode
  console.log('[RENDER] Current game mode:', gameMode, 'Game ID:', inviteCode);
  
  const mainContent = (() => {
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
  })();
  
  return (
    <>
      {mainContent}
      {renderDebugPanel()}
    </>
  );


};

export default ChessMultiplayer; 