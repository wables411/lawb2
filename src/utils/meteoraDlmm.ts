import { METEORA_CLAWB_LAWB_POOL } from '../config/lpPools';

export function meteoraProxyUrl(pathAndQuery: string): string {
  return `/.netlify/functions/meteora-dlmm?path=${encodeURIComponent(pathAndQuery)}`;
}

export async function fetchMeteoraPoolJson(poolAddress: string = METEORA_CLAWB_LAWB_POOL): Promise<unknown> {
  const r = await fetch(meteoraProxyUrl(`/pools/${poolAddress}`), { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Meteora pool HTTP ${r.status}`);
  return r.json();
}

export async function fetchMeteoraUserPnlJson(
  poolAddress: string,
  solanaUser: string,
  status: 'open' | 'closed' = 'open',
): Promise<unknown> {
  const q = `?user=${encodeURIComponent(solanaUser)}&status=${encodeURIComponent(status)}`;
  const r = await fetch(meteoraProxyUrl(`/positions/${poolAddress}/pnl${q}`), {
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Meteora pnl HTTP ${r.status}`);
  return r.json();
}
