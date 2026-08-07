import { createConfig, http } from 'wagmi';
import { fallback } from 'viem';
import { mainnet, arbitrum, base, baseSepolia } from 'wagmi/chains';
import { basePublicRpcHttpUrls } from './utils/baseRpcPublic';

// Custom Sanko networks
export const sankoTestnet = {
  id: 1992,
  name: 'Sanko Testnet',
  network: 'sanko-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tDMT',
    symbol: 'tDMT',
  },
  rpcUrls: {
    default: {
      http: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'],
    },
    public: {
      http: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SankoScan',
      url: 'https://testnet.sankoscan.io',
    },
  },
} as const;

export const sankoMainnet = {
  id: 1996,
  name: 'Sanko',
  network: 'sanko',
  nativeCurrency: {
    decimals: 18,
    name: 'DMT',
    symbol: 'DMT',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.sanko.xyz', 'https://sanko-mainnet.calderachain.xyz/http'],
    },
    public: {
      http: ['https://mainnet.sanko.xyz', 'https://sanko-mainnet.calderachain.xyz/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SankoScan',
      url: 'https://explorer.sanko.xyz',
    },
  },
} as const;

const viteRpc = (key: string): string | undefined => {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};

function mainnetFallbackTransport() {
  const urls = [
    viteRpc('VITE_MAINNET_RPC_URL'),
    'https://rpc.ankr.com/eth',
    'https://eth.blockscout.com/api/eth-rpc',
    // NB: eth.llamarpc.com removed — it rejects browser requests with a CORS
    // preflight failure, spamming the console with net::ERR_FAILED on every call.
  ].filter(Boolean) as string[];
  return urls.length === 1 ? http(urls[0]!, { batch: false }) : fallback(urls.map((u) => http(u, { batch: false })));
}

function baseFallbackTransport() {
  const urls = basePublicRpcHttpUrls();
  return urls.length === 1 ? http(urls[0]!, { batch: false }) : fallback(urls.map((u) => http(u, { batch: false })));
}

// Base Sepolia (testnet) — on-chain chess + reef jackpot testing. Primary RPC must be
// sepolia.base.org: it is the endpoint allowed by the prod CSP (publicnode was silently
// CSP-blocked, discovered live 2026-08-06 when the jackpot panel's reads all failed).
// VITE_ONCHAIN_CHESS_RPC lets a local dev point the transport at an anvil fork.
const baseSepoliaTransport = (() => {
  const override = viteRpc('VITE_ONCHAIN_CHESS_RPC');
  if (override) return http(override, { batch: false });
  return fallback([
    http('https://sepolia.base.org', { batch: false }),
    http('https://base-sepolia-rpc.publicnode.com', { batch: false }),
  ]);
})();

// Per-chain transports. Shared with appkit.ts: the app swaps to AppKit's OWN wagmi config
// after load (main.tsx), and without an explicit transports map the WagmiAdapter routes every
// read through Reown's RPC proxy (rpc.walletconnect.org), which intermittently 400s — seen
// live as chess boards freezing mid-game. Passing these makes our RPCs primary there too
// (the adapter keeps the Reown proxy as an automatic fallback).
export const chainTransports = {
  [mainnet.id]: mainnetFallbackTransport(),
  [arbitrum.id]: http(
    viteRpc('VITE_ARBITRUM_RPC_URL') ?? 'https://arb1.arbitrum.io/rpc',
    { batch: false },
  ),
  [base.id]: baseFallbackTransport(),
  [sankoTestnet.id]: http('https://sanko-arb-sepolia.rpc.caldera.xyz/http'),
  [sankoMainnet.id]: http('https://mainnet.sanko.xyz'),
  [baseSepolia.id]: baseSepoliaTransport,
} as const;

// Create wagmi config - AppKit's WagmiAdapter will add its own connectors
export const config = createConfig({
  chains: [mainnet, arbitrum, base, sankoTestnet, sankoMainnet, baseSepolia],
  connectors: [], // AppKit's WagmiAdapter will add its own connectors
  multiInjectedProviderDiscovery: true, // Enable EIP-6963 wallet discovery
  transports: chainTransports,
});

// Export all chains for use in appkit
export const allChains = [mainnet, arbitrum, base, sankoTestnet, sankoMainnet, baseSepolia];
