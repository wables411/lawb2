import { createAppKit } from '@reown/appkit/react';
import { mainnet, arbitrum, solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';

const metadata = {
  name: 'Lawb.xyz',
  description: 'Windows 98-style NFT site',
  url: import.meta.env.DEV ? 'http://localhost:3000' : 'https://lawb.xyz',
  icons: ['/assets/favicon.ico']
};

// Create wagmi adapter - it will use the wagmi config from main.tsx
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [
    mainnet,
    arbitrum,
    solana,
    solanaTestnet,
    solanaDevnet
  ],
  pendingTransactionsFilter: {
    enable: true,
    pollingInterval: 1000
  }
});

export const appKit = createAppKit({
  projectId,
  metadata,
  adapters: [wagmiAdapter],
  networks: [
    mainnet,
    arbitrum,
    solana,
    solanaTestnet,
    solanaDevnet
  ],
  features: {
    analytics: true,
  },
}); 