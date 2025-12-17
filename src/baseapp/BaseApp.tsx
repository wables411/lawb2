import React, { useState } from 'react';
import Desktop from '../components/Desktop';
import Taskbar from '../components/Taskbar';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAccount } from 'wagmi';
import { initBaseMiniApp } from '../utils/baseMiniapp';
import { lazy, Suspense } from 'react';
import Popup from '../components/Popup';
import { PlayerProfile } from '../components/PlayerProfile';
import { ChessChat } from '../components/ChessChat';

// Base app specific components
const BaseAppChessPage = lazy(() => import('./BaseAppChessPage'));

// Base app specific popups
const AsciiLawbsterMint = lazy(() => import('../components/AsciiLawbsterMint'));

function BaseApp() {
  const { address, isConnected } = useAccount();
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [minimizedPopups, setMinimizedPopups] = useState<Set<string>>(new Set());
  const [showPublicChat, setShowPublicChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [windowPositions, setWindowPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [windowSizes, setWindowSizes] = useState<Record<string, { width: number; height: number }>>({});

  // Initialize Base Mini App SDK
  React.useEffect(() => {
    void initBaseMiniApp();
  }, []);

  const handleIconClick = (action: string, popupId?: string, url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action === 'chess') {
      window.location.href = '/chess';
      return;
    }

    if (popupId) {
      if (minimizedPopups.has(popupId)) {
        restorePopup(popupId);
      } else {
        setActivePopup(popupId);
      }
    }
  };

  const closePopup = (popupId: string) => {
    setActivePopup(null);
    setMinimizedPopups(prev => {
      const next = new Set(prev);
      next.delete(popupId);
      return next;
    });
  };

  const minimizePopup = (popupId: string) => {
    setActivePopup(null);
    setMinimizedPopups(prev => new Set(prev).add(popupId));
  };

  const restorePopup = (popupId: string) => {
    setMinimizedPopups(prev => {
      const next = new Set(prev);
      next.delete(popupId);
      return next;
    });
    setActivePopup(popupId);
  };

  const openPublicChat = () => {
    setShowPublicChat(true);
  };

  const minimizePublicChat = () => {
    setShowPublicChat(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Desktop onIconClick={handleIconClick} />

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

      <Taskbar
        minimizedWindows={Array.from(minimizedPopups)}
        onRestoreWindow={restorePopup}
        connectionStatus={{
          connected: isConnected,
          address: address,
          ens: undefined
        }}
        onOpenPublicChat={openPublicChat}
      />

      {/* Public Chat */}
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChessChat
          isOpen={showPublicChat}
          onMinimize={minimizePublicChat}
          currentInviteCode={undefined}
          isDraggable={true}
          isResizable={true}
          isMobile={false}
        />
      </Suspense>

      {/* Profile Popup */}
      {showProfile && (
        <Popup id="profile-popup" isOpen={true} onClose={() => setShowProfile(false)} onMinimize={() => setShowProfile(false)} zIndex={2000}>
          <Suspense fallback={<div>Loading...</div>}>
            <PlayerProfile isMobile={false} />
          </Suspense>
        </Popup>
      )}

      {/* ASCII Lawbs Popup - Base app default */}
      {activePopup === 'asciilawbs-popup' && (
        <Popup
          id="asciilawbs-popup"
          isOpen={true}
          onClose={() => closePopup('asciilawbs-popup')}
          onMinimize={() => minimizePopup('asciilawbs-popup')}
          zIndex={2000}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <AsciiLawbsterMint />
          </Suspense>
        </Popup>
      )}
    </div>
  );
}

export default BaseApp;
