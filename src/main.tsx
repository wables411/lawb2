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

// Import Farcaster SDK directly - per docs: https://miniapps.farcaster.xyz/docs/getting-started
// The SDK is injected by Farcaster clients at runtime
import { sdk } from '@farcaster/miniapp-sdk';

// Lazy load the chess page to reduce initial bundle size
const ChessPage = lazy(() => import('./components/ChessPage'));
import { appKit, wagmiAdapter } from './appkit.ts'; // Import the appKit instance and wagmi adapter
import { getAppKit } from '@reown/appkit/react';

// Initialize AppKit singleton before any hooks are used
getAppKit(appKit);
const queryClient = new QueryClient();

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Call SDK ready() when interface is ready to be displayed
  // Per Farcaster docs: https://miniapps.farcaster.xyz/docs/getting-started
  useEffect(() => {
    // Wait a brief moment to ensure React has rendered the initial UI
    // This prevents jitter and content reflows
    const timer = setTimeout(async () => {
      try {
        // Check if SDK is available (it's injected by Farcaster clients)
        if (sdk && sdk.actions && sdk.actions.ready) {
          await sdk.actions.ready();
          console.log('[MINIAPP] ✅ SDK ready() called - splash screen hidden');
        } else {
          console.warn('[MINIAPP] SDK not available - sdk:', sdk, 'sdk.actions:', sdk?.actions);
        }
      } catch (error) {
        // SDK not available (not in Farcaster context) - that's okay
        console.error('[MINIAPP] Error calling ready():', error);
      }
    }, 100);
    
    return () => clearTimeout(timer);
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