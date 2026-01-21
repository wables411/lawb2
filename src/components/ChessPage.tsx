import React, { useState, useEffect, useMemo } from 'react';
import { ChessGame } from './ChessGame';
import LinuxNavBar from './LinuxNavBar';
import { useAccount } from 'wagmi';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import './ChessPageSimple.css';

const ChessPage: React.FC = () => {

  // Scroll to top on mount and whenever component updates
  useEffect(() => {
    // IMPORTANT: Vite template sets `body { display:flex; place-items:center; }` in `index.css`,
    // which vertically centers the whole app and creates huge "empty space" above the chess home
    // buttons on mobile. Scope the override to the /chess route only.
    document.body.classList.add('chess-route');

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
      document.body.classList.remove('chess-route');
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
  const { address, isConnected } = useAccount();
  const { open } = useAppKitSafe();

  const handleClose = () => {
    window.location.href = '/';
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
    <div className={`chess-page-simple ${isMobile ? 'mobile' : 'desktop'}`}>
      <LinuxNavBar
        walletButton={walletButton}
        connectionStatus={{
          connected: isConnected,
          address: address,
          ens: undefined
        }}
        onChessClose={handleClose}
        showChessMenu={true}
      />
      <div className="chess-content-simple">
        <ChessGame 
          onClose={handleClose} 
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default ChessPage; 