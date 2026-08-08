import './devFakeWallet'; // dev-only, inert in prod builds
import './devSpriteRenderer'; // dev-only, inert in prod builds
import { dlog } from './utils/devLog';
// Firebase disabled — lawb.xyz runs without Firebase
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Mobile from './mobile/Mobile.tsx';

const ReefArcadeMenu = lazy(() => import('./pages/ReefArcadeMenu'));
const ChessPage = lazy(() => import('./components/ChessPage'));
const GalleryPage = lazy(() => import('./pages/gallery/GalleryPage'));
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import './index.css';
import './walletModal.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { wagmiAdapter, initializeAppKit } from './appkit.ts';
import { config as wagmiConfig } from './wagmi';
import { LawbAudioProvider } from './contexts/LawbAudioContext';
import LawbMiniPlayer from './components/LawbMiniPlayer';
import { WalletConnectLeaderboardSync } from './components/WalletConnectLeaderboardSync';
const queryClient = new QueryClient();

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <Mobile /> : <App />;
};

// Component that handles dynamic config updates
const AppWithWagmi = () => {
  const [currentConfig, setCurrentConfig] = React.useState(wagmiConfig);
  const [configKey, setConfigKey] = React.useState(0);
  
  // Initialize AppKit for wallet connections
  React.useEffect(() => {
    dlog('[AppWithWagmi] Initializing AppKit for web users');
    initializeAppKit();
    
    // Poll for AppKit loading
    let attempts = 0;
    const maxAttempts = 50; // Check for 5 seconds (50 * 100ms)
    const interval = setInterval(() => {
      attempts++;
      if (wagmiAdapter && typeof wagmiAdapter === 'object' && 'wagmiConfig' in wagmiAdapter) {
        const adapterConfig = (wagmiAdapter as any).wagmiConfig;
        dlog('[main.tsx] AppKit loaded, switching to WagmiAdapter config');
        setCurrentConfig(adapterConfig);
        setConfigKey(prev => prev + 1); // Force WagmiProvider to re-initialize
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.warn('[main.tsx] AppKit did not load within timeout, using fallback config (connectors may be limited)');
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (!host.startsWith('chess.')) return;
    const q = window.location.search || '';
    const h = window.location.hash || '';
    window.location.replace(`https://lawb.xyz/chess${q}${h}`);
  }, []);

  return (
    // reconnectOnMount only after the swap to AppKit's config: if the throwaway boot
    // config starts reconnecting, it wins the race against the adapter config (both
    // persist to the same wagmi.store, with incompatible per-instance connector uids)
    // and the app is left rendering a config that can never see the restored wallet —
    // taskbar chip green (AppKit state) but useAccount() disconnected everywhere.
    <WagmiProvider
      key={configKey}
      config={currentConfig}
      reconnectOnMount={currentConfig !== wagmiConfig}
    >
      <QueryClientProvider client={queryClient}>
        <LawbAudioProvider>
          <WalletConnectLeaderboardSync />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Root />} />
              <Route
                path="/arcade"
                element={
                  <Suspense
                    fallback={
                      <div
                        style={{
                          minHeight: '100vh',
                          background: '#020810',
                          color: '#2ee6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'Orbitron, system-ui, sans-serif',
                          letterSpacing: '0.35em',
                          fontSize: 12,
                        }}
                      >
                        LOADING
                      </div>
                    }
                  >
                    <ReefArcadeMenu />
                  </Suspense>
                }
              />
              <Route
                path="/gallery"
                element={
                  <Suspense
                    fallback={
                      <div
                        style={{
                          minHeight: '100vh',
                          background: '#000005',
                          color: '#c0c0c0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'MS Sans Serif, Arial, sans-serif',
                          fontSize: 14,
                        }}
                      >
                        Loading the lawbverse…
                      </div>
                    }
                  >
                    <GalleryPage />
                  </Suspense>
                }
              />
              <Route
                path="/chess"
                element={
                  <Suspense
                    fallback={
                      <div
                        style={{
                          minHeight: '100vh',
                          background: '#0a0a0a',
                          color: '#ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'MS Sans Serif, Arial, sans-serif',
                          fontSize: 14,
                        }}
                      >
                        Loading chess…
                      </div>
                    }
                  >
                    <ChessPage />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <div
                    style={{
                      minHeight: '100vh',
                      background: '#000',
                      color: '#00ff99',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: '"Courier New", Courier, monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <div
                      style={{
                        border: '2px solid #00ff99',
                        padding: '16px 20px',
                        background: 'rgba(0, 255, 153, 0.06)',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ margin: '0 0 12px' }}>404 Not Found</p>
                      <a href="/" style={{ color: '#00ff99' }}>
                        ← back to lawb.xyz
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
          <LawbMiniPlayer />
        </LawbAudioProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithWagmi />
  </React.StrictMode>
);
