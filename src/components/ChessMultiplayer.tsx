import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { 
  updateLeaderboardEntry, 
  updateBothPlayersScores, 
  getTopLeaderboardEntries,
  formatAddress as formatLeaderboardAddress,
  removeZeroAddressEntry,
  type LeaderboardEntry 
} from '../firebaseLeaderboard';
import { firebaseChess } from '../firebaseChess';
import './ChessMultiplayer.css';
import { BrowserProvider, Contract } from 'ethers';
import { TokenSelector } from './TokenSelector';
import { useTokenBalance, useTokenAllowance, useApproveToken } from '../hooks/useTokens';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESSES, NETWORKS, type TokenSymbol } from '../config/tokens';
import { CHESS_CONTRACT_ABI, ERC20_ABI } from '../config/abis';

// Get contract address based on current network
const getContractAddress = (chainId: number) => {
  if (chainId === NETWORKS.testnet.chainId) {
    return CONTRACT_ADDRESSES.testnet.chess;
  }
  return CONTRACT_ADDRESSES.mainnet.chess;
};

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

async function getPlayerInviteCodeFromContract(address: string, contractAddress: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Ethereum provider found. Please connect your wallet.');
    }
    const provider = new BrowserProvider(window.ethereum as any);
    const contract = new Contract(
      contractAddress,
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
  const { address, isConnected, chainId } = useAccount();
  const chessContractAddress = getContractAddress(chainId || NETWORKS.mainnet.chainId);
  
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
  const { writeContract: writeCancelGame, isPending: isCancellingGame, data: cancelGameHash } = useWriteContract();
  
  // Token approval hooks
  const { approve: approveToken, isPending: isApproving, error: approveError, hash: approveHash } = useApproveToken();
  
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
  
  const { isLoading: isWaitingForCancelReceipt } = useWaitForTransactionReceipt({
    hash: cancelGameHash,
  });

  // Handle successful refund
  useEffect(() => {
    if (cancelGameHash && !isWaitingForCancelReceipt) {
      console.log('[REFUND] Transaction completed successfully');
      setGameStatus('Game refunded successfully! Your wager has been returned.');
      
      // Update Firebase to mark game as cancelled
      const updateFirebaseAfterRefund = async () => {
        try {
          // Get the current invite code from state or try to reconstruct it
          let currentInviteCode = inviteCode;
          if (!currentInviteCode && address) {
            // Try to get from contract
            try {
              const playerInviteCode = await getPlayerInviteCodeFromContract(address, chessContractAddress);
              if (playerInviteCode && playerInviteCode !== '0x000000000000') {
                currentInviteCode = playerInviteCode;
              }
            } catch (error) {
              console.error('[REFUND] Error getting invite code from contract:', error);
            }
          }
          
          if (currentInviteCode) {
            console.log('[REFUND] Updating Firebase for cancelled game:', currentInviteCode);
            await firebaseChess.updateGame(currentInviteCode, {
              game_state: 'cancelled',
              red_player: '0x0000000000000000000000000000000000000000'
            });
            console.log('[REFUND] Firebase updated successfully');
          } else {
            console.warn('[REFUND] Could not determine invite code for Firebase update');
          }
        } catch (error) {
          console.error('[REFUND] Error updating Firebase after refund:', error);
        }
        
        // Reset game state AFTER Firebase update completes
        setGameMode(GameMode.LOBBY);
        setInviteCode('');
        setPlayerColor(null);
        debugSetWager(0, 'refund completed');
        setOpponent(null);
        
        // Refresh open games list
        loadOpenGames();
      };
      
      updateFirebaseAfterRefund();
    }
  }, [cancelGameHash, isWaitingForCancelReceipt]);

  // Contract read hook for checking player's game state
  const { data: playerGameInviteCode } = useReadContract({
    address: chessContractAddress as `0x${string}`,
    abi: CHESS_CONTRACT_ABI,
    functionName: 'playerToGame',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Contract read hook for getting game details from player's current game
  const { data: contractGameData } = useReadContract({
    address: chessContractAddress as `0x${string}`,
    abi: CHESS_CONTRACT_ABI,
    functionName: 'games',
    args: playerGameInviteCode ? [playerGameInviteCode] : undefined,
    query: {
      enabled: !!playerGameInviteCode && playerGameInviteCode !== '0x000000000000',
    },
  });

  // Remove all game_id state and replace with inviteCode
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isJoiningFromLobby, setIsJoiningFromLobby] = useState<boolean>(false);

  // Contract read hook for getting game details when joining from lobby
  const { data: lobbyGameContractData, error: lobbyGameContractError, isLoading: lobbyGameContractLoading } = useReadContract({
    address: chessContractAddress as `0x${string}`,
    abi: CHESS_CONTRACT_ABI,
    functionName: 'games',
    args: inviteCode ? [inviteCode as `0x${string}`] : undefined,
    query: {
      enabled: !!inviteCode && inviteCode !== '0x000000000000' && isJoiningFromLobby,
    },
  });

  // Debug logging for lobby contract data
  useEffect(() => {
    console.log('[LOBBY_CONTRACT] lobbyGameContractData changed:', lobbyGameContractData);
    console.log('[LOBBY_CONTRACT] lobbyGameContractError:', lobbyGameContractError);
    console.log('[LOBBY_CONTRACT] lobbyGameContractLoading:', lobbyGameContractLoading);
    console.log('[LOBBY_CONTRACT] isJoiningFromLobby:', isJoiningFromLobby);
    console.log('[LOBBY_CONTRACT] inviteCode:', inviteCode);
    console.log('[LOBBY_CONTRACT] Contract read enabled:', !!inviteCode && inviteCode !== '0x000000000000' && isJoiningFromLobby);
  }, [lobbyGameContractData, lobbyGameContractError, lobbyGameContractLoading, isJoiningFromLobby, inviteCode]);



  // Helper function to get the appropriate contract data
  const getCurrentContractGameData = () => {
    console.log('[HELPER] getCurrentContractGameData called');
    console.log('[HELPER] isJoiningFromLobby:', isJoiningFromLobby);
    console.log('[HELPER] lobbyGameContractData:', lobbyGameContractData);
    console.log('[HELPER] contractGameData:', contractGameData);
    
    if (isJoiningFromLobby && lobbyGameContractData) {
      console.log('[HELPER] Returning lobbyGameContractData');
      return lobbyGameContractData;
    }
    console.log('[HELPER] Returning contractGameData');
    return contractGameData;
  };
  
  // Debug function to track invite code changes
  const debugSetInviteCode = (newValue: string, source: string) => {
    console.log(`[INVITE_DEBUG] Setting inviteCode to "${newValue}" from ${source}`);
    if (inviteCode && !newValue) {
      console.warn(`[INVITE_DEBUG] WARNING: Clearing inviteCode from "${inviteCode}" to "${newValue}" from ${source}`);
    }
    setInviteCode(newValue);
  };
  
  // Debug function to track wager changes
  // Helper function to convert wager amount from wei to token units
  const convertWagerFromWei = (weiAmount: string | number, tokenSymbol: string = 'NATIVE_DMT'): number => {
    const decimals = SUPPORTED_TOKENS[tokenSymbol as TokenSymbol]?.decimals || 18;
    return parseFloat(weiAmount.toString()) / Math.pow(10, decimals);
  };

  const debugSetWager = (newValue: number, source: string) => {
    console.log(`[WAGER_DEBUG] Setting wager to ${newValue} TDMT from ${source}`);
    if (wager !== newValue) {
      console.log(`[WAGER_DEBUG] Wager changed from ${wager} to ${newValue} TDMT`);
    }
    setWager(newValue);
  };
  
  // Tab state for left sidebar
  const [leftSidebarTab, setLeftSidebarTab] = useState<'moves' | 'leaderboard' | 'gallery'>('moves');



  // Claim winnings function for winners
  const refundGame = async () => {
    if (!inviteCode || !address) {
      alert('No game to refund or wallet not connected');
      return;
    }
    
    try {
      console.log('[REFUND] Attempting to refund game:', inviteCode);
      
      // Check if this player is the game creator
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData || gameData.blue_player !== address) {
        alert('Only the game creator can refund the game');
        return;
      }
      
      // Check if opponent has already joined
      if (gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
        alert('Cannot refund game after opponent has joined');
        return;
      }
      
      // Call contract to cancel game
      await writeCancelGame({
        address: chessContractAddress as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'cancelGame',
        args: [inviteCode as `0x${string}`],
      });
      
      console.log('[REFUND] Cancel game transaction submitted');
    } catch (error) {
      console.error('[REFUND] Error refunding game:', error);
      alert('Failed to refund game. Please try again.');
    }
  };

  const claimWinnings = async () => {
    if (!address || !playerColor) {
      console.error('[CLAIM] Missing required data for claiming winnings');
      return;
    }
    
    // If inviteCode is missing from state, try to get it from contract
    let currentInviteCode = inviteCode;
    if (!currentInviteCode && address) {
      console.log('[CLAIM] Invite code missing from state, trying to get from contract...');
      try {
        const playerInviteCode = await getPlayerInviteCodeFromContract(address, chessContractAddress);
        if (playerInviteCode && playerInviteCode !== '0x000000000000') {
          currentInviteCode = playerInviteCode;
          console.log('[CLAIM] Retrieved invite code from contract:', currentInviteCode);
        }
      } catch (error) {
        console.error('[CLAIM] Error getting invite code from contract:', error);
      }
    }
    
    if (!currentInviteCode) {
      console.error('[CLAIM] Could not determine invite code for claiming winnings');
      alert('Could not determine game invite code. Please try refreshing the page.');
      return;
    }

    try {
      setIsClaimingWinnings(true);
      console.log('[CLAIM] Claiming winnings for game:', currentInviteCode, 'Player:', playerColor, 'Address:', address);
      
      // Get game data to determine winner and invite_code
      const gameData = await firebaseChess.getGame(currentInviteCode);
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
      const currentContractData = getCurrentContractGameData();
      if (!winnerAddress && currentContractData) {
        // Also try using Firebase winner color with contract player addresses
        if (gameData.winner && (gameData.winner === 'blue' || gameData.winner === 'red')) {
          console.log('[CLAIM] Using Firebase winner color with contract player addresses');
          let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
          if (Array.isArray(currentContractData)) {
            [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = currentContractData;
          } else {
            console.error('[CLAIM] Unexpected contract data format:', currentContractData);
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
          console.log('[CLAIM] Full contract data:', currentContractData);
          let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
          if (Array.isArray(currentContractData)) {
            [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = currentContractData;
          } else {
            console.error('[CLAIM] Unexpected contract data format:', currentContractData);
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
      
      // Use the current inviteCode (from state or contract fallback)
      let bytes6InviteCode = currentInviteCode;
      
      // If we still don't have an invite code, try to get it from contract data as fallback
      if (!bytes6InviteCode && currentContractData) {
        console.log('[CLAIM] Using invite code from contract data as fallback');
        let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
        if (Array.isArray(currentContractData)) {
          [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = currentContractData;
          bytes6InviteCode = inviteCodeContract;
        } else {
          console.error('[CLAIM] Unexpected contract data format for invite code:', currentContractData);
          alert('Failed to get invite code. Please try again.');
          return;
        }
      }
      
      // Ensure the invite code is properly formatted as bytes6
      if (!bytes6InviteCode || typeof bytes6InviteCode !== 'string') {
        console.error('[CLAIM] Invalid invite code format:', bytes6InviteCode);
        alert('Invalid invite code format.');
        return;
      }
      
      // Convert to proper bytes6 format if needed
      let formattedInviteCode = bytes6InviteCode;
      if (!bytes6InviteCode.startsWith('0x')) {
        formattedInviteCode = '0x' + bytes6InviteCode;
      }
      
      // Ensure it's exactly 6 bytes (14 characters including 0x)
      if (formattedInviteCode.length !== 14) {
        console.error('[CLAIM] Invalid invite code length for contract claim:', formattedInviteCode, 'length:', formattedInviteCode.length);
        alert('Invalid invite code length for contract claim.');
        return;
      }
      
      console.log('[CLAIM] Formatted invite code:', formattedInviteCode);
      console.log('[CLAIM] Original invite code:', bytes6InviteCode);
      console.log('[CLAIM] Winner address:', winnerAddress);
      
      console.log('[CLAIM] Calling contract with:', {
        inviteCode: bytes6InviteCode,
        winner: winnerAddress,
        functionName: 'endGame',
        inviteCodeSource: gameData.invite_code ? 'Firebase' : 'Contract',
        inviteCodeLength: bytes6InviteCode.length,
        inviteCodeValid: bytes6InviteCode.startsWith('0x') && bytes6InviteCode.length === 14,
        winnerAddressValid: winnerAddress.startsWith('0x') && winnerAddress.length === 42
      });

      // Call the contract
      console.log('[CLAIM] About to call writeEndGame with:', {
        address: chessContractAddress,
        functionName: 'endGame',
        args: [formattedInviteCode, winnerAddress],
        abiLength: CHESS_CONTRACT_ABI.length,
        chainId: chainId,
        isConnected: isConnected
      });
      
      try {
        writeEndGame({
          address: chessContractAddress as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'endGame',
          args: [formattedInviteCode as `0x${string}`, winnerAddress as `0x${string}`],
        });
        
        console.log('[CLAIM] Contract call initiated successfully');
        
        // Check for immediate errors
        if (isEndingGame) {
          console.log('[CLAIM] Contract call is pending...');
        } else {
          console.log('[CLAIM] Contract call status:', { isEndingGame, endGameHash });
        }
      } catch (error) {
        console.error('[CLAIM] Error calling writeEndGame:', error);
        alert('Failed to initiate contract call. Please try again.');
        return;
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
      
      // Ensure invite code is properly formatted as bytes6
      let formattedInviteCode = inviteCode;
      if (!inviteCode.startsWith('0x')) {
        formattedInviteCode = '0x' + inviteCode;
      }
      
      // Ensure it's exactly 6 bytes (14 characters including 0x)
      if (formattedInviteCode.length !== 14) {
        console.error('[CONTRACT] Invalid invite code length:', formattedInviteCode, 'length:', formattedInviteCode.length);
        return;
      }
      
      const winnerAddress = winner === 'blue' ? bluePlayer : redPlayer;
      
      if (!winnerAddress) {
        console.error('[CONTRACT] No winner address found');
        return;
      }

      // Call the contract (only for house wallet manual resolution)
      writeEndGame({
        address: chessContractAddress as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'endGame',
        args: [formattedInviteCode as `0x${string}`, winnerAddress as `0x${string}`],
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
  const [isLocalMoveInProgress, setIsLocalMoveInProgress] = useState(false);
  
  // Multiplayer state
  const [playerColor, setPlayerColor] = useState<'blue' | 'red' | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [wager, setWager] = useState<number>(0);
  const [openGames, setOpenGames] = useState<any[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isGameCreationInProgress, setIsGameCreationInProgress] = useState(false);
  const [pendingGameData, setPendingGameData] = useState<any>(null);
  const [pendingJoinGameData, setPendingJoinGameData] = useState<any>(null);
  const [waitingForApproval, setWaitingForApproval] = useState<boolean>(false);
  const [gameTitle, setGameTitle] = useState('');
  const [gameWager, setGameWager] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('NATIVE_DMT');

  // Debug logging for join transaction
  useEffect(() => {
    console.log('[JOIN_TRANSACTION] joinGameHash changed:', joinGameHash);
    console.log('[JOIN_TRANSACTION] isJoiningGameContract:', isJoiningGameContract);
    console.log('[JOIN_TRANSACTION] joinGameError:', joinGameError);
    console.log('[JOIN_TRANSACTION] Full join transaction state:', {
      joinGameHash,
      isJoiningGameContract,
      joinGameError,
      pendingJoinGameData
    });
  }, [joinGameHash, isJoiningGameContract, joinGameError, pendingJoinGameData]);

  // Handle token approval completion and auto-join
  useEffect(() => {
    if (!isApproving && waitingForApproval && inviteCode && isJoiningFromLobby && !joinGameHash && !isJoiningGameContract) {
      console.log('[AUTO_JOIN] Token approval completed, attempting to auto-join');
      console.log('[AUTO_JOIN] isApproving:', isApproving);
      console.log('[AUTO_JOIN] waitingForApproval:', waitingForApproval);
      console.log('[AUTO_JOIN] inviteCode:', inviteCode);
      console.log('[AUTO_JOIN] isJoiningFromLobby:', isJoiningFromLobby);
      console.log('[AUTO_JOIN] joinGameHash:', joinGameHash);
      console.log('[AUTO_JOIN] isJoiningGameContract:', isJoiningGameContract);
      
      // Reset the waiting flag
      setWaitingForApproval(false);
      
      // Auto-join after token approval is completed
      console.log('[AUTO_JOIN] Calling joinGame automatically');
      joinGame(inviteCode);
    }
  }, [isApproving, waitingForApproval, inviteCode, isJoiningFromLobby, joinGameHash, isJoiningGameContract]);
  
  // Token balance for validation
  const { balance } = useTokenBalance(selectedToken, address);
  
  // Token allowance for current wager
  const currentWagerAmountWei = BigInt(Math.floor(gameWager * Math.pow(10, SUPPORTED_TOKENS[selectedToken].decimals)));
  const { allowance } = useTokenAllowance(selectedToken, address, chessContractAddress);
  
  // UI state - always use dark mode for chess
  const [darkMode] = useState(true);
  
  // Timeout system (60 minutes = 3600000 ms)
  const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const GAME_TIMEOUT_MS = 3600000; // 60 minutes
  

  const [showPieceGallery, setShowPieceGallery] = useState(false);
  const [selectedGalleryPiece, setSelectedGalleryPiece] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [victoryCelebration, setVictoryCelebration] = useState(false);
  const [showGame, setShowGame] = useState(false); // Track when game is actually active for background
  const [sidebarView, setSidebarView] = useState<'leaderboard' | 'moves' | 'gallery'>('moves'); // Default to moves
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [captureAnimation, setCaptureAnimation] = useState<{ row: number; col: number; show: boolean } | null>(null);

  const handleTimeout = async () => {
    if (!inviteCode || !playerColor) return;
    
    console.log('[TIMEOUT] Handling timeout for game:', inviteCode);
    
    // Determine winner based on who was waiting
    const winner = currentPlayer === 'blue' ? 'red' : 'blue';
    const currentContractData = getCurrentContractGameData();
    const winnerAddress = winner === 'blue' ? currentContractData?.[0] : currentContractData?.[1];
    
    if (winnerAddress) {
      console.log('[TIMEOUT] Ending game with winner:', winnerAddress);
      
      // Call contract to end game
      writeEndGame({
        address: chessContractAddress as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'endGame',
        args: [inviteCode as `0x${string}`, winnerAddress as `0x${string}`],
      });
      
      setGameStatus(`Game ended due to timeout. ${winner === 'red' ? 'Red' : 'Blue'} wins!`);
      setGameMode(GameMode.FINISHED);
    }
  };

  // Timeout management functions
  const startTimeoutTimer = useCallback(() => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
    
    const timer = setTimeout(() => {
      console.log('[TIMEOUT] 60-minute timeout reached, ending game');
      handleTimeout();
    }, GAME_TIMEOUT_MS);
    
    setTimeoutTimer(timer);
    setLastMoveTime(Date.now());
  }, [handleTimeout]);

  const stopTimeoutTimer = useCallback(() => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      setTimeoutTimer(null);
    }
  }, []);
  
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
    if (joinGameHash && !isWaitingForJoinReceipt && pendingJoinGameData) {
      console.log('[CONTRACT] Join transaction confirmed:', joinGameHash);
      
      // Ensure playerColor is set correctly for the joining player
      if (address === pendingJoinGameData.address) {
        console.log('[CONTRACT] Setting playerColor to red for confirmed join transaction');
        setPlayerColor('red');
        setOpponent(pendingJoinGameData.gameData.blue_player);
      }
      
      // Update database to mark game as active ONLY after join transaction is confirmed
      firebaseChess
        .updateGame(pendingJoinGameData.inviteCode, {
          ...pendingJoinGameData.gameData,
          red_player: pendingJoinGameData.address,
          game_state: 'active' // Now safe to mark as active since both transactions are confirmed
        })
        .then(() => {
          console.log('[CONTRACT] Firebase updated successfully after join confirmation');
          setGameMode(GameMode.ACTIVE);
          setShowGame(true); // Enable animated background
          setGameStatus('Game started!');
          setInviteCode(pendingJoinGameData.inviteCode); // Set inviteCode for Player 2
          subscribeToGame(pendingJoinGameData.inviteCode);
          
          // Clear pending data and reset joining flag
          console.log('[CONTRACT] Clearing pending join data');
          setPendingJoinGameData(null);
          setIsJoiningFromLobby(false);
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
    if (createGameHash && !isWaitingForCreateReceipt) {
      console.log('[CONTRACT] Create game transaction confirmed:', createGameHash);
      
      // Try to get game data from pendingGameData or reconstruct it
      let gameDataToSave = pendingGameData;
      
      if (!gameDataToSave && publicClient) {
        console.log('[CREATE DEBUG] No pendingGameData, attempting to reconstruct game data');
        // Try to get the game data from the contract
        // Note: createGameHash is the transaction hash, not the invite code
        // We need to use the pendingGameData.invite_code instead
        const actualInviteCode = pendingGameData?.invite_code || createGameHash;
        console.log('[CREATE DEBUG] Using invite code for contract read:', actualInviteCode);
        
        publicClient.readContract({
          address: chessContractAddress as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'games',
          args: [actualInviteCode as `0x${string}`],
        }).then((contractGame) => {
          if (contractGame && Array.isArray(contractGame) && contractGame[0] !== '0x0000000000000000000000000000000000000000') {
            // Reconstruct game data from contract
            const reconstructedGameData = {
              invite_code: actualInviteCode,
              game_title: `Chess Game ${actualInviteCode.slice(-6)}`,
              bet_amount: contractGame[2]?.toString() || '0',
              bet_token: contractGame[1] || '',
              blue_player: contractGame[0] || '',
              red_player: '0x0000000000000000000000000000000000000000',
              game_state: 'waiting_for_join', // Changed: Only mark as waiting for join, not active
              board: { 
                positions: flattenBoard(initialBoard), 
                rows: 8, 
                cols: 8 
              },
              current_player: 'blue',
              chain: 'sanko',
              contract_address: chessContractAddress,
              is_public: true,
              created_at: new Date().toISOString()
            };
            console.log('[CREATE DEBUG] Reconstructed game data:', reconstructedGameData);
            
            // Create the game in Firebase with reconstructed data
            firebaseChess.createGame(reconstructedGameData).then(() => {
              console.log('[FIREBASE] Game created successfully with reconstructed data');
              
              // Update UI
              setInviteCode(reconstructedGameData.invite_code);
              setPlayerColor('blue');
              debugSetWager(gameWager, 'create game success');
              setGameMode(GameMode.WAITING);
              setGameStatus('Waiting for opponent to join...');
              
              // Subscribe to game updates
              subscribeToGame(reconstructedGameData.invite_code);
              
              // Refresh lobby to show the new game
              setTimeout(() => {
                loadOpenGames();
              }, 1000);
              
              // Clear pending data
              setPendingGameData(null);
              setIsCreatingGame(false);
              setIsGameCreationInProgress(false);
            }).catch((error) => {
              console.error('[FIREBASE] Error creating game with reconstructed data:', error);
              setGameStatus('Transaction confirmed but failed to create game in database');
              setPendingGameData(null);
              setIsCreatingGame(false);
              setIsGameCreationInProgress(false);
            });
          }
        }).catch((error) => {
          console.error('[CREATE DEBUG] Error reconstructing game data:', error);
          setGameStatus('Transaction confirmed but game data not available');
          setPendingGameData(null);
          setIsCreatingGame(false);
          setIsGameCreationInProgress(false);
        });
        return; // Exit early since we're handling the async operation
      }
      
      if (gameDataToSave) {
        // Create the game in Firebase with waiting_for_join state
        const gameDataWithWaitingState = {
          ...gameDataToSave,
          game_state: 'waiting_for_join' // Changed: Only mark as waiting for join, not active
        };
        
        firebaseChess.createGame(gameDataWithWaitingState).then(() => {
          console.log('[FIREBASE] Game created successfully after transaction confirmation');
          
          // Update UI
          setInviteCode(gameDataToSave.invite_code);
          setPlayerColor('blue');
          debugSetWager(gameWager, 'create game success');
          setGameMode(GameMode.WAITING);
          setGameStatus('Waiting for opponent to join...');
          
          // Subscribe to game updates
          subscribeToGame(gameDataToSave.invite_code);
          
          // Refresh lobby to show the new game
          setTimeout(() => {
            loadOpenGames();
          }, 1000);
          
          // Clear pending data
          setPendingGameData(null);
          setIsCreatingGame(false);
          setIsGameCreationInProgress(false);
        }).catch((error) => {
          console.error('[FIREBASE] Error creating game after transaction:', error);
          setGameStatus('Transaction confirmed but failed to create game in database');
          setPendingGameData(null);
          setIsCreatingGame(false);
          setIsGameCreationInProgress(false);
        });
      } else {
        console.log('[CREATE DEBUG] No game data available for Firebase creation');
        setGameStatus('Transaction confirmed but game data not available');
        setPendingGameData(null);
        setIsCreatingGame(false);
        setIsGameCreationInProgress(false);
      }
    }
  }, [createGameHash, isWaitingForCreateReceipt, pendingGameData, gameWager]);

  // Monitor pendingGameData changes
  useEffect(() => {
    console.log('[PENDING DEBUG] pendingGameData changed:', pendingGameData);
  }, [pendingGameData]);

  // Monitor pendingJoinGameData changes and auto-clear if needed
  useEffect(() => {
    console.log('[PENDING DEBUG] pendingJoinGameData changed:', pendingJoinGameData);
    
    // Auto-clear pending join data if it's been stuck for too long
    if (pendingJoinGameData) {
      const timeoutId = setTimeout(() => {
        console.log('[AUTO-CLEAR] Pending join data has been stuck for too long, clearing automatically');
        setPendingJoinGameData(null);
      }, 30000); // 30 seconds timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [pendingJoinGameData]);

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
      setIsGameCreationInProgress(false);
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
      debugSetInviteCode('', 'join transaction rejection');
      setPlayerColor(null);
      debugSetWager(0, 'join transaction rejection');
      setOpponent(null);
      setGameMode(GameMode.LOBBY);
      setGameStatus('');
      setPendingJoinGameData(null);
      setIsJoiningFromLobby(false);
    }
  }, [isJoiningGameContract, pendingJoinGameData, joinGameHash, address, playerGameInviteCode]);

  // Check player game state when contract data changes
  useEffect(() => {
    if (address && playerGameInviteCode !== undefined) {
      // Reset game loading flag when address changes
      if (!hasLoadedGame) {
        // Only check if we have both the invite code and the contract data, or if we have no invite code
        const currentContractData = getCurrentContractGameData();
        if ((playerGameInviteCode !== '0x000000000000' && currentContractData) || playerGameInviteCode === '0x000000000000') {
          checkPlayerGameState();
        }
      }
    }
  }, [address, playerGameInviteCode, contractGameData, lobbyGameContractData, hasLoadedGame]);

  // Reset game loading flag when address changes
  useEffect(() => {
    setHasLoadedGame(false);
  }, [address]);

  // Start timeout timer when game becomes active
  useEffect(() => {
    if (gameMode === GameMode.ACTIVE && playerColor) {
      console.log('[TIMEOUT] Starting timeout timer for active game');
      startTimeoutTimer();
    } else {
      stopTimeoutTimer();
    }
  }, [gameMode, playerColor]);

  // Reset timeout timer after each move
  useEffect(() => {
    if (gameMode === GameMode.ACTIVE && moveHistory.length > 0) {
      console.log('[TIMEOUT] Move made, resetting timeout timer');
      startTimeoutTimer();
    }
  }, [moveHistory, gameMode]);

  // Update countdown timer
  useEffect(() => {
    if (gameMode === GameMode.ACTIVE && timeoutTimer) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastMoveTime;
        const remaining = Math.max(0, GAME_TIMEOUT_MS - elapsed);
        setTimeoutCountdown(Math.ceil(remaining / 1000));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameMode, timeoutTimer, lastMoveTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFallback();
      stopTimeoutTimer();
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
      const currentContractData = getCurrentContractGameData();
      if (playerGameInviteCode && playerGameInviteCode !== '0x000000000000' && !currentContractData) {
        console.log('[GAME_STATE] Waiting for contract data...');
        return;
      }
      if (playerGameInviteCode && playerGameInviteCode !== '0x000000000000') {
        console.log('[GAME_STATE] Found game in contract:', playerGameInviteCode);
        if (currentContractData) {
          let player1, player2, isActive, winner, inviteCode, wagerAmount;
          if (Array.isArray(currentContractData)) {
            [player1, player2, isActive, winner, inviteCode, wagerAmount] = currentContractData;
          } else {
            console.error('[GAME_STATE] Unexpected contract data format:', currentContractData);
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
          
          const firebaseGame = await firebaseChess.getGame(inviteCode);
          if (firebaseGame) {
            console.log('[GAME_STATE] Found game in Firebase:', firebaseGame);
            setInviteCode(inviteCode);
            setPlayerColor(playerColor as 'blue' | 'red');
            debugSetWager(convertWagerFromWei(firebaseGame.bet_amount, firebaseGame.bet_token || 'DMT'), 'checkPlayerGameState Firebase');
            setOpponent(opponent);
                    if (firebaseGame.game_state === 'waiting_for_join') {
          setGameMode(GameMode.WAITING);
          setGameStatus('Waiting for opponent to join...');
          console.log('[GAME_STATE] Setting game mode to WAITING');
        } else if (firebaseGame.game_state === 'active' || firebaseGame.game_state === 'test_update') {
          setGameMode(GameMode.ACTIVE);
          setShowGame(true); // Enable animated background
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
          setShowGame(true); // Enable animated background
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
            // Game exists in contract but not in Firebase - DON'T sync it to avoid race conditions
            console.log('[GAME_STATE] Game exists in contract but not in Firebase - waiting for transaction confirmation');
            console.log('[GAME_STATE] This prevents ghost games from failed transactions');
            return;
            const gameData = {
              invite_code: inviteCode,
              game_title: `Game ${inviteCode.slice(-6)}`,
              bet_amount: wagerAmount ? wagerAmount.toString() : '0',
              bet_token: 'DMT', // Default to DMT if not specified
              blue_player: player1,
              red_player: player2,
              game_state: isActive ? 'active' : 'waiting',
              board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
              current_player: 'blue',
              chain: 'sanko',
              contract_address: chessContractAddress,
              is_public: true
            };
            await firebaseChess.createGame(gameData);
            console.log('[GAME_STATE] Successfully synced game to Firebase:', gameData);
            setInviteCode(inviteCode);
            setPlayerColor(playerColor as 'blue' | 'red');
            debugSetWager(convertWagerFromWei(gameData.bet_amount, gameData.bet_token || 'NATIVE_DMT'), 'checkPlayerGameState sync');
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

        setInviteCode(game.invite_code);
        setPlayerColor(game.blue_player === address ? 'blue' : 'red');
                    debugSetWager(convertWagerFromWei(game.bet_amount, game.bet_token || 'DMT'), 'checkPlayerGameState fallback');
        setOpponent(game.blue_player === address ? game.red_player : game.blue_player);
        if (game.game_state === 'waiting') {
          setGameMode(GameMode.WAITING);
          setGameStatus('Waiting for opponent to join...');
        } else if (game.game_state === 'active' || game.game_state === 'test_update') {
          setGameMode(GameMode.ACTIVE);
          setShowGame(true); // Enable animated background
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



  // Load leaderboard from Firebase
  const loadLeaderboard = async (): Promise<void> => {
    try {
      // First, try to remove any zero address entry
      await removeZeroAddressEntry();
      
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
      console.log('[LOBBY] Loading open games...');
      const games = await firebaseChess.getOpenGames();
      console.log('[LOBBY] Loaded open games:', games);
      console.log('[LOBBY] Number of open games:', games.length);
      
      // Temporarily disable ghost game cleanup to fix lobby issue
      // await cleanupGhostGames(games);
      
      setOpenGames(games);
    } catch (error) {
      console.error('[LOBBY] Error loading open games:', error);
    }
  };

  // Clean up ghost games that exist in Firebase but not in the smart contract
  const cleanupGhostGames = async (games: any[]) => {
    if (!publicClient) {
      return;
    }
    
    for (const game of games) {
      try {
        const bytes6InviteCode = game.invite_code;
        if (!bytes6InviteCode || typeof bytes6InviteCode !== 'string' || !bytes6InviteCode.startsWith('0x') || bytes6InviteCode.length !== 14) {
          continue;
        }
        // Check if game exists in smart contract
        const contractGame = await publicClient.readContract({
          address: chessContractAddress as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'games',
          args: [bytes6InviteCode as `0x${string}`],
        });
        
        if (!contractGame || (Array.isArray(contractGame) && contractGame[0] === '0x0000000000000000000000000000000000000000')) {
          // Game doesn't exist in contract - it's a ghost game
          // Remove from Firebase
          await firebaseChess.deleteGame(game.invite_code);
        }
      } catch (error) {
        console.error('[CLEANUP] Error checking game:', game.invite_code, error);
      }
    }
  };

  // Create game with token support
  // Check and approve token spending
  const checkAndApproveToken = async () => {
    if (!address) return false;
    
    try {
      // Check if this is a native token (like DMT)
      const isNativeToken = SUPPORTED_TOKENS[selectedToken].isNative;
      
      if (isNativeToken) {
        console.log('[APPROVAL] Native token detected, skipping approval');
        return true;
      }
      
      if (allowance < currentWagerAmountWei) {
        console.log('[APPROVAL] Token approval needed, calling approveToken');
        
        // Call approveToken and wait for the result
        return new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 60; // 30 seconds max wait
          
          // Set up a one-time listener for the approval result
          const checkApprovalResult = () => {
            attempts++;
            
            if (approveError) {
              console.error('[APPROVAL] User denied approval or error occurred:', approveError);
              setGameStatus('Token approval was cancelled. Please try again.');
              resolve(false);
              return;
            }
            
            if (approveHash && !isApproving) {
              console.log('[APPROVAL] Token approval successful, proceeding with game creation');
              resolve(true);
              return;
            }
            
            if (attempts >= maxAttempts) {
              console.error('[APPROVAL] Timeout waiting for approval result');
              setGameStatus('Approval timeout. Please try again.');
              resolve(false);
              return;
            }
            
            // Still pending, check again in a moment
            setTimeout(checkApprovalResult, 500);
          };
          
          // Start the approval process
          approveToken(selectedToken, chessContractAddress, currentWagerAmountWei);
          
          // Start checking for the result
          checkApprovalResult();
        });
      }
      
      console.log('[APPROVAL] Token already approved, proceeding with game creation');
      return true;
    } catch (error) {
      console.error('[APPROVAL] Error checking approval:', error);
      setGameStatus('Failed to check token approval. Please try again.');
      return false;
    }
  };

  const createGame = async () => {
    if (!address || gameWager <= 0) {
      return;
    }
    
    setIsGameCreationInProgress(true);
    
    try {
      // Validate sufficient token balance before proceeding
      const tokenConfig = SUPPORTED_TOKENS[selectedToken];
      const wagerAmountWei = BigInt(Math.floor(gameWager * Math.pow(10, tokenConfig.decimals)));
      
      // Check token balance
      if (publicClient) {
        try {
          let balance: bigint;
          if (tokenConfig.isNative) {
            // Check native DMT balance
            balance = await publicClient.getBalance({ address: address as `0x${string}` });
          } else {
            // Check ERC-20 token balance
            balance = await publicClient.readContract({
              address: tokenConfig.address as `0x${string}`,
              abi: [
                {
                  "constant": true,
                  "inputs": [{"name": "_owner", "type": "address"}],
                  "name": "balanceOf",
                  "outputs": [{"name": "balance", "type": "uint256"}],
                  "type": "function"
                }
              ],
              functionName: 'balanceOf',
              args: [address as `0x${string}`]
            }) as bigint;
          }
          
          console.log('[CREATE] Token balance check:', {
            token: selectedToken,
            balance: balance.toString(),
            required: wagerAmountWei.toString(),
            sufficient: balance >= wagerAmountWei
          });
          
          if (balance < wagerAmountWei) {
            const balanceFormatted = Number(balance) / Math.pow(10, tokenConfig.decimals);
            setGameStatus(`Insufficient ${selectedToken} balance. You have ${balanceFormatted.toFixed(6)} ${selectedToken}, need ${gameWager} ${selectedToken}.`);
            setIsGameCreationInProgress(false);
            return;
          }
        } catch (error) {
          console.error('[CREATE] Error checking token balance:', error);
          setGameStatus('Failed to check token balance. Please try again.');
          setIsGameCreationInProgress(false);
          return;
        }
      }
      
      // Check token approval first
      const isApproved = await checkAndApproveToken();
      if (!isApproved) {
        setIsGameCreationInProgress(false);
        return;
      }
      
      const newInviteCode = generateBytes6InviteCode();
      
      // Use selected token
      const tokenAddress = SUPPORTED_TOKENS[selectedToken].address;
      // wagerAmountWei is already declared above, reuse it
      
      // Validate wager amount against contract limits
      if (publicClient) {
        try {
          const minWager = await publicClient.readContract({
            address: chessContractAddress as `0x${string}`,
            abi: CHESS_CONTRACT_ABI,
            functionName: 'tokenMinWager',
            args: [tokenAddress as `0x${string}`]
          }) as bigint;
          
          const maxWager = await publicClient.readContract({
            address: chessContractAddress as `0x${string}`,
            abi: CHESS_CONTRACT_ABI,
            functionName: 'tokenMaxWager',
            args: [tokenAddress as `0x${string}`]
          }) as bigint;
          
          console.log('[VALIDATION] Contract limits for', selectedToken, ':', {
            minWager: minWager.toString(),
            maxWager: maxWager.toString(),
            userWager: wagerAmountWei.toString()
          });
          
          if (wagerAmountWei < minWager) {
            const minWagerFormatted = Number(minWager) / Math.pow(10, SUPPORTED_TOKENS[selectedToken].decimals);
            setGameStatus(`Wager too low. Minimum for ${selectedToken}: ${minWagerFormatted}`);
            setIsGameCreationInProgress(false);
            return;
          }
          
          if (wagerAmountWei > maxWager) {
            const maxWagerFormatted = Number(maxWager) / Math.pow(10, SUPPORTED_TOKENS[selectedToken].decimals);
            setGameStatus(`Wager too high. Maximum for ${selectedToken}: ${maxWagerFormatted}`);
            setIsGameCreationInProgress(false);
            return;
          }
          
          console.log('[VALIDATION] Wager amount is within contract limits');
        } catch (error) {
          console.warn('[VALIDATION] Could not validate wager limits, proceeding anyway:', error);
        }
      }
      
      const gameData = {
        invite_code: newInviteCode,
        game_title: `Chess Game ${newInviteCode.slice(-6)}`,
        bet_amount: wagerAmountWei.toString(),
        bet_token: selectedToken,
        blue_player: address,
        game_state: 'waiting_for_join', // Changed: Only mark as waiting for join, not active
        board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
        current_player: 'blue',
        chain: 'sanko',
        contract_address: chessContractAddress,
        is_public: true,
        created_at: new Date().toISOString()
      };
      console.log('[CREATE] Game data prepared:', gameData);
      console.log('[CREATE] Calling contract with args:', [newInviteCode, tokenAddress, wagerAmountWei]);
      
      // Estimate gas for createGame function
      let gasLimit = 300000n;
      try {
        if (publicClient) {
          const estimatedGas = await publicClient.estimateContractGas({
            address: chessContractAddress as `0x${string}`,
            abi: CHESS_CONTRACT_ABI,
            functionName: 'createGame',
            args: [newInviteCode as `0x${string}`, tokenAddress as `0x${string}`, wagerAmountWei],
            account: address as `0x${string}`,
          });
          gasLimit = estimatedGas;
          console.log('[CREATE] Estimated gas:', estimatedGas.toString());
        }
      } catch (error) {
        console.warn('[CREATE] Gas estimation failed, using default:', error);
      }

      // Call contract to create game with token parameters and proper gas estimation
      let result;
      if (SUPPORTED_TOKENS[selectedToken].isNative) {
        // Native DMT transaction - include value
        console.log('[CREATE] Native DMT transaction - adding value:', wagerAmountWei.toString());
        result = writeCreateGame({
          address: chessContractAddress as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'createGame',
          args: [newInviteCode as `0x${string}`, tokenAddress as `0x${string}`, wagerAmountWei],
          gas: gasLimit,
          value: wagerAmountWei as any, // Type assertion for native token support
        });
      } else {
        // ERC-20 token transaction - no value
        result = writeCreateGame({
          address: chessContractAddress as `0x${string}`,
          abi: CHESS_CONTRACT_ABI,
          functionName: 'createGame',
          args: [newInviteCode as `0x${string}`, tokenAddress as `0x${string}`, wagerAmountWei],
          gas: gasLimit,
        });
      }
      console.log('[CREATE] Contract call initiated, result:', result);
      console.log('[CREATE] createGameHash after writeCreateGame:', createGameHash);
      console.log('[CREATE] Pending game data being set:', gameData);
      setPendingGameData(gameData);
      setGameStatus('Creating game... Please confirm transaction in your wallet.');
    } catch (error) {
      console.error('[CREATE] Error creating game:', error);
      setGameStatus('Failed to create game. Please try again.');
    } finally {
      setIsGameCreationInProgress(false);
    }
  };

  // Join game
  const joinGame = async (inviteCode: string) => {
    if (!address) return;
    try {
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData || gameData.game_state !== 'waiting_for_join') {
        setGameStatus('Game not found or already full');
        return;
      }
      
      // Validate sufficient token balance before proceeding
      const tokenSymbol = gameData.bet_token as TokenSymbol;
      const tokenConfig = SUPPORTED_TOKENS[tokenSymbol];
      const wagerAmountWei = BigInt(gameData.bet_amount);
      
      if (publicClient) {
        try {
          let balance: bigint;
          if (tokenConfig.isNative) {
            // Check native DMT balance
            balance = await publicClient.getBalance({ address: address as `0x${string}` });
          } else {
            // Check ERC-20 token balance
            balance = await publicClient.readContract({
              address: tokenConfig.address as `0x${string}`,
              abi: [
                {
                  "constant": true,
                  "inputs": [{"name": "_owner", "type": "address"}],
                  "name": "balanceOf",
                  "outputs": [{"name": "balance", "type": "uint256"}],
                  "type": "function"
                }
              ],
              functionName: 'balanceOf',
              args: [address as `0x${string}`]
            }) as bigint;
          }
          
          console.log('[JOIN] Token balance check:', {
            token: tokenSymbol,
            balance: balance.toString(),
            required: wagerAmountWei.toString(),
            sufficient: balance >= wagerAmountWei
          });
          
          if (balance < wagerAmountWei) {
            const balanceFormatted = Number(balance) / Math.pow(10, tokenConfig.decimals);
            const wagerFormatted = Number(wagerAmountWei) / Math.pow(10, tokenConfig.decimals);
            setGameStatus(`Insufficient ${tokenSymbol} balance. You have ${balanceFormatted.toFixed(6)} ${tokenSymbol}, need ${wagerFormatted} ${tokenSymbol} to join this game.`);
            return;
          }
        } catch (error) {
          console.error('[JOIN] Error checking token balance:', error);
          setGameStatus('Failed to check token balance. Please try again.');
          return;
        }
      }
      
      const wagerAmountTDMT = convertWagerFromWei(gameData.bet_amount, gameData.bet_token || 'NATIVE_DMT');
      setInviteCode(inviteCode);
      setIsJoiningFromLobby(true);
      setPlayerColor('red');
      debugSetWager(wagerAmountTDMT, 'joinGame');
      setOpponent(gameData.blue_player);
      
      // Check token balance and approval
      
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
      
      // Check token approval for the game's token
      const tokenAddress = SUPPORTED_TOKENS[gameData.bet_token as TokenSymbol]?.address;
      if (tokenAddress && tokenAddress !== ('0x0000000000000000000000000000000000000000' as typeof tokenAddress) && publicClient) {
        try {
          const allowance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: [
              {
                "constant": true,
                "inputs": [
                  {"name": "owner", "type": "address"},
                  {"name": "spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
              }
            ],
            functionName: 'allowance',
            args: [address as `0x${string}`, chessContractAddress as `0x${string}`]
          }) as bigint;
          
          const allowanceBigInt = allowance;
          const requiredAmountBigInt = BigInt(gameData.bet_amount);
          
          if (allowanceBigInt < requiredAmountBigInt) {
            setGameStatus(`Approving ${gameData.bet_token} spending...`);
            setWaitingForApproval(true);
            
            // Automatically approve the token
            try {
              approveToken(gameData.bet_token as TokenSymbol, chessContractAddress, requiredAmountBigInt);
              return; // Exit early, the approval will trigger a re-render
            } catch (error) {
              console.error('[JOIN] Error approving token:', error);
              setGameStatus(`Failed to approve ${gameData.bet_token}. Please try again.`);
              setWaitingForApproval(false);
            return;
            }
          }
        } catch (error) {
          console.error('[JOIN] Error checking token allowance:', error);
        }
      }
      
      setGameStatus('Joining game... Please confirm transaction in your wallet.');
      
      // Estimate gas for joinGame function
      let gasLimit = 200000n; // Default gas limit for join
      try {
        if (publicClient) {
          const estimatedGas = await publicClient.estimateContractGas({
            address: chessContractAddress as `0x${string}`,
            abi: CHESS_CONTRACT_ABI,
            functionName: 'joinGame',
            args: [inviteCode as `0x${string}`],
            account: address as `0x${string}`,
          });
          gasLimit = estimatedGas;
          console.log('[JOIN] Estimated gas:', estimatedGas.toString());
        }
      } catch (error) {
        console.warn('[JOIN] Gas estimation failed, using default:', error);
      }

      try {
        // Check if this is a native DMT game
        const gameTokenConfig = SUPPORTED_TOKENS[gameData.bet_token as TokenSymbol];
        const isNativeGame = gameTokenConfig?.isNative;
        
        if (isNativeGame) {
          // Native DMT transaction - include value
          console.log('[JOIN] Native DMT game - adding value:', gameData.bet_amount);
          const result = writeJoinGame({
            address: chessContractAddress as `0x${string}`,
            abi: CHESS_CONTRACT_ABI,
            functionName: 'joinGame',
            args: [inviteCode as `0x${string}`],
            gas: gasLimit,
            value: BigInt(gameData.bet_amount) as any, // Type assertion for native token support
          });
        } else {
          // ERC-20 token transaction - no value
          const result = writeJoinGame({
            address: chessContractAddress as `0x${string}`,
            abi: CHESS_CONTRACT_ABI,
            functionName: 'joinGame',
            args: [inviteCode as `0x${string}`],
            gas: gasLimit,
          });
        }
        
        // Store game data for after transaction confirmation
        setPendingJoinGameData({ inviteCode, gameData, address });
      } catch (error) {
        console.error('[JOIN] Error calling writeJoinGame:', error);
        setGameStatus('Failed to send transaction. Please try again.');
      }
    } catch (error) {
      console.error('[JOIN] Error joining game:', error);
      setGameStatus('Failed to join game. Please try again.');
      debugSetInviteCode('', 'join game error');
      setPlayerColor(null);
      debugSetWager(0, 'join game error');
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
    if (gameChannel.current) {
      gameChannel.current();
    }
    const unsubscribe = firebaseChess.subscribeToGame(inviteCode, (gameData) => {
      const currentAddress = addressRef.current;
      
      if (!gameData) {
        return;
      }
      
      // Handle player color assignment
      if (pendingJoinGameData && currentAddress === pendingJoinGameData.address) {
        if (gameData.game_state === 'active') {
          setPendingJoinGameData(null);
        }
        if (gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
          setOpponent(gameData.blue_player === currentAddress ? gameData.red_player : gameData.blue_player);
        }
      } else if (currentAddress && gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
        const blueMatch = currentAddress.toLowerCase() === gameData.blue_player.toLowerCase();
        const redMatch = currentAddress.toLowerCase() === gameData.red_player.toLowerCase();
        
        if (blueMatch && playerColor !== 'blue') {
          setPlayerColor('blue');
          setOpponent(gameData.red_player);
        } else if (redMatch && playerColor !== 'red') {
          setPlayerColor('red');
          setOpponent(gameData.blue_player);
        } else if (!blueMatch && !redMatch && playerColor !== null) {
          setPlayerColor(null);
          setOpponent(null);
        }
      } else {
        if (playerColor && (playerColor === 'blue' || playerColor === 'red')) {
          // Preserve existing valid playerColor
        } else if (currentAddress) {
          const currentContractData = getCurrentContractGameData();
          if (currentContractData && Array.isArray(currentContractData)) {
            const [player1, player2] = currentContractData;
            if (player1 && player2) {
              const playerColorFromContract = player1.toLowerCase() === currentAddress.toLowerCase() ? 'blue' : 'red';
              const opponentFromContract = player1.toLowerCase() === currentAddress.toLowerCase() ? player2 : player1;
              setPlayerColor(playerColorFromContract as 'blue' | 'red');
              setOpponent(opponentFromContract);
            }
          }
        }
        
        if (gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
          setOpponent(gameData.blue_player === currentAddress ? gameData.red_player : gameData.blue_player);
        }
      }
      
      // Update board and game state, but respect local move in progress
      if (gameData.board && !isLocalMoveInProgress) {
        const reconstructedBoard = reconstructBoard(gameData.board);
        setBoard(reconstructedBoard);
      } else if (gameData.board && isLocalMoveInProgress) {
        console.log('[FIREBASE] Skipping board update due to local move in progress');
      }
      
      if (gameData.current_player) {
        setCurrentPlayer(gameData.current_player);
      }
      
      if (gameData.game_state === 'active') {
        setGameMode(GameMode.ACTIVE);
        setShowGame(true); // Enable animated background and game board
        setGameStatus('Game in progress');
      } else if (gameData.game_state === 'finished') {
        setGameMode(GameMode.FINISHED);
        setGameStatus('Game finished');
      } else if (gameData.game_state === 'waiting_for_join') {
        setGameMode(GameMode.WAITING);
        setGameStatus('Waiting for opponent to join...');
      }
      
      // Try to get wager from contract data if Firebase doesn't have it
      let wagerValue = 0;
              const tokenSymbol = gameData.bet_token || 'NATIVE_DMT';
      
      if (gameData.bet_amount && !isNaN(parseFloat(gameData.bet_amount))) {
        wagerValue = convertWagerFromWei(gameData.bet_amount, tokenSymbol);
      } else {
        const currentContractData = getCurrentContractGameData();
        if (currentContractData && Array.isArray(currentContractData) && currentContractData[5]) {
          // Get wager from contract data (index 5 is wager amount in wei)
          wagerValue = convertWagerFromWei(currentContractData[5].toString(), tokenSymbol);
        }
      }
      debugSetWager(wagerValue, 'Firebase subscription');
    });
    gameChannel.current = unsubscribe;
    return unsubscribe;
  };

  // Simplified Firebase subscription - only set up once when inviteCode is available
  useEffect(() => {
    if (inviteCode) {
      const unsubscribe = subscribeToGame(inviteCode);
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [inviteCode]); // Only depend on inviteCode, not other variables

  // FIX: Add fallback mechanism to ensure playerColor is set correctly
  useEffect(() => {
    // If we have contract data but no playerColor, set it from contract
    const currentContractData = getCurrentContractGameData();
    if (currentContractData && !playerColor && address) {
      console.log('[FALLBACK] Setting playerColor from contract data');
      let player1, player2, isActive, winner, inviteCodeContract, wagerAmount;
      if (Array.isArray(currentContractData)) {
        [player1, player2, isActive, winner, inviteCodeContract, wagerAmount] = currentContractData;
      } else {
        console.error('[FALLBACK] Unexpected contract data format:', currentContractData);
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
        console.log('[AUTO-FIX] Checking Firebase data for inviteCode:', inviteCode);
        firebaseChess.getGame(inviteCode).then(gameData => {
          console.log('[AUTO-FIX] Current Firebase data:', gameData);
          console.log('[AUTO-FIX] Contract data:', currentContractData);
          
          // Check if Firebase needs to be updated
          const needsUpdate = !gameData || 
                             !gameData.blue_player || 
                             gameData.red_player === '0x0000000000000000000000000000000000000000' ||
                             gameData.game_state !== 'active';
          
          console.log('[AUTO-FIX] Needs update:', needsUpdate);
          
          if (needsUpdate && currentContractData && Array.isArray(currentContractData)) {
            console.log('[AUTO-FIX] Updating Firebase with correct data...');
            const [player1, player2] = currentContractData;
            console.log('[AUTO-FIX] Updating Firebase with player1 (blue):', player1);
            console.log('[AUTO-FIX] Updating Firebase with player2 (red):', player2);
            
            // Update Firebase with correct player data
            firebaseChess.updateGame(inviteCode, {
              blue_player: player1,
              red_player: player2,
              game_state: 'active',
              current_player: 'blue'
            }).then(() => {
              console.log('[AUTO-FIX] Firebase updated with correct player data');
            }).catch(error => {
              console.error('[AUTO-FIX] Error updating Firebase:', error);
            });
          }
          
          // Clear pending join data if game is confirmed active
          if (gameData && gameData.game_state === 'active' && pendingJoinGameData) {
            console.log('[AUTO-CLEAR] Game is confirmed active, clearing pending join data');
            setPendingJoinGameData(null);
          }
        }).catch(error => {
          console.error('[AUTO-FIX] Error checking game data for auto-fix:', error);
        });
      }
    }
  }, [contractGameData, lobbyGameContractData, playerColor, address, inviteCode]);

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
        setShowGame(true); // Enable animated background and game board
        
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
      debugSetInviteCode('', 'join game error effect');
      setPlayerColor(null);
      debugSetWager(0, 'join game error effect');
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
    if (!address) return 'Unknown';
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

  const getMoveNotation = (from: { row: number; col: number }, to: { row: number; col: number }, piece: string, board: (string | null)[][]) => {
    const fromSquare = coordsToAlgebraic(from.row, from.col);
    const toSquare = coordsToAlgebraic(to.row, to.col);
    return `${fromSquare}-${toSquare}`;
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
    if (!playerColor || currentPlayer !== playerColor) {
      return;
    }
    
    const piece = board[from.row][from.col];
    if (!piece) {
      return;
    }
    // Check for pawn promotion - show dialog for user choice
    // Blue pawns promote when reaching row 0 (top), red pawns promote when reaching row 7 (bottom)
    console.log('[PAWN_PROMOTION_CHECK]', {
      piece: piece,
      pieceLower: piece.toLowerCase(),
      isPawn: piece.toLowerCase() === 'p',
      pieceColor: getPieceColor(piece),
      toRow: to.row,
      bluePromotion: getPieceColor(piece) === 'blue' && to.row === 0,
      redPromotion: getPieceColor(piece) === 'red' && to.row === 7,
      shouldPromote: piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))
    });
    
    if (piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
      console.log('[PAWN_PROMOTION] Triggering promotion dialog');
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
    
    // Log the move details
    console.log('[MOVE] Executing move:', {
      from: { row: from.row, col: from.col, piece: piece },
      to: { row: to.row, col: to.col, capturedPiece: capturedPiece },
      player: currentPlayer,
      isCapture: isCapture,
      moveType: piece.toUpperCase() === 'K' ? 'king' : piece.toUpperCase() === 'R' ? 'rook' : 'other'
    });
    
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
    
    // Set flag to prevent Firebase subscription from overriding local board state
    setIsLocalMoveInProgress(true);
    
    console.log('[MOVE_ANIMATION] Starting move execution:', {
      from: { row: from.row, col: from.col, piece: piece },
      to: { row: to.row, col: to.col, capturedPiece: board[to.row][to.col] },
      currentBoard: board.map(row => [...row])
    });
    
    const newBoard = board.map(row => [...row]);
    
    // Handle special moves (castling, en passant, pawn promotion)
    console.log('[MOVE_ANIMATION] Before special moves handling');
    handleSpecialMoves(newBoard, from, to, piece, promotionPiece);
    console.log('[MOVE_ANIMATION] After special moves handling');
    
    // Move the piece (promotion is handled in handleSpecialMoves, so we need to check if it was already moved)
    // For captures, the destination square will contain the captured piece, so we always move the attacking piece there
    // For promotions, the piece is already moved by handleSpecialMoves
    if (newBoard[to.row][to.col] === null) {
      // Destination is empty, move the piece there
      newBoard[to.row][to.col] = piece;
    } else {
      // Destination has a piece (capture or promotion already handled)
      // For captures, we need to replace the captured piece with the attacking piece
      // For promotions, the piece is already there
      if (piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
        // This is a promotion, the piece is already handled by handleSpecialMoves
        console.log('[MOVE_ANIMATION] Promotion already handled by special moves');
      } else {
        // This is a capture, replace the captured piece with the attacking piece
        console.log('[MOVE_ANIMATION] Capturing piece, replacing captured piece with attacking piece');
        newBoard[to.row][to.col] = piece;
      }
    }
    newBoard[from.row][from.col] = null;
    
    console.log('[MOVE_ANIMATION] Move completed:', {
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      piece: piece,
      finalBoardState: newBoard.map(row => [...row])
    });
    
    // Update piece state
    updatePieceState(from, to, piece);
    
    // Update move history
    const moveNotation = getMoveNotation(from, to, piece, newBoard);
    setMoveHistory(prev => {
      const updated = [...prev, moveNotation];
      console.log('[MOVE HISTORY UPDATED]', updated);
      return updated;
    });
    
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
      if (currentPlayer === playerColor) {
        playSound('victory');
      } else {
        playSound('loser');
      }
      triggerVictoryCelebration();
      
      // Update scores for both players
      const currentContractData = getCurrentContractGameData();
      
      if (currentContractData && currentContractData.length >= 2) {
        await updateBothPlayersScoresLocal(currentPlayer, currentContractData[0], currentContractData[1]);
              } else {
          // Fallback to single player update if contract data not available
          await updateScore(currentPlayer === playerColor ? 'win' : 'loss');
          // Reload leaderboard after single player update
          await loadLeaderboard();
      }
      
      // Trigger contract payout for the winner
      if (winner === playerColor) {
        setTimeout(() => {
          claimWinnings();
        }, 2000); // Small delay to ensure UI updates first
      }
    } else if (isStalemate(nextPlayer, newBoard)) {
      // Stalemate = loss for the player who gets stalemated
      // nextPlayer is the one who has no legal moves, so they lose
      const winner = currentPlayer; // Player who made the move that caused stalemate
      gameState = 'finished';
      setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins by stalemate!`);
      if (winner === playerColor) {
        playSound('victory');
      } else {
        playSound('loser');
      }
      
      // Update scores for both players
      const currentContractData = getCurrentContractGameData();
      
      if (currentContractData && currentContractData.length >= 2) {
        await updateBothPlayersScoresLocal(winner, currentContractData[0], currentContractData[1]);
              } else {
          // Fallback to single player update if contract data not available
          await updateScore(winner === playerColor ? 'win' : 'loss');
          // Reload leaderboard after single player update
          await loadLeaderboard();
      }
      
      // Trigger contract payout for the winner
      if (winner === playerColor) {
        setTimeout(() => {
          claimWinnings();
        }, 2000); // Small delay to ensure UI updates first
      }
    }
    
          // Update database
      try {
        if (!inviteCode) {
          console.error('[BUG] inviteCode is missing when trying to update game!');
          setGameStatus('Game code missing. Please reload or rejoin the game.');
          return;
        }
        
        // Flatten the board for Firebase storage
        const flattenedBoard = flattenBoard(newBoard);
        
        // Update Firebase with the new board state
        await firebaseChess.updateGame(inviteCode, {
          board: { 
            positions: flattenedBoard,
            rows: 8,
            cols: 8
          },
          current_player: nextPlayer,
          game_state: gameState,
          winner: winner,
          last_move: { from, to }
        });
      } catch (error) {
        console.error('[DATABASE] Error updating game:', error);
      }
    setBoard(newBoard);
    setCurrentPlayer(nextPlayer);
    setLastMove({ from, to });
    setShowPromotion(false);
    setPromotionMove(null);
    
    // Reset the local move flag after a short delay to allow Firebase to sync
    setTimeout(() => {
      setIsLocalMoveInProgress(false);
    }, 1000);
  };

  // Victory celebration
  const triggerVictoryCelebration = () => {
    setVictoryCelebration(true);
    // Victory celebration visual effects only - sound is handled separately
    
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${['#ff4444', '#4444ff', '#ffff44', '#ff44ff'][Math.floor(Math.random() * 5)]};
          left: ${Math.random() * window.innerWidth}px;
          top: -10px;
          z-index: 9999;
          animation: confetti-fall 3s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 300);
      }, i * 100);
    }
    
    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current);
    }
    celebrationTimeout.current = setTimeout(() => {
      setVictoryCelebration(false);
    }, 5000);
  };

  // Handle special moves (castling, en passant, pawn promotion)
  const handleSpecialMoves = (newBoard: (string | null)[][], from: { row: number; col: number }, to: { row: number; col: number }, piece: string, promotionPiece = 'q') => {
    console.log('[SPECIAL_MOVES] Checking for special moves:', {
      piece: piece,
      from: from,
      to: to,
      isKing: piece.toLowerCase() === 'k',
      colDifference: Math.abs(from.col - to.col)
    });
    
    // Handle pawn promotion
    console.log('[SPECIAL_MOVES_PROMOTION_CHECK]', {
      piece: piece,
      isPawn: piece.toLowerCase() === 'p',
      pieceColor: getPieceColor(piece),
      toRow: to.row,
      promotionPiece: promotionPiece,
      shouldPromote: piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))
    });
    
    if (piece.toLowerCase() === 'p' && ((getPieceColor(piece) === 'blue' && to.row === 0) || (getPieceColor(piece) === 'red' && to.row === 7))) {
      const promotedPiece = getPieceColor(piece) === 'blue' ? promotionPiece.toLowerCase() : promotionPiece.toUpperCase();
      console.log('[SPECIAL_MOVES_PROMOTION] Promoting pawn to:', promotedPiece);
      newBoard[to.row][to.col] = promotedPiece;
    }
    
    // Handle castling
    if (piece.toLowerCase() === 'k' && Math.abs(from.col - to.col) === 2) {
      console.log('[SPECIAL_MOVES] Castling detected!', {
        fromCol: from.col,
        toCol: to.col,
        castlingType: to.col === 6 ? 'kingside' : 'queenside'
      });
      
      if (to.col === 6) { // Kingside
        console.log('[SPECIAL_MOVES] Executing kingside castling');
        newBoard[from.row][7] = null;
        newBoard[from.row][5] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
      } else if (to.col === 2) { // Queenside
        console.log('[SPECIAL_MOVES] Executing queenside castling');
        // Save the queen if it exists at d1/d8 before moving the rook
        const queenPiece = newBoard[from.row][3];
        newBoard[from.row][0] = null;
        newBoard[from.row][3] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
        // If there was a queen at d1/d8, move it to a safe position (e1/e8)
        if (queenPiece && queenPiece.toLowerCase() === 'q') {
          newBoard[from.row][4] = queenPiece;
        }
      }
    } else {
      console.log('[SPECIAL_MOVES] No castling detected');
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
    try {
      const audio = new Audio(src);
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
      
      // Reset local state
      setBoard(initialBoard);
      setCurrentPlayer('blue');
      setMoveHistory([]);
      setLastMove(null);
      
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
            const playerInviteCode = await getPlayerInviteCodeFromContract(address, chessContractAddress);
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
            debugSetWager(convertWagerFromWei(gameData.bet_amount, gameData.bet_token || 'NATIVE_DMT'), 'resumeGame');
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
        debugSetWager(0, 'handleGameStateInconsistency');
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
          debugSetWager(0, 'handleGameStateInconsistency reset');
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
      const playerGameInviteCode = await getPlayerInviteCodeFromContract(address, chessContractAddress);
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
              chessContractAddress,
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
              contract_address: chessContractAddress,
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
        {isValidMove && <div className="legal-move-indicator" />}
      </div>
    );
  };

  // Render promotion dialog
  const renderPromotionDialog = () => {
    if (!showPromotion || !promotionMove) {
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
    </div>
  );

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

  // Main render - single container like ChessGame.tsx
  return (
    <div className={`chess-game${showGame ? ' game-active' : ''}`}>
      {/* Header - always show */}
      <div className="chess-header">
        <h2>LAWB CHESS MAINNET BETA 3000</h2>
        <div className="chess-controls">
          {onMinimize && <button onClick={onMinimize}>_</button>}
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Main Layout */}
      <div className="game-stable-layout">
        {/* Left Sidebar - Only show during active gameplay */}
        {(gameMode === GameMode.ACTIVE || gameMode === GameMode.FINISHED) && showGame && (
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
                      {leaderboard.slice(0, 8).map((entry, index) => (
                        <tr key={entry.username}>
                          <td>{index + 1}</td>
                          <td>{formatAddress(entry.username)}</td>
                          <td>{entry.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {sidebarView === 'moves' && (
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
                {renderPieceGallery()}
              </div>
            )}
          </div>
        )}
        
        {/* Center Area */}
        <div className="center-area">
          {/* Lobby Mode */}
          {gameMode === GameMode.LOBBY && (
            <div className="chess-multiplayer-lobby" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'center',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h2 style={{
                color: '#ff0000',
                fontFamily: 'Impact, Charcoal, sans-serif',
                fontSize: '48px',
                fontWeight: 'bold',
                textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
                marginBottom: '10px',
                textTransform: 'uppercase'
              }}>PVP CHESS LAWBY</h2>
              
              {!isConnected ? (
                <div className="wallet-notice" style={{ marginBottom: '20px', color: '#ff0000' }}>
                  Please connect your wallet to play multiplayer chess
                </div>
              ) : (
                <>
                  <div className="status-bar" style={{ marginBottom: '20px', color: '#ff0000' }}>
                    Connected: {formatAddress(address!)}
                  </div>
                  
                  <div className="lobby-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="actions" style={{ order: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <button 
                        className="create-btn"
                        onClick={() => setIsCreatingGame(true)}
                        disabled={isCreatingGame || isGameCreationInProgress}
                        style={{ color: '#ff0000' }}
                      >
                        Create New Game
                      </button>
                      <button 
                        onClick={loadOpenGames}
                        style={{ 
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: '2px solid #ff0000',
                          color: '#ff0000',
                          padding: '8px 16px',
                          borderRadius: '0px',
                          cursor: 'pointer',
                          fontFamily: 'Courier New, monospace',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🔄 Refresh Lobby
                      </button>
                      <button 
                        onClick={() => window.location.href = '/chess'}
                        style={{ 
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: '2px solid #ff0000',
                          color: '#ff0000',
                          padding: '12px 24px',
                          borderRadius: '0px',
                          cursor: 'pointer',
                          fontFamily: 'Courier New, monospace',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🏠 Back to Chess Home
                      </button>
                    </div>
                    
                    {isCreatingGame && (
                      <div className="create-form" style={{ order: 2, marginBottom: '20px' }}>
                        <h3>Create New Game</h3>
                        <TokenSelector
                          selectedToken={selectedToken}
                          onTokenSelect={setSelectedToken}
                          wagerAmount={gameWager}
                          onWagerChange={setGameWager}
                          disabled={isGameCreationInProgress}
                        />
                        <div className="form-actions">
                          <button 
                            className="create-confirm-btn"
                            onClick={createGame}
                            disabled={gameWager <= 0 || isGameCreationInProgress}
                          >
                            {isGameCreationInProgress ? 'Creating...' : 'Create Game'}
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => {
                              setIsCreatingGame(false);
                              setIsGameCreationInProgress(false);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="open-games" style={{ order: 3 }}>
                      <h3 style={{ color: '#ff0000' }}>Open Games ({openGames.length})</h3>
                      <div className="games-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {openGames.map(game => {
                          console.log('[RENDER LOBBY] Rendering game:', game);
                          return (
                          <div key={game.invite_code} className="game-item" style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: '10px',
                            padding: '15px',
                            border: '2px solid #333',
                            borderRadius: '5px'
                          }}>
                            <div className="game-info" style={{ textAlign: 'center' }}>
                              <div className="game-id">{game.game_title || 'Untitled Game'}</div>
                              <div className="wager">
                                Wager: {(parseFloat(game.bet_amount) / Math.pow(10, SUPPORTED_TOKENS[(game.bet_token as TokenSymbol) || 'DMT'].decimals)).toFixed(2)} {game.bet_token || 'DMT'}
                              </div>
                              <div className="title">Created by: {formatAddress(game.blue_player)}</div>
                            </div>
                            <button 
                              className="join-btn"
                              onClick={() => joinGame(game.invite_code)}
                            >
                              Join Game
                            </button>
                          </div>
                          );
                        })}
                        {openGames.length === 0 && (
                          <div className="no-games" style={{ color: '#ff0000' }}>No open games available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Waiting Mode */}
          {gameMode === GameMode.WAITING && (
            <div className="chess-multiplayer-waiting">
              <h2>Waiting for Opponent</h2>
              <div className="game-code">
                Invite Code: <strong>{inviteCode}</strong>
              </div>
              <div className="game-info">
                <p>Wager: {wager.toFixed(SUPPORTED_TOKENS[selectedToken]?.decimals || 8)} {selectedToken}</p>
                <p>Share this invite code with your opponent</p>
              </div>
              <div className="waiting-actions">
                <button 
                  onClick={refundGame}
                  disabled={isCancellingGame || isWaitingForCancelReceipt}
                  className="refund-game-btn"
                >
                  {isCancellingGame || isWaitingForCancelReceipt ? '⏳ Refunding...' : '💰 Refund Game'}
                </button>
                <p className="refund-note">
                  You can refund your wager anytime before an opponent joins
                </p>
              </div>
            </div>
          )}
          
          {/* Active Game Mode */}
          {(gameMode === GameMode.ACTIVE || gameMode === GameMode.FINISHED) && showGame && (
            <>
              <div className="game-info-compact">
                <span className={currentPlayer === 'blue' ? 'current-blue' : 'current-red'}>
                  {currentPlayer === 'blue' ? 'Blue' : 'Red'} to move
                </span>
                <span className="wager-display">
                  Wager: {wager.toFixed(SUPPORTED_TOKENS[selectedToken]?.decimals || 8)} {selectedToken}
                </span>
                {opponent && (
                  <span className="opponent-info">
                    vs {formatAddress(opponent)}
                  </span>
                )}
              </div>
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
                
                <div className="game-controls-compact">
                  <div className="sidebar-toggle-group">
                    <button 
                      className={sidebarView === 'moves' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                      onClick={() => setSidebarView('moves')}
                    >
                      Moves
                    </button>
                    <button 
                      className={sidebarView === 'leaderboard' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                      onClick={() => setSidebarView('leaderboard')}
                    >
                      Leaderboard
                    </button>
                    <button 
                      className={sidebarView === 'gallery' ? 'sidebar-toggle-btn selected' : 'sidebar-toggle-btn'}
                      onClick={() => setSidebarView('gallery')}
                    >
                      Gallery
                    </button>
                  </div>
                  <button onClick={() => { setGameMode(GameMode.LOBBY); setShowGame(false); }}>New Game</button>
                  <button onClick={() => { setGameMode(GameMode.LOBBY); setShowGame(false); }}>Menu</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modals and Overlays */}
      {renderPromotionDialog()}
      {victoryCelebration && (
        <div className="victory-overlay" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.0)'}}>
          <div className="balloons-container">{/* ...balloons code... */}</div>
          <img src="/images/victory.gif" alt="Victory" style={{width:'320px',height:'auto',zIndex:2}} />
          <div style={{position:'absolute',bottom:40,left:0,width:'100vw',display:'flex',justifyContent:'center',gap:24}}>
            <button onClick={() => setGameMode(GameMode.LOBBY)}>Back to Lobby</button>
            <button onClick={() => window.location.reload()}>New Game</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessMultiplayer; 