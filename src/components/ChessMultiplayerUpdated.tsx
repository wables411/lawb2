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

// Timeout configuration (60 minutes = 3600000 ms)
const GAME_TIMEOUT_MS = 3600000;

interface ChessMultiplayerProps {
  onClose: () => void;
  onMinimize?: () => void;
  fullscreen?: boolean;
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
  
  // Token-related state
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('DMT');
  const [wagerAmount, setWagerAmount] = useState<number>(0.1);
  const [isApprovingToken, setIsApprovingToken] = useState(false);
  const [approvalError, setApprovalError] = useState<string>('');
  
  // Token hooks
  const { balance: tokenBalance, isLoading: balanceLoading } = useTokenBalance(selectedToken, address);
  const { allowance: tokenAllowance } = useTokenAllowance(selectedToken, chessContractAddress, address);
  const { approve: approveToken, isPending: isApproving } = useApproveToken();
  
  // Timeout system
  const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  
  // Smart contract integration
  const [contractInviteCode, setContractInviteCode] = useState<string>('');
  const [contractWinner, setContractWinner] = useState<string>('');
  const [isResolvingGame, setIsResolvingGame] = useState(false);
  const [canClaimWinnings, setCanClaimWinnings] = useState(false);
  const [isClaimingWinnings, setIsClaimingWinnings] = useState(false);
  const [hasLoadedGame, setHasLoadedGame] = useState(false);
  
  // Contract write hooks for different operations
  const { writeContract: writeCreateGame, isPending: isCreatingGameContract, data: createGameHash } = useWriteContract();
  const { writeContract: writeJoinGame, isPending: isJoiningGameContract, data: joinGameHash, error: joinGameError } = useWriteContract();
  const { writeContract: writeEndGame, isPending: isEndingGame, data: endGameHash } = useWriteContract();
  const { writeContract: writeCancelGame, isPending: isCancellingGame, data: cancelGameHash } = useWriteContract();
  
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
  
  // UI state - always use dark mode for chess
  const [darkMode] = useState(true);
  
  // Always apply dark mode classes
  useEffect(() => {
    document.documentElement.classList.add('chess-dark-mode');
    document.body.classList.add('chess-dark-mode');
    
    // Cleanup function to remove classes when component unmounts
    return () => {
      document.documentElement.classList.remove('chess-dark-mode');
      document.body.classList.remove('chess-dark-mode');
    };
  }, []);

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

  // Contract read hook for getting game details
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
  
  // Debug function to track invite code changes
  const debugSetInviteCode = (newValue: string, source: string) => {
    console.log(`[INVITE_DEBUG] Setting inviteCode to "${newValue}" from ${source}`);
    if (inviteCode && !newValue) {
      console.warn(`[INVITE_DEBUG] WARNING: Clearing inviteCode from "${inviteCode}" to "${newValue}" from ${source}`);
    }
    setInviteCode(newValue);
  };
  
  // Debug function to track wager changes
  const debugSetWager = (newValue: number, source: string) => {
    console.log(`[WAGER_DEBUG] Setting wager to ${newValue} ${selectedToken} from ${source}`);
    if (wager !== newValue) {
      console.log(`[WAGER_DEBUG] Wager changed from ${wager} to ${newValue} ${selectedToken}`);
    }
    setWager(newValue);
  };

  // Tab state for left sidebar
  const [leftSidebarTab, setLeftSidebarTab] = useState<'moves' | 'leaderboard'>('moves');

