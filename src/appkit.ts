import { createAppKit } from '@reown/appkit/react';
import { mainnet, arbitrum, solana } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sankoMainnet } from './wagmi';

const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';

// Use the actual origin at runtime - this ensures exact domain matching for WalletConnect verification
// For production, always use https://lawb.xyz to match dashboard configuration
const baseUrl = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://lawb.xyz';

const metadata = {
  name: 'Lawb.xyz',
  description: 'there is no meme we lawb you',
  url: baseUrl,
  icons: [`${baseUrl}/assets/favicon.ico`]
};

// Create wagmi adapter with main networks
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [
    // WagmiAdapter is EVM-only. Do not include Solana here.
    mainnet,
    arbitrum,
    sankoMainnet
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
    sankoMainnet
  ],
  features: {
    analytics: false,
  },
  // enableWallets is the only valid wallet option per Reown docs
  // WagmiAdapter defaults enableWalletConnect and enableEIP6963 to true internally
  enableWallets: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 9999,
    '--w3m-accent': '#000080',
    '--w3m-border-radius-master': '0px',
    '--w3m-font-family': 'MS Sans Serif, Arial, sans-serif'
  }
});