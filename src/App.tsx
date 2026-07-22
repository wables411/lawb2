import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import Desktop from './components/Desktop';
import LinuxNavBar from './components/LinuxNavBar';
import { ThemeToggle } from './components/ThemeToggle';
import Popup from './components/Popup';
import { createUseStyles } from 'react-jss';
import { useAppKitSafe } from './hooks/useAppKitSafe';
import { useConnectionDisplay } from './hooks/useConnectionDisplay';
import { useDisconnect as useAppKitDisconnect } from '@reown/appkit/react';
import { useAccount, useChainId, useDisconnect as useWagmiDisconnect, useConnect } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useLawbAudio } from './contexts/LawbAudioContext';

// Lazy load heavy components to reduce initial bundle size
const MintPopup = lazy(() => import('./components/MintPopup'));
import type { ClawbStreamButtonHandle } from './components/ClawbStreamButton';
const ClawbStreamButton = lazy(() => import('./components/ClawbStreamButton'));
const NFTGallery = lazy(() => import('./components/NFTGallery'));
const MemeGenerator = lazy(() => import('./components/MemeGenerator'));
const DesktopBackground = lazy(() => import('./components/DesktopLobsterBackground'));
const PlayerProfile = lazy(() => import('./components/PlayerProfile').then((m) => ({ default: m.PlayerProfile })));
const LawbLeaderboardPanel = lazy(() =>
  import('./components/LawbLeaderboardPanel').then((m) => ({ default: m.LawbLeaderboardPanel })),
);

const useStyles = createUseStyles({
  body: {
    margin: 0,
    height: '100vh',
    width: '100vw',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    color: '#000',
    cursor: 'url("/assets/lawbpointer.png"), auto',
    position: 'relative',
    isolation: 'isolate',
    backgroundColor: 'transparent',
    // overflow: 'hidden', // Removed to allow modals to be clickable
  },
});

