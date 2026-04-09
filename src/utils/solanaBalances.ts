const RPC_TIMEOUT_MS = 12_000;

/** Same-origin Netlify function — avoids CSP blocks on public RPC hostnames and browser 403 on api.mainnet-beta.solana.com. */
const SOLANA_RPC_PROXY = '/.netlify/functions/solana-rpc';

/** Direct fallbacks for local Vite (no functions) or if the proxy errors. Many hosts are not in connect-src; production should rely on the proxy. */
const DEFAULT_SOLANA_RPC_URLS = [
  'https://solana.publicnode.com',
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
];

function solanaRpcUrlList(): string[] {
  const custom = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
  const list = custom ? [custom, ...DEFAULT_SOLANA_RPC_URLS] : [...DEFAULT_SOLANA_RPC_URLS];
  return [...new Set(list)];
}

export const CLAWB_SOL_MINT = 'A2bt3Mwrn9fxGFLTA3UT7dt8WMcR7tABKih4fyuiMTWn';
export const LAWB_SOL_MINT = '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6';

async function rpcDirect(method: string, params: unknown[]): Promise<any> {
  let lastError: Error | null = null;
  for (const rpcUrl of solanaRpcUrlList()) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message || 'Solana RPC error');
      }
      return json.result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error('Solana RPC failed');
}

async function rpc(method: string, params: unknown[]): Promise<any> {
  try {
    const res = await fetch(SOLANA_RPC_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });
    const json = await res.json();
    if (json.error) {
      throw new Error(json.error.message || 'Solana RPC error');
    }
    if (!res.ok) {
      throw new Error(`Solana RPC proxy HTTP ${res.status}`);
    }
    return json.result;
  } catch (proxyErr) {
    if (import.meta.env.DEV) {
      console.warn('[SOLANA] Proxy unavailable or failed, using direct RPC:', proxyErr);
    } else {
      console.warn('[SOLANA] Proxy failed, trying direct RPC (may be blocked by CSP):', proxyErr);
    }
    return rpcDirect(method, params);
  }
}

export async function fetchSolBalance(address: string): Promise<number> {
  try {
    const result = await rpc('getBalance', [address]);
    return (result?.value ?? 0) / 1e9;
  } catch (err) {
    console.error('[SOLANA] Failed to fetch SOL balance:', err);
    return 0;
  }
}

export async function fetchSplTokenBalance(
  walletAddress: string,
  mintAddress: string,
  decimals: number = 6,
): Promise<number> {
  try {
    const result = await rpc('getTokenAccountsByOwner', [
      walletAddress,
      { mint: mintAddress },
      { encoding: 'jsonParsed' },
    ]);
    const accounts: any[] = result?.value ?? [];
    let total = 0;
    for (const acct of accounts) {
      const info = acct?.account?.data?.parsed?.info;
      if (info?.tokenAmount?.uiAmount != null) {
        total += info.tokenAmount.uiAmount;
      } else if (info?.tokenAmount?.amount) {
        total += Number(info.tokenAmount.amount) / 10 ** decimals;
      }
    }
    return total;
  } catch (err) {
    console.error(`[SOLANA] Failed to fetch SPL balance (${mintAddress}):`, err);
    return 0;
  }
}

export interface SolanaBalances {
  sol: number;
  clawb: number;
  lawb: number;
}

export async function fetchAllSolanaBalances(address: string): Promise<SolanaBalances> {
  const [sol, clawb, lawb] = await Promise.all([
    fetchSolBalance(address),
    fetchSplTokenBalance(address, CLAWB_SOL_MINT, 6),
    fetchSplTokenBalance(address, LAWB_SOL_MINT, 6),
  ]);
  return { sol, clawb, lawb };
}
