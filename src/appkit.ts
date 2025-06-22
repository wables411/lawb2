import { createAppKit } from '@reown/appkit/react';
import { mainnet } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';

const metadata = {
  name: 'Lawb.xyz',
  description: 'Windows 98-style NFT site',
  url: import.meta.env.DEV ? 'http://localhost:3000' : 'https://lawb.xyz',
  icons: ['/assets/favicon.ico']
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet],
  projectId,
  ssr: false
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet],
  projectId,
  metadata,
  features: {
    analytics: false
  }
}); 