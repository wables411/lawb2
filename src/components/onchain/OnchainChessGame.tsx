// On-chain chess game screen (Phase 4). Reads board state from the contract (source of
// truth), uses chess.js only for client-side legal-move highlighting + promotion detection,
// and submits moves via the write hook. The contract remains the final arbiter of legality.

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { useOnchainChessGame } from '../../hooks/useOnchainChessGame';
import { useOnchainChessActions } from '../../hooks/useOnchainChessActions';
import { useOnchainChessMoves } from '../../hooks/useOnchainChessMoves';
import {
  boardToFen, squareToAlgebraic, algebraicToSquare, GameStatus, Side, WagerKind,
} from '../../utils/lawbChessBoard';
import { codeToString, type GameCode } from '../../utils/lawbChessMoves';
import { chessBoardForCode } from '../../config/chessBoards';
import { ENABLE_ONCHAIN_CHESS, LAWB_CHESS_ABI } from '../../config/lawbChessOnchain';
import { playChessSound } from '../../utils/chessSounds';
import { OnchainChessBoard } from './OnchainChessBoard';
import { OnchainChessSidebar } from './OnchainChessSidebar';
import { OnchainChessResult, type GameOutcome } from './OnchainChessResult';

const Popup = lazy(() => import('../Popup'));
const PlayerProfile = lazy(() => import('../PlayerProfile').then((m) => ({ default: m.PlayerProfile })));

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// chess.js promotion letter -> contract piece type
const PROMO_TYPE: Record<string, number> = { n: 2, b: 3, r: 4, q: 5 };
// while waiting for the opponent we poll the contract at this interval, and ONLY then
// (stops on your turn / when finished / when the tab is hidden) — no idle polling.
const WAIT_POLL_MS = 4000;

function useNowSeconds(active: boolean): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export interface OnchainChessGameProps {
  code: GameCode;
  onLeave: () => void;
}

