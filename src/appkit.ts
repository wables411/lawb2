import { createAppKit } from '@reown/appkit/react';
import { mainnet } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Sanko testnet configuration
export const sankoTestnet = {
  id: 1992,
  name: 'Sanko Testnet',
  network: 'sanko',
  nativeCurrency: {
    decimals: 18,
    name: 'tDMT',
    symbol: 'tDMT',
  },
  rpcUrls: {
    public: { http: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'] },
    default: { http: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'] },
  },
  blockExplorers: {
    default: { name: 'SankoScan', url: 'https://sanko-scan.caldera.xyz' },
  },
} as const;

const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';

const metadata = {
  name: 'Lawb.xyz',
  description: 'Windows 98-style NFT site',
  url: import.meta.env.DEV ? 'http://localhost:3000' : 'https://lawb.xyz',
  icons: ['/assets/favicon.ico']
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, sankoTestnet], // Add Sanko Testnet
  projectId,
  ssr: false
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sankoTestnet], // Add Sanko Testnet
  projectId,
  metadata,
  features: {
    analytics: false
  }
}); 