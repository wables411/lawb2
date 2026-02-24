import React, { useState, useEffect, useRef, useCallback } from 'react';
import { firebaseChess } from '../firebaseChess';
import { database } from '../firebaseApp';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { useChessPieceSet } from '../contexts/ChessPieceSetContext';
import { getPieceSetById, getDefaultPieceSet } from '../config/chessPieceSets';
import './ChessGame.css';
import './ChessGameModern.css';
import './ChessSpectator.css';

const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
const POLL_INTERVAL_MS = 10_000;
const GAME_OVER_LINGER_MS = 15_000;

const CHESSBOARDS = [
  '/images/chessboard1.png',
  '/images/chessboard2.png',
  '/images/chessboard3.png',
  '/images/chessboard4.png',
];

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isClawb?: boolean;
}

function reconstructBoard(boardData: any): (string | null)[][] {
  const empty = (): (string | null)[][] =>
    Array.from({ length: 8 }, () => Array(8).fill(null));

  if (!boardData?.positions) return empty();

  if (typeof boardData.positions === 'object' && !Array.isArray(boardData.positions)) {
    const flat = boardData.positions as Record<string, string | null>;
    const rows = boardData.rows || 8;
    const cols = boardData.cols || 8;
    const board = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        board[r][c] = flat[`${r}_${c}`] || null;
      }
    }
    return board;
  }

  if (Array.isArray(boardData.positions) && boardData.positions.length === 8) {
    return boardData.positions;
  }

  return empty();
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || 'Unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const ChessSpectator: React.FC = () => {
  const { currentPieceSet, setCurrentPieceSet } = useChessPieceSet();
  const pieceImages = currentPieceSet.pieceImages;

  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: 8 }, () => Array(8).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<'blue' | 'red'>('blue');
  const [gameState, setGameState] = useState<'idle' | 'active' | 'finished'>('idle');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [bluePlayer, setBluePlayer] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chessboard] = useState(() => CHESSBOARDS[Math.floor(Math.random() * CHESSBOARDS.length)]);

  const gameUnsubRef = useRef<(() => void) | null>(null);
  const chatUnsubRef = useRef<(() => void) | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const cleanup = useCallback(() => {
    if (gameUnsubRef.current) { gameUnsubRef.current(); gameUnsubRef.current = null; }
    if (chatUnsubRef.current) { chatUnsubRef.current(); chatUnsubRef.current = null; }
  }, []);

  const subscribeToChat = useCallback((code: string) => {
    if (chatUnsubRef.current) { chatUnsubRef.current(); chatUnsubRef.current = null; }
    try {
      const messagesRef = ref(database, `chess_chat/private/${code}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(50));
      chatUnsubRef.current = onValue(messagesQuery, (snapshot) => {
        const msgs: ChatMessage[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            msgs.push({ id: child.key!, ...child.val() } as ChatMessage);
          });
        }
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        setChatMessages(msgs);
      });
    } catch (err) {
      console.error('[SPECTATOR] Chat subscribe error:', err);
    }
  }, []);

  const subscribeToGame = useCallback((code: string) => {
    cleanup();
    setInviteCode(code);
    setChatMessages([]);

    gameUnsubRef.current = firebaseChess.subscribeToGame(code, (gameData: any) => {
      if (!gameData) return;

      if (gameData.piece_set) {
        const ps = getPieceSetById(gameData.piece_set);
        if (ps) setCurrentPieceSet(ps);
      }

      if (gameData.board) {
        setBoard(reconstructBoard(gameData.board));
      }
      if (gameData.current_player) {
        setCurrentPlayer(gameData.current_player);
      }
      if (gameData.last_move) {
        setLastMove(gameData.last_move);
      }
      setBluePlayer(gameData.blue_player || '');

      if (gameData.game_state === 'finished') {
        setGameState('finished');
        setWinner(gameData.winner || null);
      } else if (gameData.game_state === 'active') {
        setGameState('active');
        setWinner(null);
      }
    });

    subscribeToChat(code);
  }, [cleanup, subscribeToChat, setCurrentPieceSet]);

  const findAndSubscribe = useCallback(async () => {
    const game = await firebaseChess.getActiveVsClawbGame();
    if (game && game.invite_code) {
      console.log('[SPECTATOR] Found active vs_clawb game:', game.invite_code);
      subscribeToGame(game.invite_code);
    }
  }, [subscribeToGame]);

  // Poll for new games when idle
  useEffect(() => {
    if (gameState === 'idle') {
      findAndSubscribe();
      pollTimerRef.current = setInterval(findAndSubscribe, POLL_INTERVAL_MS);
    } else {
      if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    }
    return () => {
      if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    };
  }, [gameState, findAndSubscribe]);

  // When game finishes, linger then return to idle
  useEffect(() => {
    if (gameState === 'finished') {
      lingerTimerRef.current = setTimeout(() => {
        cleanup();
        setGameState('idle');
        setInviteCode(null);
        setBoard(Array.from({ length: 8 }, () => Array(8).fill(null)));
        setChatMessages([]);
        setLastMove(null);
        setWinner(null);
        setBluePlayer('');
      }, GAME_OVER_LINGER_MS);
    }
    return () => {
      if (lingerTimerRef.current) { clearTimeout(lingerTimerRef.current); lingerTimerRef.current = null; }
    };
  }, [gameState, cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const renderSquare = (row: number, col: number) => {
    const piece = board[row]?.[col];
    const pieceImageUrl = piece && pieceImages[piece] ? pieceImages[piece] : null;
    const isLastMove = lastMove && (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );

    return (
      <div
        key={`${row}-${col}`}
        className={`square ${isLastMove ? 'last-move' : ''}`}
      >
        {piece && pieceImageUrl && (
          <img
            src={pieceImageUrl}
            alt={piece}
            className="piece"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 10,
              pointerEvents: 'none',
              margin: 0,
              padding: 0,
            }}
          />
        )}
      </div>
    );
  };

  const winnerLabel = winner === 'red' ? 'Clawb' : winner === 'blue' ? shortenAddress(bluePlayer) : 'Draw';

  // --- Idle / Waiting Screen ---
  if (gameState === 'idle') {
    return (
      <div className="spectator-root">
        <div className="spectator-idle">
          <img src="/images/redplushy.jpg" alt="Clawb" className="spectator-idle-img" />
          <div className="spectator-idle-text">Waiting for challenger...</div>
          <div className="spectator-idle-sub">Start a match at lawb.xyz/chess &mdash; select &ldquo;VS AI&rdquo; &rarr; Hard (Clawb)</div>
        </div>
      </div>
    );
  }

  // --- Active / Finished Game ---
  return (
    <div className="spectator-root">
      <div className="spectator-layout">
        {/* Board Column */}
        <div className="spectator-board-col">
          {/* Info Bar */}
          <div className="spectator-info-bar">
            <span className="spectator-player blue">{shortenAddress(bluePlayer)}</span>
            <span className={`spectator-turn ${currentPlayer}`}>
              {gameState === 'finished'
                ? (winner === 'draw' ? 'Draw!' : `${winnerLabel} wins!`)
                : `${currentPlayer === 'blue' ? 'Blue' : 'Red'} to move`}
            </span>
            <span className="spectator-player red">Clawb</span>
          </div>

          {/* Board */}
          <div className="spectator-board-wrapper">
            <div
              className="chessboard"
              style={{
                backgroundImage: `url(${chessboard})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gridTemplateRows: 'repeat(8, 1fr)',
                width: '100%',
                height: '100%',
                position: 'relative',
                zIndex: 1,
                margin: 0,
                padding: 0,
              }}
            >
              {Array.from({ length: 8 }, (_, row) =>
                Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
              )}
            </div>
          </div>
        </div>

        {/* Chat Column */}
        <div className="spectator-chat-col">
          <div className="spectator-chat-header">Game Chat</div>
          <div className="spectator-chat-messages">
            {chatMessages.length === 0 && (
              <div className="spectator-chat-empty">No messages yet</div>
            )}
            {chatMessages.map((msg) => {
              const isClawb =
                msg.isClawb ||
                (msg.sender || '').toLowerCase() === CLAWB_WALLET.toLowerCase() ||
                (msg.sender || '').toLowerCase().includes('clawb');
              return (
                <div key={msg.id} className={`spectator-chat-msg ${isClawb ? 'clawb' : 'player'}`}>
                  <span className="spectator-chat-sender">
                    {isClawb ? 'Clawb' : shortenAddress(msg.sender)}:
                  </span>{' '}
                  <span className="spectator-chat-text">{msg.text}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Game-over overlay */}
      {gameState === 'finished' && (
        <div className="spectator-gameover-overlay">
          <div className="spectator-gameover-box">
            <div className="spectator-gameover-title">
              {winner === 'draw' ? 'Draw!' : `${winnerLabel} wins!`}
            </div>
            <div className="spectator-gameover-sub">Next game starting soon...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessSpectator;
