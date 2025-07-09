import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { sankoTestnet } from '../appkit';
import { useSwitchChain } from 'wagmi';

// Contract configuration
const CHESS_CONTRACT_ADDRESS = '0x3112AF5728520F52FD1C6710dD7bD52285a68e47';

// Supabase configuration
const supabaseUrl = 'https://roxwocgknkiqnsgiojgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

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
  blue_player_id: string;
  red_player_id: string | null;
  board: {
    positions: (string | null)[][];
    piece_state: any;
  };
  current_player: string;
  game_state: 'waiting' | 'active' | 'completed';
  bet_amount: string;
  is_public: boolean;
  game_title?: string;
  chain: string;
  created_at: string;
  updated_at: string;
}

interface OpenGame {
  game_id: string;
  blue_player_id: string;
  bet_amount: string;
  game_title?: string;
  created_at: string;
}

const ChessMultiplayer: React.FC = () => {
  const { address: walletAddress } = useAccount();
  const { switchChain } = useSwitchChain();
  
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
  const [showGameCode, setShowGameCode] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [hasCreatedGame, setHasCreatedGame] = useState(false);
  
  // Refs
  const subscriptionRef = useRef<any>(null);
  const lastCheckTimeRef = useRef(0);
  const lastQueriedGameIdRef = useRef<string | null>(null);
  const expiryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Network management
  const ensureSankoNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setStatus('No wallet detected');
        return false;
      }
      
      const { chainId } = await (window.ethereum as any).request({ method: 'eth_chainId' });
      if (chainId !== '0x7c8') {
        try {
          await (window.ethereum as any).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7c8' }]
          });
        } catch (error: any) {
          if (error.code === 4902) {
            await (window.ethereum as any).request({
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
      
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, [
        'function playerToGame(address) view returns (bytes6)',
        'function createGame(bytes6) payable',
        'function joinGame(bytes6) payable',
        'function endGame(bytes6, address)',
        'function cancelGame(bytes6)',
        'function games(bytes6) view returns (address, address, bool, address, bytes6, uint256)',
        'function MIN_WAGER() view returns (uint256)',
        'function MAX_WAGER() view returns (uint256)'
      ], signer);
      
      return contract;
    } catch (error) {
      console.error('Failed to connect to contract:', error);
      return null;
    }
  }, []);

  // Check player game state
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
          const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
          if (chainId !== '0x7c8') {
            setStatus('Please switch to Sanko Testnet');
            return false;
          }
          
          const gameId = await contract.playerToGame(walletAddress);
          if (gameId !== '0x000000000000' && gameId !== '') {
            gameIdStr = ethers.hexlify(gameId).slice(2).toUpperCase();
          }
        }

        if (!gameIdStr) {
          const { data, error } = await supabase
            .from('chess_games')
            .select('game_id')
            .eq('chain', 'sanko')
            .eq('game_state', 'active')
            .or(`blue_player_id.eq.${walletAddress},red_player_id.eq.${walletAddress}`);
          
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

        const { data: gameData, error } = await supabase
          .from('chess_games')
          .select('*')
          .eq('game_id', gameIdStr)
          .eq('chain', 'sanko')
          .or(`blue_player_id.eq.${walletAddress},red_player_id.eq.${walletAddress}`)
          .single();
        
        if (error) throw new Error(`Supabase query error: ${error.message}`);

        if (gameData.game_state === 'active' || gameData.game_state === 'waiting') {
          setCurrentGameState(gameData);
          setPlayerColor(walletAddress === gameData.blue_player_id ? 'blue' : 'red');
          setGameId(gameIdStr);
          setIsWaitingForOpponent(gameData.game_state === 'waiting');
          setStatus(isMyTurn(gameData) ? 'Your turn' : "Opponent's turn");
          if (gameIdStr) {
            await subscribeToGame(gameIdStr);
          }
          return true;
        } else {
          resetGameState();
          return false;
        }
      } catch (error: any) {
        console.error(`checkPlayerGameState attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
        } else {
          setStatus('Failed to load game. Please reconnect wallet.');
        }
      }
      attempt++;
    }
    return false;
  }, [walletAddress, connectToContract]);

  // Generate unique invite code
  const generateUniqueInviteCode = useCallback(async () => {
    const uuid = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data } = await supabase
      .from('chess_games')
      .select('game_id')
      .eq('game_id', uuid)
      .single();
    
    if (data) return generateUniqueInviteCode();
    return uuid;
  }, []);

  // Create multiplayer game
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
        .eq('game_id', inviteCode)
        .eq('game_state', 'waiting');
      if (existingGames?.length) throw new Error('Invite code already exists');

      // Create in Supabase first
      const { data: supabaseData, error } = await supabase
        .from('chess_games')
        .insert({
          game_id: inviteCode,
          blue_player_id: walletAddress,
          red_player_id: null,
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
      setCurrentGameState(supabaseData);
      setIsWaitingForOpponent(true);
      setGameCode(inviteCode);
      setShowGameCode(true);
      setShowCreateForm(false);
      setStatus('Waiting for opponent...');

      await subscribeToGame(inviteCode);
      await fetchMultiplayerGames();
      
      alert(`Game created with wager ${wagerAmount} tDMT`);
      return inviteCode;
    } catch (error: any) {
      console.error('Create game failed:', error.message);
      setHasCreatedGame(false);
      setIsWaitingForOpponent(false);
      setStatus(`Failed to create game: ${error.message}`);
      alert(`Failed to create game: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, wagerAmount, gameTitle, isPublic, hasCreatedGame, ensureSankoNetwork, connectToContract, generateUniqueInviteCode]);

  // Join game by code
  const joinGameByCode = useCallback(async (gameId: string) => {
    setIsLoading(true);
    setStatus('Joining game...');

    try {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (!await ensureSankoNetwork()) return;

      const contract = await connectToContract();
      if (!contract) throw new Error('Failed to connect to contract');

      const { data: gameData, error } = await supabase
        .from('chess_games')
        .select('bet_amount')
        .eq('game_id', gameId)
        .single();

      if (error) throw new Error(`Failed to fetch game: ${error.message}`);

      const wagerAmount = ethers.parseEther(gameData.bet_amount.toString());
      const inviteCode = ethers.zeroPadValue(ethers.hexlify('0x' + gameId.toLowerCase()), 6);
      
      await contract.joinGame(inviteCode, { value: wagerAmount });
      await checkPlayerGameState();
      
      setStatus('Joined game successfully!');
      return true;
    } catch (error: any) {
      console.error('Join game failed:', error.message);
      setStatus(`Failed to join game: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
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
        .eq('game_id', inviteCode)
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
    setShowGameCode(false);
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

  // Load data on mount
  useEffect(() => {
    if (walletAddress) {
      checkPlayerGameState();
      fetchMultiplayerGames();
    }
  }, [walletAddress, checkPlayerGameState, fetchMultiplayerGames]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (expiryIntervalRef.current) {
        clearInterval(expiryIntervalRef.current);
      }
    };
  }, []);

  if (currentGameState && !isWaitingForOpponent) {
    return (
      <div className="chess-multiplayer-game">
        <div className="game-header">
          <h2>Multiplayer Game - {gameId}</h2>
          <div className="game-info">
            <span>You are: {playerColor}</span>
            <span>Current: {currentGameState.current_player}</span>
            <span>Status: {status}</span>
          </div>
          <button onClick={leaveGame} className="leave-btn">Leave Game</button>
        </div>
        <div className="game-board">
          {/* Chess board will be rendered here */}
          <p>Game board implementation needed</p>
        </div>
      </div>
    );
  }

  if (isWaitingForOpponent) {
    return (
      <div className="chess-multiplayer-waiting">
        <h2>Waiting for Opponent</h2>
        <div className="game-code">
          <p>Game Code: <strong>{gameCode}</strong></p>
          <p>Share this code with your opponent</p>
        </div>
        <div className="game-info">
          <p>Wager: {formatWager(currentGameState?.bet_amount || '0')}</p>
          <p>Status: {status}</p>
        </div>
        <button onClick={leaveGame} className="cancel-btn">Cancel Game</button>
      </div>
    );
  }

  return (
    <div className="chess-multiplayer-lobby">
      <h2>🏁 Multiplayer Chess</h2>
      
      <div className="status-bar">
        <span>{status}</span>
      </div>

      {!showCreateForm ? (
        <div className="lobby-content">
          <div className="open-games">
            <h3>Open Games ({openGames.length})</h3>
            {openGames.length === 0 ? (
              <p>No open games available</p>
            ) : (
              <div className="games-list">
                {openGames.map((game) => (
                  <div key={game.game_id} className="game-item">
                    <div className="game-info">
                      <span className="game-id">#{game.game_id}</span>
                      <span className="wager">{formatWager(game.bet_amount)}</span>
                      {game.game_title && <span className="title">{game.game_title}</span>}
                    </div>
                    <button
                      onClick={() => joinGameByCode(game.game_id)}
                      disabled={isLoading || !walletAddress}
                      className="join-btn"
                    >
                      {isLoading ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="actions">
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={isLoading || !walletAddress}
              className="create-btn"
            >
              Create New Game
            </button>
          </div>
        </div>
      ) : (
        <div className="create-form">
          <h3>Create New Game</h3>
          
          <div className="form-group">
            <label>Wager Amount (tDMT):</label>
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(e.target.value)}
              placeholder="0.1"
            />
          </div>

          <div className="form-group">
            <label>Game Title (optional):</label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Enter game title..."
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public Game
            </label>
          </div>

          <div className="form-actions">
            <button
              onClick={createMultiplayerGame}
              disabled={isLoading || !walletAddress}
              className="create-confirm-btn"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              disabled={isLoading}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!walletAddress && (
        <div className="wallet-notice">
          Please connect your wallet to play multiplayer chess
        </div>
      )}
    </div>
  );
};

export default ChessMultiplayer; 