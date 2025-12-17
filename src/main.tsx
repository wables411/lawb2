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

// Lazy load components - separate for Base app vs web browser
const ChessPage = lazy(() => import('./components/ChessPage'));
const BaseApp = lazy(() => import('./baseapp/BaseApp'));
const BaseAppChessPage = lazy(() => import('./baseapp/BaseAppChessPage'));

import { appKit, wagmiAdapter } from './appkit.ts'; // Import the appKit instance and wagmi adapter
import { initBaseMiniApp, isBaseMiniApp } from './utils/baseMiniapp';
import { config as wagmiConfig } from './wagmi';

// Initialize AppKit singleton before any hooks are used
// Skip AppKit initialization in Base app to avoid WalletConnect CSP issues
// Farcaster connector will be used instead via wagmi config
// Use dynamic import to avoid loading @reown/appkit/react in Base app
if (appKit && typeof window !== 'undefined' && !isBaseMiniApp()) {
  import('@reown/appkit/react').then(({ getAppKit }) => {
    if (appKit) {
      getAppKit(appKit);
    }
  }).catch((error) => {
    console.warn('[main.tsx] Failed to load getAppKit:', error);
  });
}
const queryClient = new QueryClient();

// Note: Base Mini App SDK ready() is called in React components (App.tsx, Mobile.tsx)
// after the interface is ready, per Farcaster documentation best practices

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isBaseApp = isBaseMiniApp();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // BASE APP: Use completely separate BaseApp component
  if (isBaseApp) {
    return (
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Base App...</div>}>
        <BaseApp />
      </Suspense>
    );
  }
  
  // WEB BROWSER: Use regular App/Mobile components
  return isMobile ? <Mobile /> : <App />;
};

// When in Base/Farcaster app, use our wagmi config with Farcaster connector
// Otherwise, use WagmiAdapter's config with WalletConnect
// Note: wagmiAdapter is loaded dynamically, so we need to handle it at runtime
// For regular users, we'll wait a bit for AppKit to load, then use its config
const getWagmiConfig = () => {
  if (isBaseMiniApp()) {
    return wagmiConfig;
  }
  
  // If wagmiAdapter is loaded and has wagmiConfig, use it
  if (wagmiAdapter && typeof wagmiAdapter === 'object' && 'wagmiConfig' in wagmiAdapter) {
    return (wagmiAdapter as any).wagmiConfig;
  }
  
  // Fallback: use our config (will have empty connectors until AppKit loads)
  // The WagmiAdapter will add connectors when it loads, but we need to re-render
  // For now, return the base config - AppKit should update it when loaded
  return wagmiConfig;
};

// Component that handles dynamic config updates
const AppWithWagmi = () => {
  const [currentConfig, setCurrentConfig] = React.useState(getWagmiConfig());
  const [configKey, setConfigKey] = React.useState(0);
  
  // Check if AppKit has loaded and update config if needed
  React.useEffect(() => {
    if (isBaseMiniApp()) return; // Base app uses wagmiConfig directly, no need to wait
    
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
  
  return (
    <WagmiProvider key={configKey} config={currentConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {isChessSubdomain ? (
              <Route path="/*" element={
                isBaseMiniApp() ? (
                  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Base App Chess...</div>}>
                    <BaseAppChessPage />
                  </Suspense>
                ) : (
                <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Chess...</div>}>
                  <ChessPage />
                </Suspense>
                )
              } />
            ) : (
              <>
                <Route path="/" element={<Root />} />
                <Route path="/chess" element={
                  isBaseMiniApp() ? (
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Base App Chess...</div>}>
                      <BaseAppChessPage />
                    </Suspense>
                  ) : (
                  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Chess...</div>}>
                    <ChessPage />
                  </Suspense>
                  )
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