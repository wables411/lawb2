import { createAppKit } from '@reown/appkit/react';
import { mainnet, arbitrum } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';

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

// Set up Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter();

export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, arbitrum, sankoTestnet], // Add Arbitrum mainnet
  projectId,
  ssr: false
});

createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  networks: [mainnet, arbitrum, sankoTestnet, solana, solanaTestnet, solanaDevnet], // Add Arbitrum mainnet
  projectId,
  metadata,
  features: {
    analytics: false
  }
}); 