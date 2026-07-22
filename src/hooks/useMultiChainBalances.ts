import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAllSolanaBalances, type SolanaBalances } from '../utils/solanaBalances';

const LAWB_ARB_ADDRESS = '0x741f8FbF42485E772D97f1955c31a5B8098aC962';

const ARB_RPCS = ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.llamarpc.com'];

const ERC20_BALANCE_SELECTOR = '0x70a08231';
const RPC_TIMEOUT = 12_000;
// Token balances move slowly; a 5-minute cadence is plenty and keeps idle/background
// tabs from hammering the Solana/EVM RPC proxies 24/7.
const POLL_INTERVAL = 300_000;

async function fetchErc20Balance(
  rpcUrls: string[],
  tokenAddress: string,
  walletAddress: string,
  decimals: number,
): Promise<number> {
  const paddedWallet = '0x' + walletAddress.replace('0x', '').toLowerCase().padStart(64, '0');
  const data = ERC20_BALANCE_SELECTOR + paddedWallet.slice(2);

  for (const rpcUrl of rpcUrls) {
    try {
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

      if (!res.ok) {
        // Try next RPC endpoint on rate limit / transient endpoint failures.
        continue;
      }

      const json = await res.json();
      if (!json.result || json.result === '0x') return 0;
      const raw = BigInt(json.result);
      return Number(raw) / 10 ** decimals;
    } catch {
      // Swallow and try the next endpoint.
      continue;
    }
  }

  return 0;
}

export interface MultiChainBalances {
  lawbSol: number;
  lawbArb: number;
  sol: number;
  loading: boolean;
  error: string | null;
}

const EMPTY: MultiChainBalances = {
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
      const [lawbArb, solBalances] = await Promise.all([
        evmAddress
          ? fetchErc20Balance(ARB_RPCS, LAWB_ARB_ADDRESS, evmAddress, 6)
          : Promise.resolve(0),
        solanaAddress
          ? fetchAllSolanaBalances(solanaAddress)
          : Promise.resolve({ sol: 0, clawb: 0, lawb: 0 } as SolanaBalances),
      ]);

      if (!mountedRef.current) return;
      setBalances({
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

    const startPolling = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => void fetchAll(), POLL_INTERVAL);
    };
    const stopPolling = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };

    // Only poll while the tab is visible. A backgrounded/forgotten tab should not
    // keep hitting the RPC proxies — that drip runs 24/7 even with no real user.
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        void fetchAll();
        startPolling();
      }
    };

    setBalances((prev) => ({ ...prev, loading: true }));

    if (!document.hidden) {
      void fetchAll();
      startPolling();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchAll]);

  return balances;
}
