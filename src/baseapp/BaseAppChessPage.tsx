import React, { useState, useEffect, useMemo } from 'react';
import { BaseAppChessGame } from './BaseAppChessGame';
import { BaseAppChessMultiplayer } from './BaseAppChessMultiplayer';
import { ChessChat } from '../components/ChessChat';
import { ThemeToggle } from '../components/ThemeToggle';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import { initBaseMiniApp } from '../utils/baseMiniapp';
import '../components/ChessMultiplayer.css';
import '../components/ChessPage.css';

const BaseAppChessPage: React.FC = () => {
  // Initialize Base Mini App SDK
  useEffect(() => {
    void initBaseMiniApp();
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

  useEffect(() => {
    setIsChatVisible(false);
  }, [isMobile]);

  const handleClose = () => {
    window.location.href = '/';
  };

  const handleModeSelect = (mode: 'singleplayer' | 'multiplayer') => {
    setGameMode(mode);
  };

  const handleBackToModeSelect = () => {
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
      {/* Theme Toggle - Always visible in Base app */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 10000,
        backgroundColor: 'rgba(192, 192, 192, 0.95)',
        border: '2px outset #fff',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        <ThemeToggle />
      </div>

      <div className="chess-content">
        {gameMode === 'singleplayer' ? (
          <BaseAppChessGame 
            onClose={handleClose} 
            onBackToModeSelect={handleBackToModeSelect}
            onGameStart={handleGameStart}
            onChatToggle={handleChatToggle}
            isChatMinimized={!isChatVisible}
            isMobile={isMobile}
          />
        ) : (
          <BaseAppChessMultiplayer 
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
          isDraggable={!isMobile}
          isResizable={!isMobile}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default BaseAppChessPage;
