import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './ChessGame.css';

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

const pieceImages: { [key: string]: string } = {
  'R': '/images/redrook.png',
  'N': '/images/redknight.png',
  'B': '/images/redbishop.png',
  'Q': '/images/redqueen.png',
  'K': '/images/redking.png',
  'P': '/images/redpawn.png',
  'r': '/images/bluerook.png',
  'n': '/images/blueknight.png',
  'b': '/images/bluebishop.png',
  'q': '/images/bluequeen.png',
  'k': '/images/blueking.png',
  'p': '/images/bluepawn.png'
};

const ChessMultiplayer: React.FC<{ fullscreen?: boolean }> = ({ fullscreen = false }) => {
  const [board, setBoard] = useState<(string | null)[][]>(initialBoard);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameId, setGameId] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<'blue' | 'red' | null>(null);
  const [status, setStatus] = useState<string>('');
  const [lobbyPhase, setLobbyPhase] = useState<'idle' | 'creating' | 'joining' | 'waiting' | 'active'>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);
  const gameChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Lobby creation
  const createGame = async (walletAddress: string) => {
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from('chess_games').insert({
      game_id: newGameId,
          blue_player: walletAddress,
      board: JSON.stringify({ positions: initialBoard }),
          current_player: 'blue',
          game_state: 'waiting',
      is_public: true
    });
    setGameId(newGameId);
      setPlayerColor('blue');
    setLobbyPhase('waiting');
    setStatus(`Game created! Share code: ${newGameId}`);
  };

  // Join game
  const joinGame = async (walletAddress: string, joinId: string) => {
    const { data, error } = await supabase
        .from('chess_games')
        .select('*')
      .eq('game_id', joinId)
        .eq('game_state', 'waiting')
        .single();
    if (error || !data) {
      setStatus('Game not found or already full');
        return;
      }
    await supabase.from('chess_games').update({
          red_player: walletAddress,
          game_state: 'active',
          updated_at: new Date().toISOString()
    }).eq('game_id', joinId);
    setGameId(joinId);
    setPlayerColor('red');
    setLobbyPhase('active');
    setStatus('Joined game!');
  };

  // Subscribe to game state
  useEffect(() => {
    if (!gameId) return;
    const channel = (supabase as any)
      .channel(`chess_game_${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_games', filter: `game_id=eq.${gameId}` }, (payload: any) => {
        const boardObj = JSON.parse(payload.new.board);
        const newBoard = Array.isArray(boardObj.positions) ? boardObj.positions as (string | null)[][] : initialBoard;
        setBoard(newBoard);
        setMoveHistory(Array.isArray(payload.new.move_history) ? payload.new.move_history : []);
        setLobbyPhase(payload.new.game_state === 'active' ? 'active' : 'waiting');
        setOpponent(payload.new.blue_player && payload.new.red_player ? (playerColor === 'blue' ? payload.new.red_player : payload.new.blue_player) : null);
      })
      .subscribe();
    gameChannel.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, playerColor]);

  // Render board
  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    return (
      <div key={`${row}-${col}`} className="chess-square">
        {piece && <img src={pieceImages[piece]} alt={piece} className="chess-piece" />}
      </div>
    );
  };

    return (
    <div className={`chess-multiplayer${fullscreen ? ' fullscreen' : ''}`}>
      <div className="chess-board-and-history">
        <div className="chess-board">
          {board.map((rowArr, rowIdx) => (
            <div key={rowIdx} className="chess-board-row">
              {rowArr.map((_, colIdx) => renderSquare(rowIdx, colIdx))}
                </div>
              ))}
            </div>
        <div className="move-history-column">
          <h3>Move History</h3>
          <ol className="move-history-list">
            {moveHistory.map((move, idx) => (
              <li key={idx}>{move}</li>
            ))}
          </ol>
                  </div>
              </div>
      <div className="multiplayer-controls">
        {lobbyPhase === 'idle' && (
          <>
            {/* Replace with wallet connect logic */}
            <button onClick={() => void createGame('WALLET_ADDRESS_HERE')}>Create Game</button>
            <button onClick={() => void joinGame('WALLET_ADDRESS_HERE', window.prompt('Enter game code') || '')}>Join Game</button>
          </>
        )}
        {lobbyPhase === 'waiting' && <div>Waiting for opponent... Share code: {gameId}</div>}
        {lobbyPhase === 'active' && <div>Game started! Opponent: {opponent}</div>}
        <div>{status}</div>
        </div>
      {/* TODO: Add move handling, contract integration, and full chess logic */}
    </div>
  );
};

export default ChessMultiplayer; 