export const OnchainChessGame: React.FC<OnchainChessGameProps> = ({ code, onLeave }) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { game, board, isLoading, contractAddress, refetch } = useOnchainChessGame(code);
  const actions = useOnchainChessActions();
  const { moves, lastMove } = useOnchainChessMoves(code, undefined, game?.moveNonce?.toString());

  const eloEnabled = ENABLE_ONCHAIN_CHESS && !!contractAddress && !!game;
  const { data: eloWhiteRaw } = useReadContract({
    address: contractAddress ?? undefined, abi: LAWB_CHESS_ABI, functionName: 'ratingOf',
    args: game ? [game.white] : undefined,
    query: { enabled: eloEnabled && !!game && game.white !== ZERO_ADDR },
  });
  const { data: eloBlackRaw } = useReadContract({
    address: contractAddress ?? undefined, abi: LAWB_CHESS_ABI, functionName: 'ratingOf',
    args: game ? [game.black] : undefined,
    query: { enabled: eloEnabled && !!game && game.black !== ZERO_ADDR },
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [pendingPromo, setPendingPromo] = useState<{ from: number; to: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [captureSquare, setCaptureSquare] = useState<number | null>(null);
  const [endOverlay, setEndOverlay] = useState<{ outcome: GameOutcome; detail: string } | null>(null);
  const [profileAddr, setProfileAddr] = useState<`0x${string}` | null>(null);
  const seenNonceRef = useRef<bigint | null>(null);
  const prevCountRef = useRef<number | null>(null);

  const me = address?.toLowerCase();
  const myColor =
    game && me === game.white.toLowerCase() ? Side.WHITE
    : game && me === game.black.toLowerCase() ? Side.BLACK
    : null;
  const isPlayer = myColor !== null;
  const isActive = game?.status === GameStatus.ACTIVE;
  const isOpen = game?.status === GameStatus.OPEN;
  const isFinished = game?.status === GameStatus.FINISHED;
  const myTurn = isActive && myColor !== null && game?.side === myColor;
  const orientation = myColor === Side.BLACK ? 'black' : 'white';

  const chess = useMemo(() => {
    if (!game || !board) return null;
    try {
      return new Chess(boardToFen(board, game.side, game.castling, game.ep, game.halfmove));
    } catch {
      return null;
    }
  }, [game, board]);

  const clear = useCallback(() => { setSelected(null); setTargets([]); }, []);

  const submitMove = useCallback(
    async (from: number, to: number, promo: number) => {
      clear();
      setPendingPromo(null);
      setErr(null);
      setBusy(true);
      try {
        const hash = await actions.makeMove(code, from, to, promo);
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
        refetch();
      } catch (e) {
        setErr((e as Error)?.message?.split('\n')[0] ?? 'move failed');
      } finally {
        setBusy(false);
      }
    },
    [actions, clear, code, publicClient, refetch],
  );

  const handleSquareClick = useCallback(
    (sq: number) => {
      if (!chess || !myTurn || busy) return;
      const ownPieceAt = (s: number): boolean => {
        const p = board?.[s >> 3]?.[s & 7];
        if (!p) return false;
        const isWhite = p === p.toUpperCase();
        return (myColor === Side.WHITE) === isWhite;
      };
      const selectIfMovable = (s: number): boolean => {
        const moves = chess.moves({ square: squareToAlgebraic(s) as never, verbose: true });
        if (!moves.length) return false;
        setSelected(s);
        setTargets(moves.map((m) => algebraicToSquare((m as { to: string }).to)));
        return true;
      };

      if (selected === null) {
        if (ownPieceAt(sq)) selectIfMovable(sq);
        return;
      }
      if (sq === selected) { clear(); return; }

      const moves = chess.moves({ square: squareToAlgebraic(selected) as never, verbose: true });
      const move = moves.find((m) => algebraicToSquare((m as { to: string }).to) === sq) as
        | { to: string; promotion?: string }
        | undefined;
      if (!move) {
        if (ownPieceAt(sq) && selectIfMovable(sq)) return;
        clear();
        return;
      }
      if (move.promotion) { setPendingPromo({ from: selected, to: sq }); return; }
      void submitMove(selected, sq, 0);
    },
    [board, busy, chess, clear, myColor, myTurn, selected, submitMove],
  );

  // bounded refresh: only while OPEN (waiting for a join) or ACTIVE-and-not-my-turn, tab visible
  useEffect(() => {
    const shouldWatch = isOpen || (isActive && !myTurn);
    if (!shouldWatch) return;
    const tick = () => { if (!document.hidden) refetch(); };
    const id = setInterval(tick, WAIT_POLL_MS);
    return () => clearInterval(id);
  }, [isOpen, isActive, myTurn, refetch]);

  const now = useNowSeconds(!!isActive);
  const clocks = useMemo(() => {
    if (!game) return { white: 0, black: 0 };
    let { whiteTime, blackTime } = game;
    if (isActive && game.lastMoveAt > 0n) {
      const elapsed = now - Number(game.lastMoveAt);
      if (game.side === Side.WHITE) whiteTime = Math.max(0, whiteTime - elapsed);
      else blackTime = Math.max(0, blackTime - elapsed);
    }
    return { white: whiteTime, black: blackTime };
  }, [game, isActive, now]);

  const opponentTimedOut = isActive && ((game!.side === Side.WHITE && clocks.white <= 0) || (game!.side === Side.BLACK && clocks.black <= 0));

  const result = useMemo(() => {
    if (!isFinished || !chess) return null;
    if (chess.isCheckmate()) {
      // side to move is mated -> the other side delivered checkmate
      return game!.side === Side.WHITE ? 'Checkmate — Black wins' : 'Checkmate — White wins';
    }
    if (chess.isStalemate()) return 'Stalemate — draw';
    if (chess.isInsufficientMaterial()) return 'Draw — insufficient material';
    return 'Game over';
  }, [chess, game, isFinished]);

  const doAction = useCallback(
    async (fn: () => Promise<`0x${string}`>) => {
      setErr(null);
      setBusy(true);
      try {
        const hash = await fn();
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
        refetch();
      } catch (e) {
        setErr((e as Error)?.message?.split('\n')[0] ?? 'action failed');
      } finally {
        setBusy(false);
      }
    },
    [publicClient, refetch],
  );

  // capture/move/check sound + capture animation when the move count advances (mine or opponent's)
  useEffect(() => {
    if (!game || !board) return;
    const count = board.reduce((s, row) => s + row.filter(Boolean).length, 0);
    const nonce = game.moveNonce;
    if (seenNonceRef.current !== null && nonce > seenNonceRef.current) {
      const captured = prevCountRef.current !== null && count < prevCountRef.current;
      if (captured && lastMove) {
        playChessSound('capture');
        setCaptureSquare(lastMove.to);
        window.setTimeout(() => setCaptureSquare(null), 600);
      } else if (chess?.inCheck()) {
        playChessSound('check');
      } else {
        playChessSound('move');
      }
    }
    seenNonceRef.current = nonce;
    prevCountRef.current = count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.moveNonce]);

  // victory/defeat/draw overlay: winner comes from the GameEnded event (handles all end reasons)
  useEffect(() => {
    if (!isFinished || !isPlayer || !publicClient || !contractAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const logs = await publicClient.getContractEvents({
          address: contractAddress, abi: LAWB_CHESS_ABI, eventName: 'GameEnded',
          args: { code }, fromBlock: 0n, toBlock: 'latest',
        });
        if (cancelled || !logs.length) return;
        const winner = String((logs[logs.length - 1] as { args: { winner?: string } }).args.winner ?? '').toLowerCase();
        const outcome: GameOutcome = !winner || winner === ZERO_ADDR ? 'draw' : winner === me ? 'win' : 'loss';
        setEndOverlay({ outcome, detail: result ?? 'Game over' });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, isPlayer, publicClient, contractAddress, code, me]);

  if (!contractAddress) {
    return (
      <div style={panel}>
        <p>On-chain chess isn't deployed on the connected network.</p>
        <button style={btn} onClick={onLeave}>Back</button>
      </div>
    );
  }
  if (isLoading || !game || !board) {
    return <div style={panel}><p>Loading game {codeToString(code)}…</p></div>;
  }
  if (game.status === GameStatus.NONE) {
    return (
      <div style={panel}>
        <p>No game found for code <b>{codeToString(code)}</b>.</p>
        <button style={btn} onClick={onLeave}>Back to lobby</button>
      </div>
    );
  }

  const wagerLabel =
    game.kind === WagerKind.NATIVE ? `${Number(game.wager) / 1e18} ETH`
    : game.kind === WagerKind.ERC20 ? `ERC-20 ${game.token.slice(0, 8)}…`
    : `NFT ${game.token.slice(0, 8)}…`;

  const statusText = isFinished ? (result ?? 'Game over')
    : isOpen ? (isPlayer ? 'Waiting for an opponent to join…' : 'Open — waiting for players')
    : myTurn ? 'Your move' : isPlayer ? "Opponent's move…" : 'Spectating';

  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'min(92vw, 480px)' }}>
        <span>Code: <b>{codeToString(code)}</b></span>
        <span>Wager: {wagerLabel}</span>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 'min(92vw, 480px)' }}>
            <span>⏱ White {fmtClock(clocks.white)}</span>
            <span>⏱ Black {fmtClock(clocks.black)}</span>
          </div>

          <OnchainChessBoard
            board={board}
            orientation={orientation}
            selectedSquare={selected}
            legalTargets={targets}
            lastMove={lastMove}
            boardImage={chessBoardForCode(codeToString(code))}
            captureSquare={captureSquare}
            interactive={!!myTurn && !busy}
            onSquareClick={handleSquareClick}
          />

          <div style={{ minHeight: 22, textAlign: 'center' }}>
            <b>{statusText}</b>{busy && ' • submitting…'}
          </div>
          {err && <div style={{ color: '#c0392b', maxWidth: 'min(92vw,480px)', fontSize: 12 }}>{err}</div>}

      {pendingPromo && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>Promote to:</span>
          {(['q', 'r', 'b', 'n'] as const).map((p) => (
            <button key={p} style={btn} disabled={busy}
              onClick={() => submitMove(pendingPromo.from, pendingPromo.to, PROMO_TYPE[p])}>
              {p.toUpperCase()}
            </button>
          ))}
          <button style={btn} onClick={() => setPendingPromo(null)}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {isOpen && !isPlayer && address && (
          game.kind === WagerKind.NATIVE ? (
            <button style={btn} disabled={busy}
              onClick={() => doAction(() => actions.joinGame(code, game.wager))}>
              Join — stake {Number(game.wager) / 1e18} ETH
            </button>
          ) : (
            <span style={{ fontSize: 12 }}>Joining ERC-20/NFT games isn't in this UI yet.</span>
          )
        )}
        {isActive && isPlayer && (
          <button style={btn} disabled={busy} onClick={() => doAction(() => actions.resign(code))}>Resign</button>
        )}
        {opponentTimedOut && isPlayer && (
          <button style={btn} disabled={busy} onClick={() => doAction(() => actions.claimTimeout(code))}>Claim timeout win</button>
        )}
        {isOpen && myColor === Side.WHITE && (
          <button style={btn} disabled={busy} onClick={() => doAction(() => actions.cancelGame(code))}>Cancel game</button>
        )}
        <button style={btn} disabled={busy} onClick={() => refetch()}>Refresh</button>
        <button style={btn} onClick={onLeave}>Leave</button>
      </div>
        </div>

        <OnchainChessSidebar
          moves={moves}
          players={{
            white: game.white,
            black: game.black,
            eloWhite: eloWhiteRaw !== undefined ? Number(eloWhiteRaw) : undefined,
            eloBlack: eloBlackRaw !== undefined ? Number(eloBlackRaw) : undefined,
            wagerLabel,
            statusText,
            me,
          }}
          onViewProfile={(addr) => setProfileAddr(addr)}
        />
      </div>

      {endOverlay && (
        <OnchainChessResult outcome={endOverlay.outcome} detail={endOverlay.detail} onClose={() => setEndOverlay(null)} />
      )}

      {profileAddr && (
        <Suspense fallback={null}>
          <Popup
            id="onchain-chess-profile"
            isOpen
            onClose={() => setProfileAddr(null)}
            onMinimize={() => setProfileAddr(null)}
            title="Lawb ID"
            initialPosition={{ x: 80, y: 80 }}
            initialSize={{ width: 420, height: 560 }}
            zIndex={999999}
          >
            <Suspense fallback={<div style={{ padding: 16, color: '#000' }}>Loading…</div>}>
              <PlayerProfile address={profileAddr} />
            </Suspense>
          </Popup>
        </Suspense>
      )}
    </div>
  );
};

const panel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12,
  fontFamily: "'MS Sans Serif', Arial, sans-serif", fontSize: 13, color: '#eee',
};
const btn: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', cursor: 'pointer',
  background: '#c0c0c0', border: '2px outset #fff', color: '#000',
};
