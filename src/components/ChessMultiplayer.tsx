import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { ethers } from 'ethers';

// Contract configuration
const CHESS_CONTRACT_ADDRESS = '0x3112AF5728520F52FD1C6710dD7bD52285a68e47';

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
const initialBoard = [
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
];

interface GameData {
  game_id: string;
  blue_player: string;
  red_player: string | null;
  board: {
    positions: (string | null)[][];
    piece_state: Record<string, unknown>;
  };
  current_player: string;
  game_state: 'waiting' | 'active' | 'completed';
  bet_amount: string;
  is_public: boolean;
  game_title?: string;
  chain: string;
  created_at: string;
  updated_at: string;
  last_move?: {
    piece: string;
    from_row: number;
    from_col: number;
    end_row: number;
    end_col: number;
    promotion?: string;
    captured_piece?: string | null;
  };
}

interface OpenGame {
  game_id: string;
  blue_player: string;
  bet_amount: string;
  game_title?: string;
  created_at: string;
}

const ChessMultiplayer: React.FC = () => {
  const { address: walletAddress } = useAccount();
  
  // State
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'blue' | 'red' | null>(null);
  const [currentGameState, setCurrentGameState] = useState<GameData | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [status, setStatus] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [wagerAmount, setWagerAmount] = useState('0.1');
  const [gameTitle, setGameTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [gameCode, setGameCode] = useState('');
  const [hasCreatedGame, setHasCreatedGame] = useState(false);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [forceSyncLoading, setForceSyncLoading] = useState(false);
  const [board, setBoard] = useState<(string | null)[][]>(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  
  // Refs
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const lastCheckTimeRef = useRef(0);
  const lastQueriedGameIdRef = useRef<string | null>(null);
  const expiryIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Network management
  const ensureSankoNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setStatus('No wallet detected');
        return false;
      }
      
      const { chainId } = await (window.ethereum as unknown as ethers.Eip1193Provider).request({ method: 'eth_chainId' });
      if (chainId !== '0x7c8') {
        try {
          await (window.ethereum as unknown as ethers.Eip1193Provider).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7c8' }]
          });
        } catch (error: unknown) {
          if (typeof error === 'object' && error && 'code' in error && (error as { code: number }).code === 4902) {
            await (window.ethereum as unknown as ethers.Eip1193Provider).request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7c8',
                chainName: 'Sanko Testnet',
                rpcUrls: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'],
                nativeCurrency: { name: 'tDMT', symbol: 'tDMT', decimals: 18 },
                blockExplorerUrls: ['https://explorer.testnet.sanko.xyz']
              }]
            });
          } else {
            throw new Error('Please switch to Sanko Testnet');
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      setStatus('Please switch to Sanko Testnet');
      return false;
    }
  }, []);

  // Connect to contract
  const connectToContract = useCallback(async () => {
    try {
      if (!window.ethereum) return null;
      
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, [
        {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
        {"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},
        {"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},
        {"inputs":[],"name":"ERC1967NonPayable","type":"error"},
        {"inputs":[],"name":"FailedCall","type":"error"},
        {"inputs":[],"name":"InvalidInitialization","type":"error"},
        {"inputs":[],"name":"NotInitializing","type":"error"},
        {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
        {"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},
        {"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player1","type":"address"}],"name":"GameCancelled","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player1","type":"address"},{"indexed":false,"internalType":"uint256","name":"wagerAmount","type":"uint256"}],"name":"GameCreated","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"houseFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"payoutOrRefund","type":"uint256"}],"name":"GameEnded","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player2","type":"address"}],"name":"GameJoined","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},
        {"inputs":[],"name":"MAX_WAGER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"MIN_WAGER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"cancelGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"createGame","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"address","name":"winner","type":"address"}],"name":"endGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"","type":"bytes6"}],"name":"games","outputs":[{"internalType":"address","name":"player1","type":"address"},{"internalType":"address","name":"player2","type":"address"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"uint256","name":"wagerAmount","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"house","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"joinGame","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"leaderboard","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerToGame","outputs":[{"internalType":"bytes6","name":"","type":"bytes6"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"player","type":"address"}],"name":"resetPlayerGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[{"internalType":"address payable","name":"recipient","type":"address"}],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}
      ], signer);
      
      return contract;
    } catch (error) {
      console.error('Failed to connect to contract:', error);
      return null;
    }
  }, []);

  // Start game expiry checking (from original multiplayer.js)
  const startGameExpiryCheck = useCallback(() => {
    if (expiryIntervalRef.current) {
      window.clearInterval(expiryIntervalRef.current);
    }
    
    expiryIntervalRef.current = window.setInterval(async () => {
      try {
        let expiryThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        // Defensive: If expiryThreshold is in the future, fallback to now
        if (new Date(expiryThreshold).getTime() > Date.now()) {
          console.warn('[Supabase] expiryThreshold was in the future, falling back to now:', expiryThreshold);
          expiryThreshold = new Date().toISOString();
        }
        const { data, error } = await supabase
          .from('chess_games')
          .select('game_id, blue_player')
          .eq('game_state', 'waiting')
          .is('red_player', null)
          .lte('created_at', expiryThreshold)
          .eq('chain', 'sanko');
        
        if (error) {
          console.error('Supabase expiry query error:', error.message);
          return;
        }

        for (const game of data || []) {
          const contract = await connectToContract();
          if (contract) {
            const inviteCodeBytes = ethers.zeroPadValue(ethers.hexlify('0x' + game.game_id.toLowerCase()), 6);
            await contract.cancelGame(inviteCodeBytes);
            await supabase
              .from('chess_games')
              .update({ game_state: 'cancelled', updated_at: new Date().toISOString() })
              .eq('game_id', game.game_id);
          }
        }
        await fetchMultiplayerGames();
      } catch (error) {
        console.error('Error checking game expiry:', error);
      }
    }, 60 * 1000);
  }, [connectToContract]);

  // Force sync functionality (from original multiplayer.js)
  const forceMultiplayerSync = useCallback(async () => {
    setForceSyncLoading(true);
    try {
      if (!walletAddress) {
        setStatus('Please connect your wallet to resync');
        return;
      }
      
      console.log('Attempting to resync game state');
      await checkPlayerGameState();
      setStatus('Game state resynced successfully');
    } catch (error) {
      console.error('forceMultiplayerSync failed:', error);
      setStatus('Resync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setForceSyncLoading(false);
    }
  }, [walletAddress]);

  // Check player game state with enhanced retry logic
  const checkPlayerGameState = useCallback(async (maxRetries = 5, baseDelay = 1000) => {
    if (!walletAddress) {
      setStatus('Please connect your wallet');
      return false;
    }
    
    if (Date.now() - lastCheckTimeRef.current < 1000) {
      return false;
    }
    lastCheckTimeRef.current = Date.now();

    let attempt = 1;
    while (attempt <= maxRetries) {
      try {
        let gameIdStr: string | null = null;
        const contract = await connectToContract();
        
        if (contract) {
          const chainId = await (window.ethereum as unknown as ethers.Eip1193Provider).request({ method: 'eth_chainId' });
          if (chainId !== '0x7c8') {
            setStatus('Please switch to Sanko Testnet');
            return false;
          }
          
          const gameId: string = await contract.playerToGame(walletAddress) as string;
          if (gameId !== '0x000000000000' && gameId !== '') {
            gameIdStr = ethers.hexlify(gameId).slice(2).toUpperCase();
          }
        }

        if (!gameIdStr) {
          const { data, error }: { data: Array<{ game_id: string }> | null, error: { message: string } | null } = await supabase
            .from('chess_games')
            .select('game_id')
            .eq('chain', 'sanko')
            .eq('game_state', 'active')
            .or(`blue_player.eq.${walletAddress},red_player.eq.${walletAddress}`);
          
          if (error) throw new Error(`Supabase error: ${error.message}`);
          if (!data?.length) {
            resetGameState();
            return false;
          }
          gameIdStr = data[0].game_id;
        }

        if (lastQueriedGameIdRef.current === gameIdStr) {
          return false;
        }
        lastQueriedGameIdRef.current = gameIdStr;

        const { data: gameData, error: gameError }: { data: GameData | null, error: { message: string } | null } = await supabase
          .from('chess_games')
          .select('*')
          .eq('game_id', gameIdStr.toLowerCase())
          .eq('chain', 'sanko')
          .or(`blue_player.eq.${walletAddress},red_player.eq.${walletAddress}`)
          .single();
        
        if (gameError) throw new Error(`Supabase query error: ${gameError.message}`);

        if (gameData && (gameData.game_state === 'active' || gameData.game_state === 'waiting')) {
          setCurrentGameState(gameData as GameData);
          setPlayerColor(walletAddress === gameData.blue_player ? 'blue' : 'red');
          setGameId(gameIdStr);
          setIsWaitingForOpponent(gameData.game_state === 'waiting');
          setStatus(isMyTurn(gameData as GameData) ? 'Your turn' : "Opponent's turn");
          if (gameIdStr) {
            await subscribeToGame(gameIdStr);
          }
          return true;
        } else {
          resetGameState();
          return false;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`checkPlayerGameState attempt ${attempt} failed:`, error.message);
          if (attempt < maxRetries) {
            await new Promise(resolve => window.setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
          } else {
            setStatus('Failed to load game. Please reconnect wallet.');
          }
        }
      }
      attempt++;
    }
    return false;
  }, [walletAddress, connectToContract]);

  // Generate unique invite code with better UUID generation
  const generateUniqueInviteCode = useCallback(async () => {
    const uuid = (1e7 + -1e3 + -4e3 + -8e3 + -1e11)
      .toString()
      .replace(/[018]/g, (c: string) =>
        (parseInt(c) ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16)
      )
      .slice(0, 6)
      .toUpperCase();
    
    const { data } = await supabase
      .from('chess_games')
      .select('game_id')
      .eq('game_id', uuid.toLowerCase())
      .single();
    
    if (data) return generateUniqueInviteCode();
    return uuid;
  }, []);

  // Create multiplayer game with enhanced error handling
  const createMultiplayerGame = useCallback(async () => {
    if (hasCreatedGame) return;
    setHasCreatedGame(true);
    setIsLoading(true);
    setStatus('Creating game...');

    try {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (!await ensureSankoNetwork()) return;

      const contract = await connectToContract();
      if (!contract) throw new Error('Failed to connect to contract');

      const minWager = ethers.formatEther(await contract.MIN_WAGER());
      const maxWager = ethers.formatEther(await contract.MAX_WAGER());
      if (parseFloat(wagerAmount) < parseFloat(minWager) || parseFloat(wagerAmount) > parseFloat(maxWager)) {
        throw new Error(`Wager must be between ${minWager} and ${maxWager} tDMT`);
      }

      // Check for existing game
      let existingGame = await contract.playerToGame(walletAddress);
      if (existingGame !== '0x000000000000' && existingGame !== '') {
        await leaveGame();
        existingGame = await contract.playerToGame(walletAddress);
        if (existingGame !== '0x000000000000' && existingGame !== '') {
          const gameIdStr = ethers.hexlify(existingGame).slice(2).toUpperCase();
          const inviteCodeBytes = ethers.zeroPadValue(ethers.hexlify('0x' + gameIdStr.toLowerCase()), 6);
          await contract.cancelGame(inviteCodeBytes);
          await cleanupStaleGame(gameIdStr);
        }
      }

      const inviteCode = await generateUniqueInviteCode();
      const inviteCodeBytes = ethers.zeroPadValue(ethers.hexlify('0x' + inviteCode.toLowerCase()), 6);
      const wagerInWei = ethers.parseEther(wagerAmount);

      // Check for existing games with same code
      const { data: existingGames } = await supabase
        .from('chess_games')
        .select('game_id')
        .eq('game_id', inviteCode.toLowerCase())
        .eq('game_state', 'waiting');
      if (existingGames?.length) throw new Error('Invite code already exists');

      // Create in Supabase first
      const { data: supabaseData, error } = await supabase
        .from('chess_games')
        .insert({
          game_id: inviteCode.toLowerCase(),
          blue_player: walletAddress,
          red_player: null,
          board: { positions: JSON.parse(JSON.stringify(initialBoard)), piece_state: {} },
          current_player: 'blue',
          game_state: 'waiting',
          bet_amount: wagerAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: isPublic,
          game_title: gameTitle || null,
          chain: 'sanko',
          contract_address: CHESS_CONTRACT_ADDRESS
        })
        .select()
        .single();

      if (error) throw new Error(`Supabase insert failed: ${error.message}`);

      // Create on contract
      await contract.createGame(inviteCodeBytes, { value: wagerInWei });

      setGameId(inviteCode);
      setPlayerColor('blue');
      setCurrentGameState(supabaseData as GameData);
      setIsWaitingForOpponent(true);
      setGameCode(inviteCode);
      setShowCreateForm(false);
      setStatus('Waiting for opponent...');

      await subscribeToGame(inviteCode);
      await fetchMultiplayerGames();
      
      alert(`Game created with wager ${wagerAmount} tDMT`);
      return inviteCode;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Create game failed:', error.message);
        setHasCreatedGame(false);
        setIsWaitingForOpponent(false);
        setStatus(`Failed to create game: ${error.message}`);
        alert(`Failed to create game: ${error.message}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, wagerAmount, gameTitle, isPublic, hasCreatedGame, ensureSankoNetwork, connectToContract, generateUniqueInviteCode]);

  // Join game by code with retry logic
  const joinGameByCode = useCallback(async (gameId: string, maxRetries = 3, retryDelay = 2000) => {
    setIsLoading(true);
    setStatus('Joining game...');

    let attempt = 1;
    while (attempt <= maxRetries) {
      try {
        if (!walletAddress) throw new Error('Wallet not connected');
        if (!await ensureSankoNetwork()) return;

        const contract = await connectToContract();
        if (!contract) throw new Error('Failed to connect to contract');

        const { data: gameData, error } = await supabase
          .from('chess_games')
          .select('bet_amount')
          .eq('game_id', gameId.toLowerCase())
          .single();

        if (error) throw new Error(`Failed to fetch game: ${error.message}`);

        const wagerAmountStr = typeof gameData.bet_amount === 'string' ? gameData.bet_amount : String(gameData.bet_amount);
        const wagerAmount = ethers.parseEther(wagerAmountStr);
        const inviteCode = ethers.zeroPadValue(ethers.hexlify('0x' + gameId.toLowerCase()), 6);
        
        await contract.joinGame(inviteCode, { value: wagerAmount });
        await checkPlayerGameState();
        
        setStatus('Joined game successfully!');
        return true;
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Join attempt ${attempt} failed:`, error.message);
          if (attempt === maxRetries) {
            setStatus(`Failed to join game: ${error.message}`);
            return false;
          }
          await new Promise(resolve => window.setTimeout(resolve, retryDelay));
        }
      }
      attempt++;
    }
    return false;
  }, [walletAddress, ensureSankoNetwork, connectToContract, checkPlayerGameState]);

  // Fetch multiplayer games
  const fetchMultiplayerGames = useCallback(async () => {
    try {
      const { data: games, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('chain', 'sanko')
        .eq('game_state', 'waiting')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
        return;
      }

      setOpenGames(games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }, []);

  // Subscribe to game updates
  const subscribeToGame = useCallback(async (gameId: string) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabase
      .channel(`chess_game_${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chess_games', filter: `game_id=eq.${gameId}` },
        (payload) => {
          const newGame = payload.new as GameData;
          if (newGame) {
            setCurrentGameState(newGame);
            setIsWaitingForOpponent(newGame.game_state === 'waiting');
            setStatus(isMyTurn(newGame) ? 'Your turn' : "Opponent's turn");
          }
        }
      )
      .subscribe();
  }, []);

  // Leave game
  const leaveGame = useCallback(async () => {
    try {
      if (gameId) {
        const contract = await connectToContract();
        if (contract) {
          const inviteCodeBytes = ethers.zeroPadValue(ethers.hexlify('0x' + gameId.toLowerCase()), 6);
          await contract.cancelGame(inviteCodeBytes);
        }
        await cleanupStaleGame(gameId);
      }
      resetGameState();
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }, [gameId, connectToContract]);

  // Cleanup stale game
  const cleanupStaleGame = useCallback(async (inviteCode: string) => {
    try {
      await supabase
        .from('chess_games')
        .delete()
        .eq('game_id', inviteCode.toLowerCase())
        .eq('game_state', 'waiting');
    } catch (error) {
      console.error(`Failed to delete stale game ${inviteCode}:`, error);
    }
  }, []);

  // Reset game state
  const resetGameState = useCallback(() => {
    setGameId(null);
    setPlayerColor(null);
    setCurrentGameState(null);
    setIsWaitingForOpponent(false);
    setGameCode('');
    setHasCreatedGame(false);
    setShowCreateForm(false);
    setStatus('Ready to play');
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  // Check if it's my turn
  const isMyTurn = useCallback((gameData: GameData) => {
    if (!walletAddress || !playerColor) return false;
    return gameData.current_player.toLowerCase() === playerColor;
  }, [walletAddress, playerColor]);

  // Format wager amount
  const formatWager = useCallback((wagerWei: string) => {
    try {
      return ethers.formatEther(wagerWei) + ' tDMT';
    } catch {
      return wagerWei + ' wei';
    }
  }, []);

  // Chess board rendering functions
  const getPieceColor = (piece: string | null): 'blue' | 'red' => {
    if (!piece) return 'blue';
    return piece >= 'a' && piece <= 'z' ? 'blue' : 'red';
  };

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

  const handleSquareClick = (row: number, col: number) => {
    if (!currentGameState || isWaitingForOpponent || isProcessingMove) return;
    
    const piece = board[row][col];
    const isMyTurnNow = isMyTurn(currentGameState);
    
    if (!isMyTurnNow) return;

    if (selectedPiece) {
      // Try to make a move
      if (selectedPiece.row === row && selectedPiece.col === col) {
        // Clicked on same piece, deselect
        setSelectedPiece(null);
        setLegalMoves([]);
      } else {
        // Try to move to this square
        makeMove(selectedPiece.row, selectedPiece.col, row, col);
        setSelectedPiece(null);
        setLegalMoves([]);
      }
    } else if (piece && getPieceColor(piece) === playerColor) {
      // Select piece and show legal moves
      setSelectedPiece({ row, col });
      // For now, just show all squares as legal (simplified)
      const moves: { row: number; col: number }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (r !== row || c !== col) {
            moves.push({ row: r, col: c });
          }
        }
      }
      setLegalMoves(moves);
    }
  };

  const makeMove = async (startRow: number, startCol: number, endRow: number, endCol: number) => {
    if (!currentGameState || !gameId || isProcessingMove) return;
    
    setIsProcessingMove(true);
    try {
      // Update board locally first
      const newBoard = board.map(row => [...row]);
      const piece = newBoard[startRow][startCol];
      newBoard[endRow][endCol] = piece;
      newBoard[startRow][startCol] = null;
      
      setBoard(newBoard);
      setLastMove({ from: { row: startRow, col: startCol }, to: { row: endRow, col: endCol } });
      
      // Update game state in Supabase
      const { error } = await supabase
        .from('chess_games')
        .update({
          board: { positions: newBoard, piece_state: {} },
          current_player: currentGameState.current_player === 'blue' ? 'red' : 'blue',
          last_move: {
            piece,
            from_row: startRow,
            from_col: startCol,
            end_row: endRow,
            end_col: endCol
          },
          updated_at: new Date().toISOString()
        })
        .eq('game_id', gameId);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Move failed:', error);
      // Revert board state on error
      setBoard(board);
    } finally {
      setIsProcessingMove(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (walletAddress) {
      checkPlayerGameState();
      fetchMultiplayerGames();
    }
  }, [walletAddress, checkPlayerGameState, fetchMultiplayerGames]);

  // Sync board state from game data
  useEffect(() => {
    if (currentGameState?.board?.positions) {
      setBoard(currentGameState.board.positions);
    }
  }, [currentGameState?.board?.positions]);

  // Subscribe to lobby updates
  useEffect(() => {
    const channel = supabase
      .channel('chess_games_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chess_games' },
        () => {
          fetchMultiplayerGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMultiplayerGames]);

  // Start game expiry checking on mount
  useEffect(() => {
    startGameExpiryCheck();
    return () => {
      if (expiryIntervalRef.current) {
        window.clearInterval(expiryIntervalRef.current);
      }
    };
  }, [startGameExpiryCheck]);

  // Add contract event listeners for real-time UX
  useEffect(() => {
    let contract: ethers.Contract | null = null;
    let isMounted = true;

    async function setupListeners() {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      contract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, [
        {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
        {"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},
        {"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},
        {"inputs":[],"name":"ERC1967NonPayable","type":"error"},
        {"inputs":[],"name":"FailedCall","type":"error"},
        {"inputs":[],"name":"InvalidInitialization","type":"error"},
        {"inputs":[],"name":"NotInitializing","type":"error"},
        {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
        {"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},
        {"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player1","type":"address"}],"name":"GameCancelled","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player1","type":"address"},{"indexed":false,"internalType":"uint256","name":"wagerAmount","type":"uint256"}],"name":"GameCreated","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"houseFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"payoutOrRefund","type":"uint256"}],"name":"GameEnded","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player2","type":"address"}],"name":"GameJoined","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},
        {"inputs":[],"name":"MAX_WAGER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"MIN_WAGER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"cancelGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"createGame","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"address","name":"winner","type":"address"}],"name":"endGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"","type":"bytes6"}],"name":"games","outputs":[{"internalType":"address","name":"player1","type":"address"},{"internalType":"address","name":"player2","type":"address"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"uint256","name":"wagerAmount","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"house","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"joinGame","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"leaderboard","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerToGame","outputs":[{"internalType":"bytes6","name":"","type":"bytes6"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"player","type":"address"}],"name":"resetPlayerGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[{"internalType":"address payable","name":"recipient","type":"address"}],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}
      ], signer);

      // Event: GameCreated
      contract.on('GameCreated', async () => {
        if (!isMounted) return;
        await fetchMultiplayerGames();
      });
      // Event: GameJoined
      contract.on('GameJoined', async () => {
        if (!isMounted) return;
        await fetchMultiplayerGames();
        await checkPlayerGameState();
      });
      // Event: GameEnded
      contract.on('GameEnded', async () => {
        if (!isMounted) return;
        await fetchMultiplayerGames();
        await checkPlayerGameState();
      });
      // Event: GameCancelled
      contract.on('GameCancelled', async () => {
        if (!isMounted) return;
        await fetchMultiplayerGames();
        await checkPlayerGameState();
      });
    }
    setupListeners();
    return () => {
      isMounted = false;
      if (contract) {
        contract.removeAllListeners('GameCreated');
        contract.removeAllListeners('GameJoined');
        contract.removeAllListeners('GameEnded');
        contract.removeAllListeners('GameCancelled');
      }
    };
  }, [fetchMultiplayerGames, checkPlayerGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (expiryIntervalRef.current) {
        window.clearInterval(expiryIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Active game view - should integrate with existing chessboard
  if (currentGameState && !isWaitingForOpponent) {
    return (
      <div className="game-mode-panel">
        <h3 className="game-mode-title">Multiplayer Game</h3>
        <div className="game-info">
          <div className="game-info-bar">
            <span className={currentGameState.current_player === 'blue' ? 'current-blue' : 'current-red'}>
              Current: {currentGameState.current_player === 'blue' ? 'Blue' : 'Red'}
            </span>
            <span className="wager-label">Wager:</span> <span>{formatWager(currentGameState.bet_amount)}</span>
            <span className="mode-play">Mode: PvP</span>
            <span>Game ID: {gameId}</span>
          </div>
        </div>
        <div className="chess-main-area">
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
            <button onClick={leaveGame}>Leave Game</button>
            <button onClick={forceMultiplayerSync} disabled={forceSyncLoading}>
              {forceSyncLoading ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for opponent view
  if (isWaitingForOpponent) {
    return (
      <div className="game-mode-panel">
        <h3 className="game-mode-title">Waiting for Opponent</h3>
        <div className="game-info">
          <div className="game-info-bar">
            <span className="wager-label">Wager:</span> <span>{formatWager(currentGameState?.bet_amount || '0')}</span>
            <span>Status: {status}</span>
          </div>
        </div>
        <div className="chess-main-area">
          <div className="chessboard-container">
            <div className="chessboard">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                color: '#666',
                fontSize: '16px',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                  Game Code: {gameCode}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  Share this code with your opponent
                </div>
                <div style={{ fontSize: '14px' }}>
                  Waiting for opponent to join...
                </div>
              </div>
            </div>
          </div>
          <div className="game-controls">
            <button onClick={leaveGame}>Cancel Game</button>
            <button onClick={forceMultiplayerSync} disabled={forceSyncLoading}>
              {forceSyncLoading ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main lobby view - using existing CSS structure
  return (
    <div className="game-mode-panel">
      <h3 className="game-mode-title">🏁 Multiplayer Chess</h3>
      
      <div className="game-info">
        <div className="game-info-bar">
          <span>{status}</span>
        </div>
      </div>

      {!showCreateForm ? (
        <div className="chess-main-area">
          <div className="chessboard-container">
            <div className="chessboard">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', textAlign: 'center' }}>
                  Open Games ({openGames.length})
                </h4>
                {openGames.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>No open games available</p>
                ) : (
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    width: '100%',
                    maxWidth: '400px'
                  }}>
                    {openGames.map((game) => (
                      <div key={game.game_id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        background: 'rgba(0,0,0,0.05)', 
                        border: '1px solid rgba(0,0,0,0.1)', 
                        borderRadius: '4px', 
                        marginBottom: '8px' 
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>#{game.game_id}</div>
                          <div style={{ fontSize: '12px' }}>{formatWager(game.bet_amount)}</div>
                          {game.game_title && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{game.game_title}</div>}
                        </div>
                        <button
                          onClick={() => joinGameByCode(game.game_id)}
                          disabled={isLoading || !walletAddress}
                          className="mode-btn"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          {isLoading ? 'Joining...' : 'Join'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="game-controls">
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={isLoading || !walletAddress}
              className="mode-btn"
            >
              Create New Game
            </button>
            <button onClick={forceMultiplayerSync} disabled={forceSyncLoading}>
              {forceSyncLoading ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      ) : (
        <div className="chess-main-area">
          <div className="chessboard-container">
            <div className="chessboard">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', textAlign: 'center' }}>Create New Game</h4>
                
                <div style={{ width: '100%', maxWidth: '300px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Wager Amount (tDMT):</label>
                    <input
                      type="number"
                      min="0.1"
                      max="1000"
                      step="0.1"
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(e.target.value)}
                      placeholder="0.1"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Game Title (optional):</label>
                    <input
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder="Enter game title..."
                      maxLength={50}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      Public Game
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="game-controls">
            <button
              onClick={createMultiplayerGame}
              disabled={isLoading || !walletAddress}
              className="mode-btn"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              disabled={isLoading}
              className="mode-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!walletAddress && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          background: 'rgba(255,255,0,0.1)', 
          border: '1px solid rgba(255,255,0,0.3)', 
          borderRadius: '4px', 
          marginTop: '20px',
          fontSize: '14px'
        }}>
          Please connect your wallet to play multiplayer chess
        </div>
      )}
    </div>
  );
};

export default ChessMultiplayer; 