import React, { useState, useEffect, useMemo } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import { ChessChat } from './ChessChat';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import { initBaseMiniApp } from '../utils/baseMiniapp';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  // Initialize Base Mini App SDK if running as Base Mini App (doesn't affect regular web app)
  useEffect(() => {
    void initBaseMiniApp();
  }, []);

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

    console.log('[CHESS_PAGE] Mobile detection', {
      mediaQueryMatch,
      capabilities,
      uaMobile,
      detected
    });

    return detected;
  }, [mediaQueryMatch, capabilities]);
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  const [chatInviteCode, setChatInviteCode] = useState<string | undefined>();
  const [isInGame, setIsInGame] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

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

  return (
    <div className={`chess-page ${isMobile ? 'mobile' : 'desktop'}`}>
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
    </div>
  );
};

export default ChessPage; 