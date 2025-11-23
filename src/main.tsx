import './firebaseApp';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Mobile from './mobile/Mobile.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import './index.css';
import './walletModal.css';
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
  // Per agents checklist: https://miniapps.farcaster.xyz/docs/guides/agents-checklist
  useEffect(() => {
    const callReady = async () => {
      console.log('[MINIAPP] Attempting to call ready()...');
      console.log('[MINIAPP] SDK object:', sdk);
      console.log('[MINIAPP] SDK.actions:', sdk?.actions);
      console.log('[MINIAPP] SDK.actions.ready:', sdk?.actions?.ready);
      
      // Try multiple times - SDK might not be injected immediately
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
            await sdk.actions.ready();
            console.log('[MINIAPP] ✅ SDK ready() called successfully on attempt', attempt + 1);
            return; // Success!
          } else {
            console.log(`[MINIAPP] Attempt ${attempt + 1}/5: SDK not ready yet, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`[MINIAPP] Attempt ${attempt + 1}/5 failed:`, error);
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      
      console.error('[MINIAPP] ❌ Failed to call ready() after all attempts');
      console.error('[MINIAPP] Final SDK state:', { sdk, hasActions: !!sdk?.actions, hasReady: !!sdk?.actions?.ready });
    };
    
    // Wait a brief moment to ensure React has rendered the initial UI
    const timer = setTimeout(callReady, 100);
    
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