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

// Import Farcaster SDK statically (will work in Farcaster context)
let sdkInstance: any = null;
try {
  // Try to import SDK - it will be available in Farcaster context
  const farcasterSDK = require('@farcaster/miniapp-sdk');
  sdkInstance = farcasterSDK.sdk;
  console.log('[MINIAPP] Farcaster SDK imported successfully');
} catch (error) {
  // SDK not available - try dynamic import as fallback
  console.log('[MINIAPP] Static import failed, will try dynamic import');
  if (typeof window !== 'undefined') {
    import('@farcaster/miniapp-sdk')
      .then(({ sdk }) => {
        sdkInstance = sdk;
        console.log('[MINIAPP] Farcaster SDK loaded via dynamic import');
      })
      .catch((err) => {
        console.log('[MINIAPP] SDK not available (not in Farcaster context):', err);
      });
  }
}

// Export function to get SDK instance
export function getSDKInstance() {
  return sdkInstance;
}

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Call SDK ready() when interface is ready to be displayed
  // Following Farcaster guide: https://miniapps.farcaster.xyz/docs/guides/loading
  useEffect(() => {
    const callReady = async () => {
      console.log('[MINIAPP] Attempting to call ready()...');
      
      // Try multiple times with delays in case SDK loads asynchronously
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          let sdk = getSDKInstance();
          
          // If SDK not available yet, wait a bit and try again
          if (!sdk) {
            console.log(`[MINIAPP] SDK not available yet, attempt ${attempt + 1}/10`);
            await new Promise(resolve => setTimeout(resolve, 200));
            continue;
          }
          
          if (sdk && sdk.actions && sdk.actions.ready) {
            // Wait a brief moment to ensure React has rendered the initial UI
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await sdk.actions.ready();
            console.log('[MINIAPP] ✅ SDK ready() called successfully - splash screen hidden');
            return; // Success, exit loop
          } else {
            console.warn('[MINIAPP] SDK available but ready() method missing', sdk);
          }
        } catch (error) {
          console.warn(`[MINIAPP] Attempt ${attempt + 1} failed:`, error);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.error('[MINIAPP] ❌ Failed to call ready() after all attempts');
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