  // Timeout management
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
  }, [timeoutTimer]);

  const stopTimeoutTimer = useCallback(() => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      setTimeoutTimer(null);
    }
  }, [timeoutTimer]);

  const handleTimeout = async () => {
    if (!inviteCode || !playerColor) return;
    
    console.log('[TIMEOUT] Handling timeout for game:', inviteCode);
    
    // Determine winner based on who was waiting
    const winner = currentPlayer === 'blue' ? 'red' : 'blue';
    const winnerAddress = winner === 'blue' ? contractGameData?.[0] : contractGameData?.[1];
    
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

  // Token approval management
  const checkAndApproveToken = async () => {
    if (!address || !chessContractAddress) return false;
    
    const requiredAmount = BigInt(Math.floor(wagerAmount * Math.pow(10, SUPPORTED_TOKENS[selectedToken].decimals)));
    
    if (tokenAllowance < requiredAmount) {
      console.log('[APPROVAL] Token allowance insufficient, requesting approval');
      setIsApprovingToken(true);
      setApprovalError('');
      
      try {
        approveToken(selectedToken, chessContractAddress, requiredAmount);
        return false; // Will be handled by transaction receipt
      } catch (error) {
        console.error('[APPROVAL] Error approving token:', error);
        setApprovalError('Failed to approve token. Please try again.');
        setIsApprovingToken(false);
        return false;
      }
    }
    
    return true;
  };

  // Handle approval transaction receipt
  useEffect(() => {
    if (!isApproving && isApprovingToken) {
      console.log('[APPROVAL] Transaction completed, checking allowance...');
      setIsApprovingToken(false);
      setApprovalError('');
      
      // Wait a moment for the allowance to update, then try to create game
      setTimeout(() => {
        if (gameMode === GameMode.LOBBY) {
          console.log('[APPROVAL] Retrying game creation after approval');
          createGame();
        }
      }, 2000);
    }
  }, [isApproving, isApprovingToken, gameMode]);

  // Create game with token support
  const createGame = async () => {
    if (!address || wagerAmount <= 0) return;
    
    console.log('[CREATE] Starting game creation - address:', address, 'wager:', wagerAmount, 'token:', selectedToken);
    
    // Check token approval first
    const isApproved = await checkAndApproveToken();
    if (!isApproved) {
      setGameStatus('Please approve token spending first');
      return;
    }
    
    setIsCreatingGame(true);
    try {
      const newInviteCode = generateBytes6InviteCode();
      console.log('[CREATE] Generated invite code:', newInviteCode);
      
      const tokenAddress = SUPPORTED_TOKENS[selectedToken].address;
      const wagerAmountWei = BigInt(Math.floor(wagerAmount * Math.pow(10, SUPPORTED_TOKENS[selectedToken].decimals)));
      
      const gameData = {
        invite_code: newInviteCode,
        game_title: `Chess Game ${newInviteCode.slice(-6)}`,
        bet_amount: wagerAmountWei.toString(),
        bet_token: selectedToken,
        blue_player: address,
        game_state: 'waiting',
        board: { positions: flattenBoard(initialBoard), rows: 8, cols: 8 },
        current_player: 'blue',
        chain: 'sanko',
        contract_address: chessContractAddress,
        is_public: true,
        created_at: new Date().toISOString()
      };
      
      console.log('[CREATE] Game data prepared:', gameData);
      console.log('[CREATE] Calling contract with args:', [newInviteCode, tokenAddress, wagerAmountWei]);
      
      // Call contract to create game with token parameters
      writeCreateGame({
        address: chessContractAddress as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'createGame',
        args: [newInviteCode as `0x${string}`, tokenAddress as `0x${string}`, wagerAmountWei],
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

  // Join game with token support
  const joinGame = async (inviteCode: string) => {
    if (!address) return;
    
    try {
      const gameData = await firebaseChess.getGame(inviteCode);
      if (!gameData || gameData.game_state !== 'waiting') {
        setGameStatus('Game not found or already full');
        return;
      }
      
      const wagerAmountWei = BigInt(gameData.bet_amount);
      const gameToken = (gameData.bet_token as TokenSymbol) || 'DMT';
      const wagerAmountFormatted = Number(wagerAmountWei) / Math.pow(10, SUPPORTED_TOKENS[gameToken].decimals);
      
      setInviteCode(inviteCode);
      setPlayerColor('red');
      debugSetWager(wagerAmountFormatted, 'joinGame');
      setOpponent(gameData.blue_player);
      
      console.log('[JOIN] Setting up join game with data:', {
        inviteCode,
        playerColor: 'red',
        wagerAmountFormatted,
        gameToken,
        opponent: gameData.blue_player,
        address
      });
      
      // Check if player is trying to join their own game
      if (address === gameData.blue_player) {
        console.error('[JOIN] Player cannot join their own game');
        setGameStatus('You cannot join your own game');
        return;
      }
      
      // Check token approval for joining
      const tokenAddress = SUPPORTED_TOKENS[gameToken].address;
      const { allowance: joinAllowance } = useTokenAllowance(gameToken, chessContractAddress, address);
      
      if (joinAllowance < wagerAmountWei) {
        console.log('[JOIN] Token allowance insufficient for joining');
        setGameStatus('Please approve token spending first');
        return;
      }
      
      setGameStatus('Joining game... Please confirm transaction in your wallet.');
      
      // Call contract to join game
      writeJoinGame({
        address: chessContractAddress as `0x${string}`,
        abi: CHESS_CONTRACT_ABI,
        functionName: 'joinGame',
        args: [inviteCode as `0x${string}`],
      });
      
      setPendingJoinGameData({ inviteCode, gameData, address });
    } catch (error) {
      console.error('[JOIN] Error joining game:', error);
      setGameStatus('Failed to join game. Please try again.');
      debugSetInviteCode('', 'join game error');
      setPlayerColor(null);
      debugSetWager(0, 'join game error');
      setOpponent(null);
    }
  };

  // Start timeout timer when game becomes active
  useEffect(() => {
    if (gameMode === GameMode.ACTIVE && playerColor) {
      console.log('[TIMEOUT] Starting timeout timer for active game');
      startTimeoutTimer();
    } else {
      stopTimeoutTimer();
    }
  }, [gameMode, playerColor, startTimeoutTimer, stopTimeoutTimer]);

  // Reset timeout timer after each move
  useEffect(() => {
    if (gameMode === GameMode.ACTIVE && moveHistory.length > 0) {
      console.log('[TIMEOUT] Move made, resetting timeout timer');
      startTimeoutTimer();
    }
  }, [moveHistory, gameMode, startTimeoutTimer]);

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
      
      return newBoard;
    }
    
    return initialBoard;
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Render timeout countdown
  const renderTimeoutCountdown = () => {
    if (gameMode !== GameMode.ACTIVE || timeoutCountdown <= 0) return null;
    
    const minutes = Math.floor(timeoutCountdown / 60);
    const seconds = timeoutCountdown % 60;
    
    return (
      <div style={{ 
        color: timeoutCountdown < 300 ? '#ff0000' : '#00ff00',
        fontWeight: 'bold',
        textShadow: '0 0 6px currentColor'
      }}>
        Timeout: {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    );
  };

  // Render token selector in lobby
  const renderTokenSelector = () => {
    if (gameMode !== GameMode.LOBBY) return null;
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <TokenSelector
          selectedToken={selectedToken}
          onTokenSelect={setSelectedToken}
          wagerAmount={wagerAmount}
          onWagerChange={setWagerAmount}
          disabled={isCreatingGame || isApprovingToken}
        />
        
        {approvalError && (
          <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
            {approvalError}
          </div>
        )}
        
        {isApprovingToken && (
          <div style={{ color: '#00ff00', fontSize: '12px', marginTop: '5px' }}>
            Approving token...
          </div>
        )}
      </div>
    );
  };

  // Render lobby with token support
  const renderLobby = () => (
    <div className="chess-multiplayer-lobby">
      <h2>Chess Multiplayer</h2>
      
      {!isConnected ? (
        <div className="wallet-notice">
          Please connect your wallet to play
        </div>
      ) : (
        <div className="lobby-content">
          {renderTokenSelector()}
          
          <div className="actions">
            <button
              className="create-btn"
              onClick={createGame}
              disabled={isCreatingGame || isApprovingToken || wagerAmount <= 0}
            >
              {isCreatingGame ? 'Creating...' : 'Create Game'}
            </button>
            
            <button
              className="resume-btn"
              onClick={() => {/* Resume logic */}}
            >
              Resume Game
            </button>
          </div>
          
          <div className="open-games">
            <h3>Open Games</h3>
            <div className="games-list">
              {openGames.length > 0 ? (
                openGames.map((game) => (
                  <div key={game.invite_code} className="game-item">
                    <div className="game-info">
                      <div className="game-id">{game.game_title}</div>
                      <div className="wager">
                        {Number(game.bet_amount) / Math.pow(10, SUPPORTED_TOKENS[(game.bet_token as TokenSymbol) || 'DMT'].decimals)} {(game.bet_token as TokenSymbol) || 'DMT'}
                      </div>
                      <div className="title">by {formatAddress(game.blue_player)}</div>
                    </div>
                    <button
                      className="join-btn"
                      onClick={() => joinGame(game.invite_code)}
                      disabled={isJoiningGameContract}
                    >
                      {isJoiningGameContract ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-games">No open games available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render waiting screen with timeout info
  const renderWaiting = () => (
    <div className="chess-multiplayer-waiting">
      <h2>Waiting for Opponent</h2>
      <div className="game-code">
        Game Code: <strong>{inviteCode}</strong>
      </div>
      <div className="game-info">
        <p>Wager: {wager} {selectedToken}</p>
        <p>Share this code with your opponent</p>
      </div>
      {renderTimeoutCountdown()}
    </div>
  );

  // Render game board with timeout countdown
  const renderGameBoard = () => (
    <div className="game-stable-layout">
      <div className="chess-header">
        <h2>Chess Multiplayer</h2>
        <div className="chess-controls">
          <button className="minimize-btn" onClick={onMinimize}>_</button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="game-content">
        <div className="left-sidebar">
          <div className="game-info">
            <div className="game-status-section">
              <div className="status">{gameStatus}</div>
              <div className={`current-player ${currentPlayer === 'red' ? 'red-turn' : 'blue-turn'}`}>
                {currentPlayer === 'red' ? 'Red' : 'Blue'}'s turn
              </div>
            </div>
            <div className="game-details-section">
              <div className="wager-display">
                Wager: {wager} {selectedToken}
              </div>
              <div className="opponent-info">
                Opponent: {opponent ? formatAddress(opponent) : 'None'}
              </div>
              {renderTimeoutCountdown()}
            </div>
          </div>
          
          <div className="tab-buttons">
            <button
              className={leftSidebarTab === 'moves' ? 'active' : ''}
              onClick={() => setLeftSidebarTab('moves')}
            >
              Moves
            </button>
            <button
              className={leftSidebarTab === 'leaderboard' ? 'active' : ''}
              onClick={() => setLeftSidebarTab('leaderboard')}
            >
              Leaderboard
            </button>
          </div>
          
          {leftSidebarTab === 'moves' ? (
            <div className="move-history">
              <h4>Move History</h4>
              <div className="moves">
                {moveHistory.map((move, index) => (
                  <div key={index} className="move">{move}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="leaderboard">
              <h3>Leaderboard</h3>
              {/* Leaderboard content */}
            </div>
          )}
        </div>
        
        <div className="center-area">
          <div className="chessboard-container">
            <div className="chessboard">
              {/* Chess board rendering */}
            </div>
          </div>
        </div>
        
        <div className="right-sidebar">
          {/* Right sidebar content */}
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="chess-game">
      {gameMode === GameMode.LOBBY && renderLobby()}
      {gameMode === GameMode.WAITING && renderWaiting()}
      {gameMode === GameMode.ACTIVE && renderGameBoard()}
      {gameMode === GameMode.FINISHED && (
        <div className="chess-multiplayer-waiting">
          <h2>Game Finished</h2>
          <div className="game-info">
            <p>{gameStatus}</p>
            {canClaimWinnings && (
              <button
                className="claim-winnings-btn"
                onClick={() => {/* Claim logic */}}
                disabled={isClaimingWinnings}
              >
                {isClaimingWinnings ? 'Claiming...' : 'Claim Winnings'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 