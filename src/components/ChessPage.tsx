import React, { useState, useEffect } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import { ChessChat } from './ChessChat';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { getSDKInstance } from '../main';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  // Scroll to top on mount and whenever component updates
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    scrollToTop();
    // Also scroll after a brief delay to ensure DOM is ready
    const timeout = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Call SDK ready() when ChessPage loads (backup call for /chess route)
  useEffect(() => {
    const callReady = async () => {
      console.log('[MINIAPP] ChessPage: Attempting to call ready()...');
      
      // Try multiple times with delays
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const sdk = getSDKInstance();
          
          if (!sdk) {
            console.log(`[MINIAPP] ChessPage: SDK not available yet, attempt ${attempt + 1}/10`);
            await new Promise(resolve => setTimeout(resolve, 200));
            continue;
          }
          
          if (sdk && sdk.actions && sdk.actions.ready) {
            await new Promise(resolve => setTimeout(resolve, 200));
            
            await sdk.actions.ready();
            console.log('[MINIAPP] ✅ ChessPage: SDK ready() called successfully');
            return;
          }
        } catch (error) {
          console.warn(`[MINIAPP] ChessPage: Attempt ${attempt + 1} failed:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.error('[MINIAPP] ❌ ChessPage: Failed to call ready() after all attempts');
    };
    
    callReady();
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