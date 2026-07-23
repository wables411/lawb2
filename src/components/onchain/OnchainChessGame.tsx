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
import { useChessPieceSet } from '../../contexts/ChessPieceSetContext';
import { oc, solid, ocBtnPrimary, ocBtnSecondary, ocBtnGhost, ocBtnDanger, OcArenaHeader, OcPill } from './onchainUi';

const Popup = lazy(() => import('../Popup'));
const PlayerProfile = lazy(() => import('../PlayerProfile').then((m) => ({ default: m.PlayerProfile })));
const ChessChat = lazy(() => import('../ChessChat').then((m) => ({ default: m.ChessChat })));

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
type SideT = typeof Side[keyof typeof Side];

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
  const { currentPieceSet } = useChessPieceSet();
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
  const [joinTokenId, setJoinTokenId] = useState('');
  const [showChat, setShowChat] = useState(false);
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

  // join an open game — handles native / ERC-20 / NFT (approval then the matching join call)
  const join = useCallback(async () => {
    if (!game) return;
    setErr(null);
    setBusy(true);
    const wait = async (h: `0x${string}`) => { if (publicClient) await publicClient.waitForTransactionReceipt({ hash: h }); };
    try {
      if (game.kind === WagerKind.NATIVE) {
        await wait(await actions.joinGame(code, game.wager));
      } else if (game.kind === WagerKind.ERC20) {
        await wait(await actions.approveErc20(game.token, game.wager));
        await wait(await actions.joinGame(code, 0n));
      } else if (game.kind === WagerKind.ERC721) {
        const id = BigInt(joinTokenId || '0');
        await wait(await actions.approveErc721(game.token, id));
        await wait(await actions.joinGameERC721(code, id));
      } else {
        const id = BigInt(joinTokenId || '0');
        await wait(await actions.setNftApprovalForAll(game.token, true));
        await wait(await actions.joinGameERC1155(code, id));
      }
      refetch();
    } catch (e) {
      setErr((e as Error)?.message?.split('\n')[0] ?? 'join failed');
    } finally {
      setBusy(false);
    }
  }, [actions, code, game, joinTokenId, publicClient, refetch]);

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
        <OcArenaHeader />
        <div style={{ color: oc.muted, fontSize: 13 }}>On-chain chess isn't deployed on the connected network.</div>
        <button style={ocBtnSecondary} onClick={onLeave}>Back</button>
      </div>
    );
  }
  if (isLoading || !game || !board) {
    return <div style={panel}><OcArenaHeader /><div style={{ color: oc.muted }}>Loading game {codeToString(code)}…</div></div>;
  }
  if (game.status === GameStatus.NONE) {
    return (
      <div style={panel}>
        <OcArenaHeader />
        <div style={{ color: oc.muted, fontSize: 13 }}>No game found for code <b style={{ color: oc.ink }}>{codeToString(code)}</b>.</div>
        <button style={ocBtnSecondary} onClick={onLeave}>Back to lobby</button>
      </div>
    );
  }

  const wagerLabel =
    game.kind === WagerKind.NATIVE ? `${Number(game.wager) / 1e18} ETH`
    : game.kind === WagerKind.ERC20 ? `ERC-20 ${game.token.slice(0, 8)}…`
    : `NFT ${game.token.slice(0, 8)}…`;
  const potLabel = game.kind === WagerKind.NATIVE ? `${(Number(game.wager) / 1e18) * 2} ETH` : 'Both stakes';

  const statusText = isFinished ? (result ?? 'Game over')
    : isOpen ? (isPlayer ? 'Waiting for an opponent to join…' : 'Open — waiting for players')
    : myTurn ? 'Your move' : isPlayer ? "Opponent's move…" : 'Spectating';

  // bottom = you (or White for a spectator); top = the other side
  const bottomSide = myColor ?? Side.WHITE;
  const topSide = bottomSide === Side.WHITE ? Side.BLACK : Side.WHITE;
  const kingImg = (side: SideT) => currentPieceSet.pieceImages[side === Side.WHITE ? 'K' : 'k'];
  const dataFor = (side: SideT) => ({
    side,
    addr: side === Side.WHITE ? game.white : game.black,
    elo: side === Side.WHITE
      ? (eloWhiteRaw !== undefined ? Number(eloWhiteRaw) : undefined)
      : (eloBlackRaw !== undefined ? Number(eloBlackRaw) : undefined),
    clock: side === Side.WHITE ? clocks.white : clocks.black,
    isYou: myColor === side,
    turn: isActive && game.side === side,
  });

  return (
    <div style={panel}>
      <OcArenaHeader right={<OcPill tone={isFinished ? 'gold' : 'cyan'}>#{codeToString(code)}</OcPill>} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
        {/* board column with player cards top + bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 'min(92vw, 480px)' }}>
          <PlayerCard {...dataFor(topSide)} avatar={kingImg(topSide)} />

          <div style={{ backgroundImage: 'linear-gradient(#0c1728, #0a1220)', border: `1px solid ${oc.line2}`,
            borderRadius: 16, padding: 12, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
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
          </div>

          <PlayerCard {...dataFor(bottomSide)} avatar={kingImg(bottomSide)} />

          <div style={{ minHeight: 20, textAlign: 'center', fontSize: 13, fontWeight: 700,
            color: myTurn ? oc.cyan : oc.muted }}>
            {statusText}{busy && ' · submitting…'}
          </div>
          {err && (
            <div style={{ color: '#ff9d94', fontSize: 12, backgroundImage: solid('rgba(232,86,74,.10)'),
              border: '1px solid rgba(232,86,74,.35)', borderRadius: 10, padding: '9px 12px' }}>{err}</div>
          )}

          {pendingPromo && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: oc.muted, fontSize: 12 }}>Promote to:</span>
              {(['q', 'r', 'b', 'n'] as const).map((p) => (
                <button key={p} style={ocBtnSecondary} disabled={busy}
                  onClick={() => submitMove(pendingPromo.from, pendingPromo.to, PROMO_TYPE[p])}>{p.toUpperCase()}</button>
              ))}
              <button style={ocBtnGhost} onClick={() => setPendingPromo(null)}>Cancel</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {isOpen && !isPlayer && address && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {(game.kind === WagerKind.ERC721 || game.kind === WagerKind.ERC1155) && (
                  <input style={{ ...ocInputInline, width: 110 }} placeholder="your token ID"
                    value={joinTokenId} onChange={(e) => setJoinTokenId(e.target.value)} />
                )}
                <button style={ocBtnPrimary} disabled={busy} onClick={join}>
                  {game.kind === WagerKind.NATIVE
                    ? `Join — stake ${Number(game.wager) / 1e18} ETH`
                    : game.kind === WagerKind.ERC20 ? 'Join (approve + stake)' : 'Join (stake your NFT)'}
                </button>
              </div>
            )}
            {isActive && isPlayer && (
              <button style={ocBtnDanger} disabled={busy} onClick={() => doAction(() => actions.resign(code))}>Resign</button>
            )}
            {opponentTimedOut && isPlayer && (
              <button style={ocBtnPrimary} disabled={busy} onClick={() => doAction(() => actions.claimTimeout(code))}>Claim timeout win</button>
            )}
            {isOpen && myColor === Side.WHITE && (
              <button style={ocBtnGhost} disabled={busy} onClick={() => doAction(() => actions.cancelGame(code))}>Cancel game</button>
            )}
            <button style={ocBtnGhost} onClick={() => setShowChat((v) => !v)}>Chat</button>
            <button style={ocBtnGhost} disabled={busy} onClick={() => refetch()}>Refresh</button>
            <button style={ocBtnGhost} onClick={onLeave}>Leave</button>
          </div>
        </div>

        {/* right rail: pot badge + sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(92vw, 280px)' }}>
          <div style={{ backgroundImage: solid('rgba(242,183,60,.13)'), border: `1px solid ${oc.goldline}`, borderRadius: 13, padding: '13px 15px' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: oc.muted2, marginBottom: 2 }}>
              Pot · winner takes all
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 19, color: oc.gold }}>{potLabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, fontSize: 11, color: oc.muted }}>
              <span style={{ color: oc.cyan }}>⛓</span> Escrowed on-chain · contract validates every move
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
      </div>

      {endOverlay && (
        <OnchainChessResult outcome={endOverlay.outcome} detail={endOverlay.detail} onClose={() => setEndOverlay(null)} />
      )}

      {showChat && (
        <Suspense fallback={null}>
          <ChessChat isOpen onMinimize={() => setShowChat(false)} currentInviteCode={codeToString(code)} />
        </Suspense>
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

/** Player identity card with avatar, short address / you tag, ELO, and clock. */
const PlayerCard: React.FC<{
  side: SideT; addr: string; elo?: number; clock: number; isYou: boolean; turn: boolean; avatar?: string;
}> = ({ side, addr, elo, clock, isYou, turn, avatar }) => {
  const accent = side === Side.WHITE ? oc.red : oc.blue;
  const zero = '0x0000000000000000000000000000000000000000';
  const name = addr && addr !== zero ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Waiting…';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, backgroundImage: oc.card,
      border: `1px solid ${oc.line}`, borderLeft: `3px solid ${accent}`, borderRadius: 13, padding: '9px 12px',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundImage: solid('#0b1420'),
        border: `1px solid ${oc.line2}`, display: 'grid', placeItems: 'center', overflow: 'hidden', flex: '0 0 auto' }}>
        {avatar && <img src={avatar} alt="" style={{ width: '86%', height: '86%', objectFit: 'contain' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: oc.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}{isYou && <span style={{ color: oc.muted2, fontWeight: 400, fontSize: 11 }}> · you</span>}
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, color: oc.muted2, letterSpacing: '.06em' }}>
          {side === Side.WHITE ? 'WHITE' : 'BLACK'} · ELO {elo ?? '—'}{turn ? ' · to move' : ''}
        </div>
      </div>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 20, letterSpacing: '.04em',
        minWidth: 74, textAlign: 'center', padding: '6px 10px', borderRadius: 10,
        backgroundImage: solid('#0a1322'), border: `1px solid ${turn ? oc.line2 : oc.line}`,
        color: turn ? oc.cyan : oc.muted2, boxShadow: turn ? '0 0 16px rgba(63,224,214,.15)' : 'none',
      }}>{fmtClock(clock)}</div>
    </div>
  );
};

const panel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 16,
  fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif", fontSize: 13, color: oc.ink,
  backgroundImage: oc.panel, border: `1px solid ${oc.line}`, borderRadius: 16,
  maxWidth: 800, margin: '0 auto', boxShadow: '0 24px 60px rgba(0,0,0,.4)',
};
const ocInputInline: React.CSSProperties = {
  backgroundImage: oc.inset, border: `1px solid ${oc.line}`, borderRadius: 9,
  color: oc.ink, fontFamily: 'ui-monospace, monospace', fontSize: 12, padding: '9px 10px', outline: 'none',
};
