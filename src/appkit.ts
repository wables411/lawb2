// AppKit initialization for REOWN wallet connections

import { sankoMainnet } from './wagmi';

const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';

// Static URL ensures exact match with Reown Dashboard configuration
// This URL must match exactly what's configured in https://dashboard.reown.com
const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://lawb.xyz';

const metadata = {
  name: 'Lawb.xyz',
  description: 'there is no meme we lawb you',
  url: baseUrl,
  icons: [`${baseUrl}/assets/favicon.ico`]
};

// Type definitions for when modules are loaded
let wagmiAdapter: any = null;
let appKit: any = null;

// Initialize AppKit for wallet connections
export const initializeAppKit = () => {
  // Check if already initialized
  if (appKit || wagmiAdapter) {
    console.log('[AppKit] Already initialized, skipping');
    return;
  }
  
  console.log('[AppKit] Loading AppKit modules');
  
  // Use dynamic imports to load AppKit modules
  Promise.all([
    import('@reown/appkit/react'),
    import('@reown/appkit/networks'),
    import('@reown/appkit-adapter-wagmi')
  ]).then(([appkitModule, networksModule, adapterModule]) => {
    const { createAppKit, getAppKit } = appkitModule;
    const { mainnet, arbitrum, base, solana } = networksModule;
    const { WagmiAdapter } = adapterModule;
    
    console.log('[AppKit] Creating WagmiAdapter and AppKit');
    
    wagmiAdapter = new WagmiAdapter({
      projectId,
      networks: [
        // WagmiAdapter is EVM-only. Do not include Solana here.
        mainnet,
        arbitrum,
        base,
        sankoMainnet
      ],
      pendingTransactionsFilter: {
        enable: true,
        pollingInterval: 1000
      }
    });

    appKit = createAppKit({
      projectId,
      metadata,
      adapters: [wagmiAdapter],
      networks: [
        mainnet,
        arbitrum,
        base,
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
    
    // Register AppKit with React component
    if (appKit && getAppKit) {
      getAppKit(appKit);
      console.log('[AppKit] AppKit registered with React');
    }
    
    console.log('[AppKit] AppKit initialized successfully');
  }).catch((error) => {
    console.error('[AppKit] Failed to load AppKit modules:', error);
  });
};

// Export with type assertions for TypeScript
export { wagmiAdapter, appKit };
