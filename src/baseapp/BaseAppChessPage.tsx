import React, { useState, useEffect, useMemo } from 'react';
import { BaseAppChessGame } from './BaseAppChessGame';
import { BaseAppChessMultiplayer } from './BaseAppChessMultiplayer';
import { ChessChat } from '../components/ChessChat';
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

  // Detect Base Mini App
  const isBaseMiniAppDetected = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();
  
  const isMobile = useMemo(() => {
    // Don't treat Base Mini App as mobile
    if (isBaseMiniAppDetected) {
      return false;
    }
    
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
  }, [mediaQueryMatch, capabilities, isBaseMiniAppDetected]);

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
    <div 
      className={`chess-page ${isMobile ? 'mobile' : 'desktop'}`}
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
      <div 
        className="chess-content"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
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
