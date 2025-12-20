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
    
    // Add body class to enable Base Mini App styles regardless of window width
    // This ensures mobile/miniapp styling works on desktop browsers too
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const isBaseApp = window.self !== window.top;
      if (isBaseApp) {
        document.body.classList.add('base-miniapp');
        document.documentElement.classList.add('base-miniapp');
      }
    }
    
    return () => {
      // Cleanup: remove class when component unmounts
      if (typeof document !== 'undefined') {
        document.body.classList.remove('base-miniapp');
        document.documentElement.classList.remove('base-miniapp');
      }
    };
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
  
  // Base Mini App should ALWAYS render in mobile/miniapp style (vertical, mobile-like)
  // regardless of the actual device it's opened on
  // Desktop browser visits should use desktop styling (handled by main.tsx routing)
  const isMobile = useMemo(() => {
    // Base Mini App is ALWAYS mobile-like (vertical miniapp style)
    if (isBaseMiniAppDetected) {
      return true; // Always use mobile/miniapp styling in Base Mini App
    }
    
    // For desktop browser visits (shouldn't happen since BaseAppChessPage is only for miniapp,
    // but fallback logic for safety)
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
      className={`chess-page ${isMobile ? 'mobile' : 'desktop'} ${isBaseMiniAppDetected ? 'baseapp' : ''}`}
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
