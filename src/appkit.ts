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

// CRITICAL: Do NOT check isBaseMiniApp() at module load time
// The check happens too early and may fail to detect iframe properly
// Instead, we'll check it lazily when actually needed
// This prevents AppKit from loading in Base/Farcaster app

// Function to check if we're in Base app - call this when needed, not at module load
const checkIsBaseApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // PRIMARY: Check iframe first (most reliable)
  try {
    if (window.self !== window.top) {
      console.log('[AppKit] ✅ Detected Base app via iframe');
      return true;
    }
  } catch (e) {
    // Cross-origin iframe - definitely Base app
    console.log('[AppKit] ✅ Detected Base app via cross-origin iframe');
    return true;
  }
  
  // Use the comprehensive detection from baseMiniapp.ts
  const isBase = isBaseMiniApp();
  
  if (isBase) {
    console.log('[AppKit] ✅ Detected Base app via baseMiniapp detection');
  } else {
    console.log('[AppKit] ❌ Not in Base app - will load AppKit');
  }
  
  return isBase;
};

// Don't check at module load - check lazily
let isBase: boolean | null = null;

// Type definitions for when modules are loaded
// Use any for dynamic imports to avoid type issues at compile time
// These will be properly typed at runtime when modules are loaded
let wagmiAdapter: any = null;
let appKit: any = null;

// Lazy initialization function - call this when we actually need AppKit
// This ensures the Base app check happens AFTER the app is mounted and in iframe
export const initializeAppKit = () => {
  // Check if already initialized
  if (appKit || wagmiAdapter) {
    console.log('[AppKit] Already initialized, skipping');
    return;
  }
  
  // Check if we're in Base app NOW (after mount, when iframe is definitely set up)
  if (checkIsBaseApp()) {
    console.log('[AppKit] Base app detected, skipping AppKit initialization');
    return;
  }
  
  console.log('[AppKit] Loading AppKit modules (NOT in Base app)');
  
  // Use dynamic imports to prevent WalletConnect from loading in Base app
  // Wrap in try-catch to prevent any errors from propagating
  Promise.all([
    import('@reown/appkit/react'),
    import('@reown/appkit/networks'),
    import('@reown/appkit-adapter-wagmi')
  ]).then(([appkitModule, networksModule, adapterModule]) => {
    const { createAppKit, getAppKit } = appkitModule;
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

// Don't auto-initialize at module load - let main.tsx call initializeAppKit() when needed
// This ensures Base app detection happens after the app is mounted

// Export with type assertions for TypeScript
// In Base app, appKit will be null - useAppKitSafe hook will handle this gracefully
export { wagmiAdapter, appKit };