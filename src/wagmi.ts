import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum, base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { isBaseMiniApp } from './utils/baseMiniapp';

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

// Get RPC URLs from environment variables or use public endpoints
const getRpcUrl = (chainId: number, defaultUrls: string[]): string => {
  // Check for environment variable first (e.g., VITE_MAINNET_RPC_URL, VITE_BASE_RPC_URL)
  const envKey = `VITE_${chainId === 1 ? 'MAINNET' : chainId === 8453 ? 'BASE' : chainId === 42161 ? 'ARBITRUM' : 'RPC'}_RPC_URL`;
  const envUrl = import.meta.env[envKey];
  if (envUrl) return envUrl;
  
  // Use first default URL as fallback
  return defaultUrls[0];
};

// Create wagmi config with Sanko networks
// When in Base/Farcaster app, use Farcaster's native wallet connector
// Otherwise, AppKit will handle connectors via WagmiAdapter
const connectors = isBaseMiniApp() 
  ? [farcasterMiniApp()] 
  : []; // AppKit's WagmiAdapter will add its own connectors

export const config = createConfig({
  chains: [mainnet, arbitrum, base, sankoTestnet, sankoMainnet],
  connectors,
  transports: {
    [mainnet.id]: http(getRpcUrl(mainnet.id, ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'])),
    [arbitrum.id]: http(getRpcUrl(arbitrum.id, ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum'])),
    [base.id]: http(getRpcUrl(base.id, ['https://mainnet.base.org', 'https://base.llamarpc.com'])),
    [sankoTestnet.id]: http('https://sanko-arb-sepolia.rpc.caldera.xyz/http'),
    [sankoMainnet.id]: http('https://mainnet.sanko.xyz'),
  },
});

// Export all chains for use in appkit
export const allChains = [mainnet, arbitrum, base, sankoTestnet, sankoMainnet]; 