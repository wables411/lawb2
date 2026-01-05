# Base App Template Files

These are simplified versions of key files for the new Base App repository.

## 1. `src/main.tsx` (Simplified)

```typescript
import './firebaseApp';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { config as wagmiConfig } from './wagmi';
import { initBaseMiniApp } from './utils/baseMiniapp';
import './index.css';
import './walletModal.css';

const ChessPage = lazy(() => import('./ChessPage'));

const queryClient = new QueryClient();

// Initialize Base Mini App SDK on app load
React.useEffect(() => {
  void initBaseMiniApp();
  
  // Always add base-miniapp class (we're always in Base App)
  if (typeof document !== 'undefined') {
    document.body.classList.add('base-miniapp');
    document.documentElement.classList.add('base-miniapp');
  }
}, []);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chess" element={
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Chess...</div>}>
                <ChessPage />
              </Suspense>
            } />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
```

## 2. `src/wagmi.ts` (Base Chain Only)

```typescript
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

// Base App only supports Base chain
const connectors = [farcasterMiniApp()];

export const config = createConfig({
  chains: [base],
  connectors,
  // Disable EIP-6963 wallet discovery (Farcaster connector doesn't support it)
  multiInjectedProviderDiscovery: false,
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
});

// Export Base chain for use elsewhere
export const baseChain = base;
```

## 3. `src/App.tsx` (Simplified from BaseApp.tsx)

Key changes:
- Remove all `isBaseMiniApp()` checks
- Always add `base-miniapp` class on mount
- Simplify component (no conditionals)
- Remove comments about detection

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import { ThemeToggle } from './components/ThemeToggle';
import { useAccount } from 'wagmi';
import { initBaseMiniApp, getSafeAreaInsets, applySafeAreaInsets, triggerHapticImpact, triggerHapticSelection, triggerHapticNotification } from './utils/baseMiniapp';
import { lazy, Suspense } from 'react';
import Popup from './components/Popup';
import { PlayerProfile } from './components/PlayerProfile';
import { ChessChat } from './components/ChessChat';

// Lazy load components
const AsciiLawbsterMint = lazy(() => import('./components/AsciiLawbsterMint'));
const MintPopup = lazy(() => import('./components/MintPopup'));
const MemeGenerator = lazy(() => import('./components/MemeGenerator'));
const NFTGallery = lazy(() => import('./components/NFTGallery'));

// Uniform popup content wrapper style
const POPUP_CONTENT_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  padding: '15px',
  WebkitOverflowScrolling: 'touch',
  wordWrap: 'break-word',
  wordBreak: 'break-word',
  maxWidth: '100%'
};

// Default popup size - will be updated with safe area insets
const DEFAULT_MINIAPP_POPUP_SIZE = { 
  width: 'calc(100vw - 32px)', 
  height: 'calc(100vh - 60px)'
};

function App() {
  const { address, isConnected } = useAccount();
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [minimizedPopups, setMinimizedPopups] = useState<Set<string>>(new Set());
  const [showPublicChat, setShowPublicChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [showMemeGenerator, setShowMemeGenerator] = useState(false);
  const [miniappPopupSize, setMiniappPopupSize] = useState(DEFAULT_MINIAPP_POPUP_SIZE);

  // Initialize Base Mini App SDK and apply safe area insets
  useEffect(() => {
    const initialize = async () => {
      await initBaseMiniApp();
      
      // Always add base-miniapp class (we're always in Base App)
      document.body.classList.add('base-miniapp');
      document.documentElement.classList.add('base-miniapp');
      
      // Apply safe area insets as CSS variables
      await applySafeAreaInsets();
      
      // Get safe area insets and calculate popup size
      const insets = await getSafeAreaInsets();
      const taskbarHeight = 60;
      const padding = 16;
      
      const width = `calc(100vw - ${insets.left + insets.right + padding * 2}px)`;
      const height = `calc(100vh - ${insets.top + insets.bottom + taskbarHeight + padding}px)`;
      
      setMiniappPopupSize({ width, height });
    };
    
    void initialize();
    
    return () => {
      // Cleanup
      document.body.classList.remove('base-miniapp');
      document.documentElement.classList.remove('base-miniapp');
    };
  }, []);

  // Rest of component logic (same as BaseApp.tsx but simplified)
  // ... (keep all the popup handlers, etc.)
  
  return (
    <>
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}>
        <Desktop onIconClick={handleIconClick} />
        <Taskbar
          minimizedWindows={Array.from(minimizedPopups)}
          onRestoreWindow={restorePopup}
          connectionStatus={{
            connected: isConnected,
            address: address,
            ens: undefined
          }}
          onOpenPublicChat={openPublicChat}
          onOpenProfile={() => setShowProfile(true)}
        />
        
        {/* All popups here - same as BaseApp.tsx */}
      </div>
    </>
  );
}

