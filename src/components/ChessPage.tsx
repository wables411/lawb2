import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { ChessGame } from './ChessGame';
import LinuxNavBar from './LinuxNavBar';
import { useAccount } from 'wagmi';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import Popup from './Popup';
import { ChessPieceSetProvider } from '../contexts/ChessPieceSetContext';
import { debugIngest } from '../utils/debugIngest';
import './ChessPageSimple.css';

const ChessPieceInfo = lazy(() => import('./ChessPieceInfo').then(m => ({ default: m.ChessPieceInfo })));
const ChessChat = lazy(() => import('./ChessChat').then(m => ({ default: m.ChessChat })));
const PlayerProfile = lazy(() => import('./PlayerProfile').then(m => ({ default: m.PlayerProfile })));
const ChessSpectator = lazy(() => import('./ChessSpectator').then(m => ({ default: m.ChessSpectator })));

const isSpectatorMode = (() => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('stream') === '1' || params.get('spectate') === '1';
})();

/** Wallet-connected chess page — the normal player experience. */
const ChessPageConnected: React.FC = () => {
  const [showChessPieceInfo, setShowChessPieceInfo] = useState(false);
  const [showPublicChat, setShowPublicChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Scroll to top on mount and whenever component updates
  useEffect(() => {
    // IMPORTANT: Vite template sets `body { display:flex; place-items:center; }` in `index.css`,
    // which vertically centers the whole app and creates huge "empty space" above the chess home
    // buttons on mobile. Scope the override to the /chess route only.
    document.body.classList.add('chess-route');

    // #region agent log (hypothesis H1: body/#root centering is causing vertical offset)
    debugIngest({sessionId:'debug-session',runId:'mobile-topspace-pre',hypothesisId:'H1',location:'ChessPage.tsx:useEffect(mount)',message:'ChessPage mounted: body class + computed layout',data:(()=>{const cs=window.getComputedStyle(document.body);const root=document.getElementById('root');const rcs=root?window.getComputedStyle(root):null;return{bodyClass:document.body.className,bodyDisplay:cs.display,bodyAlignItems:(cs as any).alignItems,bodyJustifyContent:(cs as any).justifyContent,bodyPlaceItems:(cs as any).placeItems,rootDisplay:rcs?.display,rootAlignSelf:rcs?((rcs as any).alignSelf):undefined,inner:{w:window.innerWidth,h:window.innerHeight},vv:(window as any).visualViewport?{w:(window as any).visualViewport.width,h:(window as any).visualViewport.height,offsetTop:(window as any).visualViewport.offsetTop}:null,scroll:{y:window.scrollY,docEl:(document.documentElement&&{scrollTop:document.documentElement.scrollTop,clientH:document.documentElement.clientHeight,scrollH:document.documentElement.scrollHeight})}}})(),timestamp:Date.now()});
    // #endregion agent log

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

    // #region agent log (hypothesis H2: chess containers are centered within viewport)
    requestAnimationFrame(() => {
      debugIngest({sessionId:'debug-session',runId:'mobile-topspace-pre',hypothesisId:'H2',location:'ChessPage.tsx:rAF(after scrollToTop)',message:'Post-layout rects (page + home-view + first button)',data:(()=>{const page=document.querySelector('.chess-page-simple') as HTMLElement|null;const home=document.querySelector('.game-stable-layout.home-view') as HTMLElement|null;const panel=document.querySelector('.game-mode-panel-streamlined') as HTMLElement|null;const btn=document.querySelector('.mode-selection-compact button') as HTMLElement|null;const rect=(el:HTMLElement|null)=>el?{top:Math.round(el.getBoundingClientRect().top),left:Math.round(el.getBoundingClientRect().left),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}:null;return{page:rect(page),home:rect(home),panel:rect(panel),firstBtn:rect(btn),scrollY:window.scrollY}})(),timestamp:Date.now()});
    });
    // #endregion agent log

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
  const connectionDisplay = useConnectionDisplay();
  const { open } = useAppKitSafe();

  const handleClose = () => {
    window.location.href = '/';
  };

  const walletButton = (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => {
          if (!connectionDisplay.connected) {
            void open({ view: 'Connect' });
          } else {
            void open({ view: 'Account' });
          }
        }} 
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: connectionDisplay.connected ? 'limegreen' : 'red',
          fontWeight: 'bold'
        }}
      >
        <span style={{
          height: '10px',
          width: '10px',
          borderRadius: '50%',
          backgroundColor: connectionDisplay.connected ? 'limegreen' : 'red',
          marginRight: '8px',
          border: '1px solid black'
        }}></span>
        {connectionDisplay.connected ? `${connectionDisplay.address?.slice(0, 6)}...${connectionDisplay.address?.slice(-4)}` : 'Disconnected'}
      </div>
    </div>
  );

  return (
    <ChessPieceSetProvider>
      <div className={`chess-page-simple ${isMobile ? 'mobile' : 'desktop'}`}>
        <LinuxNavBar
          walletButton={walletButton}
          connectionStatus={{
            connected: connectionDisplay.connected,
            address: connectionDisplay.address,
            ens: connectionDisplay.ens
          }}
          onOpenPublicChat={() => {
            console.log('[CHESSPAGE] onOpenPublicChat called, setting showPublicChat to true');
            setShowPublicChat(true);
          }}
          onOpenProfile={() => {
            console.log('[CHESSPAGE] onOpenProfile called, setting showProfile to true');
            setShowProfile(true);
          }}
        />
        <div className="chess-content-simple">
          <ChessGame 
            onClose={handleClose} 
            isMobile={isMobile}
          />
        </div>
        
        {showChessPieceInfo && (
          <Popup 
            id="chess-piece-info-popup" 
            isOpen={true} 
            onClose={() => {
              console.log('[CHESSPAGE] Closing Chess Piece Info popup');
              setShowChessPieceInfo(false);
            }} 
            onMinimize={() => {
              console.log('[CHESSPAGE] Minimizing Chess Piece Info popup');
              setShowChessPieceInfo(false);
            }} 
            title="Chess Piece Info" 
            initialPosition={isMobile ? { x: 16, y: 16 } : { x: 100, y: 100 }} 
            initialSize={isMobile ? { width: 'calc(100vw - 32px)', height: 'calc(100vh - 100px)' } : { width: 400, height: 500 }} 
            zIndex={999998}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <ChessPieceInfo isMobile={isMobile} />
            </Suspense>
          </Popup>
        )}
        
        {showPublicChat && (
          <Popup 
            id="public-chat-popup" 
            isOpen={true} 
            onClose={() => {
              console.log('[CHESSPAGE] Closing Public Chat popup');
              setShowPublicChat(false);
            }} 
            onMinimize={() => {
              console.log('[CHESSPAGE] Minimizing Public Chat popup');
              setShowPublicChat(false);
            }} 
            title="Public Chat" 
            initialPosition={isMobile ? { x: 16, y: 16 } : { x: 20, y: 120 }} 
            initialSize={isMobile ? { width: 'calc(100vw - 32px)', height: 'calc(100vh - 100px)' } : { width: 400, height: 500 }} 
            zIndex={999998}
          >
            <Suspense fallback={<div>Loading chat...</div>}>
              <ChessChat
                isOpen={true}
                onMinimize={() => setShowPublicChat(false)}
                currentInviteCode={undefined}
                isDraggable={false}
                isResizable={false}
                isMobile={isMobile}
              />
            </Suspense>
          </Popup>
        )}
        
        {showProfile && (
          <Popup 
            id="profile-popup" 
            isOpen={true} 
            onClose={() => {
              console.log('[CHESSPAGE] Closing Profile popup');
              setShowProfile(false);
            }} 
            onMinimize={() => {
              console.log('[CHESSPAGE] Minimizing Profile popup');
              setShowProfile(false);
            }} 
            title="Profile" 
            initialPosition={isMobile ? { x: 16, y: 16 } : { x: 20, y: 180 }} 
            initialSize={isMobile ? { width: 'calc(100vw - 32px)', height: 'calc(100vh - 100px)' } : { width: 400, height: 500 }} 
            zIndex={999998}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <div className="chess-chat-window desktop" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                  <PlayerProfile isMobile={isMobile} />
                </div>
              </div>
            </Suspense>
          </Popup>
        )}
      </div>
    </ChessPieceSetProvider>
  );
};

/** Top-level route component — routes to spectator or connected player view. */
const ChessPage: React.FC = () => {
  if (isSpectatorMode) {
    return (
      <ChessPieceSetProvider>
        <Suspense fallback={<div style={{ background: '#0a0a0a', width: '100vw', height: '100vh' }} />}>
          <ChessSpectator />
        </Suspense>
      </ChessPieceSetProvider>
    );
  }

  return <ChessPageConnected />;
};

export default ChessPage;
