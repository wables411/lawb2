import { fallback, http, type Transport } from 'viem';

/**
 * Public Base HTTP endpoints for read-only viem clients (Uniswap scans, token balances).
 * Order: optional paid/env URL first, then free endpoints; put drpc last (often rate-limits `eth_getLogs`).
 */
export function basePublicFallbackTransport(): Transport {
  const env =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_RPC_URL
      ? String(import.meta.env.VITE_BASE_RPC_URL).trim()
      : '';
  // Hosts must appear in `_headers` connect-src (production blocks e.g. 1rpc / publicnode).
  const urls = [
    ...(env ? [env] : []),
    'https://mainnet.base.org',
    'https://base.gateway.tenderly.co',
    'https://rpc.ankr.com/base',
    'https://base.drpc.org',
  ];
  return fallback(urls.map((url) => http(url, { batch: false })));
}
