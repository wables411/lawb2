import React, { useState, useEffect } from 'react';
import Desktop from '../components/Desktop';
import Taskbar from '../components/Taskbar';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAccount } from 'wagmi';
import { initBaseMiniApp, isBaseMiniApp, getSafeAreaInsets, applySafeAreaInsets, triggerHapticImpact, triggerHapticSelection, triggerHapticNotification } from '../utils/baseMiniapp';
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
const NFTGallery = lazy(() => import('../components/NFTGallery'));

// Uniform popup content wrapper style for miniapp
const POPUP_CONTENT_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  padding: '15px',
  WebkitOverflowScrolling: 'touch',
  wordWrap: 'break-word',
  wordBreak: 'break-word',
  maxWidth: '100%'
};

// Default popup size for miniapp - will be updated with safe area insets
// This is a fallback if safe area insets aren't available yet
const DEFAULT_MINIAPP_POPUP_SIZE = { 
  width: 'calc(100vw - 32px)', 
  height: 'calc(100vh - 60px)' // 16px top + 44px bottom (taskbar + padding)
};

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
  const [miniappPopupSize, setMiniappPopupSize] = useState(DEFAULT_MINIAPP_POPUP_SIZE);

  // Initialize Base Mini App SDK and apply safe area insets
  useEffect(() => {
    const initialize = async () => {
      await initBaseMiniApp();
      
      if (isBaseMiniApp()) {
        // Apply safe area insets as CSS variables
        await applySafeAreaInsets();
        
        // Get safe area insets and calculate popup size
        const insets = await getSafeAreaInsets();
        const taskbarHeight = 60;
        const padding = 16; // 8px on each side
        
        const width = `calc(100vw - ${insets.left + insets.right + padding * 2}px)`;
        const height = `calc(100vh - ${insets.top + insets.bottom + taskbarHeight + padding}px)`;
        
        setMiniappPopupSize({ width, height });
      }
    };
    
    void initialize();
  }, []);

  React.useEffect(() => {
    console.log('[BaseApp] showPublicChat state changed to:', showPublicChat);
    if (showPublicChat) {
      console.log('[BaseApp] Public chat should now be visible');
    }
  }, [showPublicChat]);

  const handleIconClick = async (action: string, popupId?: string, url?: string) => {
    console.log('[BaseApp] Icon clicked:', { action, popupId, url });
    
    // Haptic feedback for icon click
    await triggerHapticImpact('light');
    
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
        await triggerHapticNotification('error');
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
      return;
    }
  };

  const closePopup = async (popupId: string) => {
    await triggerHapticSelection();
    setActivePopup(null);
    setMinimizedPopups(prev => {
      const next = new Set(prev);
      next.delete(popupId);
      return next;
    });
  };

  const minimizePopup = async (popupId: string) => {
    await triggerHapticSelection();
    setActivePopup(null);
    setMinimizedPopups(prev => new Set(prev).add(popupId));
  };

  const restorePopup = async (popupId: string) => {
    await triggerHapticSelection();
    setMinimizedPopups(prev => {
      const next = new Set(prev);
      next.delete(popupId);
      return next;
    });
    setActivePopup(popupId);
  };

  const openPublicChat = async () => {
    console.log('[BaseApp] Opening public chat - button clicked');
    await triggerHapticImpact('light');
    console.log('[BaseApp] Setting showPublicChat to true');
    setShowPublicChat(true);
    console.log('[BaseApp] showPublicChat state updated');
  };

  const minimizePublicChat = async () => {
    await triggerHapticSelection();
    setShowPublicChat(false);
  };

  return (
    <>
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}>
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

      {/* Profile Popup */}
      {showProfile && (
        <Popup 
          id="profile-popup" 
          isOpen={true} 
          onClose={async () => {
            await triggerHapticSelection();
            setShowProfile(false);
          }} 
          onMinimize={async () => {
            await triggerHapticSelection();
            setShowProfile(false);
          }} 
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <Suspense fallback={<div>Loading...</div>}>
              <PlayerProfile isMobile={isBaseMiniApp()} />
            </Suspense>
          </div>
        </Popup>
      )}

      {/* Mint Popup */}
      {showMintPopup && (
        <Suspense fallback={<div>Loading...</div>}>
          <MintPopup 
            isOpen={true}
            onClose={async () => {
              await triggerHapticSelection();
              setShowMintPopup(false);
            }}
            onMinimize={async () => {
              await triggerHapticSelection();
              setShowMintPopup(false);
            }}
            walletAddress={address || ''}
          />
        </Suspense>
      )}

      {/* Meme Generator Popup */}
      {showMemeGenerator && (
        <Popup
          id="meme-generator-popup"
          isOpen={true}
          onClose={async () => {
            await triggerHapticSelection();
            setShowMemeGenerator(false);
          }}
          onMinimize={async () => {
            await triggerHapticSelection();
            setShowMemeGenerator(false);
          }}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <Suspense fallback={<div>Loading...</div>}>
              <MemeGenerator />
            </Suspense>
          </div>
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
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              purify your wallet and cleanse your soul with Purity Finance.
            </p>
            <p style={{ marginBottom: '10px' }}>
              swap any sol token in your wallet directly for $LAWB
            </p>
            <a href="https://www.purity.finance/lawb" target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer', color: '#0066cc', display: 'block', marginBottom: '10px' }}>click to Purify</a>
            <img src="/assets/puritylawb.png" alt="Purity Lawb" style={{ maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
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
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
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
                marginTop: '10px',
                marginBottom: '10px',
                display: 'block'
              }}
            >
              Click
            </button>
            <img 
              src="/assets/miladychanfaq.png" 
              alt="Miladychan FAQ" 
              style={{ 
                width: '100%', 
                maxWidth: '100%',
                height: 'auto',
                marginTop: '10px'
              }} 
            />
          </div>
        </Popup>
      )}

      {/* Lawbstation Popup */}
      {activePopup === 'lawbstation-popup' && (
        <Popup
          id="lawbstation-popup"
          isOpen={true}
          onClose={() => closePopup('lawbstation-popup')}
          onMinimize={() => minimizePopup('lawbstation-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on <a href="https://www.miladystation2.net/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>MiladyStation</a> technology. Inspired by Milady, Allstarz, Rusty Rollers, Cigawrette Packs, SPX6900 and Radbro. Brought to you in part by PortionClub and Mony Corp Group. LawbStations seem nice but a lobster controlled by MiladyStation will never achieve anything without a roadmap.
            </p>
            <p style={{ marginBottom: '10px' }}>Chain: Solana</p>
            <p style={{ marginBottom: '10px' }}>
              <a href="https://magiceden.us/marketplace/lawbstation" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Collect Lawbstations on Secondary</a>
            </p>
            <img src="/assets/lawbstation.GIF" alt="Lawbstation" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
            <video controls src="/assets/lawbstation.mp4" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
          </div>
        </Popup>
      )}

      {/* $LAWB Popup */}
      {activePopup === 'lawb-popup' && (
        <Popup
          id="lawb-popup"
          isOpen={true}
          onClose={() => closePopup('lawb-popup')}
          onMinimize={() => minimizePopup('lawb-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <h1 style={{ marginBottom: '10px' }}>
              <a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>🦞 $LAWB</a>
            </h1>
            <p style={{ marginBottom: '10px' }}>
              $lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap. Token created 03.15.24 on <a href="https://www.pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>pump.fun</a>.
            </p>
            <p style={{ marginBottom: '10px' }}>$lawb airdropped to LawbStation holders 03.19.24</p>
            <p style={{ marginBottom: '10px' }}>THERE IS NO MEME WE $LAWB YOU</p>
            <p style={{ marginBottom: '10px' }}>(sol) ca: 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6</p>
            <p style={{ marginBottom: '10px' }}>(base) ca: 0x7e18298b46A1F2399617cde083Fe11415A2ad15B</p>
            <p style={{ marginBottom: '10px' }}>(arb) ca: 0x741f8FbF42485E772D97f1955c31a5B8098aC962</p>
            <p style={{ marginBottom: '10px' }}>(dmt) ca: 0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F</p>
            <p style={{ marginBottom: '10px' }}>
              if you wish to bridge your $lawb token from solana to arbitrum to sanko, visit <a href="https://portalbridge.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>https://portalbridge.com/</a>
            </p>
            <p style={{ marginBottom: '10px' }}>step 1. connect solana wallet and select $lawb token (65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6)</p>
            <p style={{ marginBottom: '10px' }}>step 2. connect arbitrum wallet and select $lawb token (0x741f8FbF42485E772D97f1955c31a5B8098aC962)</p>
            <p style={{ marginBottom: '10px' }}>step 3. select token quantity, confirm transactions.</p>
            <p style={{ marginBottom: '10px' }}>step 4. now that you have $lawb on arbitrum, visit <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>https://sanko.xyz/bridge</a> and connect your arb wallet.</p>
          </div>
        </Popup>
      )}

      {/* Lawbstarz Popup */}
      {activePopup === 'lawbstarz-popup' && (
        <Popup
          id="lawbstarz-popup"
          isOpen={true}
          onClose={() => closePopup('lawbstarz-popup')}
          onMinimize={() => minimizePopup('lawbstarz-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              ☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ LAWBSTARZ IS AN <a href="https://allstarz.world" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>ALLSTARZ</a> DERIVATIVE ☆ LAWBSTARZ IS INSPIRED BY <a href="https://www.remilia.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>REMILIA CORP</a> ☆ LED BY NETWORK SPIRITUALITY ☆ 666 <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>CIGAWRETTEPACKS</a> WERE CONSUMED BY <a href="https://x.com/portionclub69" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>PORTIONCLUB69</a> AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆
            </p>
            <p>Chain: Ethereum</p>
            <p>
              Collect on <a href="https://magiceden.us/collections/ethereum/0xd7922cd333da5ab3758c95f774b092a7b13a5449" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Secondary</a>
            </p>
            <img src="/assets/lawbstarz.gif" alt="Lawbstarz" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
            <blockquote className="twitter-tweet" data-media-max-width="560" style={{ marginTop: '10px', marginBottom: '10px' }}>
              <p lang="en" dir="ltr">The following 🧵 has been transcripted from a live news broadcast:<br/><br/>Anchor: &ldquo;Good evening, viewers. Tonight, we embark on an extraordinary journey that defies rational explanation. It all began with February&apos;s Cigawrette Packs cargo ship hijacking, little did we know that the.. <a href="https://t.co/BWgLOk59N4">pic.twitter.com/BWgLOk59N4</a></p>&mdash; wables (@wables411) <a href="https://twitter.com/wables411/status/1669009492007354369?ref_src=twsrc%5Etfw">June 14, 2023</a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js"></script>
            <img src="/assets/lawbstarzhotelroom.png" alt="Lawbstarz Hotel Room" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
            <img src="/assets/tile-06-audio-image0-lawbstarz dj set 1.0 copy.png" alt="Lawbstarz DJ Set" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
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
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <Suspense fallback={<div>Loading...</div>}>
              <AsciiLawbsterMint walletAddress={address || ''} onMintSuccess={() => {}} />
            </Suspense>
          </div>
        </Popup>
      )}

      {/* NFT Gallery Popup */}
      {activePopup === 'nft-gallery-popup' && (
        <Popup
          id="nft-gallery-popup"
          isOpen={true}
          onClose={() => closePopup('nft-gallery-popup')}
          onMinimize={() => minimizePopup('nft-gallery-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <Suspense fallback={<div>Loading...</div>}>
              <NFTGallery 
                isOpen={true}
                onClose={() => closePopup('nft-gallery-popup')}
                renderAsContent={true}
              />
            </Suspense>
          </div>
        </Popup>
      )}

      {/* Lawbsters Popup */}
      {activePopup === 'lawbsters-popup' && (
        <Popup
          id="lawbsters-popup"
          isOpen={true}
          onClose={() => closePopup('lawbsters-popup')}
          onMinimize={() => minimizePopup('lawbsters-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Cigawrette Packs</a> derivative.
            </p>
            <p style={{ marginBottom: '10px' }}>Chain: Ethereum</p>
            <p style={{ marginBottom: '10px' }}>
              Collect on <a href="https://magiceden.us/collections/ethereum/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Secondary</a> or <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/buy/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>NFTX</a>
            </p>
            <div style={{ maxWidth: '400px', margin: '0 auto', marginBottom: '10px' }}>
              {/* Tweet component would go here if available */}
            </div>
            <img src="/assets/lawbsters.gif" alt="Lawbsters" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
          </div>
        </Popup>
      )}

      {/* Pixelawbs Popup */}
      {activePopup === 'pixelawbs-popup' && (
        <Popup
          id="pixelawbs-popup"
          isOpen={true}
          onClose={() => closePopup('pixelawbs-popup')}
          onMinimize={() => minimizePopup('pixelawbs-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => { closePopup('pixelawbs-popup'); setShowMintPopup(true); }}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>SCATTER.ART</a>
            </p>
            <p style={{ marginBottom: '10px' }}>Chain: Ethereum</p>
            <p style={{ marginBottom: '10px' }}>
              Collect on <a href="https://magiceden.us/collections/ethereum/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Secondary</a>
            </p>
            <img src="/assets/pixelawb.png" alt="Pixelawbs" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
          </div>
        </Popup>
      )}

      {/* Halloween Popup */}
      {activePopup === 'halloween-popup' && (
        <Popup
          id="halloween-popup"
          isOpen={true}
          onClose={() => closePopup('halloween-popup')}
          onMinimize={() => minimizePopup('halloween-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              Halloween Lawbsters - Spooky collection details
            </p>
            <p style={{ marginBottom: '10px' }}>Chain: Base</p>
            <p style={{ marginBottom: '10px' }}>
              Collect on <a href="https://magiceden.us/collections/base" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Secondary</a>
            </p>
            <img src="/assets/lawbsterhalloween.gif" alt="Halloween Lawbsters" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
          </div>
        </Popup>
      )}

      {/* Nexus Popup */}
      {activePopup === 'nexus-popup' && (
        <Popup
          id="nexus-popup"
          isOpen={true}
          onClose={() => closePopup('nexus-popup')}
          onMinimize={() => minimizePopup('nexus-popup')}
          zIndex={2000}
          initialSize={miniappPopupSize}
        >
          <div style={POPUP_CONTENT_STYLE}>
            <p style={{ marginBottom: '10px' }}>
              1000 Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana. Collect on <a href="https://magiceden.us/marketplace/lawbnexus" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Secondary</a>
            </p>
            <img src="/assets/nexus.gif" alt="Nexus" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px', marginBottom: '10px' }} />
            <video controls src="/assets/nexusminting.mp4" style={{ width: '100%', maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
          </div>
        </Popup>
      )}
      </div>

      {/* Public Chat - Render outside overflow container to ensure visibility */}
      {showPublicChat && (
        <Suspense fallback={<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10003, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading chat...</div>}>
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
    </>
  );
}

export default BaseApp;
