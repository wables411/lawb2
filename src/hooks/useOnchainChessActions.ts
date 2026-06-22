// Write-path hook for the LawbChess on-chain contract (Phase 4).
//
// INERT until VITE_ONCHAIN_CHESS is enabled (ENABLE_ONCHAIN_CHESS). Nothing in the live
// tree calls these yet; the Firebase PvP path is untouched. Each action is user-triggered,
// so when the flag is off (or the contract isn't deployed on the active chain) the action
// throws a clear error rather than silently no-op'ing.
//
// Move submission supports both paths from the spec (§6):
//   - makeMove: the connected wallet signs each move tx directly (works with no relayer).
//   - registerMoveKey + signMoveWithKey (utils/lawbChessMoves) -> a relayer submits
//     makeMoveBySig for the popup-free path. The relayer is a separate service (not here).

import { useCallback } from 'react';
import { useChainId, useWriteContract } from 'wagmi';
import { ENABLE_ONCHAIN_CHESS, LAWB_CHESS_ABI, getLawbChessAddress } from '../config/lawbChessOnchain';
import { WagerKind } from '../utils/lawbChessBoard';
import type { GameCode } from '../utils/lawbChessMoves';

// Minimal approval ABIs (escrow pulls require prior approval for ERC20/721/1155).
const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const ERC721_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

const SET_APPROVAL_FOR_ALL_ABI = [
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

export interface CreateGameParams {
  code: GameCode;
  baseTimeSec: number;
  incrementSec: number;
}

export interface CreateFungibleParams extends CreateGameParams {
  /** NATIVE or ERC20 */
  kind: typeof WagerKind.NATIVE | typeof WagerKind.ERC20;
  /** address(0) for native, token address for ERC20 */
  token: `0x${string}`;
  wager: bigint;
}

export interface CreateErc721Params extends CreateGameParams {
  nft: `0x${string}`;
  tokenId: bigint;
}

export interface CreateErc1155Params extends CreateGameParams {
  nft: `0x${string}`;
  tokenId: bigint;
  quantity: bigint;
}

type Hash = `0x${string}`;

export function useOnchainChessActions() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, isError, error, reset } = useWriteContract();

  const resolve = useCallback((): `0x${string}` => {
    if (!ENABLE_ONCHAIN_CHESS) throw new Error('on-chain chess is disabled (VITE_ONCHAIN_CHESS)');
    const address = getLawbChessAddress(chainId);
    if (!address) throw new Error(`LawbChess not deployed on chain ${chainId}`);
    return address;
  }, [chainId]);

  const write = useCallback(
    (functionName: string, args: readonly unknown[], value?: bigint): Promise<Hash> => {
      const address = resolve();
      return writeContractAsync({
        address,
        abi: LAWB_CHESS_ABI,
        functionName: functionName as never,
        args: args as never,
        ...(value !== undefined ? { value } : {}),
      });
    },
    [resolve, writeContractAsync],
  );

  // ---- approvals (call before create/join for token/NFT wagers) ----
  const approveErc20 = useCallback(
    (token: `0x${string}`, amount: bigint) =>
      writeContractAsync({
        address: token,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [resolve(), amount],
      }),
    [resolve, writeContractAsync],
  );

  const approveErc721 = useCallback(
    (nft: `0x${string}`, tokenId: bigint) =>
      writeContractAsync({
        address: nft,
        abi: ERC721_APPROVE_ABI,
        functionName: 'approve',
        args: [resolve(), tokenId],
      }),
    [resolve, writeContractAsync],
  );

  const setNftApprovalForAll = useCallback(
    (nft: `0x${string}`, approved = true) =>
      writeContractAsync({
        address: nft,
        abi: SET_APPROVAL_FOR_ALL_ABI,
        functionName: 'setApprovalForAll',
        args: [resolve(), approved],
      }),
    [resolve, writeContractAsync],
  );

  // ---- create ----
  const createGame = useCallback(
    (p: CreateFungibleParams) =>
      write(
        'createGame',
        [p.code, p.kind, p.token, p.wager, p.baseTimeSec, p.incrementSec],
        p.kind === WagerKind.NATIVE ? p.wager : 0n,
      ),
    [write],
  );

  const createGameERC721 = useCallback(
    (p: CreateErc721Params) =>
      write('createGameERC721', [p.code, p.nft, p.tokenId, p.baseTimeSec, p.incrementSec]),
    [write],
  );

  const createGameERC1155 = useCallback(
    (p: CreateErc1155Params) =>
      write('createGameERC1155', [p.code, p.nft, p.tokenId, p.quantity, p.baseTimeSec, p.incrementSec]),
    [write],
  );

  // ---- join (wager terms come from the open game; native value must equal the stake) ----
  const joinGame = useCallback(
    (code: GameCode, nativeValue?: bigint) => write('joinGame', [code], nativeValue ?? 0n),
    [write],
  );

  const joinGameERC721 = useCallback(
    (code: GameCode, tokenId: bigint) => write('joinGameERC721', [code, tokenId]),
    [write],
  );

  const joinGameERC1155 = useCallback(
    (code: GameCode, tokenId: bigint) => write('joinGameERC1155', [code, tokenId]),
    [write],
  );

  // ---- play ----
  const makeMove = useCallback(
    (code: GameCode, from: number, to: number, promo = 0) =>
      write('makeMove', [code, from, to, promo]),
    [write],
  );

  const makeMoveBySig = useCallback(
    (code: GameCode, from: number, to: number, promo: number, nonce: bigint, sig: `0x${string}`) =>
      write('makeMoveBySig', [code, from, to, promo, nonce, sig]),
    [write],
  );

  const registerMoveKey = useCallback(
    (code: GameCode, moveKey: `0x${string}`) => write('registerMoveKey', [code, moveKey]),
    [write],
  );

  const resign = useCallback((code: GameCode) => write('resign', [code]), [write]);
  const cancelGame = useCallback((code: GameCode) => write('cancelGame', [code]), [write]);
  const claimTimeout = useCallback((code: GameCode) => write('claimTimeout', [code]), [write]);
  const withdrawPending = useCallback(() => write('withdrawPending', []), [write]);

  return {
    // approvals
    approveErc20,
    approveErc721,
    setNftApprovalForAll,
    // create
    createGame,
    createGameERC721,
    createGameERC1155,
    // join
    joinGame,
    joinGameERC721,
    joinGameERC1155,
    // play
    makeMove,
    makeMoveBySig,
    registerMoveKey,
    resign,
    cancelGame,
    claimTimeout,
    withdrawPending,
    // tx status (from the most recent write)
    hash,
    isPending,
    isError,
    error: (error as Error) ?? null,
    reset,
  };
}
