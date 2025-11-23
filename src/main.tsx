import './firebaseApp';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Mobile from './mobile/Mobile.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { isMiniAppContext } from './utils/platformDetection';

// Lazy load the chess page to reduce initial bundle size
const ChessPage = lazy(() => import('./components/ChessPage'));
import { appKit, wagmiAdapter } from './appkit.ts'; // Import the appKit instance and wagmi adapter
import { getAppKit } from '@reown/appkit/react';

// Initialize AppKit singleton before any hooks are used
getAppKit(appKit);
const queryClient = new QueryClient();

// Initialize Farcaster Mini App SDK (always available, will work in preview tool)
let sdkInstance: any = null;
let sdkInitPromise: Promise<any> | null = null;

async function initializeMiniAppSDK() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Always try to import SDK - it will work in Farcaster context
    const { sdk } = await import('@farcaster/miniapp-sdk');
    sdkInstance = sdk;
    console.log('[MINIAPP] Farcaster SDK initialized');
    return sdk;
  } catch (error) {
    // SDK import failed - not in Farcaster context, that's okay
    console.log('[MINIAPP] SDK not available (not in Farcaster context)');
    return null;
  }
}

// Initialize SDK immediately and store the promise
sdkInitPromise = initializeMiniAppSDK().catch(console.error);

// Export function to get SDK instance (waits for initialization if needed)
export async function getSDKInstance() {
  if (sdkInstance) {
    return sdkInstance;
  }
  // Wait for initialization to complete
  if (sdkInitPromise) {
    await sdkInitPromise;
  }
  return sdkInstance;
}

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Call SDK ready() when interface is ready to be displayed
  // Following Farcaster guide: https://miniapps.farcaster.xyz/docs/guides/loading
  useEffect(() => {
    const callReady = async () => {
      try {
        // Wait for SDK to initialize (it might still be loading)
        const sdk = await getSDKInstance();
        
        if (sdk && sdk.actions && sdk.actions.ready) {
          // Wait a brief moment to ensure React has rendered the initial UI
          // This prevents jitter and content reflows
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await sdk.actions.ready();
          console.log('[MINIAPP] SDK ready() called - splash screen hidden');
        } else {
          console.warn('[MINIAPP] SDK not available or ready() method missing');
        }
      } catch (error) {
        console.warn('[MINIAPP] Failed to call SDK ready():', error);
      }
    };
    
    callReady();
  }, []); // Empty deps - only call once when component mounts

  return isMobile ? <Mobile /> : <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {isChessSubdomain ? (
              <Route path="/*" element={
                <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Chess...</div>}>
                  <ChessPage />
                </Suspense>
              } />
            ) : (
              <>
                <Route path="/" element={<Root />} />
                <Route path="/chess" element={
                  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Chess...</div>}>
                    <ChessPage />
                  </Suspense>
                } />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);