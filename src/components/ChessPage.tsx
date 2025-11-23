import React, { useState, useEffect } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import { ChessChat } from './ChessChat';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { sdk } from '@farcaster/miniapp-sdk';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  // Scroll to top on mount and whenever component updates
  useEffect(() => {
    const scrollToTop = () => {
      try {
        // Try multiple methods to ensure scrolling works in all contexts (including iframes)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        // Also try scrolling the root element
        const root = document.getElementById('root');
        if (root) {
          root.scrollTop = 0;
        }
        // Try scrolling the chess-page element
        const chessPage = document.querySelector('.chess-page');
        if (chessPage) {
          (chessPage as HTMLElement).scrollTop = 0;
        }
      } catch (error) {
        // Silently handle cross-origin frame access errors (expected in iframe contexts)
        // This is normal when embedded in Farcaster/Base apps
      }
    };
    
    scrollToTop();
    // Also scroll after multiple delays to ensure DOM is ready and any iframe context is loaded
    const timeout1 = setTimeout(scrollToTop, 100);
    const timeout2 = setTimeout(scrollToTop, 300);
    const timeout3 = setTimeout(scrollToTop, 500);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);

  // Call SDK ready() when ChessPage loads (backup call for /chess route)
  useEffect(() => {
    const callReady = async () => {
      console.log('[MINIAPP] ChessPage: Attempting to call ready()...');
      
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
            await sdk.actions.ready();
            console.log('[MINIAPP] ✅ ChessPage: SDK ready() called successfully on attempt', attempt + 1);
            return;
          } else {
            console.log(`[MINIAPP] ChessPage: Attempt ${attempt + 1}/5: SDK not ready yet`);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`[MINIAPP] ChessPage: Attempt ${attempt + 1}/5 failed:`, error);
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      
      console.error('[MINIAPP] ❌ ChessPage: Failed to call ready() after all attempts');
    };
    
    const timer = setTimeout(callReady, 200);
    return () => clearTimeout(timer);
  }, []);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  const [chatInviteCode, setChatInviteCode] = useState<string | undefined>();
  const [isInGame, setIsInGame] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(!isMobile); // Hide chat by default on mobile

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