import React, { useState, useEffect, useMemo } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import { ChessChat } from './ChessChat';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import LinuxNavBar from './LinuxNavBar';
import { useAccount } from 'wagmi';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import { lazy, Suspense } from 'react';
import './ChessMultiplayer.css';
import './ChessPage.css';

const PlayerProfile = lazy(() => import('./PlayerProfile').then(m => ({ default: m.PlayerProfile })));

const ChessPage: React.FC = () => {

  // Scroll to top on mount and whenever component updates
  useEffect(() => {
    const scrollToTop = () => {
      try {
        // Try multiple methods to ensure scrolling works in all contexts
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
        if (document.documentElement) {
          document.documentElement.style.overflowX = 'hidden';
          document.documentElement.style.overflowY = 'auto';
        }
        document.body.style.overflowX = 'hidden';
        document.body.style.overflowY = 'auto';
        
        // Also try scrolling the root element
        const root = document.getElementById('root');
        if (root) {
          root.scrollTop = 0;
          root.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        
        // Try scrolling the chess-page element
        const chessPage = document.querySelector('.chess-page');
        if (chessPage) {
          (chessPage as HTMLElement).scrollTop = 0;
          chessPage.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        
        // Try scrolling chess-content element
        const chessContent = document.querySelector('.chess-content');
        if (chessContent) {
          (chessContent as HTMLElement).scrollTop = 0;
          chessContent.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      } catch (error) {
        // Silently handle any errors
      }
    };
    
    // Immediate scroll
    scrollToTop();
    // Also scroll after multiple delays to ensure DOM is ready
    const timeout1 = setTimeout(scrollToTop, 50);
    const timeout2 = setTimeout(scrollToTop, 100);
    const timeout3 = setTimeout(scrollToTop, 300);
    const timeout4 = setTimeout(scrollToTop, 500);
    const timeout5 = setTimeout(scrollToTop, 1000);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
    };
  }, []);
  const mediaQueryMatch = useMediaQuery('(max-width: 768px)');
  const capabilities = useMobileCapabilities();

  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return mediaQueryMatch;
    }

    const ua = navigator.userAgent || '';
    const uaMobile =
      /Android|iPhone|iPad|iPod|Windows Phone|Mobile|BlackBerry/i.test(ua) ||
      ((navigator as any).userAgentData?.mobile ?? false);

    const detected =
      uaMobile ||
      (capabilities.isTouchDevice && (mediaQueryMatch || capabilities.screenWidth <= 1024));

    return detected;
  }, [mediaQueryMatch, capabilities]);
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  const [chatInviteCode, setChatInviteCode] = useState<string | undefined>();
  const [isInGame, setIsInGame] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { open } = useAppKitSafe();

  useEffect(() => {
    setIsChatVisible(false);
  }, [isMobile]);

  const handleClose = () => {
    // Navigate back to main site
    window.location.href = '/';
  };

  const handleModeSelect = (mode: 'singleplayer' | 'multiplayer') => {
    setGameMode(mode);
  };

  const handleBackToModeSelect = () => {
    // Reset game state when going back to mode selection
    setIsInGame(false);
    setChatInviteCode(undefined);
  };



  const handleGameStart = (inviteCode?: string) => {
    setIsInGame(true);
    setChatInviteCode(inviteCode);
  };

  const handleChatToggle = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleChatMinimize = () => {
    setIsChatVisible(false);
  };

  const walletButton = (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => {
          if (!isConnected) {
            void open({ view: 'Connect' });
          } else {
            void open({ view: 'Account' });
          }
        }} 
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: isConnected ? 'limegreen' : 'red',
          fontWeight: 'bold'
        }}
      >
        <span style={{
          height: '10px',
          width: '10px',
          borderRadius: '50%',
          backgroundColor: isConnected ? 'limegreen' : 'red',
          marginRight: '8px',
          border: '1px solid black'
        }}></span>
        {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Disconnected'}
      </div>
    </div>
  );

  return (
    <div className={`chess-page ${isMobile ? 'mobile' : 'desktop'}`}>
      <LinuxNavBar
        walletButton={walletButton}
        connectionStatus={{
          connected: isConnected,
          address: address,
          ens: undefined
        }}
        onOpenPublicChat={handleChatToggle}
        onOpenProfile={() => setShowProfile(true)}
      />
      <div className="chess-content">
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
      
      {/* Independent Chat Window - Available on both desktop and mobile when opened via menu */}
      {/* Chat is now opened via menu button in ChessGame/ChessMultiplayer components */}
      {isChatVisible && (
        <ChessChat
          isOpen={isChatVisible}
          onMinimize={handleChatMinimize} // Allow minimizing
          currentInviteCode={chatInviteCode}
          isDraggable={!isMobile}
          isResizable={!isMobile}
          isMobile={isMobile}
        />
      )}
      
      {showProfile && (
        <Suspense fallback={<div>Loading...</div>}>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#c0c0c0',
            border: '2px outset #fff',
            padding: '20px',
            zIndex: 10000,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => setShowProfile(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
            <PlayerProfile isMobile={isMobile} />
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default ChessPage; 