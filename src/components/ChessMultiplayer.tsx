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
import { useMobileCapabilities } from '../hooks/useMediaQuery';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESSES, NETWORKS, type TokenSymbol } from '../config/tokens';
import { CHESS_CONTRACT_ABI, ERC20_ABI } from '../config/abis';
import { getDefaultPieceSet, getPixelawbsPieceSet, type ChessPieceSet } from '../config/chessPieceSets';
import { checkPixelawbsNFTOwnership, type NFTVerificationResult } from '../utils/nftVerification';

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

interface ChessMultiplayerProps {
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

export const ChessMultiplayer: React.FC<ChessMultiplayerProps> = ({ onClose, onMinimize, fullscreen = false, onBackToModeSelect, onGameStart, onChatToggle, isChatMinimized, isMobile = false }) => {

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
      setGameStatus('Match refunded successfully! Your wager has been returned.');
      
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
  const { data: playerGameInviteCode, refetch: refetchPlayerGame } = useReadContract({
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
    if (lobbyGameContractData || lobbyGameContractError) {
      console.log('[LOBBY_CONTRACT] lobbyGameContractData changed:', lobbyGameContractData);
      console.log('[LOBBY_CONTRACT] lobbyGameContractError:', lobbyGameContractError);
      console.log('[LOBBY_CONTRACT] lobbyGameContractLoading:', lobbyGameContractLoading);
      console.log('[LOBBY_CONTRACT] isJoiningFromLobby:', isJoiningFromLobby);
      console.log('[LOBBY_CONTRACT] inviteCode:', inviteCode);
      console.log('[LOBBY_CONTRACT] Contract read enabled:', !!inviteCode && inviteCode !== '0x000000000000' && isJoiningFromLobby);
    }
  }, [lobbyGameContractData, lobbyGameContractError, lobbyGameContractLoading, isJoiningFromLobby, inviteCode]);



  // Helper function to get the appropriate contract data
  const getCurrentContractGameData = () => {
    if (isJoiningFromLobby && lobbyGameContractData) {
      return lobbyGameContractData;
    }
    return contractGameData;
  };
  
  // Debug function to track invite code changes
  const debugSetInviteCode = (newValue: string, source: string) => {
    console.log(`[INVITE_DEBUG] Setting inviteCode to "${newValue}" from ${source}`);
    if (inviteCode && !newValue) {
      console.warn(`[INVITE_DEBUG] WARNING: Clearing inviteCode from "${inviteCode}" to "${newValue}" from ${source}`);
    }
    
    // Reset board state tracking when starting a new game
    if (newValue && newValue !== inviteCode) {
      console.log('[OPPONENT_MOVE] New game detected, resetting board state tracking');
      previousBoardStateRef.current = null;
      isFirstBoardLoadRef.current = true;
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
    // Use the actual token from the game data instead of defaulting to NATIVE_DMT
    const tokenSymbol = currentGameToken || selectedToken || 'NATIVE_DMT';
    console.log(`[WAGER_DEBUG] Setting wager to ${newValue} ${tokenSymbol} from ${source}`);
    console.log(`[WAGER_DEBUG] Token breakdown - currentGameToken: ${currentGameToken}, selectedToken: ${selectedToken}, final: ${tokenSymbol}`);
    if (wager !== newValue) {
      console.log(`[WAGER_DEBUG] Wager changed from ${wager} to ${newValue} ${tokenSymbol}`);
    }
    setWager(newValue);
  };
  
  // Tab state for left sidebar
  const [leftSidebarTab, setLeftSidebarTab] = useState<'moves' | 'leaderboard' | 'gallery'>('moves');



  // Claim winnings function for winners
  const refundGame = async () => {
    if (!inviteCode || !address) {
      alert('No match to refund or wallet not connected');
      return;
    }
    
    try {
      console.log('[REFUND] Attempting to refund game:', inviteCode);
      
      // Check if this player is the game creator
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData || gameData.blue_player !== address) {
        alert('Only the match creator can refund the match');
        return;
      }
      
      // Check if opponent has already joined
      if (gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
        alert('Cannot refund match after opponent has joined');
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
      alert('Failed to refund match. Please try again.');
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
      alert('Could not determine match invite code. Please try refreshing the page.');
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
      } else {
        console.log('[CLAIM] Firebase winner data missing:', { 
          winner: gameData.winner, 
          blue_player: gameData.blue_player, 
          red_player: gameData.red_player 
        });
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
        console.log('[CLAIM] Trying fallback winner determination...');
        
        // Fallback: If game is finished but no winner in Firebase, determine from game state
        if (gameData.game_state === 'finished' && gameData.blue_player && gameData.red_player) {
          // If current player is claiming and game is finished, they are likely the winner
          // This is a reasonable fallback for cases where Firebase update failed
          winnerAddress = address;
          console.log('[CLAIM] Using fallback winner determination:', winnerAddress);
        } else {
          console.error('[CLAIM] Could not determine winner address');
          alert('Failed to verify winner. Please try again.');
          return;
        }
      }
      
      console.log('[CLAIM] Winner verification details:', {
        winnerAddress,
        address,
        playerColor,
        winnerAddressType: typeof winnerAddress,
        addressType: typeof address,
        addressesMatch: winnerAddress === address,
        winnerAddressLength: winnerAddress?.length,
        addressLength: address?.length,
        winnerAddressLower: winnerAddress?.toLowerCase(),
        addressLower: address?.toLowerCase(),
        addressesMatchLower: winnerAddress?.toLowerCase() === address?.toLowerCase()
      });
      
      if (winnerAddress?.toLowerCase() !== address?.toLowerCase()) {
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

  // Piece set state
  const [selectedPieceSet, setSelectedPieceSet] = useState<ChessPieceSet>(getDefaultPieceSet());
  const [showPieceSetSelector, setShowPieceSetSelector] = useState(false);
  const [showPieceSetDropdown, setShowPieceSetDropdown] = useState(false);
  const [nftVerificationResult, setNftVerificationResult] = useState<NFTVerificationResult | null>(null);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  
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
  const [currentGameToken, setCurrentGameToken] = useState<TokenSymbol>('NATIVE_DMT');

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
  const [sidebarView, setSidebarView] = useState<'moves' | 'leaderboard' | 'gallery'>('moves');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [captureAnimation, setCaptureAnimation] = useState<{ row: number; col: number; show: boolean } | null>(null);
  const [gameJustFinished, setGameJustFinished] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(false);

  // Add audio preloading system
  const [audioCache, setAudioCache] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // Add last move tracking for better capture detection
  const [lastMoveData, setLastMoveData] = useState<{
    from: { row: number; col: number };
    to: { row: number; col: number };
    piece: string;
    capturedPiece: string | null;
    player: 'blue' | 'red';
  } | null>(null);

  // Mobile capabilities detection
  const mobileCapabilities = useMobileCapabilities();
  const { isMobile: isMobileDevice, isLandscape, isTouchDevice, hasHapticFeedback, screenWidth, screenHeight } = mobileCapabilities;

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

  // Check NFT ownership when piece set selector is shown
  useEffect(() => {
    if (showPieceSetSelector && address) {
      const checkNFT = async () => {
        setIsCheckingNFT(true);
        try {
          // Use cross-chain verification - works regardless of current network
          const result = await checkPixelawbsNFTOwnership(address);
          setNftVerificationResult(result);
          console.log('[NFT_VERIFICATION] Result:', result);
        } catch (error) {
          console.error('[NFT_VERIFICATION] Error:', error);
          setNftVerificationResult({
            hasPixelawbsNFT: false,
            balance: 0,
            error: 'Failed to check NFT ownership'
          });
        } finally {
          setIsCheckingNFT(false);
        }
      };
      
      checkNFT();
    }
  }, [showPieceSetSelector, address]);

  // Handle transaction receipt for game joining
  useEffect(() => {
    console.log('[JOIN_TRANSACTION_DEBUG] Checking join transaction state:', {
      joinGameHash,
      isWaitingForJoinReceipt,
      pendingJoinGameData,
      address,
      inviteCode
    });
    
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
          // Don't create a new subscription - Player 2 already has an active subscription
          // subscribeToGame(pendingJoinGameData.inviteCode);
          
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
    } else if (joinGameHash && !isWaitingForJoinReceipt && !pendingJoinGameData && inviteCode) {
      // FALLBACK: Handle case where transaction is confirmed but pendingJoinGameData is missing
      console.log('[CONTRACT_FALLBACK] Join transaction confirmed but pendingJoinGameData missing');
      console.log('[CONTRACT_FALLBACK] Attempting to recover with inviteCode:', inviteCode);
      console.log('[CONTRACT_FALLBACK] Current address:', address);
      
      firebaseChess.getGame(inviteCode).then(gameData => {
        console.log('[CONTRACT_FALLBACK] Retrieved game data:', gameData);
        
        if (gameData && gameData.blue_player && address) {
          console.log('[CONTRACT_FALLBACK] Game data valid, updating to active state');
          
          // Check if red_player is already set
          if (gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
            console.log('[CONTRACT_FALLBACK] Red player already set:', gameData.red_player);
            // Just update UI
            setGameMode(GameMode.ACTIVE);
            setShowGame(true);
            setGameStatus('Game started!');
            setPlayerColor('red');
            setOpponent(gameData.blue_player);
            return;
          }
          
          firebaseChess.updateGame(inviteCode, {
            ...gameData,
            red_player: address,
            game_state: 'active'
          }).then(() => {
            console.log('[CONTRACT_FALLBACK] Firebase updated successfully');
            setGameMode(GameMode.ACTIVE);
            setShowGame(true);
            setGameStatus('Game started!');
            setPlayerColor('red');
            setOpponent(gameData.blue_player);
          }).catch(error => {
            console.error('[CONTRACT_FALLBACK] Error updating Firebase:', error);
            // Force UI update anyway since transaction is confirmed
            console.log('[CONTRACT_FALLBACK] Forcing UI update despite Firebase error');
            setGameMode(GameMode.ACTIVE);
            setShowGame(true);
            setGameStatus('Game started!');
            setPlayerColor('red');
            setOpponent(gameData.blue_player);
          });
        } else {
          console.error('[CONTRACT_FALLBACK] Invalid game data or missing fields:', {
            hasGameData: !!gameData,
            hasBluePlayer: gameData?.blue_player,
            hasAddress: !!address
          });
        }
      }).catch(error => {
        console.error('[CONTRACT_FALLBACK] Error getting game data:', error);
      });
    }
  }, [joinGameHash, isWaitingForJoinReceipt, pendingJoinGameData, address, inviteCode]);

  // Add periodic check for contract state to catch missed updates
  useEffect(() => {
    if (joinGameHash && address && inviteCode && gameMode === GameMode.WAITING) {
      console.log('[CONTRACT_STATE_CHECK] Setting up periodic contract state check');
      
      const interval = setInterval(async () => {
        try {
          const gameData = await firebaseChess.getGame(inviteCode);
          console.log('[CONTRACT_STATE_CHECK] Current game state:', gameData?.game_state);
          
          // If game should be active but UI is still waiting, force transition
          if (gameData && gameData.blue_player && gameData.red_player && 
              gameData.red_player !== '0x0000000000000000000000000000000000000000' &&
              gameData.game_state === 'waiting_for_join') {
            
            console.log('[CONTRACT_STATE_CHECK] Game has both players but wrong state, fixing...');
            
            // Update Firebase to active
            await firebaseChess.updateGame(inviteCode, {
              ...gameData,
              game_state: 'active'
            });
            
            console.log('[CONTRACT_STATE_CHECK] Firebase updated, transitioning UI');
            setGameMode(GameMode.ACTIVE);
            setShowGame(true);
            setGameStatus('Game started!');
          } else if (gameData && gameData.game_state === 'active' && gameMode === GameMode.WAITING) {
            console.log('[CONTRACT_STATE_CHECK] Game is active in Firebase, transitioning UI');
            setGameMode(GameMode.ACTIVE);
            setShowGame(true);
            setGameStatus('Game started!');
          }
        } catch (error) {
          console.error('[CONTRACT_STATE_CHECK] Error:', error);
        }
      }, 3000); // Check every 3 seconds
      
      return () => {
        console.log('[CONTRACT_STATE_CHECK] Cleaning up periodic check');
        clearInterval(interval);
      };
    }
  }, [joinGameHash, address, inviteCode, gameMode]);

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
        const actualInviteCode = pendingGameData?.invite_code;
        if (!actualInviteCode) {
          console.error('[CREATE DEBUG] No invite code available in pendingGameData');
          setGameStatus('Transaction confirmed but no invite code available');
          setPendingGameData(null);
          setIsCreatingGame(false);
          setIsGameCreationInProgress(false);
          return;
        }
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
              console.log('[CREATE_SUCCESS_RECONSTRUCTED] Setting currentGameToken to:', reconstructedGameData.bet_token);
              setCurrentGameToken(reconstructedGameData.bet_token as TokenSymbol);
              debugSetWager(gameWager, 'create game success');
              setGameMode(GameMode.WAITING);
              setGameStatus('Waiting for opponent to join...');
              
              // Subscribe to game updates
              subscribeToGame(reconstructedGameData.invite_code);
              
              // Refresh lobby to show the new match
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
          console.log('[CREATE_SUCCESS] Setting currentGameToken to:', gameDataToSave.bet_token);
          setCurrentGameToken(gameDataToSave.bet_token as TokenSymbol);
          debugSetWager(gameWager, 'create game success');
          setGameMode(GameMode.WAITING);
          setGameStatus('Waiting for opponent to join...');
          
          // Subscribe to game updates
          subscribeToGame(gameDataToSave.invite_code);
          
          // Refresh lobby to show the new match
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
      }, 300000); // 5 minutes timeout - allows for slow blockchain confirmations
      
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
  }, [address, playerGameInviteCode, hasLoadedGame]); // Keep only essential dependencies to prevent infinite loops

  // Reset game loading flag when address changes
  useEffect(() => {
    setHasLoadedGame(false);
  }, [address]);

  // Watch for contract data changes and trigger game state check
  useEffect(() => {
    if (address && !hasLoadedGame && (contractGameData || lobbyGameContractData)) {
      // Only check if we haven't already loaded a game
      const currentContractData = getCurrentContractGameData();
      if (currentContractData && Array.isArray(currentContractData)) {
        const [player1, player2] = currentContractData;
        if (player1 && player2 && (player1 === address || player2 === address)) {
          console.log('[CONTRACT_WATCH] Found active game in contract, checking game state');
          checkPlayerGameState();
        }
      }
    }
  }, [contractGameData, lobbyGameContractData, address, hasLoadedGame]);

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
    
    // CRITICAL FIX: Prevent multiple Firebase subscriptions
    if (gameChannel.current) {
      console.log('[GAME_STATE] Firebase subscription already active, skipping checkPlayerGameState');
      return;
    }
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
            // Don't create subscription here - it will be created by the main useEffect
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
            setCurrentGameToken(gameData.bet_token as TokenSymbol || 'NATIVE_DMT');
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
            // Don't create subscription here - it will be created by the main useEffect
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
                    setCurrentGameToken(game.bet_token as TokenSymbol || 'DMT');
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
        // Don't create subscription here - it will be created by the main useEffect
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
  // Debounced version of loadOpenGames to prevent excessive calls
  const debouncedLoadOpenGamesRef = useRef<NodeJS.Timeout | null>(null);
  
  const loadOpenGames = async () => {
    // Clear any pending debounced call
    if (debouncedLoadOpenGamesRef.current) {
      clearTimeout(debouncedLoadOpenGamesRef.current);
    }
    
          // Debounce the actual loading
      debouncedLoadOpenGamesRef.current = setTimeout(async () => {
        // Don't load if game just finished to prevent excessive calls
        if (gameJustFinished) {
          console.log('[LOBBY] Skipping load - game just finished');
          return;
        }
        
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
      }, 1000); // 1 second debounce
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
        winner: null, // Initialize winner field
        board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
        current_player: 'blue',
        chain: 'sanko',
        contract_address: chessContractAddress,
        is_public: true,
        created_at: new Date().toISOString(),
        piece_set: selectedPieceSet.id // Add selected piece set to game data
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
      setCurrentGameToken(gameData.bet_token as TokenSymbol);
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
  // Track previous board state to detect moves - moved outside function to persist across subscription updates
  const previousBoardStateRef = useRef<string | null>(null);
  const isFirstBoardLoadRef = useRef<boolean>(true);
  
  const subscribeToGame = (inviteCode: string) => {
    if (gameChannel.current) {
      gameChannel.current();
    }
    
    console.log('[FIREBASE_SUB] Setting up subscription for game:', inviteCode);
    
    const unsubscribe = firebaseChess.subscribeToGame(inviteCode, (gameData) => {
      try {
      // Reduced logging for performance - only log on important state changes
      if (gameData.game_state !== gameMode) {
        console.log('[FIREBASE_SUB] Game state changed from:', gameMode, 'to:', gameData.game_state);
      }
      
      const currentAddress = addressRef.current;
      
      if (!gameData) {
        return;
      }

      // Load piece set from game data if available
      if (gameData.piece_set && gameData.piece_set !== selectedPieceSet.id) {
        console.log('[PIECE_SET] Loading piece set from game data:', gameData.piece_set);
        if (gameData.piece_set === 'pixelawbs') {
          setSelectedPieceSet(getPixelawbsPieceSet());
        } else {
          // Default to lawbstation pieces
          setSelectedPieceSet(getDefaultPieceSet());
        }
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
      
      // CRITICAL FIX: Only skip Firebase updates during our own moves, not opponent moves
      if (isLocalMoveInProgress && gameData.current_player === playerColor) {
        console.log('[FIREBASE] Local move in progress and it\'s our turn, skipping Firebase updates');
        return;
      }
      
      // Clear loading state when we receive game data
      if (isGameLoading) {
        setIsGameLoading(false);
      }
      
              // Enhanced opponent move detection with capture detection
        if (gameData.board && playerColor) {
          const currentBoardState = JSON.stringify(gameData.board);
          
          // Initialize previousBoardState only on the very first load, then detect changes
          if (isFirstBoardLoadRef.current) {
            console.log('[OPPONENT_MOVE] First board load - initializing previousBoardState with current board');
            previousBoardStateRef.current = currentBoardState;
            isFirstBoardLoadRef.current = false;
          } else if (previousBoardStateRef.current !== currentBoardState) {
            console.log('[OPPONENT_MOVE] Board state changed, checking for opponent move');
            
            // Check if this is actually an opponent move (not our own move)
            const isOpponentMove = currentPlayer !== playerColor;
            
            if (isOpponentMove) {
              console.log('[OPPONENT_MOVE] Confirmed opponent move - current player:', currentPlayer, 'player color:', playerColor);
              
              // Enhanced capture detection by comparing board states
              const previousBoard = reconstructBoard(JSON.parse(previousBoardStateRef.current || '{}'));
              const currentBoard = reconstructBoard(gameData.board);
              
              // Find the move by comparing board states
              let fromSquare = null;
              let toSquare = null;
              let capturedPiece = null;
              
              // Find the moved piece and capture
              for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                  const prevPiece = previousBoard[row][col];
                  const currPiece = currentBoard[row][col];
                  
                  if (prevPiece !== currPiece) {
                    if (prevPiece && !currPiece) {
                      // Piece was removed from this square
                      fromSquare = { row, col };
                    } else if (!prevPiece && currPiece) {
                      // Piece was added to this square
                      toSquare = { row, col };
                    } else if (prevPiece && currPiece && prevPiece !== currPiece) {
                      // Piece was captured and replaced
                      capturedPiece = prevPiece;
                      fromSquare = { row, col };
                      toSquare = { row, col };
                    }
                  }
                }
              }
              
              // If we found a move, determine if it was a capture
              if (fromSquare && toSquare) {
                const isCapture = capturedPiece !== null;
                
                if (isCapture) {
                  console.log('[OPPONENT_MOVE] Opponent capture detected, playing capture sound and animation');
                  playMoveSoundAndAnimation('capture', toSquare);
                } else {
                  console.log('[OPPONENT_MOVE] Opponent move detected, playing move sound');
                  playMoveSoundAndAnimation('move');
                }
                
                // Check for check after opponent move
                if (isKingInCheck(currentBoard, playerColor)) {
                  console.log('[SOUND] Playing check sound for opponent move');
                  playSound('check');
                }
              } else {
                // Fallback: play move sound if we can't determine the move type
                console.log('[OPPONENT_MOVE] Could not determine move type, playing move sound');
                playMoveSoundAndAnimation('move');
              }
            }
            
            // Update previousBoardState after processing the change
            previousBoardStateRef.current = currentBoardState;
          }
        }
      
      // Process Firebase updates (opponent moves or initial state)
      if (gameData.board) {
        try {
          const reconstructedBoard = reconstructBoard(gameData.board);
          
          // Enhanced validation for initial board state
          if (isFirstBoardLoadRef.current) {
            console.log('[BOARD_SYNC] First board load - validating initial state');
            if (isValidBoardState(reconstructedBoard)) {
              setBoard(reconstructedBoard);
              isFirstBoardLoadRef.current = false;
              console.log('[BOARD_SYNC] Initial board state validated and set');
            } else {
              console.warn('[BOARD_SYNC] Initial board state invalid, using initial board');
              setBoard(initialBoard);
              isFirstBoardLoadRef.current = false;
            }
          } else {
            // For subsequent updates, only update if board is valid
            if (isValidBoardState(reconstructedBoard)) {
              console.log('[BOARD_SYNC] Setting board from Firebase update');
              setBoard(reconstructedBoard);
            } else {
              console.warn('[BOARD_SYNC] Board update invalid, keeping current state');
            }
          }
        } catch (error) {
          console.error('[BOARD_SYNC] Error reconstructing board:', error);
          if (isFirstBoardLoadRef.current) {
            setBoard(initialBoard);
            isFirstBoardLoadRef.current = false;
          }
        }
      }
      
      if (gameData.current_player) {
        setCurrentPlayer(gameData.current_player);
      }
      
      if (gameData.game_state === 'active') {
        console.log('[FIREBASE_SUB] 🎯 GAME STATE CHANGED TO ACTIVE!');
        console.log('[FIREBASE_SUB] Previous game mode:', gameMode);
        console.log('[FIREBASE_SUB] Setting game mode to ACTIVE');
        setGameMode(GameMode.ACTIVE);
        setShowGame(true);
        setGameStatus('Game in progress');
        
        // CRITICAL FIX: Force contract state refresh when game becomes active
        if (refetchPlayerGame) {
          console.log('[GAME_ACTIVE] Forcing contract state refresh for game creator');
          refetchPlayerGame();
        }
        
        // CRITICAL FIX: Ensure player color and opponent are set when game becomes active
        if (gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
          const currentAddress = addressRef.current;
          if (currentAddress) {
            const blueMatch = currentAddress.toLowerCase() === gameData.blue_player.toLowerCase();
            const redMatch = currentAddress.toLowerCase() === gameData.red_player.toLowerCase();
            
            if (blueMatch && playerColor !== 'blue') {
              console.log('[GAME_ACTIVE] Setting player color to blue for game creator');
              setPlayerColor('blue');
              setOpponent(gameData.red_player);
            } else if (redMatch && playerColor !== 'red') {
              console.log('[GAME_ACTIVE] Setting player color to red for joining player');
              setPlayerColor('red');
              setOpponent(gameData.blue_player);
            }
          }
        }
        
        // ADDITIONAL FIX: Force checkPlayerGameState to ensure proper state detection
        setTimeout(() => {
          console.log('[GAME_ACTIVE] Triggering checkPlayerGameState after contract refresh');
          checkPlayerGameState();
        }, 1000);
        
        // CRITICAL FIX: Force board state synchronization when game becomes active
        if (gameData.board && isFirstBoardLoadRef.current) {
          console.log('[GAME_ACTIVE] Game just became active, ensuring board synchronization');
          try {
            const reconstructedBoard = reconstructBoard(gameData.board);
            if (isValidBoardState(reconstructedBoard)) {
              setBoard(reconstructedBoard);
              isFirstBoardLoadRef.current = false;
              console.log('[GAME_ACTIVE] Board synchronized successfully');
              // Only show game AFTER board is properly loaded
              setShowGame(true);
              setGameStatus('Game in progress');
            } else {
              console.warn('[GAME_ACTIVE] Invalid board state, using initial board');
              setBoard(initialBoard);
              isFirstBoardLoadRef.current = false;
              // Show game with initial board
              setShowGame(true);
              setGameStatus('Game in progress');
            }
          } catch (error) {
            console.error('[GAME_ACTIVE] Error synchronizing board:', error);
            setBoard(initialBoard);
            isFirstBoardLoadRef.current = false;
            // Show game with initial board
            setShowGame(true);
            setGameStatus('Game in progress');
          }
        } else if (!isFirstBoardLoadRef.current) {
          // Board already loaded, just show game
          setShowGame(true);
          setGameStatus('Game in progress');
        } else {
          // No board data available, use initial board and show game
          console.warn('[GAME_ACTIVE] No board data available, using initial board');
          setBoard(initialBoard);
          isFirstBoardLoadRef.current = false;
          setShowGame(true);
          setGameStatus('Game in progress');
        }
        
        // CRITICAL FIX: Ensure both players get notified of game state change
        // This is especially important for the game creator who might be stuck in waiting mode
        if (gameMode === GameMode.WAITING) {
          console.log('[GAME_ACTIVE] Game creator detected active state, transitioning from waiting to active');
          // Force UI update for game creator
          setGameMode(GameMode.ACTIVE);
          setShowGame(true);
          setGameStatus('Game in progress');
          
          // OPTIMIZATION: Immediately show initial board if available
          if (gameData.board) {
            try {
              const reconstructedBoard = reconstructBoard(gameData.board);
              if (isValidBoardState(reconstructedBoard)) {
                setBoard(reconstructedBoard);
                console.log('[GAME_ACTIVE] Initial board loaded immediately');
              }
            } catch (error) {
              console.error('[GAME_ACTIVE] Error loading initial board:', error);
            }
          }
        }
      } else if (gameData.game_state === 'finished') {
        setGameMode(GameMode.FINISHED);
        setGameStatus('Game finished');
        setGameJustFinished(true); // Prevent excessive lobby loading
        
        // Clear the flag after 30 seconds to allow normal lobby loading
        setTimeout(() => {
          setGameJustFinished(false);
        }, 30000);
        
        // CRITICAL FIX: Enhanced game end notification logic
        console.log('[GAME_END] Game finished via Firebase subscription. Game data:', {
          winner: gameData.winner,
          playerColor: playerColor,
          gameState: gameData.game_state,
          hasWinner: !!gameData.winner,
          hasPlayerColor: !!playerColor
        });
        
        // Trigger victory/defeat animations for both players when game ends
        if (gameData.winner && playerColor) {
          console.log('[GAME_END] Winner and player color available, triggering celebrations');
          
          if (gameData.winner === playerColor) {
            console.log('[GAME_END] Player won! Triggering victory celebration');
            playSound('victory');
            triggerVictoryCelebration();
          } else {
            console.log('[GAME_END] Player lost! Triggering defeat celebration');
            playSound('loser');
            triggerDefeatCelebration();
          }
        } else {
          // FALLBACK: If winner is not set but game is finished, try to determine winner from board state
          console.log('[GAME_END] Winner not set in Firebase, attempting to determine from board state');
          
          if (gameData.board && gameData.board.positions) {
            try {
              const reconstructedBoard = reconstructBoard(gameData.board);
              console.log('[GAME_END] Reconstructed board for winner determination:', reconstructedBoard);
              
              // Check if blue king is missing (red wins)
              let blueKingFound = false;
              let redKingFound = false;
              
              for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                  const piece = reconstructedBoard[row][col];
                  if (piece === 'blueking') blueKingFound = true;
                  if (piece === 'redking') redKingFound = true;
                }
              }
              
              console.log('[GAME_END] King status - Blue king found:', blueKingFound, 'Red king found:', redKingFound);
              
              if (!blueKingFound && playerColor === 'red') {
                console.log('[GAME_END] Blue king missing, red player wins! Triggering victory celebration');
                playSound('victory');
                triggerVictoryCelebration();
              } else if (!redKingFound && playerColor === 'blue') {
                console.log('[GAME_END] Red king missing, blue player wins! Triggering victory celebration');
                playSound('victory');
                triggerVictoryCelebration();
              } else if (!blueKingFound && playerColor === 'blue') {
                console.log('[GAME_END] Blue king missing, blue player loses! Triggering defeat celebration');
                playSound('loser');
                triggerDefeatCelebration();
              } else if (!redKingFound && playerColor === 'red') {
                console.log('[GAME_END] Red king missing, red player loses! Triggering defeat celebration');
                playSound('loser');
                triggerDefeatCelebration();
              }
            } catch (error) {
              console.error('[GAME_END] Error determining winner from board state:', error);
            }
          }
        }
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
      
      // CRITICAL FIX: Set the current game token before setting wager to ensure correct display
      console.log('[FIREBASE_SUB] Setting currentGameToken to:', tokenSymbol, 'from game data:', gameData.bet_token);
      setCurrentGameToken(tokenSymbol as TokenSymbol);
      debugSetWager(wagerValue, 'Firebase subscription');
    } catch (error) {
      console.error('[FIREBASE_SUB] Error in subscription callback:', error);
      // Don't break the subscription on error, just log it
    }
    });
    
    console.log('[FIREBASE_SUB] Subscription established successfully for game:', inviteCode);
    gameChannel.current = unsubscribe;
    return unsubscribe;
  };

  // Simplified Firebase subscription - only set up once when inviteCode is available
  useEffect(() => {
    if (inviteCode && !gameChannel.current) {
      console.log('[FIREBASE_SUB] Setting up subscription for:', inviteCode);
      
      // Set loading state while waiting for initial data
      setIsGameLoading(true);
      
      // Add timeout to clear loading state if it takes too long
      const loadingTimeout = setTimeout(() => {
        console.log('[LOADING] Loading timeout reached, clearing loading state');
        setIsGameLoading(false);
      }, 10000); // 10 second timeout
      
      // Reset board state tracking for new game
      previousBoardStateRef.current = null;
      isFirstBoardLoadRef.current = true;
      
      const unsubscribe = subscribeToGame(inviteCode);
      return () => {
        console.log('[FIREBASE_SUB] Cleaning up subscription for:', inviteCode);
        clearTimeout(loadingTimeout);
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
        if (gameChannel.current) {
          gameChannel.current();
          gameChannel.current = null;
        }
      };
    }
  }, [inviteCode]); // Only depend on inviteCode, not other variables

  // CRITICAL FIX: Add additional subscription setup for game creators who might miss the initial subscription
  useEffect(() => {
    if (inviteCode && gameMode === GameMode.WAITING && !gameChannel.current) {
      console.log('[FIREBASE_SUB_FALLBACK] Setting up fallback subscription for waiting game creator:', inviteCode);
      
      // Force subscription setup for game creators who might be stuck in waiting mode
      const unsubscribe = subscribeToGame(inviteCode);
      return () => {
        console.log('[FIREBASE_SUB_FALLBACK] Cleaning up fallback subscription for:', inviteCode);
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
        if (gameChannel.current) {
          gameChannel.current();
          gameChannel.current = null;
        }
      };
    }
  }, [inviteCode, gameMode]); // Depend on both inviteCode and gameMode for fallback

  // DEBUG: Add manual state check function to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugGameState = async () => {
        if (inviteCode) {
          console.log('[DEBUG] Manual game state check for:', inviteCode);
          try {
            const gameData = await firebaseChess.getGame(inviteCode);
            console.log('[DEBUG] Game data:', gameData);
            console.log('[DEBUG] Current UI state - gameMode:', gameMode, 'playerColor:', playerColor, 'opponent:', opponent);
            console.log('[DEBUG] Transaction state - joinGameHash:', joinGameHash, 'pendingJoinGameData:', pendingJoinGameData);
            console.log('[DEBUG] Game state:', gameData?.game_state, 'Blue player:', gameData?.blue_player, 'Red player:', gameData?.red_player);
            
            // Return the data for inspection
            return {
              inviteCode,
              gameData,
              gameMode,
              playerColor,
              opponent,
              joinGameHash,
              pendingJoinGameData
            };
          } catch (error) {
            console.error('[DEBUG] Error checking game state:', error);
            return { error: error instanceof Error ? error.message : String(error) };
          }
        } else {
          console.log('[DEBUG] No invite code available');
          return { error: 'No invite code available' };
        }
      };
      
      (window as any).forceGameActive = () => {
        console.log('[DEBUG] Force setting game to active mode');
        setGameMode(GameMode.ACTIVE);
        setShowGame(true);
        setGameStatus('Game in progress (forced)');
      };
      
      (window as any).fixStuckGame = async () => {
        if (inviteCode && address) {
          console.log('[DEBUG] Attempting to fix stuck game for invite code:', inviteCode);
          try {
            const gameData = await firebaseChess.getGame(inviteCode);
            if (gameData) {
              console.log('[DEBUG] Current game data:', gameData);
              
              if (gameData.game_state === 'waiting_for_join' && gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
                console.log('[DEBUG] Game has both players but is stuck in waiting_for_join, fixing...');
                
                await firebaseChess.updateGame(inviteCode, {
                  ...gameData,
                  game_state: 'active'
                });
                
                console.log('[DEBUG] Game state updated to active');
                setGameMode(GameMode.ACTIVE);
                setShowGame(true);
                setGameStatus('Game started!');
                
                // Set player colors
                if (gameData.blue_player === address) {
                  setPlayerColor('blue');
                  setOpponent(gameData.red_player);
                } else if (gameData.red_player === address) {
                  setPlayerColor('red');
                  setOpponent(gameData.blue_player);
                }
              } else {
                console.log('[DEBUG] Game state is:', gameData.game_state, '- no fix needed');
              }
            } else {
              console.log('[DEBUG] No game data found');
            }
          } catch (error) {
            console.error('[DEBUG] Error fixing stuck game:', error);
          }
        } else {
          console.log('[DEBUG] No invite code or address available');
        }
      };
      
      // Expose firebaseChess to window for debugging
      (window as any).firebaseChess = firebaseChess;
    }
  }, [inviteCode, gameMode, playerColor, opponent]);

  // CRITICAL FIX: Add periodic check for game state changes to ensure game creators get notified
  useEffect(() => {
    if (inviteCode && gameMode === GameMode.WAITING && address) {
      console.log('[PERIODIC_CHECK] Setting up periodic check for game creator:', inviteCode);
      
      const interval = setInterval(async () => {
        try {
          const gameData = await firebaseChess.getGame(inviteCode);
          console.log('[PERIODIC_CHECK] Current game state:', gameData?.game_state, 'Current UI mode:', gameMode, 'Blue player:', gameData?.blue_player, 'Red player:', gameData?.red_player);
          
          if (gameData && gameData.game_state === 'active' && gameMode === GameMode.WAITING) {
            console.log('[PERIODIC_CHECK] Game became active, forcing UI update for game creator');
            setGameMode(GameMode.ACTIVE);
            setShowGame(true);
            setGameStatus('Game in progress');
            
            // Set player color and opponent if not already set
            if (!playerColor && gameData.blue_player === address) {
              setPlayerColor('blue');
              setOpponent(gameData.red_player);
            } else if (!playerColor && gameData.red_player === address) {
              setPlayerColor('red');
              setOpponent(gameData.blue_player);
            }
            
            // Set wager and token
            if (gameData.bet_token && gameData.bet_amount) {
              setCurrentGameToken(gameData.bet_token as TokenSymbol);
              const wagerValue = convertWagerFromWei(gameData.bet_amount, gameData.bet_token);
              debugSetWager(wagerValue, 'periodic check');
            }
          }
        } catch (error) {
          console.error('[PERIODIC_CHECK] Error checking game state:', error);
        }
      }, 2000); // Check every 2 seconds for faster response
      
      return () => {
        console.log('[PERIODIC_CHECK] Cleaning up periodic check');
        clearInterval(interval);
      };
    }
  }, [inviteCode, gameMode, address]);

  // CRITICAL FIX: Add periodic check for game end state to ensure both players get notified
  useEffect(() => {
    if (inviteCode && gameMode === GameMode.ACTIVE && address && playerColor) {
      console.log('[GAME_END_CHECK] Setting up periodic check for game end state:', inviteCode);
      
      const interval = setInterval(async () => {
        try {
          const gameData = await firebaseChess.getGame(inviteCode);
          if (gameData && gameData.game_state === 'finished' && gameMode === GameMode.ACTIVE) {
            console.log('[GAME_END_CHECK] Game finished detected via periodic check:', gameData);
            
            // Force game end notification if not already triggered
            if (gameData.winner && gameData.winner !== playerColor) {
              console.log('[GAME_END_CHECK] Player lost! Triggering defeat celebration');
              playSound('loser');
              triggerDefeatCelebration();
            } else if (gameData.winner && gameData.winner === playerColor) {
              console.log('[GAME_END_CHECK] Player won! Triggering victory celebration');
              playSound('victory');
              triggerVictoryCelebration();
            }
            
            // Update game mode to finished
            setGameMode(GameMode.FINISHED);
            setGameStatus('Game finished');
          }
        } catch (error) {
          console.error('[GAME_END_CHECK] Error checking game end state:', error);
        }
      }, 5000); // Check every 5 seconds (reduced frequency for performance)
      
      return () => {
        console.log('[GAME_END_CHECK] Cleaning up game end check for:', inviteCode);
        clearInterval(interval);
      };
    }
  }, [inviteCode, gameMode, address, playerColor]);

  // CRITICAL FIX: Add periodic board sync for active games to ensure real-time updates
  useEffect(() => {
    if (inviteCode && gameMode === GameMode.ACTIVE && address) {
      console.log('[BOARD_SYNC_CHECK] Setting up periodic board sync for active game:', inviteCode);
      
      const interval = setInterval(async () => {
        try {
          const gameData = await firebaseChess.getGame(inviteCode);
          if (gameData && gameData.board && gameData.game_state === 'active') {
            // Check if board has changed
            const currentBoardState = JSON.stringify(gameData.board);
            if (previousBoardStateRef.current !== currentBoardState) {
              console.log('[BOARD_SYNC_CHECK] Board changed, updating from Firebase');
              
              try {
                const reconstructedBoard = reconstructBoard(gameData.board);
                if (isValidBoardState(reconstructedBoard)) {
                  setBoard(reconstructedBoard);
                  previousBoardStateRef.current = currentBoardState;
                  console.log('[BOARD_SYNC_CHECK] Board updated successfully');
                }
              } catch (error) {
                console.error('[BOARD_SYNC_CHECK] Error reconstructing board:', error);
              }
            }
            
            // Update current player if it changed
            if (gameData.current_player && gameData.current_player !== currentPlayer) {
              console.log('[BOARD_SYNC_CHECK] Current player changed to:', gameData.current_player);
              setCurrentPlayer(gameData.current_player);
            }
          }
        } catch (error) {
          console.error('[BOARD_SYNC_CHECK] Error syncing board:', error);
        }
      }, 1000); // Check every 1 second for active games
      
      return () => {
        console.log('[BOARD_SYNC_CHECK] Cleaning up board sync check');
        clearInterval(interval);
      };
    }
  }, [inviteCode, gameMode, address, currentPlayer]);

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
        firebaseChess.getGame(inviteCode).then(gameData => {
          // Check if Firebase needs to be updated
          const needsUpdate = !gameData || 
                             !gameData.blue_player || 
                             gameData.red_player === '0x0000000000000000000000000000000000000000' ||
                             gameData.game_state !== 'active';
          
          if (needsUpdate && currentContractData && Array.isArray(currentContractData)) {
            const [player1, player2] = currentContractData;
            
            // Update Firebase with correct player data
            firebaseChess.updateGame(inviteCode, {
              blue_player: player1,
              red_player: player2,
              game_state: 'active',
              current_player: 'blue',
              winner: null // Initialize winner field
            }).then(() => {
              console.log('[AUTO-FIX] Firebase updated with correct player data');
            }).catch(error => {
              console.error('[AUTO-FIX] Error updating Firebase:', error);
            });
          }
          
          // Clear pending join data if game is confirmed active
          if (gameData && gameData.game_state === 'active' && pendingJoinGameData) {
            setPendingJoinGameData(null);
          }
        }).catch(error => {
          console.error('[AUTO-FIX] Error checking game data for auto-fix:', error);
        });
      }
    }
  }, [playerColor, address, inviteCode]); // Removed contractGameData and lobbyGameContractData to prevent infinite loops

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
        winner: null, // Initialize winner field
        last_move: null, // Reset last move for new match
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

  // Helper function to validate board state
  const isValidBoardState = (board: (string | null)[][]): boolean => {
    if (!board || !Array.isArray(board) || board.length !== 8) {
      return false;
    }
    
    for (let row = 0; row < 8; row++) {
      if (!Array.isArray(board[row]) || board[row].length !== 8) {
        return false;
      }
    }
    
    // Check for basic chess piece validity
    const validPieces = ['R', 'N', 'B', 'Q', 'K', 'P', 'r', 'n', 'b', 'q', 'k', 'p', null];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!validPieces.includes(board[row][col])) {
          return false;
        }
      }
    }
    
    return true;
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
      
      // Validate the reconstructed board
      if (isValidBoardState(newBoard)) {
        console.log('[BOARD] Reconstructed from flat structure:', newBoard);
        return newBoard;
      } else {
        console.warn('[BOARD] Reconstructed board failed validation, using initial board');
        return initialBoard;
      }
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
        
        if (isValidBoard && isValidBoardState(boardData.positions)) {
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

  const getOppositeColor = (color: 'blue' | 'red'): 'blue' | 'red' => {
    return color === 'blue' ? 'red' : 'blue';
  };

  const isValidKingMove = (color: 'blue' | 'red', startRow: number, startCol: number, endRow: number, endCol: number, boardState = board, skipCheckValidation = false): boolean => {
    const rowDiff = Math.abs(startRow - endRow);
    const colDiff = Math.abs(startCol - endCol);
    
    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) return true;
    
    // Castling
    if (rowDiff === 0 && colDiff === 2) {
      // Skip check validation if we're already in the middle of checking legal moves
      if (!skipCheckValidation) {
        // Check if king is currently in check - castling is not allowed when king is in check
        if (isKingInCheck(boardState, color)) {
          return false;
        }
      }
      
      if (color === 'blue' && !pieceState.blueKingMoved) {
        if (endCol === 6 && !pieceState.blueRooksMove.right) {
          // Kingside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][5] === null && boardState[startRow][6] === null) {
            // Check if king moves through check (only if not skipping validation)
            if (!skipCheckValidation) {
              const attackingColor = color === 'blue' ? 'red' : 'blue';
              if (!isSquareUnderAttack(startRow, 5, attackingColor, boardState) &&
                  !isSquareUnderAttack(startRow, 6, attackingColor, boardState)) {
                return true;
              }
            } else {
              return true; // Skip check validation for castling during legal move generation
            }
          }
        }
        if (endCol === 2 && !pieceState.blueRooksMove.left) {
          // Queenside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][1] === null && boardState[startRow][2] === null && boardState[startRow][3] === null) {
            // Check if king moves through check (only if not skipping validation)
            if (!skipCheckValidation) {
              const attackingColor = color === 'blue' ? 'red' : 'blue';
              if (!isSquareUnderAttack(startRow, 2, attackingColor, boardState) &&
                  !isSquareUnderAttack(startRow, 3, attackingColor, boardState)) {
                return true;
              }
            } else {
              return true; // Skip check validation for castling during legal move generation
            }
          }
        }
      } else if (color === 'red' && !pieceState.redKingMoved) {
        if (endCol === 6 && !pieceState.redRooksMove.right) {
          // Kingside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][5] === null && boardState[startRow][6] === null) {
            // Check if king moves through check (only if not skipping validation)
            if (!skipCheckValidation) {
              const attackingColor: 'blue' | 'red' = getOppositeColor(color);
              if (!isSquareUnderAttack(startRow, 5, attackingColor, boardState) &&
                  !isSquareUnderAttack(startRow, 6, attackingColor, boardState)) {
                return true;
              }
            } else {
              return true; // Skip check validation for castling during legal move generation
            }
          }
        }
        if (endCol === 2 && !pieceState.redRooksMove.left) {
          // Queenside castling - check if path is clear and king doesn't move through check
          if (boardState[startRow][1] === null && boardState[startRow][2] === null && boardState[startRow][3] === null) {
            // Check if king moves through check (only if not skipping validation)
            if (!skipCheckValidation) {
              const attackingColor: 'blue' | 'red' = getOppositeColor(color);
              if (!isSquareUnderAttack(startRow, 2, attackingColor, boardState) &&
                  !isSquareUnderAttack(startRow, 3, attackingColor, boardState)) {
                return true;
              }
            } else {
              return true; // Skip check validation for castling during legal move generation
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
        isValidMove = isValidKingMove(playerColor, startRow, startCol, endRow, endCol, boardState, !checkForCheck);
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

  const getLegalMoves = (from: { row: number; col: number }, boardState = board, player = currentPlayer, checkForCheck = true, depth = 0): { row: number; col: number }[] => {
    // Prevent infinite recursion
    if (depth > 10) {
      console.warn('[RECURSION_GUARD] Maximum recursion depth reached in getLegalMoves');
      return [];
    }
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
        if (canPieceMove(piece, from.row, from.col, forwardRow, from.col, checkForCheck, player, boardState, true)) {
          moves.push({ row: forwardRow, col: from.col });
        }
      }
      
      // Double move from starting position
      if (from.row === startingRow) {
        const doubleRow = from.row + 2 * direction;
        if (doubleRow >= 0 && doubleRow < 8) {
          if (canPieceMove(piece, from.row, from.col, doubleRow, from.col, checkForCheck, player, boardState, true)) {
            moves.push({ row: doubleRow, col: from.col });
          }
        }
      }
      
      // Diagonal captures
      for (const colOffset of [-1, 1]) {
        const captureCol = from.col + colOffset;
        const captureRow = from.row + direction;
        if (captureCol >= 0 && captureCol < 8 && captureRow >= 0 && captureRow < 8) {
          if (canPieceMove(piece, from.row, from.col, captureRow, captureCol, checkForCheck, player, boardState, true)) {
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
          if (canPieceMove(piece, from.row, from.col, newRow, newCol, checkForCheck, player, boardState, true)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    } else {
      // For other pieces (rook, bishop, queen, king), check all squares but use silent mode
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (canPieceMove(piece, from.row, from.col, row, col, checkForCheck, player, boardState, true)) {
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
          const legalMoves = getLegalMoves({ row, col }, boardState, player, true, 0);
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
          const legalMoves = getLegalMoves({ row, col }, boardState, player, true, 0);
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
      const moves = getLegalMoves({ row, col }, board, currentPlayer, true, 0);
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
    // Haptic feedback for move execution
    if (hasHapticFeedback && navigator.vibrate) {
      navigator.vibrate(20);
    }
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
    
    // Store move data for better tracking
    setLastMoveData({
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      piece: piece,
      capturedPiece: capturedPiece,
      player: currentPlayer
    });
    
    // Log the move details
    console.log('[MOVE] Executing move:', {
      from: { row: from.row, col: from.col, piece: piece },
      to: { row: to.row, col: to.col, capturedPiece: capturedPiece },
      player: currentPlayer,
      isCapture: isCapture,
      moveType: piece.toUpperCase() === 'K' ? 'king' : piece.toUpperCase() === 'R' ? 'rook' : 'other'
    });
    
    // Play sound effects and show animations immediately for better responsiveness
    if (isCapture) {
      playMoveSoundAndAnimation('capture', to);
      
      // Wait for animation to complete before executing the move
      setTimeout(() => {
        executeMoveAfterAnimation(from, to, promotionPiece);
      }, 500); // Restored to 500ms for proper GIF completion
      return;
    }
    
    // If not a capture, play move sound and execute move immediately
    playMoveSoundAndAnimation('move');
    executeMoveAfterAnimation(from, to, promotionPiece);
  };

  // Enhanced move execution with special moves
  const executeMoveAfterAnimation = async (from: { row: number; col: number }, to: { row: number; col: number }, promotionPiece = 'q') => {
    if (!playerColor || currentPlayer !== playerColor) return;
    
    const piece = board[from.row][from.col];
    if (!piece) return;
    
    // Ensure piece is not null for TypeScript
    const pieceString = piece as string;
    
    // CRITICAL FIX: Set flag to prevent Firebase subscription from overriding local board state
    setIsLocalMoveInProgress(true);
    console.log('[MOVE_ANIMATION] Local move in progress flag set');
    
    // SAFETY TIMEOUT: Reset flag after 5 seconds to prevent it from getting stuck
    const safetyTimeout = setTimeout(() => {
      if (isLocalMoveInProgress) {
        console.warn('[SAFETY] Local move flag stuck for 5 seconds, resetting');
        setIsLocalMoveInProgress(false);
      }
    }, 5000);
    
    console.log('[MOVE_ANIMATION] Starting move execution:', {
      from: { row: from.row, col: from.col, piece: piece },
      to: { row: to.row, col: to.col, capturedPiece: board[to.row][to.col] },
      currentBoard: board.map(row => [...row])
    });
    
    const newBoard = board.map(row => [...row]);
    
    // Handle pawn promotion BEFORE moving the piece to avoid display delay
    let pieceToPlace = pieceString;
    if (pieceString.toLowerCase() === 'p' && ((getPieceColor(pieceString) === 'blue' && to.row === 0) || (getPieceColor(pieceString) === 'red' && to.row === 7))) {
      pieceToPlace = getPieceColor(pieceString) === 'blue' ? promotionPiece.toLowerCase() : promotionPiece.toUpperCase();
      console.log('[MOVE_ANIMATION] Promoting pawn to:', pieceToPlace);
    }
    
    // Execute the move with the correct piece (promoted if applicable)
    newBoard[to.row][to.col] = pieceToPlace;
    newBoard[from.row][from.col] = null;
    
    // Handle special moves (castling, en passant) - but NOT pawn promotion since we handled it above
    console.log('[MOVE_ANIMATION] Before special moves handling');
    handleSpecialMoves(newBoard, from, to, pieceString, promotionPiece);
    console.log('[MOVE_ANIMATION] After special moves handling');
    
    console.log('[MOVE_ANIMATION] Move completed:', {
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      piece: pieceToPlace,
      finalBoardState: newBoard.map(row => [...row])
    });
    
    // Update piece state
    updatePieceState(from, to, pieceString);
    
    // Update move history
    const moveNotation = getMoveNotation(from, to, pieceString, newBoard);
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
        console.log('[CHECKMATE] Checkmate detected! Setting winner:', currentPlayer);
        gameState = 'finished';
        winner = currentPlayer;
        setGameStatus(`${currentPlayer === 'red' ? 'Red' : 'Blue'} wins by checkmate!`);
        setGameJustFinished(true); // Prevent excessive lobby loading
        
        // Clear the flag after 30 seconds to allow normal lobby loading
        setTimeout(() => {
          setGameJustFinished(false);
        }, 30000);
        
        if (currentPlayer === playerColor) {
          playSound('victory');
          triggerVictoryCelebration();
        } else {
          playSound('loser');
          triggerDefeatCelebration();
        }
      
      // Update scores for both players
      const currentContractData = getCurrentContractGameData();
      
      if (currentContractData && Array.isArray(currentContractData) && (currentContractData as any).length >= 2) {
        const contractData = currentContractData as unknown as any[];
        if (contractData[0] && contractData[1]) {
          const player1 = contractData[0] as string;
          const player2 = contractData[1] as string;
          await updateBothPlayersScoresLocal(currentPlayer, player1, player2);
        } else {
          // Fallback to single player update if contract data not available
          await updateScore(currentPlayer === playerColor ? 'win' : 'loss');
          // Reload leaderboard after single player update
          await loadLeaderboard();
        }
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
      winner = currentPlayer; // Player who made the move that caused stalemate
      gameState = 'finished';
      setGameStatus(`${winner === 'red' ? 'Red' : 'Blue'} wins by stalemate!`);
      setGameJustFinished(true); // Prevent excessive lobby loading
      
      // Clear the flag after 30 seconds to allow normal lobby loading
      setTimeout(() => {
        setGameJustFinished(false);
      }, 30000);
      
      if (winner === playerColor) {
        playSound('victory');
        triggerVictoryCelebration();
      } else {
        playSound('loser');
        triggerDefeatCelebration();
      }
      
      // Update Firebase FIRST (critical for winner field)
      try {
        if (!inviteCode) {
          console.error('[BUG] inviteCode is missing when trying to update game!');
          setGameStatus('Game code missing. Please reload or rejoin the game.');
          return;
        }
        
        // Flatten the board for Firebase storage
        const flattenedBoard = flattenBoard(newBoard);
        
        // Update Firebase with the new board state
        console.log('[FIREBASE_UPDATE] About to update Firebase with:', {
          inviteCode,
          gameState,
          winner,
          currentPlayer,
          nextPlayer,
          playerColor
        });
        console.log('[FIREBASE_UPDATE] CRITICAL: Setting winner field to:', winner, 'for game:', inviteCode);
        
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
        
        console.log('[FIREBASE_UPDATE] Firebase update completed successfully');
      } catch (error) {
        console.error('[DATABASE] Error updating game:', error);
        console.error('[DATABASE] Error details:', {
          inviteCode,
          gameState,
          winner,
          error: String(error)
        });
      }
      
              // Update scores for both players (AFTER Firebase update)
        try {
          const currentContractData = getCurrentContractGameData();
          
          if (currentContractData && Array.isArray(currentContractData) && (currentContractData as any).length >= 2) {
          const contractData = currentContractData as unknown as any[];
          if (contractData[0] && contractData[1]) {
            const player1 = contractData[0] as string;
            const player2 = contractData[1] as string;
            await updateBothPlayersScoresLocal(winner, player1, player2);
          } else {
            // Fallback to single player update if contract data not available
            await updateScore(winner === playerColor ? 'win' : 'loss');
            // Reload leaderboard after single player update
            await loadLeaderboard();
          }
        } else {
          // Fallback to single player update if contract data not available
          await updateScore(winner === playerColor ? 'win' : 'loss');
          // Reload leaderboard after single player update
          await loadLeaderboard();
        }
      } catch (error) {
        console.error('[SCORE] Error updating scores:', error);
        // Don't fail the entire game end if score update fails
      }
      
      // Trigger contract payout for the winner
      if (winner === playerColor) {
        setTimeout(() => {
          claimWinnings();
        }, 2000); // Small delay to ensure UI updates first
      }
    }
      try {
        if (!inviteCode) {
          console.error('[BUG] inviteCode is missing when trying to update game!');
          setGameStatus('Game code missing. Please reload or rejoin the game.');
          return;
        }
        
        // CRITICAL FIX: Clear the local move flag BEFORE Firebase update to prevent race condition
        setIsLocalMoveInProgress(false);
        console.log('[MOVE_ANIMATION] Local move in progress flag cleared BEFORE Firebase update');
        
        // Add small delay to ensure local state is fully updated before Firebase update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Flatten the board for Firebase storage
        const flattenedBoard = flattenBoard(newBoard);
        
        // Update Firebase with the new board state
        console.log('[FIREBASE_UPDATE] About to update Firebase with:', {
          inviteCode,
          gameState,
          winner,
          currentPlayer,
          nextPlayer,
          playerColor
        });
        
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
        
        console.log('[FIREBASE_UPDATE] Firebase update completed successfully');
      } catch (error) {
        console.error('[DATABASE] Error updating game:', error);
        console.error('[DATABASE] Error details:', {
          inviteCode,
          gameState,
          winner,
          error: String(error)
        });
      }
    setBoard(newBoard);
    setCurrentPlayer(nextPlayer);
    setLastMove({ from, to });
    setShowPromotion(false);
    setPromotionMove(null);
    
    // Clear the local move flag after everything is complete
    setIsLocalMoveInProgress(false);
    console.log('[MOVE_ANIMATION] Local move completed, flag cleared');
    
    // Cleanup safety timeout
    clearTimeout(safetyTimeout);
  };

  // Add state for victory/defeat animation
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);

  // Helper to clear victory/defeat overlays
  const clearCelebration = () => {
    setShowVictory(false);
    setShowDefeat(false);
    setVictoryCelebration(false);
  };

  // Victory celebration
  const triggerVictoryCelebration = () => {
    setVictoryCelebration(true);
    setShowVictory(true);
    
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
    
    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current);
    }
    celebrationTimeout.current = setTimeout(() => {
      setVictoryCelebration(false);
    }, 5000);
  };

  // Defeat celebration with blood effect
  const triggerDefeatCelebration = () => {
    setShowDefeat(true);
    
    // Create blood drip effect
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const bloodDrip = document.createElement('div');
        bloodDrip.className = 'blood-drip';
        bloodDrip.style.cssText = `
          position: fixed;
          top: 0;
          width: 18px;
          height: 60px;
          background: linear-gradient(to bottom, #a80000 0%, #d10000 80%, #5a0000 100%);
          border-radius: 50% 50% 60% 60%/60% 60% 100% 100%;
          opacity: 0.85;
          z-index: 2000;
          left: ${Math.random() * window.innerWidth}px;
          animation: blood-drip-fall 2.8s linear forwards;
        `;
        document.body.appendChild(bloodDrip);
        setTimeout(() => bloodDrip.remove(), 2800);
      }, i * 150);
    }
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
        // If there was a queen at d1/d8, move it to a safe position (e1/e8) FIRST
        if (queenPiece && queenPiece.toLowerCase() === 'q') {
          newBoard[from.row][4] = queenPiece;
        }
        // Now move the rook
        newBoard[from.row][0] = null;
        newBoard[from.row][3] = getPieceColor(piece) === 'blue' ? 'r' : 'R';
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

  // Play sound with preloaded audio for instant playback
  const playSound = (soundType: 'move' | 'capture' | 'check' | 'checkmate' | 'victory' | 'loser' | 'upgrade') => {
    if (!soundEnabled) return;
    
    try {
      // Use preloaded audio if available
      if (audioLoaded && audioCache[soundType]) {
        const audio = audioCache[soundType];
        // Clone the audio to allow overlapping sounds
        const audioClone = audio.cloneNode() as HTMLAudioElement;
        audioClone.volume = 0.3;
        audioClone.currentTime = 0;
        audioClone.play().catch(e => console.warn('Preloaded audio play failed:', e));
      } else {
        // Fallback to creating new audio object
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
        audio.volume = 0.3;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      }
    } catch (error) {
      console.warn('Sound play failed:', error);
    }
  };

  // Synchronized sound and animation for moves
  const playMoveSoundAndAnimation = (soundType: 'move' | 'capture', animationPosition?: { row: number; col: number }) => {
    // Play sound immediately
    playSound(soundType);
    
    // Show animation if provided
    if (animationPosition) {
      setCaptureAnimation({ row: animationPosition.row, col: animationPosition.col, show: true });
      setTimeout(() => {
        setCaptureAnimation(null);
      }, 500); // Increased to 500ms to match GIF duration
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
            game_state: 'waiting',
            winner: null // Reset winner field
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
          updateData.winner = null; // Initialize winner field
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
              winner: null, // Initialize winner field
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



  // Enhanced mobile touch handling for better piece selection and drag support
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<{ row: number; col: number } | null>(null);

  const handleTouchStart = (row: number, col: number, event: React.TouchEvent) => {
    // Prevent default to avoid double-tap zoom on mobile
    event.preventDefault();
    
    const touch = event.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(false);
    setDraggedPiece(null);
    
    // Haptic feedback for touch devices
    if (hasHapticFeedback && navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    // Handle piece selection
    handleSquareClick(row, col);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    // Prevent scrolling when touching the chessboard
    event.preventDefault();
    
    if (!touchStartPos || !selectedSquare) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // Start dragging if movement exceeds threshold
    if ((deltaX > 10 || deltaY > 10) && !isDragging) {
      setIsDragging(true);
      setDraggedPiece(selectedSquare);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    
    if (isDragging && draggedPiece && selectedSquare) {
      // Calculate which square the piece was dropped on
      const touch = event.changedTouches[0];
      const boardElement = event.currentTarget.closest('.chessboard');
      
      if (boardElement) {
        const boardRect = boardElement.getBoundingClientRect();
        const squareSize = boardRect.width / 8;
        
        const relativeX = touch.clientX - boardRect.left;
        const relativeY = touch.clientY - boardRect.top;
        
        const col = Math.floor(relativeX / squareSize);
        const row = Math.floor(relativeY / squareSize);
        
        // Ensure valid coordinates
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
          // Check if the move is valid
          const validMoves = getLegalMoves(draggedPiece, board, currentPlayer);
          const isValidMove = validMoves.some(move => move.row === row && move.col === col);
          
          if (isValidMove) {
            makeMove(draggedPiece, { row, col });
          }
        }
      }
    }
    
    // Reset touch state
    setTouchStartPos(null);
    setIsDragging(false);
    setDraggedPiece(null);
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
        onTouchEnd={handleTouchEnd}
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
      <div className={`promotion-dialog ${isMobile ? 'mobile-promotion' : ''}`} style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid gold',
        borderRadius: '8px',
        padding: isMobile ? '15px' : '20px',
        zIndex: 1000,
        minWidth: isMobile ? '280px' : '320px',
        maxWidth: isMobile ? '90vw' : '400px'
      }}>
        <div className="promotion-content">
          <h3 style={{ 
            color: 'white', 
            marginBottom: isMobile ? '10px' : '15px',
            fontSize: isMobile ? '16px' : '18px',
            textAlign: 'center'
          }}>
            Choose promotion piece:
          </h3>
          <div className={`promotion-pieces ${isMobile ? 'mobile-promotion-grid' : ''}`} style={{ 
            display: 'flex', 
            gap: isMobile ? '8px' : '10px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: 'center'
          }}>
            {pieces.map(piece => (
              <div
                key={piece}
                className={`promotion-piece ${isMobile ? 'mobile-promotion-piece' : ''}`}
                onClick={() => {
                  executeMove(promotionMove.from, promotionMove.to, piece);
                  setShowPromotion(false);
                  setPromotionMove(null);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
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
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={pieceImages[piece]} 
                  alt={piece} 
                  style={{ 
                    width: isMobile ? '32px' : '40px', 
                    height: isMobile ? '32px' : '40px',
                    pointerEvents: 'none'
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render piece set selector
  const renderPieceSetSelector = () => {
    const handlePieceSetSelect = (pieceSet: ChessPieceSet) => {
      setSelectedPieceSet(pieceSet);
      setShowPieceSetDropdown(false);
    };

    const getPieceSetDisplayName = (pieceSetId: string) => {
      if (pieceSetId === 'lawbstation') return 'LawbStation Chess Set';
      if (pieceSetId === 'pixelawbs') return 'PixeLawbs Chess Set';
      return 'Select Chess Set';
    };

    // Filter available piece sets based on NFT ownership
    const availablePieceSets = [
      getDefaultPieceSet(), // LawbStation always available
      ...(nftVerificationResult?.hasPixelawbsNFT ? [getPixelawbsPieceSet()] : [])
    ];

    return (
      <div className="piece-set-selection-row" style={{ justifyContent: 'center' }}>
        <div className="piece-set-controls-col">
          <div className="piece-set-selection-panel" style={{background:'transparent',borderRadius:0,padding:'32px 24px',boxShadow:'none',textAlign:'center'}}>
            <h2 style={{fontWeight:700,letterSpacing:1,fontSize:'2rem',color:'#ff0000',marginBottom:16,textShadow:'0 0 6px #ff0000, 0 0 2px #ff0000'}}>Select Chess Set</h2>
            <p style={{fontSize:'1.1rem',color:'#ff0000',marginBottom:24,textShadow:'0 0 6px #ff0000, 0 0 2px #ff0000'}}>Choose your preferred chess set for this match.</p>
            
            {isCheckingNFT && (
              <div style={{marginBottom: '20px', color: '#ff0000', fontSize: '1rem'}}>
                Checking Pixelawbs NFT ownership...
              </div>
            )}
            
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
                    {availablePieceSets.map((pieceSet) => (
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
                        {pieceSet.id === 'pixelawbs' && !nftVerificationResult?.hasPixelawbsNFT && (
                          <span style={{fontSize: '0.8em', color: '#666'}}> (NFT Required)</span>
                        )}
                      </div>
                    ))}
                    {!nftVerificationResult?.hasPixelawbsNFT && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #333',
                          fontSize: '1em',
                          color: '#666',
                          background: '#000000',
                          cursor: 'not-allowed',
                          opacity: 0.5
                        }}
                      >
                        PixeLawbs Chess Set (NFT Required)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {nftVerificationResult?.error && (
              <div style={{marginBottom: '20px', color: '#ff0000', fontSize: '0.9rem'}}>
                {nftVerificationResult.error}
              </div>
            )}
            
            <button 
              className={`piece-set-btn start-btn`}
              onClick={() => { 
                setShowPieceSetSelector(false); 
                createGame();
              }}
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
          </div>
        </div>
      </div>
    );
  };

  // Render piece gallery
  const renderPieceGallery = () => (
    <div className="piece-gallery">
      <h3>{selectedPieceSet.name}</h3>
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

  // Load initial data with optimized lobby loading
  useEffect(() => {
    loadLeaderboard();
    loadOpenGames();
    checkStuckGames(); // Check for stuck games on load
    
    // Set up polling for open games with debouncing and reduced frequency
    let timeoutId: NodeJS.Timeout;
    const debouncedLoadOpenGames = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Only load if we're in lobby mode and not in an active game
        if (gameMode === GameMode.LOBBY && !inviteCode) {
          loadOpenGames();
        }
      }, 2000); // 2 second debounce
    };
    
    const interval = setInterval(debouncedLoadOpenGames, 60000); // Changed from 30s to 60s
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
      if (debouncedLoadOpenGamesRef.current) {
        clearTimeout(debouncedLoadOpenGamesRef.current);
      }
      if (gameChannel.current) {
        // Just call the unsubscribe function
        gameChannel.current();
      }
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
    };
  }, [gameMode, inviteCode, gameJustFinished]);

  // Preload audio files for instant playback
  useEffect(() => {
    const preloadAudio = async () => {
      const audioFiles = {
        move: '/images/move.mp3',
        capture: '/images/capture.mp3',
        check: '/images/play.mp3',
        victory: '/images/victory.mp3',
        loser: '/images/loser.mp3',
        upgrade: '/images/upgrade.mp3'
      };

      const cache: { [key: string]: HTMLAudioElement } = {};
      
      for (const [type, src] of Object.entries(audioFiles)) {
        try {
          const audio = new Audio(src);
          audio.volume = 0.3;
          audio.preload = 'auto';
          
          // Wait for audio to be loaded
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            // Fallback timeout
            setTimeout(resolve, 1000);
          });
          
          cache[type] = audio;
        } catch (error) {
          console.warn(`Failed to preload audio ${type}:`, error);
        }
      }
      
      setAudioCache(cache);
      setAudioLoaded(true);
      console.log('[AUDIO] Audio files preloaded successfully');
    };

    preloadAudio();
  }, []);

  // Main render - single container like ChessGame.tsx
  return (
    <div className={`chess-game${showGame ? ' game-active' : ''} ${isMobile ? 'mobile mobile-device' : 'desktop'} ${isLandscape ? 'landscape-orientation' : 'portrait-orientation'}`}>
      {/* Header - always show */}
      <div className="chess-header">
        <h2>LAWB CHESS MAINNET BETA 3000</h2>
        <div className="chess-controls">
          {onMinimize && <button onClick={onMinimize}>_</button>}
          <button 
            className="chat-bubble-btn"
            onClick={onChatToggle}
            title="Toggle Chat"
            style={{
              background: '#c0c0c0',
              border: '1px outset #fff',
              borderRadius: '0',
              color: '#000',
              cursor: 'pointer',
              fontFamily: 'MS Sans Serif, Microsoft Sans Serif, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              margin: '0 2px'
            }}
          >
            💬
          </button>
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Main Layout */}
      <div className="game-stable-layout">
        {/* Left Sidebar - Show only during active gameplay, not in lobby */}
        {(gameMode === GameMode.ACTIVE || gameMode === GameMode.FINISHED) && (
          <div className="left-sidebar">
            {/* Tab Navigation */}
            <div className="sidebar-tabs">
              <button 
                className={`tab-button ${sidebarView === 'moves' ? 'active' : ''}`}
                onClick={() => setSidebarView('moves')}
              >
                Moves
              </button>
              <button 
                className={`tab-button ${sidebarView === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setSidebarView('leaderboard')}
              >
                Leaderboard
              </button>
              <button 
                className={`tab-button ${sidebarView === 'gallery' ? 'active' : ''}`}
                onClick={() => setSidebarView('gallery')}
              >
                Gallery
              </button>
              <button 
                className="tab-button menu-button"
                onClick={() => { setGameMode(GameMode.LOBBY); setShowGame(false); }}
              >
                Menu
              </button>
              {onBackToModeSelect && (
                <button 
                  className="tab-button menu-button"
                  onClick={onBackToModeSelect}
                >
                  Mode Select
                </button>
              )}
            </div>

            {/* Tab Content */}
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

            {sidebarView === 'leaderboard' && (
              <div className="leaderboard-compact">
                <div className="leaderboard-title">Leaderboard</div>
                <div className="leaderboard-list">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div key={entry.username} className="leaderboard-entry">
                      <span className="rank">#{index + 1}</span>
                      <span className="player">{formatLeaderboardAddress(entry.username)}</span>
                      <span className="score">{entry.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarView === 'gallery' && (
              <div className="piece-gallery-compact">
                <div className="gallery-title">Piece Gallery</div>
                <div className="piece-gallery-grid">
                  {pieceGallery.map((piece) => (
                    <div 
                      key={piece.key} 
                      className={`piece-gallery-item ${selectedGalleryPiece === piece.key ? 'selected' : ''}`}
                      data-piece-color={piece.name.toLowerCase().includes('red') ? 'red' : 'blue'}
                      onClick={() => setSelectedGalleryPiece(selectedGalleryPiece === piece.key ? null : piece.key)}
                    >
                      <img src={piece.img} alt={piece.name} className="piece-gallery-img" />
                      <div className="piece-gallery-name">{piece.name}</div>
                      {selectedGalleryPiece === piece.key && (
                        <div className="piece-gallery-desc">{piece.desc}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Center Area */}
        <div className={`center-area ${isGameLoading ? 'loading' : ''}`}>
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
                        Create New Match
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
                        <h3 style={{ color: '#ff0000' }}>Create New Match</h3>
                        
                        {/* Game Creation Flow Explanation */}
                        <div style={{ 
                          background: 'rgba(255, 0, 0, 0.1)', 
                          border: '1px solid #ff0000', 
                          padding: '12px', 
                          marginBottom: '15px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          lineHeight: '1.4',
                          color: '#ff0000'
                        }}>
                          <strong>📋 Game Creation Flow:</strong><br/>
                          1️⃣ <strong>Select Token</strong> - Choose DMT or other supported Sanko tokens<br/>
                          2️⃣ <strong>Enter Amount</strong> - Set your wager amount (must be within min/max limits)<br/>
                          3️⃣ <strong>Select Piece Set</strong> - Choose your preferred chess piece style<br/>
                          4️⃣ <strong>Click "Create Game"</strong> - This will trigger two transactions:<br/>
                          &nbsp;&nbsp;&nbsp;• <strong>Approval Transaction</strong> - Allows the contract to spend your tokens<br/>
                          &nbsp;&nbsp;&nbsp;• <strong>Create Game Transaction</strong> - Creates the game and locks your wager<br/>
                          <br/>
                          <strong>💡 Note:</strong> You'll need to confirm both transactions in your wallet. The first approval may be for a higher amount to avoid future approvals.
                        </div>
                        
                        <TokenSelector
                          selectedToken={selectedToken}
                          onTokenSelect={setSelectedToken}
                          wagerAmount={gameWager}
                          onWagerChange={setGameWager}
                          disabled={isGameCreationInProgress}
                        />
                        <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                          <button 
                            className="create-confirm-btn"
                            onClick={() => {
                              if (gameWager > 0 && !isGameCreationInProgress) {
                                setShowPieceSetSelector(true);
                              }
                            }}
                            disabled={gameWager <= 0 || isGameCreationInProgress}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ff0000',
                              color: '#000000',
                              border: 'none',
                              borderRadius: '0px',
                              cursor: gameWager <= 0 || isGameCreationInProgress ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            {isGameCreationInProgress ? 'Creating...' : 'Create Game'}
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => {
                              setIsCreatingGame(false);
                              setIsGameCreationInProgress(false);
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ff0000',
                              color: '#000000',
                              border: 'none',
                              borderRadius: '0px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Piece Set Selector */}
                    {showPieceSetSelector && (
                      <div style={{ order: 2, marginBottom: '20px' }}>
                        {renderPieceSetSelector()}
                      </div>
                    )}
                    
                    <div className="open-games" style={{ order: 3 }}>
                      <h3 style={{ color: '#ff0000' }}>Open Games ({openGames.length})</h3>
                      <div className="games-list" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {openGames.map(game => {
                          console.log('[RENDER LOBBY] Rendering game:', game);
                          return (
                          <div key={game.invite_code} className="game-item" style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px',
                            border: '1px solid #333',
                            borderRadius: '3px',
                            backgroundColor: '#000000'
                          }}>
                            <div className="game-details" style={{ textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '4px', color: '#ff0000' }}>
                              <div className="game-id" style={{ fontWeight: 'bold', color: '#ff0000' }}>{game.game_title || 'Untitled Game'}</div>
                              <div className="wager" style={{ color: '#ff0000' }}>
                                Wager: {(parseFloat(game.bet_amount) / Math.pow(10, SUPPORTED_TOKENS[(game.bet_token as TokenSymbol) || 'DMT'].decimals)).toFixed(2)} {SUPPORTED_TOKENS[(game.bet_token as TokenSymbol) || 'DMT']?.symbol || 'DMT'}
                              </div>
                              <div className="creator" style={{ fontSize: '0.8rem', color: '#ff0000' }}>Created by: {formatAddress(game.blue_player)}</div>
                            </div>
                            <button 
                              className="join-btn"
                              onClick={() => joinGame(game.invite_code)}
                              style={{
                                padding: '4px 12px',
                                fontSize: '0.8rem',
                                backgroundColor: '#ff0000',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0px',
                                cursor: 'pointer'
                              }}
                            >
                              Join Game
                            </button>
                          </div>
                          );
                        })}
                        {openGames.length === 0 && (
                          <div className="no-games" style={{ 
                            color: '#ff0000', 
                            textAlign: 'center', 
                            padding: '20px',
                            background: 'rgba(255, 0, 0, 0.05)',
                            border: '1px solid rgba(255, 0, 0, 0.2)',
                            borderRadius: '4px'
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                              🦞♟ No Open Games Available
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              Be the first to create a match! Click "Create New Match" above to start.<br/>
                              Other players will be able to match wage and join your game once it's created.
                            </div>
                          </div>
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
                <p>Wager: {wager.toFixed(6)} {currentGameToken}</p>
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
                <div className="waiting-gif-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '20px',
                  width: '100%'
                }}>
                  <img 
                    src="/assets/stardance.gif" 
                    alt="Star dance animation" 
                    style={{
                      width: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
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
                  Wager: {wager.toFixed(6)} {currentGameToken}
                </span>
                {opponent && (
                  <span className="opponent-info">
                    vs {formatAddress(opponent)}
                  </span>
                )}
              </div>
              <div className="chess-main-area">
                {/* Loading indicator */}
                {isGameLoading && (
                  <div className="game-loading-indicator" style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#ff0000',
                    padding: '20px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontFamily: 'Courier New, monospace',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    <div style={{ marginBottom: '10px' }}>🔄</div>
                    <div>Loading Game...</div>
                    <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                      Connecting to Firebase...
                    </div>
                  </div>
                )}
                <div className={`chessboard-container ${isGameLoading ? 'loading' : ''}`}>
                  <div className={`chessboard ${isGameLoading ? 'loading' : ''}`}>
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
                
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modals and Overlays */}
      {renderPromotionDialog()}
      
      {/* Victory/Defeat Overlays */}
      {showVictory && (
        <div className="victory-overlay">
          <div className="balloons-container" />
          <div className="victory-modal">
            <div className="victory-content">
              <img src="/images/victory.gif" alt="Victory" style={{ width: 120, marginBottom: 16 }} />
              <div>Victory!</div>
              <button onClick={() => { clearCelebration(); setGameMode(GameMode.LOBBY); setShowGame(false); }}>Back to Lobby</button>
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
              <button onClick={() => { clearCelebration(); setGameMode(GameMode.LOBBY); setShowGame(false); }}>Back to Lobby</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessMultiplayer; 