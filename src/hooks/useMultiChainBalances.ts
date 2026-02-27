import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAllSolanaBalances, type SolanaBalances } from '../utils/solanaBalances';

const CLAWB_BASE_ADDRESS = '0x26a43bd8a28a0423afb5725b8242ec0a40947b07';
const LAWB_ARB_ADDRESS = '0x741f8FbF42485E772D97f1955c31a5B8098aC962';

const BASE_RPC = 'https://mainnet.base.org';
const ARB_RPC = 'https://arb1.arbitrum.io/rpc';

const ERC20_BALANCE_SELECTOR = '0x70a08231';
const RPC_TIMEOUT = 12_000;
const POLL_INTERVAL = 60_000;

async function fetchErc20Balance(
  rpcUrl: string,
  tokenAddress: string,
  walletAddress: string,
  decimals: number,
): Promise<number> {
  try {
    const paddedWallet = '0x' + walletAddress.replace('0x', '').toLowerCase().padStart(64, '0');
    const data = ERC20_BALANCE_SELECTOR + paddedWallet.slice(2);
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
      }),
      signal: AbortSignal.timeout(RPC_TIMEOUT),
    });
    const json = await res.json();
    if (!json.result || json.result === '0x') return 0;
    const raw = BigInt(json.result);
    return Number(raw) / 10 ** decimals;
  } catch (err) {
    console.error(`[EVM] Balance fetch failed (${tokenAddress} on ${rpcUrl}):`, err);
    return 0;
  }
}

export interface MultiChainBalances {
  clawbBase: number;
  clawbSol: number;
  lawbSol: number;
  lawbArb: number;
  sol: number;
  loading: boolean;
  error: string | null;
}

const EMPTY: MultiChainBalances = {
  clawbBase: 0,
  clawbSol: 0,
  lawbSol: 0,
  lawbArb: 0,
  sol: 0,
  loading: false,
  error: null,
};

export function useMultiChainBalances(
  evmAddress?: string,
  solanaAddress?: string,
): MultiChainBalances {
  const [balances, setBalances] = useState<MultiChainBalances>({ ...EMPTY, loading: true });
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchAll = useCallback(async () => {
    if (!evmAddress && !solanaAddress) {
      setBalances(EMPTY);
      return;
    }

    try {
      const [clawbBase, lawbArb, solBalances] = await Promise.all([
        evmAddress
          ? fetchErc20Balance(BASE_RPC, CLAWB_BASE_ADDRESS, evmAddress, 18)
          : Promise.resolve(0),
        evmAddress
          ? fetchErc20Balance(ARB_RPC, LAWB_ARB_ADDRESS, evmAddress, 6)
          : Promise.resolve(0),
        solanaAddress
          ? fetchAllSolanaBalances(solanaAddress)
          : Promise.resolve({ sol: 0, clawb: 0, lawb: 0 } as SolanaBalances),
      ]);

      if (!mountedRef.current) return;
      setBalances({
        clawbBase,
        clawbSol: solBalances.clawb,
        lawbSol: solBalances.lawb,
        lawbArb,
        sol: solBalances.sol,
        loading: false,
        error: null,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setBalances((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch balances',
      }));
    }
  }, [evmAddress, solanaAddress]);

  useEffect(() => {
    mountedRef.current = true;
    setBalances((prev) => ({ ...prev, loading: true }));
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  return balances;
}
