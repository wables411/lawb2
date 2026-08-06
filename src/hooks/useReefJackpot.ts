// Read/write hook for the ReefRunJackpot contract (REEFRUN_ONCHAIN_SPEC §7).
//
// INERT until VITE_REEF_JACKPOT is enabled: reads are disabled and the arcade menu
// never renders the jackpot tile, so the flag-off bundle does zero extra RPC.
// Same pattern as useOnchainChessActions.

import { useCallback } from 'react';
import { decodeEventLog } from 'viem';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import {
  ENABLE_REEF_JACKPOT,
  ERC20_ALLOWANCE_ABI,
  REEF_JACKPOT_ABI,
  getReefJackpotAddress,
  type ReefJackpotVerdict,
} from '../config/reefJackpotOnchain';

export type JackpotBoard = {
  pot: bigint;
  highScoreMs: number;
  champion: `0x${string}`;
  lastBeatenAt: number;
  entryAmount: bigint;
};

export type JackpotEntry = { nonce: number; seed: number };

export function useReefJackpot() {
  const chainId = useChainId();
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const contract = ENABLE_REEF_JACKPOT ? getReefJackpotAddress(chainId) : null;

  const boardRead = useReadContract({
    address: contract ?? undefined,
    abi: REEF_JACKPOT_ABI,
    functionName: 'jackpot',
    query: { enabled: Boolean(contract) },
  });

  const tokenRead = useReadContract({
    address: contract ?? undefined,
    abi: REEF_JACKPOT_ABI,
    functionName: 'entryToken',
    query: { enabled: Boolean(contract) },
  });

  const allowanceRead = useReadContract({
    address: (tokenRead.data as `0x${string}` | undefined) ?? undefined,
    abi: ERC20_ALLOWANCE_ABI,
    functionName: 'allowance',
    args: account && contract ? [account, contract] : undefined,
    query: { enabled: Boolean(contract && account && tokenRead.data) },
  });

  const balanceRead = useReadContract({
    address: (tokenRead.data as `0x${string}` | undefined) ?? undefined,
    abi: ERC20_ALLOWANCE_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: Boolean(contract && account && tokenRead.data) },
  });

  const board: JackpotBoard | null = boardRead.data
    ? {
        pot: boardRead.data[0],
        highScoreMs: Number(boardRead.data[1]),
        champion: boardRead.data[2],
        lastBeatenAt: Number(boardRead.data[3]),
        entryAmount: boardRead.data[4],
      }
    : null;

  const refresh = useCallback(() => {
    void boardRead.refetch();
    void allowanceRead.refetch();
    void balanceRead.refetch();
  }, [boardRead, allowanceRead, balanceRead]);

  /**
   * Pay the entry (approving first if needed) and return the contract-assigned
   * run seed + entry nonce, parsed from the Entered event.
   */
  const enterJackpot = useCallback(async (): Promise<JackpotEntry> => {
    if (!contract) throw new Error('jackpot not deployed on this chain');
    if (!account) throw new Error('connect a wallet first');
    if (!publicClient) throw new Error('no rpc client');
    const token = tokenRead.data as `0x${string}` | undefined;
    if (!token) throw new Error('entry token unknown (still loading?)');
    const entryAmount = board?.entryAmount;
    if (!entryAmount) throw new Error('entry amount unknown (still loading?)');

    const allowance = (allowanceRead.data as bigint | undefined) ?? 0n;
    if (allowance < entryAmount) {
      const approveHash = await writeContractAsync({
        address: token,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: 'approve',
        args: [contract, entryAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const enterHash = await writeContractAsync({
      address: contract,
      abi: REEF_JACKPOT_ABI,
      functionName: 'enter',
      args: [],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: enterHash });
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contract.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: REEF_JACKPOT_ABI, data: log.data, topics: log.topics });
        if (decoded.eventName === 'Entered') {
          const args = decoded.args as { nonce: bigint; seed: number };
          refresh();
          return { nonce: Number(args.nonce), seed: Number(args.seed) };
        }
      } catch {
        // not our event — keep scanning
      }
    }
    throw new Error('entered, but Entered event not found in receipt');
  }, [contract, account, publicClient, tokenRead.data, board?.entryAmount, allowanceRead.data, writeContractAsync, refresh]);

  /**
   * Submit the validator-signed score on-chain. Returns whether the run took the pot
   * (parsed from ScoreSubmitted/JackpotWon in the receipt).
   */
  const submitJackpotScore = useCallback(
    async (v: ReefJackpotVerdict): Promise<{ won: boolean; payout: bigint | null }> => {
      if (!contract) throw new Error('jackpot not deployed on this chain');
      if (!publicClient) throw new Error('no rpc client');
      const hash = await writeContractAsync({
        address: contract,
        abi: REEF_JACKPOT_ABI,
        functionName: 'submitScore',
        args: [BigInt(v.survivalMs), BigInt(v.entryNonce), v.seed, BigInt(v.deadline), v.signature],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      let won = false;
      let payout: bigint | null = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== contract.toLowerCase()) continue;
        try {
          const decoded = decodeEventLog({ abi: REEF_JACKPOT_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === 'ScoreSubmitted') won = (decoded.args as { won: boolean }).won;
          if (decoded.eventName === 'JackpotWon') payout = (decoded.args as { payout: bigint }).payout;
        } catch {
          // not our event
        }
      }
      refresh();
      return { won, payout };
    },
    [contract, publicClient, writeContractAsync, refresh],
  );

  return {
    enabled: ENABLE_REEF_JACKPOT,
    contract,
    chainId,
    account: account ?? null,
    board,
    token: (tokenRead.data as `0x${string}` | undefined) ?? null,
    balance: (balanceRead.data as bigint | undefined) ?? null,
    boardLoading: boardRead.isLoading,
    enterJackpot,
    submitJackpotScore,
    refresh,
  };
}
