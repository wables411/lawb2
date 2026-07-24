// Read-only hook for LawbChess on-chain game state (Phase 4 read path).
//
// INERT until VITE_ONCHAIN_CHESS is enabled (ENABLE_ONCHAIN_CHESS) AND the contract is
// deployed on the active chain. Until then `enabled` is false and no RPC call is made.
//
// Pull-based on purpose: NO refetchInterval / NO event listeners here (bandwidth + Netlify
// guardrails, LAWBCHESS_HANDOFF.md §7). Live updates come later via the write path / relayer.
// The live Firebase PvP path is untouched.

import { useCallback, useMemo } from 'react';
import { useChainId, useReadContract } from 'wagmi';
import { ENABLE_ONCHAIN_CHESS, LAWB_CHESS_ABI, getLawbChessAddress } from '../config/lawbChessOnchain';
import {
  decodeOnchainBoard,
  parseGameTuple,
  type ChessBoard,
  type OnchainGame,
} from '../utils/lawbChessBoard';

/** A valid game code is a bytes6 hex string: 0x + 12 hex chars. */
function isValidCode(code: string | undefined): code is `0x${string}` {
  return typeof code === 'string' && /^0x[0-9a-fA-F]{12}$/.test(code);
}

export interface UseOnchainChessGameResult {
  /** Parsed contract game struct, or null when unavailable. */
  game: OnchainGame | null;
  /** Decoded 8x8 board (live (string|null)[][] convention), or null when unavailable. */
  board: ChessBoard | null;
  /** The LawbChess proxy address used, or null if not deployed on this chain. */
  contractAddress: `0x${string}` | null;
  isEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Read a single on-chain chess game by its bytes6 code.
 * @param code    bytes6 game code (0x + 12 hex chars), or undefined to disable.
 * @param chainId optional override; defaults to the connected chain.
 */
export function useOnchainChessGame(
  code: `0x${string}` | string | undefined,
  chainId?: number,
): UseOnchainChessGameResult {
  const connectedChainId = useChainId();
  const effectiveChainId = chainId ?? connectedChainId;
  const contractAddress = getLawbChessAddress(effectiveChainId);
  const validCode = isValidCode(code) ? code : undefined;

  const isEnabled = ENABLE_ONCHAIN_CHESS && !!contractAddress && !!validCode;

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: contractAddress ?? undefined,
    abi: LAWB_CHESS_ABI,
    functionName: 'games',
    args: validCode ? [validCode] : undefined,
    chainId: effectiveChainId,
    query: {
      enabled: isEnabled,
    },
  });

  const game = useMemo<OnchainGame | null>(() => {
    if (!data) return null;
    // wagmi/viem returns the multi-output `games` getter as a positional tuple.
    return parseGameTuple(data as Parameters<typeof parseGameTuple>[0]);
  }, [data]);

  const board = useMemo<ChessBoard | null>(
    () => (game ? decodeOnchainBoard(game.board) : null),
    [game],
  );

  // STABLE identity (react-query's refetch already is). The game screen's wait-poll
  // effect depends on this function; an unstable identity made the clock's 1s re-render
  // reset the 4s interval forever, so opponents' moves never appeared during a live game.
  const stableRefetch = useCallback(() => { void refetch(); }, [refetch]);

  return {
    game,
    board,
    contractAddress,
    isEnabled,
    isLoading: isEnabled && isLoading,
    isError,
    error: (error as Error) ?? null,
    refetch: stableRefetch,
  };
}
