import React, { useState, useEffect } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import { ChessChat } from './ChessChat';
import { useMediaQuery } from '../hooks/useMediaQuery';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
      
      {/* Independent Chat Window - Only on desktop, hidden on mobile (chat is in sidebar popup) */}
      {!isMobile && (
        <ChessChat
          isOpen={isChatVisible}
          onMinimize={handleChatMinimize} // Allow minimizing
          currentInviteCode={chatInviteCode}
          isDraggable={true}
          isResizable={true}
          isMobile={false}
        />
      )}
    </div>
  );
};

export default ChessPage; 