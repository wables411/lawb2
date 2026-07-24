import { dlog } from './utils/devLog';
// AppKit initialization for REOWN wallet connections

import { sankoMainnet, chainTransports } from './wagmi';
import { ENABLE_ONCHAIN_CHESS } from './config/lawbChessOnchain';

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
    dlog('[AppKit] Already initialized, skipping');
    return;
  }
  
  dlog('[AppKit] Loading AppKit modules');
  
  // Use dynamic imports to load AppKit modules
  Promise.all([
    import('@reown/appkit/react'),
    import('@reown/appkit/networks'),
    import('@reown/appkit-adapter-wagmi'),
    import('@reown/appkit-adapter-solana')
  ]).then(([appkitModule, networksModule, adapterModule, solanaAdapterModule]) => {
    const { createAppKit, getAppKit } = appkitModule;
    const { mainnet, arbitrum, base, solana, baseSepolia } = networksModule;
    const { WagmiAdapter } = adapterModule;
    const { SolanaAdapter } = solanaAdapterModule;

    // Base Sepolia only when the on-chain chess flag is on (keeps it out of the production wallet UX).
    const evmNetworks = ENABLE_ONCHAIN_CHESS
      ? [mainnet, arbitrum, base, sankoMainnet, baseSepolia]
      : [mainnet, arbitrum, base, sankoMainnet];

    dlog('[AppKit] Creating WagmiAdapter and AppKit');

    wagmiAdapter = new WagmiAdapter({
      projectId,
      networks: evmNetworks, // WagmiAdapter is EVM-only. Do not include Solana here.
      // Use OUR per-chain RPCs (adapter falls back to the Reown proxy automatically).
      // Without this, every read after the config swap went through rpc.walletconnect.org,
      // whose intermittent 400s froze live chess boards.
      transports: chainTransports,
      pendingTransactionsFilter: {
        enable: true,
        pollingInterval: 1000
      }
    });

    const solanaAdapter = new SolanaAdapter();

    appKit = createAppKit({
      projectId,
      metadata,
      adapters: [wagmiAdapter, solanaAdapter],
      networks: ENABLE_ONCHAIN_CHESS
        ? [mainnet, arbitrum, base, solana, sankoMainnet, baseSepolia]
        : [mainnet, arbitrum, base, solana, sankoMainnet],
      features: {
        analytics: false,
      },
      // enableWallets is the only valid wallet option per Reown docs
      // WagmiAdapter defaults enableWalletConnect and enableEIP6963 to true internally
      enableWallets: true,
      themeMode: 'light',
      themeVariables: {
        // Above every site layer — the Reef Run arcade root is fixed at z 2147483000,
        // which silently swallowed the modal ("Manage Wallet does nothing"). The wallet
        // modal must always be the topmost thing on the page.
        '--w3m-z-index': 2147483200,
        '--w3m-accent': '#000080',
        '--w3m-border-radius-master': '0px',
        '--w3m-font-family': 'MS Sans Serif, Arial, sans-serif'
      }
    });
    
    // Register AppKit with React component
    if (appKit && getAppKit) {
      getAppKit(appKit);
      dlog('[AppKit] AppKit registered with React');
    }
    
    dlog('[AppKit] AppKit initialized successfully');
  }).catch((error) => {
    console.error('[AppKit] Failed to load AppKit modules:', error);
  });
};

// Export with type assertions for TypeScript
export { wagmiAdapter, appKit };
