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

// Conditionally initialize Farcaster Mini App SDK
let sdkInitialized = false;
async function initializeMiniAppSDK() {
  if (typeof window === 'undefined' || !isMiniAppContext()) {
    return;
  }

  try {
    // Dynamically import SDK only in mini app context
    const { sdk } = await import('@farcaster/miniapp-sdk');
    
    // Call ready() after app loads
    // This will be called from the App component after React renders
    (window as any).__farcasterSDK = sdk;
    sdkInitialized = true;
    console.log('[MINIAPP] Farcaster SDK initialized');
  } catch (error) {
    console.warn('[MINIAPP] Failed to initialize Farcaster SDK:', error);
  }
}

// Initialize SDK if in mini app context
if (isMiniAppContext()) {
  initializeMiniAppSDK().catch(console.error);
}

// Export function to call ready() from App component
export async function callSDKReady() {
  if (!sdkInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    const sdk = (window as any).__farcasterSDK;
    if (sdk && sdk.actions && sdk.actions.ready) {
      await sdk.actions.ready();
      console.log('[MINIAPP] SDK ready() called successfully');
    }
  } catch (error) {
    console.warn('[MINIAPP] Failed to call SDK ready():', error);
  }
}

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Call SDK ready() when app loads in mini app context
  useEffect(() => {
    if (isMiniAppContext()) {
      // Small delay to ensure app is fully rendered
      const timer = setTimeout(() => {
        callSDKReady();
      }, 100);
      return () => clearTimeout(timer);
    }
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