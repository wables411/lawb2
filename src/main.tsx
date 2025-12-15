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
import { lazy, Suspense } from 'react';

// Lazy load the chess page to reduce initial bundle size
const ChessPage = lazy(() => import('./components/ChessPage'));
import { appKit, wagmiAdapter } from './appkit.ts'; // Import the appKit instance and wagmi adapter
import { getAppKit } from '@reown/appkit/react';
import { initBaseMiniApp, isBaseMiniApp } from './utils/baseMiniapp';
import { config as wagmiConfig } from './wagmi';

// Initialize AppKit singleton before any hooks are used
// Skip AppKit initialization in Base app to avoid WalletConnect CSP issues
// Farcaster connector will be used instead via wagmi config
if (appKit) {
  getAppKit(appKit);
}
const queryClient = new QueryClient();

// Note: Base Mini App SDK ready() is called in React components (App.tsx, Mobile.tsx)
// after the interface is ready, per Farcaster documentation best practices

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <Mobile /> : <App />;
};

// When in Base/Farcaster app, use our wagmi config with Farcaster connector
// Otherwise, use WagmiAdapter's config with WalletConnect
const wagmiConfigToUse = isBaseMiniApp() 
  ? wagmiConfig 
  : (wagmiAdapter?.wagmiConfig || wagmiConfig); // Fallback to our config if wagmiAdapter is null

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfigToUse}>
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