import { createAppKit } from '@reown/appkit/react';
import { mainnet, arbitrum, solana } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sankoMainnet } from './wagmi';

const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';

const metadata = {
  name: 'Lawb.xyz',
  description: 'Windows 98-style NFT site',
  url: import.meta.env.DEV ? 'http://localhost:3000' : 'https://lawb.xyz',
  icons: ['/assets/favicon.ico']
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
  // Explicitly enable connector discovery/QR & EIP-6963 for desktop extensions
  enableInjected: true,
  enableWalletConnect: true,
  enableEIP6963: true,
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
  // Explicitly enable wallets/connectors to avoid undefined option reads in adapter
  enableWallets: true,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 9999,
    '--w3m-accent': '#000080',
    '--w3m-border-radius-master': '0px',
    '--w3m-font-family': 'MS Sans Serif, Arial, sans-serif'
  }
});