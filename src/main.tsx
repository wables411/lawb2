import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Mobile from './mobile/Mobile.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiAdapter } from './appkit.ts';
import './appkit.ts'; // This initializes the AppKit

const queryClient = new QueryClient();

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return isMobile ? <Mobile /> : <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Root />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);