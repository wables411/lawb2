import React, { useState } from 'react';
import Desktop from '../components/Desktop';
import Taskbar from '../components/Taskbar';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAccount } from 'wagmi';
import { initBaseMiniApp, isBaseMiniApp } from '../utils/baseMiniapp';
import { lazy, Suspense } from 'react';
import Popup from '../components/Popup';
import { PlayerProfile } from '../components/PlayerProfile';
import { ChessChat } from '../components/ChessChat';

// Base app specific components
const BaseAppChessPage = lazy(() => import('./BaseAppChessPage'));

// Base app specific popups
const AsciiLawbsterMint = lazy(() => import('../components/AsciiLawbsterMint'));
const MintPopup = lazy(() => import('../components/MintPopup'));
const MemeGenerator = lazy(() => import('../components/MemeGenerator'));

function BaseApp() {
  const { address, isConnected } = useAccount();
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [minimizedPopups, setMinimizedPopups] = useState<Set<string>>(new Set());
  const [showPublicChat, setShowPublicChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [showMemeGenerator, setShowMemeGenerator] = useState(false);
  const [windowPositions, setWindowPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [windowSizes, setWindowSizes] = useState<Record<string, { width: number; height: number }>>({});

  // Initialize Base Mini App SDK
  React.useEffect(() => {
    void initBaseMiniApp();
  }, []);

  React.useEffect(() => {
    console.log('[BaseApp] showPublicChat changed:', showPublicChat);
  }, [showPublicChat]);

  const handleIconClick = (action: string, popupId?: string, url?: string) => {
    console.log('[BaseApp] Icon clicked:', { action, popupId, url });
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action === 'chess') {
      window.location.href = '/chess';
      return;
    }

    if (action === 'wallet' || action === 'profile') {
      setShowProfile(true);
      return;
    }

    if (action === 'mint') {
      if (!address) {
        alert('Please connect your wallet first!');
        return;
      }
      setShowMintPopup(true);
      return;
    }

    if (action === 'meme-generator') {
      setShowMemeGenerator(true);
      return;
    }

    if (action === 'nft-gallery') {
      setActivePopup('nft-gallery-popup');
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
    console.log('[BaseApp] Opening public chat');
    setShowPublicChat(true);
  };

  const minimizePublicChat = () => {
    setShowPublicChat(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Desktop onIconClick={handleIconClick} />

      <Taskbar
        minimizedWindows={Array.from(minimizedPopups)}
        onRestoreWindow={restorePopup}
        connectionStatus={{
          connected: isConnected,
          address: address,
          ens: undefined
        }}
        onOpenPublicChat={openPublicChat}
        onOpenProfile={() => setShowProfile(true)}
      />

      {/* Public Chat */}
      {showPublicChat && (
        <Suspense fallback={<div>Loading chat...</div>}>
          <ChessChat
            isOpen={showPublicChat}
            onMinimize={minimizePublicChat}
            currentInviteCode={undefined}
            isDraggable={!isBaseMiniApp()}
            isResizable={!isBaseMiniApp()}
            isMobile={isBaseMiniApp()}
          />
        </Suspense>
      )}

      {/* Profile Popup */}
      {showProfile && (
        <Popup 
          id="profile-popup" 
          isOpen={true} 
          onClose={() => setShowProfile(false)} 
          onMinimize={() => setShowProfile(false)} 
          zIndex={2000}
          initialSize={{ width: 'calc(100vw - 32px)', height: 'calc(100vh - 80px)' }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <PlayerProfile isMobile={isBaseMiniApp()} />
          </Suspense>
        </Popup>
      )}

      {/* Mint Popup */}
      {showMintPopup && (
        <Suspense fallback={<div>Loading...</div>}>
          <MintPopup 
            isOpen={true}
            onClose={() => setShowMintPopup(false)}
            onMinimize={() => setShowMintPopup(false)}
            walletAddress={address || ''}
          />
        </Suspense>
      )}

      {/* Meme Generator Popup */}
      {showMemeGenerator && (
        <Popup
          id="meme-generator-popup"
          isOpen={true}
          onClose={() => setShowMemeGenerator(false)}
          onMinimize={() => setShowMemeGenerator(false)}
          zIndex={2000}
          initialSize={{ width: 'calc(100vw - 32px)', height: 'calc(100vh - 80px)' }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <MemeGenerator />
          </Suspense>
        </Popup>
      )}

      {/* Purity Popup */}
      {activePopup === 'purity-popup' && (
        <Popup
          id="purity-popup"
          isOpen={true}
          onClose={() => closePopup('purity-popup')}
          onMinimize={() => minimizePopup('purity-popup')}
          zIndex={2000}
          initialSize={{ width: 'calc(100vw - 32px)', height: 'calc(100vh - 80px)' }}
        >
          <div style={{ padding: '15px' }}>
            <p style={{ marginBottom: '10px' }}>
              purify your wallet and cleanse your soul with Purity Finance.
            </p>
            <p style={{ marginBottom: '10px' }}>
              swap any sol token in your wallet directly for $LAWB
            </p>
            <a href="https://www.purity.finance/lawb" target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer', color: '#0066cc' }}>click to Purify</a>
            <img src="/assets/puritylawb.png" alt="Purity Lawb" style={{ maxWidth: '100%', marginTop: '10px' }} />
          </div>
        </Popup>
      )}

      {/* Miladychan Popup */}
      {activePopup === 'miladychan-popup' && (
        <Popup
          id="miladychan-popup"
          isOpen={true}
          onClose={() => closePopup('miladychan-popup')}
          onMinimize={() => minimizePopup('miladychan-popup')}
          zIndex={2000}
          initialSize={{ width: 'calc(100vw - 32px)', height: 'calc(100vh - 80px)' }}
        >
          <div style={{ padding: '15px' }}>
            <p style={{ marginBottom: '10px' }}>
              miladychan is a realtime imageboard inspired by the early 00's anonymous imageboard and its culture - embracing the loosely organized discussion & light-hearted funposting enabled by anonymity and transciency. Click(button) to be lawbed.
            </p>
            <button
              onClick={() => window.open('https://boards.miladychan.org/milady/33793', '_blank', 'noopener,noreferrer')}
              style={{
                background: '#c0c0c0',
                border: '2px outset #fff',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#000',
                marginTop: '10px'
              }}
            >
              Click
            </button>
            <img 
              src="/assets/miladychanfaq.png" 
              alt="Miladychan FAQ" 
              style={{ 
                width: '100%', 
                marginTop: '10px',
                maxWidth: '100%',
                height: 'auto'
              }} 
            />
          </div>
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
          initialSize={{ width: 'calc(100vw - 32px)', height: 'calc(100vh - 80px)' }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <AsciiLawbsterMint walletAddress={address || ''} onMintSuccess={() => {}} />
          </Suspense>
        </Popup>
      )}
    </div>
  );
}

export default BaseApp;