export default App;
```

## 4. `src/ChessPage.tsx` (Simplified from BaseAppChessPage.tsx)

```typescript
import React, { useState, useEffect } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import { ChessChat } from './components/ChessChat';
import { initBaseMiniApp } from './utils/baseMiniapp';
import './components/ChessMultiplayer.css';
import './components/ChessPage.css';

const ChessPage: React.FC = () => {
  // Initialize Base Mini App SDK
  useEffect(() => {
    void initBaseMiniApp();
    
    // Always add base-miniapp class
    if (typeof document !== 'undefined') {
      document.body.classList.add('base-miniapp');
      document.documentElement.classList.add('base-miniapp');
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('base-miniapp');
        document.documentElement.classList.remove('base-miniapp');
      }
    };
  }, []);

  // Base App always uses mobile/miniapp style
  const isMobile = true;

  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  const [chatInviteCode, setChatInviteCode] = useState<string | undefined>();
  const [isInGame, setIsInGame] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  // ... rest of handlers ...

  return (
    <div 
      className="chess-page mobile baseapp"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}
    >
      <div className="chess-content" style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        maxWidth: '100%',
        maxHeight: '100%'
      }}>
        {gameMode === 'singleplayer' ? (
          <ChessGame 
            onClose={handleClose} 
            onBackToModeSelect={handleBackToModeSelect}
            onGameStart={handleGameStart}
            onChatToggle={handleChatToggle}
            isChatMinimized={!isChatVisible}
            isMobile={isMobile}
          />
        ) : (
          <ChessMultiplayer 
            onClose={handleClose} 
            onMinimize={() => {}} 
            fullscreen={false} 
            onBackToModeSelect={handleBackToModeSelect}
            onGameStart={handleGameStart}
            onChatToggle={handleChatToggle}
            isChatMinimized={!isChatVisible}
            isMobile={isMobile}
          />
        )}
      </div>
      
      {isChatVisible && (
        <ChessChat
          isOpen={isChatVisible}
          onMinimize={handleChatMinimize}
          currentInviteCode={chatInviteCode}
          isDraggable={false}
          isResizable={false}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default ChessPage;
```

## 5. `package.json` (Simplified)

Remove the `build:base-miniapp` script, keep everything else:

```json
{
  "name": "lawb-baseapp",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "postbuild": "cp _headers dist/",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@farcaster/miniapp-sdk": "^0.2.1",
    "@farcaster/miniapp-wagmi-connector": "^1.1.0",
    "@tanstack/react-query": "^5.90.6",
    "chess.js": "^1.4.0",
    "ethers": "^6.15.0",
    "firebase": "^10.12.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-draggable": "^4.5.0",
    "react-jss": "^10.10.0",
    "react-router-dom": "^6.28.0",
    "typescript": "^5.2.2",
    "viem": "^2.32.0",
    "vite": "^5.2.0",
    "wagmi": "^2.19.2"
  }
}
```

## 6. `index.html` (From index.base-miniapp.html)

Use `index.base-miniapp.html` as your `index.html` - it's already configured for Base App.

## 7. `.env.example`

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Base RPC (optional)
VITE_BASE_RPC_URL=https://mainnet.base.org

# Base Mini App ID
VITE_BASE_APP_ID=693d9e36d77c069a945bde7b
```

## Key Simplifications Summary

1. **No Detection Logic** - Always assume Base App
2. **No Conditional Rendering** - Single code path
3. **Base Chain Only** - Remove all other chains
4. **Mobile Always** - Remove desktop layouts
5. **Simplified CSS** - Remove `.baseapp` selectors, make those styles default
6. **No Duplicates** - Single version of each component






