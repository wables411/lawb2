const RPC_TIMEOUT_MS = 12_000;

/** Public endpoints (browser-safe). Official api.mainnet-beta.solana.com often returns 403 from the public web. */
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

async function rpc(method: string, params: unknown[]): Promise<any> {
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
