// CRITICAL: Do NOT import @reown/appkit modules at the top level
// This causes WalletConnect to initialize even when we're in Base app
// Instead, we'll use dynamic imports only when NOT in Base app

import { sankoMainnet } from './wagmi';
import { isBaseMiniApp } from './utils/baseMiniapp';

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

// Delay check until after window is available to ensure proper detection
// Be very defensive - assume we're in Base app if ANY indicator suggests it
let isBase = false;
if (typeof window !== 'undefined') {
  isBase = isBaseMiniApp();
  console.log('[AppKit] isBaseMiniApp() =', isBase, 'window.location:', window.location.href, 'hostname:', window.location.hostname);
  
  // Additional safety check: if we're in an iframe or on farcaster domain, definitely don't load WalletConnect
  try {
    const inIframe = window.self !== window.top;
    const onFarcasterDomain = window.location.hostname.includes('farcaster.xyz') || window.location.hostname.includes('warpcast.com');
    if (inIframe || onFarcasterDomain) {
      isBase = true;
      console.log('[AppKit] Additional safety check: inIframe=', inIframe, 'onFarcasterDomain=', onFarcasterDomain, '-> forcing isBase=true');
    }
  } catch (e) {
    // Cross-origin iframe - definitely Base app
    isBase = true;
    console.log('[AppKit] Cross-origin iframe detected -> forcing isBase=true');
  }
}

// Type definitions for when modules are loaded
// Use any for dynamic imports to avoid type issues at compile time
// These will be properly typed at runtime when modules are loaded
let wagmiAdapter: any = null;
let appKit: any = null;

// Only load AppKit modules if NOT in Base app
// This prevents WalletConnect from initializing at all
// CRITICAL: Check isBase again right before import to ensure it's still false
if (!isBase && typeof window !== 'undefined') {
  // Double-check we're not in Base app before loading
  const doubleCheckBase = isBaseMiniApp();
  if (doubleCheckBase) {
    console.log('[AppKit] Base app detected during double-check, skipping AppKit load');
  } else {
    console.log('[AppKit] Loading AppKit modules (NOT in Base app)');
    
    // Use dynamic imports to prevent WalletConnect from loading in Base app
    // Wrap in try-catch to prevent any errors from propagating
    Promise.all([
      import('@reown/appkit/react'),
      import('@reown/appkit/networks'),
      import('@reown/appkit-adapter-wagmi')
    ]).then(([appkitModule, networksModule, adapterModule]) => {
    const { createAppKit } = appkitModule;
    const { mainnet, arbitrum, base, solana } = networksModule;
    const { WagmiAdapter } = adapterModule;
    
    console.log('[AppKit] Creating WagmiAdapter and AppKit (NOT in Base app)');
    
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
    
      console.log('[AppKit] AppKit initialized successfully');
    }).catch((error) => {
      console.error('[AppKit] Failed to load AppKit modules:', error);
    });
  }
} else {
  console.log('[AppKit] Skipping AppKit module loading (in Base app - using Farcaster connector)');
}

// Export with type assertions for TypeScript
// In Base app, appKit will be null - useAppKitSafe hook will handle this gracefully
export { wagmiAdapter, appKit };