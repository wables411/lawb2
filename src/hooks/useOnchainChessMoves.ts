// Reads a game's move history from on-chain MovePlayed events and replays it to SAN
// (standard algebraic notation) via chess.js. One-shot fetch + refetch on demand — NO
// polling. Trustless: anyone can recompute the move list from chain events.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChainId, usePublicClient } from 'wagmi';
import { Chess } from 'chess.js';
import { ENABLE_ONCHAIN_CHESS, LAWB_CHESS_ABI, getLawbChessAddress } from '../config/lawbChessOnchain';
import { squareToAlgebraic } from '../utils/lawbChessBoard';
import type { GameCode } from '../utils/lawbChessMoves';

const PROMO_LETTER: Record<number, string | undefined> = { 2: 'n', 3: 'b', 4: 'r', 5: 'q' };

export interface OnchainMove {
  san: string;
  from: number;
  to: number;
}

/**
 * @param code       bytes6 game code
 * @param chainId    optional chain override (defaults to connected)
 * @param refreshKey bump this (e.g. the game's moveNonce) to refetch after a move
 */
export function useOnchainChessMoves(
  code: GameCode | undefined,
  chainId?: number,
  refreshKey?: unknown,
) {
  const connectedChainId = useChainId();
  const effectiveChainId = chainId ?? connectedChainId;
  const publicClient = usePublicClient({ chainId: effectiveChainId });
  const address = getLawbChessAddress(effectiveChainId);
  const enabled = ENABLE_ONCHAIN_CHESS && !!address && !!code && !!publicClient;

  const [moves, setMoves] = useState<OnchainMove[]>([]);
  // Incremental replay state: after the first fetch, later fetches scan only NEW blocks and
  // append to the persisted chess.js replay, instead of re-scanning from block 0 on every move
  // (a from-genesis eth_getLogs per move — increasingly slow/rate-limited on public RPCs).
  const replayRef = useRef<{ key: string; chess: Chess; lastBlock: bigint; moves: OnchainMove[] } | null>(null);

  const fetchMoves = useCallback(async () => {
    if (!enabled || !publicClient || !address || !code) {
      replayRef.current = null;
      setMoves([]);
      return;
    }
    const key = `${effectiveChainId}:${address}:${code}`;
    let st = replayRef.current;
    if (!st || st.key !== key) {
      st = { key, chess: new Chess(), lastBlock: -1n, moves: [] };
      replayRef.current = st;
    }
    try {
      const logs = await publicClient.getContractEvents({
        address,
        abi: LAWB_CHESS_ABI,
        eventName: 'MovePlayed',
        args: { code },
        // A new move can only land in a block AFTER the highest block we've already replayed
        // (same-block logs always arrive together), so lastBlock+1 never skips one.
        fromBlock: st.lastBlock >= 0n ? st.lastBlock + 1n : 0n,
        toBlock: 'latest',
      });
      for (const log of logs) {
        const a = (log as { args: { from: number; to: number; promo: number } }).args;
        const from = Number(a.from);
        const to = Number(a.to);
        const promo = Number(a.promo);
        let san: string;
        try {
          const m = st.chess.move({ from: squareToAlgebraic(from), to: squareToAlgebraic(to), promotion: PROMO_LETTER[promo] });
          san = m.san;
        } catch {
          san = `${squareToAlgebraic(from)}-${squareToAlgebraic(to)}`; // defensive
        }
        st.moves.push({ san, from, to });
        const bn = (log as { blockNumber?: bigint }).blockNumber;
        if (typeof bn === 'bigint' && bn > st.lastBlock) st.lastBlock = bn;
      }
      if (logs.length) setMoves([...st.moves]);
      else if (!st.moves.length) setMoves([]);
    } catch {
      // RPC range/availability errors: keep whatever we had rather than crashing the UI
    }
  }, [enabled, publicClient, address, code, effectiveChainId]);

  useEffect(() => {
    void fetchMoves();
  }, [fetchMoves, refreshKey]);

  const lastMove = moves.length ? { from: moves[moves.length - 1].from, to: moves[moves.length - 1].to } : null;

  return { moves, lastMove, refetchMoves: fetchMoves };
}
