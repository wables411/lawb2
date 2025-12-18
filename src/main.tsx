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

import { appKit, wagmiAdapter, initializeAppKit } from './appkit.ts'; // Import the appKit instance and wagmi adapter
import { initBaseMiniApp, isBaseMiniApp, isBaseMiniAppAsync } from './utils/baseMiniapp';
import { config as wagmiConfig } from './wagmi';
const queryClient = new QueryClient();

// Note: Base Mini App SDK ready() is called in React components (App.tsx, Mobile.tsx)
// after the interface is ready, per Farcaster documentation best practices

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const [isBaseApp, setIsBaseApp] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Use async SDK detection as primary method (most reliable for mobile Base app)
  React.useEffect(() => {
    const checkBaseApp = async () => {
      // First do quick synchronous check
      const syncCheck = isBaseMiniApp();
      if (syncCheck) {
        console.log('[Root] Base app detected via sync check');
        setIsBaseApp(true);
        setIsChecking(false);
        return;
      }
      
      // Then do async SDK check (more reliable, especially on mobile)
      try {
        const asyncCheck = await isBaseMiniAppAsync();
        console.log('[Root] Base app async check result:', asyncCheck);
        setIsBaseApp(asyncCheck);
      } catch (e) {
        console.warn('[Root] Async check failed, using sync result:', e);
        setIsBaseApp(syncCheck);
      } finally {
        setIsChecking(false);
      }
    };
    
    void checkBaseApp();
  }, []);
  
  // Show loading while checking (prevents flash of wrong UI)
  if (isChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading...</div>;
  }
  
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
  const [isBaseApp, setIsBaseApp] = React.useState<boolean | null>(null);
  
  // Use async SDK detection as primary method (most reliable for mobile Base app)
  React.useEffect(() => {
    const checkAndInitialize = async () => {
      // First do quick synchronous check
      const syncCheck = isBaseMiniApp();
      if (syncCheck) {
        console.log('[AppWithWagmi] Base app detected via sync check, skipping AppKit');
        setIsBaseApp(true);
        return;
      }
      
      // Then do async SDK check (more reliable, especially on mobile)
      try {
        const asyncCheck = await isBaseMiniAppAsync();
        console.log('[AppWithWagmi] Base app async check result:', asyncCheck);
        setIsBaseApp(asyncCheck);
        
        if (asyncCheck) {
          console.log('[AppWithWagmi] Base app detected via async check, skipping AppKit initialization');
          return; // Base app uses wagmiConfig directly with Farcaster connector
        }
      } catch (e) {
        console.warn('[AppWithWagmi] Async check failed, using sync result:', e);
        setIsBaseApp(syncCheck);
        if (syncCheck) {
          return;
        }
      }
      
      // Initialize AppKit for regular web users
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
    
    };
    
    void checkAndInitialize();
  }, []);
  
  // Update config if Base app status changes
  React.useEffect(() => {
    if (isBaseApp === true) {
      // Base app detected - use wagmiConfig with Farcaster connector
      setCurrentConfig(wagmiConfig);
      setConfigKey(prev => prev + 1);
    } else if (isBaseApp === false && wagmiAdapter && typeof wagmiAdapter === 'object' && 'wagmiConfig' in wagmiAdapter) {
      // Not Base app and AppKit loaded - use WagmiAdapter config
      const adapterConfig = (wagmiAdapter as any).wagmiConfig;
      setCurrentConfig(adapterConfig);
      setConfigKey(prev => prev + 1);
    }
  }, [isBaseApp, wagmiAdapter]);
  
  // Poll for AppKit loading (only if not Base app)
  React.useEffect(() => {
    if (isBaseApp === true) return; // Base app uses wagmiConfig directly
    
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
  }, [isBaseApp]);
  
  return (
    <WagmiProvider key={configKey} config={currentConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {isChessSubdomain ? (
              <Route path="/*" element={
                isBaseApp === true ? (
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
                  isBaseApp === true ? (
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