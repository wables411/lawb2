import './firebaseApp';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Mobile from './mobile/Mobile.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load the chess page to reduce initial bundle size
const ChessPage = lazy(() => import('./components/ChessPage'));
import { appKit } from './appkit.ts'; // Import the appKit instance

const queryClient = new QueryClient();

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <Mobile /> : <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
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