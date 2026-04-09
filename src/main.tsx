// Firebase disabled — lawb.xyz runs without Firebase
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Mobile from './mobile/Mobile.tsx';

const ReefArcadeMenu = lazy(() => import('./pages/ReefArcadeMenu'));
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import './index.css';
import './walletModal.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { wagmiAdapter, initializeAppKit } from './appkit.ts';
import { config as wagmiConfig } from './wagmi';
import { LawbAudioProvider } from './contexts/LawbAudioContext';
import LawbMiniPlayer from './components/LawbMiniPlayer';
import { WalletConnectLeaderboardSync } from './components/WalletConnectLeaderboardSync';
const queryClient = new QueryClient();

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  // Redirect chess subdomain to main site
  if (typeof window !== 'undefined' && window.location.hostname.startsWith('chess.')) {
    window.location.replace(`https://lawb.xyz${window.location.pathname === '/' ? '' : window.location.pathname}`);
    return null;
  }
  return isMobile ? <Mobile /> : <App />;
};

// Component that handles dynamic config updates
const AppWithWagmi = () => {
  const [currentConfig, setCurrentConfig] = React.useState(wagmiConfig);
  const [configKey, setConfigKey] = React.useState(0);
  
  // Initialize AppKit for wallet connections
  React.useEffect(() => {
    console.log('[AppWithWagmi] Initializing AppKit for web users');
    initializeAppKit();
    
    // Poll for AppKit loading
    let attempts = 0;
    const maxAttempts = 50; // Check for 5 seconds (50 * 100ms)
    const interval = setInterval(() => {
      attempts++;
      if (wagmiAdapter && typeof wagmiAdapter === 'object' && 'wagmiConfig' in wagmiAdapter) {
        const adapterConfig = (wagmiAdapter as any).wagmiConfig;
        console.log('[main.tsx] AppKit loaded, switching to WagmiAdapter config');
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
  
  // Poll for AppKit loading
  React.useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // Check for 5 seconds (50 * 100ms)
    const interval = setInterval(() => {
      attempts++;
      if (wagmiAdapter && typeof wagmiAdapter === 'object' && 'wagmiConfig' in wagmiAdapter) {
        const adapterConfig = (wagmiAdapter as any).wagmiConfig;
        console.log('[main.tsx] AppKit loaded, switching to WagmiAdapter config');
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
  
  return (
    <WagmiProvider key={configKey} config={currentConfig}>
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
              <Route path="/chess" element={<Navigate to="/" replace />} />
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
