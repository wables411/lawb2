import { fallback, http, type Transport } from 'viem';

function viteBaseRpcEnv(): string {
  return typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_RPC_URL
    ? String(import.meta.env.VITE_BASE_RPC_URL).trim()
    : '';
}

/**
 * Same host order as {@link basePublicFallbackTransport} — for ethers `JsonRpcProvider` loops.
 * Hosts must appear in `_headers` connect-src.
 */
export function basePublicRpcHttpUrls(): string[] {
  const env = viteBaseRpcEnv();
  return [
    ...(env ? [env] : []),
    'https://mainnet.base.org',
    'https://base.gateway.tenderly.co',
    'https://rpc.ankr.com/base',
    'https://base.drpc.org',
  ];
}

/**
 * Public Base HTTP endpoints for read-only viem clients (Uniswap scans, token balances).
 * Order: optional paid/env URL first, then free endpoints; put drpc last (often rate-limits `eth_getLogs`).
 */
export function basePublicFallbackTransport(): Transport {
  const urls = basePublicRpcHttpUrls();
  return fallback(urls.map((url) => http(url, { batch: false })));
}