function App() {
  const LS_VIZ_MODE = 'lawbamp_viz_mode';
  const classes = useStyles();
  const { open } = useAppKitSafe();
  const { address, isConnected } = useAccount();
  const connectionDisplay = useConnectionDisplay();
  const { disconnect: disconnectEvm } = useWagmiDisconnect();
  const { disconnect: disconnectAppKit } = useAppKitDisconnect();
  const chainId = useChainId();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [activePopup, setActivePopup] = useState<string | null>(null);
  // Re-open Pixelawbs promo window on homepage load (skip stream mode).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('stream') === '1') return;
    setActivePopup((current) => current ?? 'pixelawbs-popup');
  }, []);
  
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [lawbTab, setLawbTab] = useState<'lawb' | 'clawb' | 'faq'>('lawb');

  const [minimizedPopups, setMinimizedPopups] = useState<Set<string>>(new Set());
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [mintPopupType, setMintPopupType] = useState<'selection' | 'pixelawbs' | 'asciilawbs'>('selection');
  const [showNFTGallery, setShowNFTGallery] = useState(false);
  const [showMemeGenerator, setShowMemeGenerator] = useState(false);
  const { state: audioState, actions: audioActions } = useLawbAudio();
  const audioActionsRef = useRef(audioActions);
  audioActionsRef.current = audioActions;

  const navigate = useNavigate();
  const clawbRef = useRef<ClawbStreamButtonHandle>(null);

  // Stream mode automation for OBS browser sources. Run once on mount — do not re-run on audioActions change.
  const streamAutoplayFiredRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isStreamMode = params.get('stream') === '1';
    if (!isStreamMode) return;
    const isWorldOnly = params.get('worldOnly') === '1';
    if (isWorldOnly) return;

    const wantsMiniPlayer = params.get('openPlayer') === '1';
    const wantsAutoplay = params.get('autoplay') === '1';
    const wantsViz = params.get('viz');

    if (wantsMiniPlayer && !audioState.showMiniPlayer) {
      audioActionsRef.current.toggleMiniPlayer();
    }

    if (wantsViz === 'ascii' || wantsViz === 'bars') {
      try {
        localStorage.setItem(LS_VIZ_MODE, wantsViz);
        window.dispatchEvent(new CustomEvent('lawbamp-viz-mode', { detail: { mode: wantsViz } }));
      } catch {
        // non-blocking
      }
    }

    if (wantsAutoplay && !streamAutoplayFiredRef.current) {
      streamAutoplayFiredRef.current = true;
      const t = setTimeout(() => {
        void audioActionsRef.current.play().catch(() => {});
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [audioState.showMiniPlayer]); // Intentionally exclude audioActions — prevents effect loop and duplicate play() storms

  // TikTok embed ref
  const tiktokRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activePopup === 'halloween-popup' && tiktokRef.current) {
      // Remove any previous script
      const prev = tiktokRef.current.querySelector('script[data-tiktok-embed]');
      if (prev) prev.remove();
      // Inject TikTok script
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.setAttribute('data-tiktok-embed', 'true');
      tiktokRef.current.appendChild(script);
    }
  }, [activePopup]);

  // Twitter widgets loading for tweet embeds (lawbsters + lawbstarz)
  useEffect(() => {
    if (activePopup === 'lawbstarz-popup' || activePopup === 'lawbsters-popup') {
      // Small delay to ensure popup is rendered
      const loadTwitterWidgets = () => {
        // Load Twitter widgets script if not already loaded
        if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
          const script = document.createElement('script');
          script.src = 'https://platform.twitter.com/widgets.js';
          script.async = true;
          script.charset = 'utf-8';
          document.body.appendChild(script);
          
          // Wait for script to load, then parse tweets
          script.onload = () => {
            // Additional delay to ensure twttr is fully initialized
            setTimeout(() => {
              if ((window as any).twttr && (window as any).twttr.widgets) {
                (window as any).twttr.widgets.load();
              }
            }, 100);
          };
        } else {
          // Script already loaded, wait a bit then parse tweets
          setTimeout(() => {
            if ((window as any).twttr && (window as any).twttr.widgets) {
              (window as any).twttr.widgets.load();
            }
          }, 200);
        }
      };
      
      // Delay to ensure popup content is rendered
      setTimeout(loadTwitterWidgets, 100);
    }
  }, [activePopup]);

  const handleIconClick = (action: string, popupId?: string, url?: string) => {
    console.log('[APP] handleIconClick called with:', { action, popupId, url });
    if (action === 'url' && url) {
      window.open(url, '_blank');
    } else if (action === 'popup' && popupId) {
      if (popupId === 'miladychan-popup') {
        // Miladychan window - open as a popup
        console.log('[APP] Opening Miladychan window');
        setActivePopup(popupId);
        setMinimizedPopups(prev => {
          const newSet = new Set(prev);
          newSet.delete(popupId);
          return newSet;
        });
        void document.body.offsetWidth;
      } else {
        console.log('[APP] Setting active popup to:', popupId);
        setActivePopup(popupId);
        setMinimizedPopups(prev => {
          const newSet = new Set(prev);
          newSet.delete(popupId);
          return newSet;
        });
        void document.body.offsetWidth;
      }
    } else if (action === 'wallet') {
      if (!connectionDisplay.connected) {
        // Open wallet connection modal
        void open({ view: 'Connect' });
      } else {
        // Open account management modal (chain selector/disconnect)
        void open({ view: 'Account' });
      }
    } else if (action === 'mint') {
      if (!address) {
        alert('Please connect your wallet first!');
        return;
      }
      setShowMintPopup(true);
    } else if (action === 'nft-gallery') {
      navigate('/gallery');
    } else if (action === 'meme-generator') {
      setShowMemeGenerator(true);
    } else if (action === 'lawb-profile') {
      setMinimizedPopups((prev) => {
        const next = new Set(prev);
        next.delete('profile-popup');
        return next;
      });
      setActivePopup('profile-popup');
    } else if (action === 'lawb-leaderboard') {
      setMinimizedPopups((prev) => {
        const next = new Set(prev);
        next.delete('leaderboard-popup');
        return next;
      });
      setActivePopup('leaderboard-popup');
    } else if (action === 'arcade') {
      navigate('/arcade');
    } else if (action === 'chess') {
      navigate('/chess');
    }
  };

  const closePopup = () => setActivePopup(null);
  
  const minimizePopup = (popupId: string) => {
    setMinimizedPopups(prev => new Set(prev).add(popupId));
    setActivePopup(null);
  };

  const restorePopup = (popupId: string) => {
    if (popupId === 'mint-popup') {
      setShowMintPopup(true);
    } else if (popupId === 'nft-gallery-popup') {
      setShowNFTGallery(true);
    } else if (popupId === 'meme-generator-popup') {
      setShowMemeGenerator(true);
    } else {
      setActivePopup(popupId);
    }
    setMinimizedPopups(prev => {
      const newSet = new Set(prev);
      newSet.delete(popupId);
      return newSet;
    });
  };

  const closeMintPopup = () => {
    setShowMintPopup(false);
    setMintPopupType('selection'); // Reset to selection for next time
  };
  const closeNFTGallery = () => setShowNFTGallery(false);
  const closeMemeGenerator = () => setShowMemeGenerator(false);

  const minimizeMintPopup = () => {
    setShowMintPopup(false);
    setMinimizedPopups(prev => new Set(prev).add('mint-popup'));
  };

  const minimizeNFTGallery = () => {
    setShowNFTGallery(false);
    setMinimizedPopups(prev => new Set(prev).add('nft-gallery-popup'));
  };

  const minimizeMemeGenerator = () => {
    setShowMemeGenerator(false);
    setMinimizedPopups(prev => new Set(prev).add('meme-generator-popup'));
  };

  const walletButton = (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => {
          if (!connectionDisplay.connected) {
            // Open wallet connection modal
            void open({ view: 'Connect' });
          } else {
            // Toggle wallet menu
            setShowWalletMenu(!showWalletMenu);
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
        {connectionDisplay.connected
          ? `${connectionDisplay.namespace === 'solana' ? 'SOL ' : ''}${connectionDisplay.address?.slice(0, 6)}...${connectionDisplay.address?.slice(-4)}`
          : 'Disconnected'}
      </div>
      {connectionDisplay.connected && showWalletMenu && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: '4px',
          background: '#c0c0c0',
          border: '2px outset #fff',
          padding: '4px',
          zIndex: 10000,
          minWidth: '120px'
        }}>
          <button
            onClick={() => {
              if (connectionDisplay.namespace === 'solana') {
                void disconnectAppKit({ namespace: 'solana' });
              } else if (connectionDisplay.namespace === 'eip155') {
                disconnectEvm();
              } else {
                void disconnectAppKit();
              }
              setShowWalletMenu(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '4px 8px',
              background: '#c0c0c0',
              border: '2px outset #fff',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'left'
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={classes.body}>
      {/* Desktop background: Lawbstation + Pixelawbs chess piece PNGs + ocean gradient */}
      <Suspense fallback={null}>
        <DesktopBackground />
      </Suspense>

      <Desktop onIconClick={handleIconClick} />

      <LinuxNavBar
        walletButton={walletButton}
        connectionStatus={{
          connected: connectionDisplay.connected,
          address: connectionDisplay.address,
          ens: connectionDisplay.ens
        }}
        onClawbClick={() => clawbRef.current?.triggerDance()}
        onOpenUwU={() => {
          setMinimizedPopups((prev) => {
            const next = new Set(prev);
            next.delete('uwu-popup');
            return next;
          });
          setActivePopup('uwu-popup');
        }}
      />

      {/* Clawb desktop CTA button in bottom-right */}
      <Suspense fallback={null}>
        <ClawbStreamButton ref={clawbRef} />
      </Suspense>

      <Popup id="miladychan-popup" isOpen={activePopup === 'miladychan-popup'} onClose={closePopup} onMinimize={minimizePopup} zIndex={2000}>
        <p style={{marginBottom: isMobile ? '12px' : '10px', fontSize: isMobile ? '16px' : '14px', lineHeight: isMobile ? '1.6' : '1.4'}}>
          miladychan is a realtime imageboard inspired by the early 00's anonymous imageboard and its culture - embracing the loosely organized discussion & light-hearted funposting enabled by anonymity and transciency. Click(button) to be lawbed.
        </p>
        <button
          onClick={() => window.open('https://boards.miladychan.org/milady/33793', '_blank', 'noopener,noreferrer')}
          style={{
            background: '#c0c0c0',
            border: '2px outset #fff',
            padding: isMobile ? '12px 16px' : '8px 16px',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: 'bold',
            color: '#000',
            marginTop: isMobile ? '12px' : '10px',
            minHeight: isMobile ? '44px' : 'auto',
            minWidth: isMobile ? '44px' : 'auto',
            touchAction: 'manipulation'
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
      </Popup>

      <Popup id="purity-popup" isOpen={activePopup === 'purity-popup'} onClose={closePopup} onMinimize={minimizePopup} zIndex={2000}>
        <p style={{marginBottom: isMobile ? '12px' : '10px', fontSize: isMobile ? '16px' : '14px', lineHeight: isMobile ? '1.6' : '1.4'}}>
          purify your wallet and cleanse your soul with Purity Finance.
        </p>
        <p style={{marginBottom: isMobile ? '12px' : '10px', fontSize: isMobile ? '16px' : '14px', lineHeight: isMobile ? '1.6' : '1.4'}}>
          swap any sol token in your wallet directly for $LAWB
        </p>
        <a href="https://www.purity.finance/lawb" target="_blank" rel="noopener noreferrer" style={{
          cursor: 'pointer',
          fontSize: isMobile ? '16px' : '14px',
          padding: isMobile ? '8px 12px' : '4px 8px',
          display: 'inline-block',
          minHeight: isMobile ? '44px' : 'auto',
          lineHeight: isMobile ? '28px' : 'inherit',
          touchAction: 'manipulation'
        }}>click to Purify</a>
        <img src="/assets/puritylawb.png" alt="Purity Lawb" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="lawbstarz-popup" isOpen={activePopup === 'lawbstarz-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          ☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ LAWBSTARZ IS AN <a href="https://allstarz.world" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>ALLSTARZ</a> DERIVATIVE ☆ LAWBSTARZ IS INSPIRED BY <a href="https://www.remilia.org/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>REMILIA CORP</a> ☆ LED BY NETWORK SPIRITUALITY ☆ 666 <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>CIGAWRETTEPACKS</a> WERE CONSUMED BY <a href="https://x.com/portionclub69" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>PORTIONCLUB69</a> AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆
        </p>
        <p>Chain: Ethereum</p>
        <p>
          Collect on <a href="https://opensea.io/collection/lawbstarz" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbstarz.webp" alt="Lawbstarz" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <div id="twitter-embed-lawbstarz">
          <blockquote className="twitter-tweet" data-media-max-width="560">
            <p lang="en" dir="ltr">The following 🧵 has been transcripted from a live news broadcast:<br/><br/>Anchor: &ldquo;Good evening, viewers. Tonight, we embark on an extraordinary journey that defies rational explanation. It all began with February&apos;s Cigawrette Packs cargo ship hijacking, little did we know that the.. <a href="https://t.co/BWgLOk59N4">pic.twitter.com/BWgLOk59N4</a></p>&mdash; wables (@wables411) <a href="https://twitter.com/wables411/status/1669009492007354369?ref_src=twsrc%5Etfw">June 14, 2023</a>
          </blockquote>
        </div>
        <img src="/assets/lawbstarzhotelroom.png" alt="Lawbstarz Hotel Room" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <img src="/assets/tile06-lawbstarz-djset.webp" alt="Lawbstarz DJ Set" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="lawbstation-popup" isOpen={activePopup === 'lawbstation-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on <a href="https://www.miladystation2.net/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>MiladyStation</a> technology. Inspired by Milady, Allstarz, Rusty Rollers, Cigawrette Packs, SPX6900 and Radbro. Brought to you in part by PortionClub and Mony Corp Group. LawbStations seem nice but a lobster controlled by MiladyStation will never achieve anything without a roadmap.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Solana</p>
        <p style={{marginBottom: '10px'}}>
          <a href="https://www.tensor.trade/trade/lawbstation" target="_blank" rel="noopener noreferrer">Collect Lawbstations on Secondary</a>
        </p>
        <img src="/assets/lawbstation.webp" alt="Lawbstation" style={{ width: '100%', marginTop: '10px' }} />
        <video controls src="/assets/lawbstation.mp4" style={{ width: '100%', marginTop: '10px' }} />
      </Popup>
      
      <Popup id="nexus-popup" isOpen={activePopup === 'nexus-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          1000 Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana. Collect on <a href="https://www.tensor.trade/trade/lawbnexus" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/nexus.webp" alt="Nexus" style={{ width: '100%', marginBottom: '10px' }} />
        <video controls src="/assets/nexusminting.mp4" style={{ width: '100%' }} />
      </Popup>

      <Popup id="lawbsters-popup" isOpen={activePopup === 'lawbsters-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Cigawrette Packs</a> derivative.
        </p>
        <p>Chain: Ethereum</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://opensea.io/collection/lawbsters" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a> or <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/buy/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>NFTX</a>
        </p>
        <div id="twitter-embed-lawbsters" style={{ maxWidth: '560px', margin: '10px auto', width: '100%' }}>
          <blockquote className="twitter-tweet" data-media-max-width="560">
            <a href="https://twitter.com/wables411/status/1620879129850834944?ref_src=twsrc%5Etfw">March 2, 2023</a>
          </blockquote>
        </div>
        <img src="/assets/lawbsters.gif" alt="Lawbsters" style={{ width: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="pixelawbs-popup" isOpen={activePopup === 'pixelawbs-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        {(() => {
          const handleCollectHere = (e: React.MouseEvent<HTMLSpanElement>) => {
            e.preventDefault();
            setActivePopup(null);
            setShowMintPopup(true);
          };
          return (
            <>
              <p style={{marginBottom: '10px'}}>
                PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{color: 'blue', textDecoration: 'underline', cursor: 'pointer'}} onClick={handleCollectHere}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>SCATTER.ART</a>
              </p>
              <video
                controls
                autoPlay
                loop
                muted
                playsInline
                src="/assets/pixelawbs.mp4"
                style={{ width: '100%', marginBottom: '10px' }}
                preload="auto"
                poster="/assets/pixelawbsintro.webp"
              />
              <p style={{marginBottom: '10px'}}>
                2222 Pixelated Lawbsters inspired by <a href="https://pixeladymaker.net/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>PixeladyMaker</a>
              </p>
              <p style={{marginBottom: '10px'}}>Chain: Ethereum</p>
              <p style={{marginBottom: '10px'}}>
                Collect on <a href="https://opensea.io/collection/pixelawbsters" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
              </p>
              <img src="/assets/mint.webp" alt="Mint" style={{ maxWidth: '100%' }} />
            </>
          );
        })()}
      </Popup>

      <Popup id="asciilawbs-popup" isOpen={activePopup === 'asciilawbs-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <h3 style={{
          marginBottom: '10px',
          fontSize: isMobile ? '18px' : '16px',
          lineHeight: isMobile ? '1.4' : '1.2'
        }}>
          MINT ASCIILAWBS <span 
            style={{
              color: 'blue', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              touchAction: 'manipulation',
              padding: isMobile ? '4px 8px' : '2px 4px',
              display: 'inline-block',
              minHeight: isMobile ? '44px' : 'auto',
              lineHeight: isMobile ? '44px' : 'inherit'
            }} 
            onClick={() => {
              setActivePopup(null);
              if (!address) {
                alert('Please connect your wallet first!');
                return;
              }
              setMintPopupType('asciilawbs');
              setShowMintPopup(true);
            }}
          >*HERE*</span>
        </h3>
        <p style={{
          marginBottom: '10px',
          fontSize: isMobile ? '14px' : '12px',
          lineHeight: isMobile ? '1.5' : '1.4'
        }}>
          420 ascii lawbsters inspired by ascii milady, milady, cigawrette packs, allstarz and rusty rollers. brought to you in part by portion club.
        </p>
        <p style={{
          marginBottom: '10px',
          fontSize: isMobile ? '14px' : '12px'
        }}>Chain: Base</p>
        <p style={{
          marginBottom: '10px',
          fontSize: isMobile ? '14px' : '12px'
        }}>
          Collect on <a 
            href="https://opensea.io/collection/asciilawbs" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              color: 'blue', 
              textDecoration: 'underline',
              touchAction: 'manipulation',
              padding: isMobile ? '4px 8px' : '2px 4px',
              display: 'inline-block',
              minHeight: isMobile ? '44px' : 'auto',
              lineHeight: isMobile ? '44px' : 'inherit'
            }}
          >Secondary</a>
        </p>
        <img 
          src="/assets/asciilawb.GIF" 
          alt="ASCII Lawbsters" 
          style={{ 
            width: '100%', 
            marginTop: isMobile ? '16px' : '10px',
            maxWidth: '100%',
            height: 'auto'
          }} 
        />
      </Popup>

      <Popup id="halloween-popup" isOpen={activePopup === 'halloween-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <h3 style={{marginBottom: '10px'}}>A LAWBSTER HALLOWEEN</h3>
        <p style={{marginBottom: '10px'}}>
          a Lawbster Halloween party seems nice but a a group of what seems to be humans controlled by lobsters just hijacked the Spirit Halloween Superstore.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Base</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://opensea.io/collection/a-lawbster-halloween" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbsterhalloween.webp" alt="Lawbster Halloween" style={{ width: '100%', marginBottom: '10px' }} />
        <div ref={tiktokRef} style={{ maxWidth: '400px', margin: '0 auto' }}>
          <blockquote 
            className="tiktok-embed" 
            cite="https://www.tiktok.com/@wables.eth/video/7295660710644682027" 
            data-video-id="7295660710644682027" 
            style={{maxWidth: '605px', minWidth: '325px'}}
          >
            <section>
              <a target="_blank" rel="noreferrer" title="@wables.eth" href="https://www.tiktok.com/@wables.eth?refer=embed">@wables.eth</a> 420 lawbsters hijacked a spirit halloween superstore 🦞🎃 minting rn on @ourzora via @PC69 <a target="_blank" rel="noreferrer" title="♬ original sound - wables.eth" href="https://www.tiktok.com/music/original-sound-7295660837769857835?refer=embed">♬ original sound - wables.eth</a>
            </section>
          </blockquote>
        </div>
      </Popup>

      <Popup id="uwu-popup" isOpen={activePopup === 'uwu-popup'} onClose={closePopup} onMinimize={minimizePopup} zIndex={2200} title="UwU 🦄">
        <video
          src="/assets/lawbuwu.MP4"
          style={{ width: '100%', maxHeight: isMobile ? '56vh' : '70vh', background: '#000' }}
          autoPlay
          controls
          loop
          playsInline
          muted
        />
      </Popup>

      <Popup
        id="profile-popup"
        isOpen={activePopup === 'profile-popup'}
        onClose={closePopup}
        onMinimize={minimizePopup}
        zIndex={2100}
        title="Lawb Profile"
        initialSize={{ width: isMobile ? 'calc(100vw - 24px)' : 520, height: isMobile ? '85vh' : 620 }}
      >
        <Suspense fallback={<div style={{ padding: 16 }}>Loading profile…</div>}>
          <PlayerProfile isMobile={isMobile} />
        </Suspense>
      </Popup>

      <Popup
        id="leaderboard-popup"
        isOpen={activePopup === 'leaderboard-popup'}
        onClose={closePopup}
        onMinimize={minimizePopup}
        zIndex={2100}
        title="Lawb Leaderboard"
        initialSize={{ width: isMobile ? 'calc(100vw - 24px)' : 440, height: isMobile ? '70vh' : 520 }}
      >
        <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
          <LawbLeaderboardPanel isMobile={isMobile} />
        </Suspense>
      </Popup>

      <Popup id="lawb-popup" isOpen={activePopup === 'lawb-popup'} onClose={closePopup} onMinimize={minimizePopup} zIndex={2000} title="tokens">
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '10px',
          borderBottom: '2px solid #808080',
          paddingBottom: '0',
        }}>
          {([
            { key: 'lawb', label: '$LAWB' },
            { key: 'clawb', label: 'Clawb' },
            { key: 'faq', label: 'FAQ' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLawbTab(key)}
              style={{
                padding: isMobile ? '8px 16px' : '4px 12px',
                fontSize: isMobile ? '14px' : '12px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: lawbTab === key ? '2px outset #dfdfdf' : '2px solid #808080',
                borderBottom: lawbTab === key ? '2px solid #c0c0c0' : '2px solid #808080',
                background: lawbTab === key ? '#c0c0c0' : '#a0a0a0',
                fontWeight: lawbTab === key ? 'bold' : 'normal',
                position: 'relative',
                bottom: '-2px',
                marginBottom: '0',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* $LAWB Tab */}
        {lawbTab === 'lawb' && (
          <>
            <h2 style={{marginBottom: '8px', fontSize: isMobile ? '20px' : '16px'}}>
              <a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer" style={{
                color: 'blue',
                textDecoration: 'underline',
                touchAction: 'manipulation'
              }}>$LAWB</a>
            </h2>
            <div style={{
              background: '#f0f0f0',
              border: '2px inset #808080',
              padding: '8px',
              marginBottom: '12px',
              fontSize: isMobile ? '13px' : '11px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}>
              <p style={{marginBottom: '4px'}}><strong>(sol)</strong> 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6</p>
              <p style={{marginBottom: '4px'}}><strong>(base)</strong> 0x7e18298b46A1F2399617cde083Fe11415A2ad15B</p>
              <p style={{marginBottom: '4px'}}><strong>(arb)</strong> 0x741f8FbF42485E772D97f1955c31a5B8098aC962</p>
              <p style={{marginBottom: '0'}}><strong>(sanko — chain sunset, legacy)</strong> 0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F</p>
            </div>

            <p style={{marginBottom: isMobile ? '12px' : '10px', fontSize: isMobile ? '14px' : '13px', lineHeight: '1.5'}}>
              $lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap. Token created 03.15.24 on <a href="https://www.pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>pump.fun</a>.
            </p>
            <p style={{marginBottom: '10px', fontSize: isMobile ? '14px' : '13px'}}>$lawb airdropped to LawbStation holders 03.19.24. Now multichain across Solana, Base, and Arbitrum. (A Sanko deployment exists, but that chain has sunset.)</p>
            <p style={{marginBottom: '10px', fontSize: isMobile ? '14px' : '13px', fontWeight: 'bold'}}>THERE IS NO MEME WE $LAWB YOU</p>

            <img src="/assets/lawbticker.webp" alt="ticker $lawb" style={{ width: '100%', marginBottom: '10px', marginTop: '6px' }} />

            <div style={{ width: '100%', height: isMobile ? '300px' : '400px', marginTop: isMobile ? '8px' : '6px' }}>
              {activePopup === 'lawb-popup' && lawbTab === 'lawb' ? (
                <iframe
                  height="100%"
                  width="100%"
                  id="geckoterminal-embed"
                  title="GeckoTerminal Embed"
                  src="https://www.geckoterminal.com/solana/pools/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep?embed=1&info=1&swaps=0&grayscale=0&light_chart=0&chart_type=market_cap&resolution=15m"
                  frameBorder="0"
                  allow="clipboard-write"
                  allowFullScreen
                  loading="lazy"
                />
              ) : null}
            </div>
          </>
        )}

        {/* Clawb Tab */}
        {lawbTab === 'clawb' && (
          <>
            <h2 style={{marginBottom: '8px', fontSize: isMobile ? '20px' : '16px'}}>Clawb</h2>
            <p style={{ marginBottom: '10px', fontSize: isMobile ? '14px' : '13px', lineHeight: '1.5' }}>
              Clawb is an AI lobster who is always live on{' '}
              <a href="https://retake.tv/clawb" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>retake.tv/clawb</a>.
              He talks in chat with his own voice, lives in a 3D reef world, posts on X and Farcaster, makes memes,
              plays music, and takes voice calls from viewers.
            </p>
            <p style={{ marginBottom: '10px', fontSize: isMobile ? '14px' : '13px', lineHeight: '1.5' }}>
              Viewers can launch their own memecoins with him on Robinhood Chain — type <strong>!deploy</strong> with
              a ticker and a picture and Clawb mints it, or start a <strong>!party</strong> so a group launches one
              together. Every token&apos;s trading fee is split between its creators and retake — Clawb keeps nothing.
            </p>
            <p style={{ marginBottom: '14px', fontSize: isMobile ? '14px' : '13px', lineHeight: '1.5', fontWeight: 'bold' }}>
              there is no meme i lawb you.
            </p>

            <div style={{
              background: '#f0f0f0',
              border: '2px inset #808080',
              padding: '8px',
              marginBottom: '14px',
              fontSize: isMobile ? '13px' : '12px',
              lineHeight: '1.6',
            }}>
              <p style={{marginBottom: '6px', fontWeight: 'bold'}}>On lawb.xyz</p>
              <p style={{marginBottom: '6px'}}>Watch the stream and join live chat from the Clawb button on the taskbar.</p>
              <p style={{marginBottom: '0'}}>Clawb is also the single-player chess opponent and a playable Reef Run character.</p>
            </div>

            <div style={{
              background: '#f0f0f0',
              border: '2px inset #808080',
              padding: '8px',
              marginBottom: '14px',
              fontSize: isMobile ? '13px' : '12px',
              lineHeight: '1.6',
            }}>
              <p style={{marginBottom: '6px', fontWeight: 'bold'}}>The short history</p>
              <p style={{marginBottom: '6px'}}>Earlier eras experimented with on-chain commercials/adspace on the stream and a claimable $CLAWB token.</p>
              <p style={{marginBottom: '0'}}>Both were retired in July 2026 — Clawb now focuses on the stream and the games; $CLAWB is no longer part of the site economy.</p>
            </div>

            <div style={{
              background: '#f0f0f0',
              border: '2px inset #808080',
              padding: '8px',
              marginBottom: '14px',
              fontSize: isMobile ? '13px' : '12px',
              lineHeight: '1.6',
              wordBreak: 'break-all',
            }}>
              <p style={{marginBottom: '6px', fontWeight: 'bold'}}>Where to find it</p>
              <p style={{marginBottom: '4px'}}>
                Stream: <a href="https://retake.tv/clawb" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>retake.tv/clawb</a>
              </p>
              <p style={{marginBottom: '4px'}}>
                Farcaster: <a href="https://warpcast.com/clawb" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>@clawb</a>
              </p>
              <p style={{marginBottom: '0'}}>
                X: <a href="https://x.com/clawblawb" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>@clawblawb</a>
              </p>
            </div>
          </>
        )}

        {/* FAQ Tab */}
        {lawbTab === 'faq' && (
          <>
            <h2 style={{marginBottom: '8px', fontSize: isMobile ? '20px' : '16px'}}>FAQ</h2>
            <div style={{
              background: '#f0f0f0',
              border: '2px inset #808080',
              padding: '8px',
              marginBottom: '14px',
              fontSize: isMobile ? '13px' : '12px',
              lineHeight: '1.6',
            }}>
              <p style={{marginBottom: '6px', fontWeight: 'bold'}}>Bridge Guide (SOL &rarr; ARB)</p>
              <p style={{marginBottom: '4px'}}>
                Visit <a href="https://portalbridge.com/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>portalbridge.com</a> to bridge $lawb from Solana to Arbitrum.
              </p>
              <p style={{marginBottom: '4px'}}>1. Connect Solana wallet, select $lawb token</p>
              <p style={{marginBottom: '4px'}}>2. Connect Arbitrum wallet, select $lawb token</p>
              <p style={{marginBottom: '4px'}}>3. Select quantity, confirm transactions</p>
              <p style={{marginBottom: '0'}}>Note: the Sanko chain has sunset — the old Sanko $lawb deployment is legacy and there is no active bridge path to it.</p>
            </div>

            <div style={{
              background: '#f0f0f0',
              border: '2px inset #808080',
              padding: '8px',
              marginBottom: '14px',
              fontSize: isMobile ? '13px' : '12px',
              lineHeight: '1.6',
              wordBreak: 'break-all',
            }}>
              <p style={{marginBottom: '6px', fontWeight: 'bold'}}>Ecosystem tokens ($DMT, $CULT &amp; $MS2)</p>
              <p style={{marginBottom: '6px'}}>
                <strong>$DMT</strong> (Dream Machine Token, Arbitrum) — the featured wager token for on-chain Lawb Chess, live on Arbitrum One. CA: 0x8B0E6f19Ee57089F7649A455D89D7bC6314D04e8
              </p>
              <p style={{marginBottom: '6px'}}>
                <strong>$CULT</strong> (Milady Cult Coin, Ethereum) — Remilia&apos;s token, planned as the entry token for Reef Run&apos;s upcoming on-chain jackpot. CA: 0x0000000000c5dc95539589fbD24BE07c6C14eCa4
              </p>
              <p style={{marginBottom: '6px'}}>
                <strong>$MS2</strong> (Station This, Ethereum) — powers StationThis / <a href="https://noema.art" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Noema</a>, the Milady-community AI art platform Clawb uses to render its art and memes. Also the payment token for the Pixelawbs MS2 mint list (35,000 MS2 per mint). CA: 0x98Ed411B8cf8536657c660Db8aA55D9D4bAAf820
              </p>
              <p style={{marginBottom: '0'}}>None of these tokens are issued by lawb — they are third-party tokens used in the ecosystem.</p>
            </div>
          </>
        )}
      </Popup>

      <Suspense fallback={<div>Loading MintPopup...</div>}>
        <MintPopup 
          isOpen={showMintPopup} 
          onClose={closeMintPopup} 
          onMinimize={minimizeMintPopup}
          walletAddress={address || ''}
          initialMintType={mintPopupType}
        />
      </Suspense>

      <Suspense fallback={<div>Loading NFTGallery...</div>}>
        <NFTGallery 
          isOpen={showNFTGallery} 
          onClose={closeNFTGallery} 
          onMinimize={minimizeNFTGallery}
          walletAddress={address} 
        />
      </Suspense>

      <Suspense fallback={<div>Loading MemeGenerator...</div>}>
        <Popup id="meme-generator-popup" isOpen={showMemeGenerator} onClose={closeMemeGenerator} onMinimize={minimizeMemeGenerator}>
          <MemeGenerator />
        </Popup>
      </Suspense>

      </div>
  );
}

export default App;