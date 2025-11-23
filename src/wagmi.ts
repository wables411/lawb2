import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';

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

// Create wagmi config with Sanko networks
export const config = createConfig({
  chains: [mainnet, arbitrum, sankoTestnet, sankoMainnet],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [sankoTestnet.id]: http('https://sanko-arb-sepolia.rpc.caldera.xyz/http'),
    [sankoMainnet.id]: http('https://mainnet.sanko.xyz'),
  },
});

// Export all chains for use in appkit
export const allChains = [mainnet, arbitrum, sankoTestnet, sankoMainnet]; 