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

// Lazy load components
const ChessPage = lazy(() => import('./components/ChessPage'));
const ClawbWorld = lazy(() => import('./components/ClawbWorld'));

import { wagmiAdapter, initializeAppKit } from './appkit.ts';
import { config as wagmiConfig } from './wagmi';
const queryClient = new QueryClient();

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

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
                <Route path="/world" element={
                  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px', background: '#0a1628', color: '#e2e8f0' }}>Entering Clawb's World...</div>}>
                    <ClawbWorld />
                  </Suspense>
                } />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithWagmi />
  </React.StrictMode>
);
