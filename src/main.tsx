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
let sdkInitialized = false;
let sdkInstance: any = null;

async function initializeMiniAppSDK() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Always try to import SDK - it will work in Farcaster context
    const { sdk } = await import('@farcaster/miniapp-sdk');
    sdkInstance = sdk;
    sdkInitialized = true;
    console.log('[MINIAPP] Farcaster SDK initialized');
    
    // Call ready() immediately after initialization
    // This is critical - without it, users see infinite loading screen
    try {
      await sdk.actions.ready();
      console.log('[MINIAPP] SDK ready() called successfully');
    } catch (readyError) {
      console.warn('[MINIAPP] ready() called but may not be in Farcaster context:', readyError);
    }
  } catch (error) {
    // SDK import failed - not in Farcaster context, that's okay
    console.log('[MINIAPP] SDK not available (not in Farcaster context)');
  }
}

// Initialize SDK immediately
initializeMiniAppSDK().catch(console.error);

// Export function to call ready() from components (backup)
export async function callSDKReady() {
  if (!sdkInitialized || !sdkInstance || typeof window === 'undefined') {
    return;
  }

  try {
    if (sdkInstance && sdkInstance.actions && sdkInstance.actions.ready) {
      await sdkInstance.actions.ready();
      console.log('[MINIAPP] SDK ready() called successfully (backup call)');
    }
  } catch (error) {
    console.warn('[MINIAPP] Failed to call SDK ready():', error);
  }
}

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Call SDK ready() when app loads (backup call in case initial call didn't work)
  useEffect(() => {
    // Small delay to ensure app is fully rendered, then call ready()
    const timer = setTimeout(() => {
      callSDKReady();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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