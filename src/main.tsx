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
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChessPage from './components/ChessPage'; // to be created

// Initialize Firebase early to prevent initialization errors
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration with fallbacks for production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAed5bn78c6Mb5Y3ezULH9CEg7IAKYFAps",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chess-220ee.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://chess-220ee-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chess-220ee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chess-220ee.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "724477138097",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:724477138097:web:7dc15f79db3bda5c763e90"
};

// Initialize Firebase only if not already initialized
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('[FIREBASE] Firebase initialized successfully');
    
    // Test database connection
    const database = getDatabase(app);
    console.log('[FIREBASE] Database connection established');
  } catch (error) {
    console.error('[FIREBASE] Firebase initialization error:', error);
  }
} else {
  app = getApps()[0];
  console.log('[FIREBASE] Firebase already initialized');
}

const queryClient = new QueryClient();

const isChessSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('chess.');

const Root = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <Mobile /> : <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {isChessSubdomain ? (
              <Route path="/*" element={<ChessPage />} />
            ) : (
              <>
                <Route path="/" element={<Root />} />
                <Route path="/chess" element={<ChessPage />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);