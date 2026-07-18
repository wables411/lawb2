import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { firebaseChess } from '../firebaseChess';
import { useChessPieceSet } from '../contexts/ChessPieceSetContext';
import { getPieceSetById } from '../config/chessPieceSets';
import './ChessGame.css';
import './ChessGameModern.css';
import './ChessSpectator.css';

const POLL_INTERVAL_MS = 10_000;
const GAME_OVER_LINGER_MS = 15_000;
const PARTICLE_COUNT = 60;

const CHESSBOARDS = [
  '/images/chessboard1.png',
  '/images/chessboard2.png',
  '/images/chessboard3.png',
  '/images/chessboard4.png',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
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

function squareToAlgebraic(row: number, col: number): string {
  const file = String.fromCharCode(97 + col);
  const rank = String(8 - row);
  return `${file}${rank}`;
}

function withCaptureTag(move: string): string {
  return /x/i.test(move) ? `${move} *capture*` : move;
}

function initParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0003,
    vy: -Math.random() * 0.0004 - 0.0001,
    size: Math.random() * 2.5 + 0.5,
    opacity: Math.random() * 0.35 + 0.05,
    hue: Math.random() * 40 + 200,
  }));
}

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>(initParticles());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;

        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="spectator-particles" />;
};

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
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [chessboard] = useState(() => CHESSBOARDS[Math.floor(Math.random() * CHESSBOARDS.length)]);
  const [captureSquare, setCaptureSquare] = useState<string | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const prevBoardRef = useRef<(string | null)[][]>(Array.from({ length: 8 }, () => Array(8).fill(null)));
  const gameUnsubRef = useRef<(() => void) | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (gameUnsubRef.current) { gameUnsubRef.current(); gameUnsubRef.current = null; }
  }, []);

  const detectCapture = useCallback((oldBoard: (string | null)[][], newBoard: (string | null)[][]) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const was = oldBoard[r]?.[c];
        const now = newBoard[r]?.[c];
        if (was && now && was !== now) {
          setCaptureSquare(`${r}-${c}`);
          setTimeout(() => setCaptureSquare(null), 500);
          return;
        }
      }
    }
  }, []);

  const subscribeToGame = useCallback((code: string) => {
    cleanup();
    setInviteCode(code);
    setMoveHistory([]);
    setMoveCount(0);

    gameUnsubRef.current = firebaseChess.subscribeToGame(code, (gameData: any) => {
      if (!gameData) return;

      if (gameData.piece_set) {
        const ps = getPieceSetById(gameData.piece_set);
        if (ps) setCurrentPieceSet(ps);
      }

      if (gameData.board) {
        const newBoard = reconstructBoard(gameData.board);
        detectCapture(prevBoardRef.current, newBoard);
        prevBoardRef.current = newBoard;
        setBoard(newBoard);
      }
      if (gameData.current_player) {
        setCurrentPlayer(gameData.current_player);
      }
      if (gameData.last_move) {
        setLastMove(gameData.last_move);
        setMoveCount(prev => prev + 1);
      }
      if (Array.isArray(gameData.move_history)) {
        const readableMoves = gameData.move_history
          .map((m: unknown) => String(m || '').trim())
          .filter((m: string) => m.length > 0);
        setMoveHistory(readableMoves);
      } else if (gameData.last_move?.from && gameData.last_move?.to) {
        const from = gameData.last_move.from;
        const to = gameData.last_move.to;
        const fallbackMove = `${squareToAlgebraic(from.row, from.col)} -> ${squareToAlgebraic(to.row, to.col)}`;
        setMoveHistory((prev) => {
          if (prev[prev.length - 1] === fallbackMove) return prev;
          return [...prev, fallbackMove];
        });
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
  }, [cleanup, setCurrentPieceSet, detectCapture]);

  const findAndSubscribe = useCallback(async () => {
    // Backgrounded /chess tabs must not drip Firebase reads 24/7.
    if (typeof document !== 'undefined' && document.hidden) return;
    const game = await firebaseChess.getActiveClawbGame();
    if (game && game.invite_code) {
      console.log('[SPECTATOR] Found active Clawb game:', game.invite_code, 'type:', game.game_type || 'unknown');
      subscribeToGame(game.invite_code);
    }
  }, [subscribeToGame]);

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

  useEffect(() => {
    if (gameState === 'finished') {
      lingerTimerRef.current = setTimeout(() => {
        cleanup();
        setGameState('idle');
        setInviteCode(null);
        setBoard(Array.from({ length: 8 }, () => Array(8).fill(null)));
        prevBoardRef.current = Array.from({ length: 8 }, () => Array(8).fill(null));
        setMoveHistory([]);
        setLastMove(null);
        setWinner(null);
        setBluePlayer('');
        setMoveCount(0);
      }, GAME_OVER_LINGER_MS);
    }
    return () => {
      if (lingerTimerRef.current) { clearTimeout(lingerTimerRef.current); lingerTimerRef.current = null; }
    };
  }, [gameState, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  const moveRows = useMemo(() => {
    const rows: Array<{ turn: number; blue: string; red: string }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      rows.push({
        turn: Math.floor(i / 2) + 1,
        blue: withCaptureTag(moveHistory[i] || ''),
        red: withCaptureTag(moveHistory[i + 1] || ''),
      });
    }
    return rows;
  }, [moveHistory]);

  const renderSquare = (row: number, col: number) => {
    const piece = board[row]?.[col];
    const pieceImageUrl = piece && pieceImages[piece] ? pieceImages[piece] : null;
    const isLastMove = lastMove && (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
    const isCaptureFlash = captureSquare === `${row}-${col}`;

    return (
      <div
        key={`${row}-${col}`}
        className={`square ${isLastMove ? 'last-move' : ''} ${isCaptureFlash ? 'capture-flash' : ''}`}
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

  if (gameState === 'idle') {
    return (
      <div className="spectator-root">
        <div className="spectator-bg" />
        <ParticleCanvas />
        <div className="spectator-crt-overlay" />
        <div className="spectator-idle">
          <img src="/images/redplushy.jpg" alt="Clawb" className="spectator-idle-img" />
          <div className="spectator-idle-text">Waiting for challenger...</div>
          <div className="spectator-idle-sub">Start a match at lawb.xyz/chess &mdash; select &ldquo;VS AI&rdquo; &rarr; Hard (Clawb)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="spectator-root">
      <div className="spectator-bg" />
      <ParticleCanvas />
      <div className="spectator-crt-overlay" />

      <div className="spectator-layout">
        <div className="spectator-board-col">
          <div className="spectator-info-bar">
            <span className="spectator-player blue">{shortenAddress(bluePlayer)}</span>
            <span className={`spectator-turn ${currentPlayer}`}>
              {gameState === 'finished'
                ? (winner === 'draw' ? 'Draw!' : `${winnerLabel} wins!`)
                : `${currentPlayer === 'blue' ? 'Blue' : 'Red'} to move`}
            </span>
            <span className="spectator-player red">Clawb</span>
          </div>

          <div className={`spectator-board-wrapper turn-${currentPlayer}`}>
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

          {moveCount > 0 && (
            <div className="spectator-move-counter">Move {moveCount}</div>
          )}
        </div>

        <div className="spectator-chat-col">
          <div className="spectator-chat-header">Move History</div>
          <div className="spectator-chat-messages">
            {moveRows.length === 0 && (
              <div className="spectator-chat-empty">No moves yet</div>
            )}
            {moveRows.slice(-18).map((row) => (
              <div key={row.turn} className="spectator-chat-msg player">
                <span className="spectator-chat-sender">{row.turn}.</span>{' '}
                <span className="spectator-chat-text">
                  Blue: {row.blue || '-'} | Red: {row.red || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
