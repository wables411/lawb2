import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useConnect, useDisconnect, useEnsName, useChainId } from 'wagmi';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { mainnet } from 'wagmi/chains';
import { useAppKitSafe as useAppKit } from '../hooks/useAppKitSafe';
import MobileNFTGallery from './MobileNFTGallery';
import MobileMintPopup from './MobileMintPopup';
import MobilePopup98 from './MobilePopup98';
import MemeGenerator from '../components/MemeGenerator';
import AsciiLawbsterMint from '../components/AsciiLawbsterMint';
import { playIconClickSound } from '../utils/sound';
import LinuxNavBar from '../components/LinuxNavBar';
const ClawbClaimPanel = lazy(() => import('../components/ClawbClaimPanel'));

const useStyles = createUseStyles({
  mobileContainer: {
    minHeight: '100vh',
    minWidth: '100vw',
    width: '100vw',
    height: '100vh',
    // Background will be overridden by dark mode CSS
    background: "url('/assets/background.gif') no-repeat center center fixed",
    backgroundSize: 'cover',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    // Dark mode override
    '.lawb-app-dark-mode &': {
      background: '#000000 !important',
      backgroundImage: 'none !important',
      color: '#00ff00 !important',
    },
  },
  header: {
    backgroundColor: '#c00',
    padding: '0.75rem 0',
    border: 'none',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    color: '#fff',
    letterSpacing: '1px',
    textShadow: '1px 1px 0 #000',
    textTransform: 'uppercase',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '80px', // space for bottom taskbar
    padding: '0 1rem',
    justifyContent: 'center',
    alignItems: 'start',
  },
  icon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    textAlign: 'center',
    '& img': {
      width: '64px',
      height: '64px',
    },
    '& span': {
      // Never split single-word collection names (Lawbsters, Lawbstarz, Halloween)
      whiteSpace: 'nowrap',
      wordBreak: 'keep-all',
      overflowWrap: 'normal',
      hyphens: 'none',
    }
  },
  taskbar: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '100vw',
    height: '56px',
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    zIndex: 1000,
    borderTop: '2px solid #00ffff',
  },
  menuButton: {
    background: '#00ffff',
    color: '#000',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    boxShadow: '2px 2px 0 #000',
  },
  walletStatus: {
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
  },
  statusDot: {
    height: '10px',
    width: '10px',
    borderRadius: '50%',
    backgroundColor: (isConnected: boolean) => isConnected ? 'limegreen' : 'red',
    marginRight: '6px',
    border: '1px solid #000',
  },
  clock: {
    color: '#00ffff',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    fontSize: '1rem',
    fontWeight: 'bold',
    textShadow: '1px 1px 0 #000',
    marginRight: '24px',
  },
  pixelawbsPopupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.7)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixelawbsPopup: {
    background: '#fff',
    borderRadius: '12px',
    width: '90vw',
    maxWidth: '420px',
    height: '75vh',
    maxHeight: '600px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: '#00ffff',
    color: '#000',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '1px 1px 0 #000',
  },
  menuOverlay: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.4)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  menuModal: {
    width: '100vw',
    background: '#c0c0c0',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
    padding: '15px 0 8px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    zIndex: 3100,
    marginBottom: '70px',
    maxHeight: 'calc(70vh - 56px)',
    overflowY: 'auto',
    position: 'absolute',
    left: 0,
    bottom: '56px',
  },
  menuLink: {
    display: 'block',
    width: '90%',
    padding: '6px',
    color: '#000',
    textDecoration: 'none',
    background: '#e0e0e0',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1rem',
    textAlign: 'center',
    marginBottom: '3px',
    border: '2px outset #fff',
    boxShadow: '1px 1px 0 #aaa',
  },
});

type ActiveView = 'main' | 'gallery';

const EVM_NFTS = [
  { id: 'lawbsters', name: 'Lawbsters', image: '/assets/lawbsters.gif', description: '420 Lawbsters. ETH.' },
  { id: 'lawbstarz', name: 'Lawbstarz', image: '/assets/lawbstarz.gif', description: '666 Lawbstarz. ETH.' },
  { id: 'halloween', name: 'Halloween', image: '/assets/lawbsterhalloween.gif', description: 'Halloween Lawbsters. BASE.' },
  { id: 'pixelawbs', name: 'Pixelawbs', image: '/assets/pixelawb.png', description: '2222 Pixelawbs. ETH.' },
  { id: 'asciilawbs', name: 'ASCII Lawbsters', image: '/assets/asciilawb.GIF', description: '420 ASCII Lawbsters. BASE.' },
  { id: 'red-vs-blue', name: 'Red VS Blue', image: '/images/racing-flag.svg', description: 'RED vs BLUE: A LAWBSTER RACE TO REMEMBER. ETH.' },
];
const SOL_NFTS = [
  { id: 'lawbstation', name: 'Lawbstation', image: '/assets/lawbstation.GIF', description: 'Lawbstation. SOL.' },
  { id: 'nexus', name: 'Nexus', image: '/assets/nexus.gif', description: 'Nexus. SOL.' },
];

interface FolderNFT {
  id: string;
  name: string;
  image: string;
  description: string;
}

const Mobile = () => {
  const classes = useStyles();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { data: ens } = useEnsName({ address });
  const connectionDisplay = useConnectionDisplay(ens ?? undefined);
  const { isPending, connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  
  // Web browser mobile - no Base app auto-connect
  
  // Simple wallet connection
  const handleWalletConnection = async () => {
    try {
      // Web browser mobile - use AppKit modal
      await open({ view: 'Connect' });
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Unable to connect wallet. Please try again.');
    }
  };
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [showPixelawbsPopup, setShowPixelawbsPopup] = useState(false);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [showEvmFolder, setShowEvmFolder] = useState(false);
  const [showSolFolder, setShowSolFolder] = useState(false);
  const [showLawbPopup, setShowLawbPopup] = useState(false);
  const [showLawbsters, setShowLawbsters] = useState(false);
  const [showLawbstarz, setShowLawbstarz] = useState(false);
  const [showPixelawbs, setShowPixelawbs] = useState(false);
  const [showHalloween, setShowHalloween] = useState(false);
  const [showAsciilawbs, setShowAsciilawbs] = useState(false);
  const [showLawbstation, setShowLawbstation] = useState(false);
  const [showNexus, setShowNexus] = useState(false);
  const [showMemeGenerator, setShowMemeGenerator] = useState(false);
  const [showClaimPopup, setShowClaimPopup] = useState(false);
  const [mintPopupType, setMintPopupType] = useState<'selection' | 'pixelawbs' | 'asciilawbs'>('selection');

  // Twitter widgets loading for both lawbsters and lawbstarz popups on mobile
  useEffect(() => {
    if (showLawbsters || showLawbstarz) {
      // Small delay to ensure popup is rendered
      const loadTwitterWidgets = () => {
        // Load Twitter widgets script if not already loaded
        const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
        if (!existingScript) {
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
            }, 300);
          };
        } else {
          // Script already loaded, wait a bit then parse tweets
          setTimeout(() => {
            if ((window as any).twttr && (window as any).twttr.widgets) {
              (window as any).twttr.widgets.load();
            }
          }, 500);
        }
      };
      
      // Delay to ensure popup content is rendered
      setTimeout(loadTwitterWidgets, 300);
    }
  }, [showLawbsters, showLawbstarz]);

  const icons = [
    { label: 'Mint', icon: '/assets/mint.gif', action: () => { setMintPopupType('selection'); setShowMintPopup(true); } },
    { label: `EVM NFT'S FOLDER`, icon: '/assets/evmfolder.png', action: () => setShowEvmFolder(true) },
    { label: `SOL NFTS FOLDER`, icon: '/assets/solfolder.png', action: () => setShowSolFolder(true) },
    { label: '$LAWB', icon: '/assets/lawbticker.gif', action: () => setShowLawbPopup(true) },
    { label: 'Lawb NFT Gallery', icon: '/assets/evmfolder.png', action: () => setActiveView('gallery') },
    { label: 'Meme Generator', icon: '/assets/meme.gif', action: () => setShowMemeGenerator(true) },
  ];

  const handleIconClick = (icon: typeof icons[0]) => {
    playIconClickSound();
    icon.action();
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // No auto-popup on load - user must click to open popups


  if (activeView === 'gallery') {
    return <MobileNFTGallery onBack={() => setActiveView('main')} walletAddress={address || undefined} />;
  }



  interface FolderPopupProps {
    open: boolean;
    onClose: () => void;
    title: string;
    nfts: FolderNFT[];
  }

  function FolderPopup({ open, onClose, title, nfts }: FolderPopupProps) {
    const handleIconClick = (id: string) => {
      playIconClickSound();
      switch (id) {
        case 'lawbsters': setShowLawbsters(true); break;
        case 'lawbstarz': setShowLawbstarz(true); break;
        case 'pixelawbs': setShowPixelawbs(true); break;
        case 'halloween': setShowHalloween(true); break;
        case 'asciilawbs': setShowAsciilawbs(true); break;
        case 'lawbstation': setShowLawbstation(true); break;
        case 'nexus': setShowNexus(true); break;
        case 'red-vs-blue': 
          window.open('https://opensea.io/item/ethereum/0x46353e0b6b4d9723d253c00acd29adefc05083bb/2', '_blank', 'noopener,noreferrer');
          break;
        default: break;
      }
    };
    return (
      <MobilePopup98 isOpen={open} onClose={onClose} title={title}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
          {nfts.map((nft: FolderNFT) => (
            <div key={nft.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f8f8', borderRadius: 8, padding: 8, cursor: 'pointer', minWidth: 0, overflow: 'visible' }} onClick={() => handleIconClick(nft.id)}>
              <img src={nft.image} alt={nft.name} style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }} />
              <span style={{ fontWeight: 'bold', fontSize: 14, whiteSpace: 'nowrap', wordBreak: 'keep-all', overflowWrap: 'normal', hyphens: 'none', textAlign: 'center', lineHeight: '1.2', overflow: 'visible', width: '100%', maxWidth: '100%' }}>{nft.name}</span>
              <span style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>{nft.description}</span>
            </div>
          ))}
        </div>
      </MobilePopup98>
    );
  }

  function LawbPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
      <MobilePopup98 isOpen={open} onClose={onClose} title="$LAWB">
        <h1 style={{marginBottom: '10px'}}>
          <a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>🦞 $LAWB</a>
        </h1>
        <p style={{marginBottom: '10px'}}>
          $lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap. Token created 03.15.24 on <a href="https://www.pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>pump.fun</a>.
        </p>
        <p style={{marginBottom: '10px'}}>$lawb airdropped to LawbStation holders 03.19.24</p>
        <p style={{marginBottom: '10px'}}>THERE IS NO MEME WE $LAWB YOU</p>
        <p style={{marginBottom: '10px'}}>(sol) ca: 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6</p>
        <p style={{marginBottom: '10px'}}>(base) ca: 0x7e18298b46A1F2399617cde083Fe11415A2ad15B</p>
        <p style={{marginBottom: '10px'}}>(arb) ca: 0x741f8FbF42485E772D97f1955c31a5B8098aC962</p>
        <p style={{marginBottom: '10px'}}>(dmt) ca: 0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F</p>
        <p style={{marginBottom: '10px'}}>
          if you wish to bridge your $lawb token from solana to arbitrum to sanko, visit <a href="https://portalbridge.com/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>https://portalbridge.com/</a>
        </p>
        <p style={{marginBottom: '10px'}}>step 1. connect solana wallet and select $lawb token (65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6)</p>
        <p style={{marginBottom: '10px'}}>step 2. connect arbitrum wallet and select $lawb token (0x741f8FbF42485E772D97f1955c31a5B8098aC962)</p>
        <p style={{marginBottom: '10px'}}>step 3. select token quantity, confirm transactions.</p>
        <p style={{marginBottom: '10px'}}>step 4. now that you have $lawb on arbitrum, visit <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>https://sanko.xyz/bridge</a> and connect your arb wallet.</p>
        <p style={{marginBottom: '10px'}}>step 5. from arb wallet, select $lawb token.</p>
        <p style={{marginBottom: '10px'}}>step 6. connect to sanko chain. if not already selected, select $lawb token on sanko (0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F)</p>
        <p style={{marginBottom: '10px'}}>step 7. select quantity and confirm transactions.</p>
        <img src="/assets/lawbticker.gif" alt="ticker $lawb" style={{ width: '100%', marginBottom: '10px', marginTop: '10px' }} />
        <div style={{ width: '100%', height: '400px', marginTop: '10px' }}>
          <iframe 
            height="100%" 
            width="100%" 
            id="geckoterminal-embed" 
            title="GeckoTerminal Embed" 
            src="https://www.geckoterminal.com/solana/pools/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep?embed=1&info=1&swaps=0&grayscale=0&light_chart=0&chart_type=market_cap&resolution=15m" 
            frameBorder="0" 
            allow="clipboard-write" 
            allowFullScreen
          />
        </div>
      </MobilePopup98>
    );
  }

  return (
    <div className={classes.mobileContainer}>
      <button
        onClick={() => {
          playIconClickSound();
          setShowClaimPopup(true);
        }}
        type="button"
        title="Open Claim $CLAWB"
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          width: '96px',
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          zIndex: 2200,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <img
          src="/assets/restitution.png"
          alt="Claim CLAWB"
          style={{
            width: '100%',
            display: 'block',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))',
          }}
        />
      </button>
      <header className={classes.header}>
        <h1 className={classes.title}>there is no meme we lawb you</h1>
      </header>
      <div className={classes.iconGrid}>
        {icons.map(icon => (
          <div key={icon.label} className={classes.icon} onClick={() => handleIconClick(icon)}>
            <img src={icon.icon} alt={icon.label} />
            <span>{icon.label}</span>
          </div>
        ))}
      </div>
      {/* Pixelawbs Popup (on load) */}
      {showPixelawbsPopup && (
        <MobilePopup98 isOpen={showPixelawbsPopup} onClose={() => setShowPixelawbsPopup(false)} title="Pixelawbs">
          <p style={{marginBottom: '10px'}}>
            PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{color: '#ff0000', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => { setShowPixelawbsPopup(false); setShowMintPopup(true); }}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>SCATTER.ART</a>
          </p>
          <video controls src="/assets/pixelawbs.mp4" style={{ width: '100%', marginBottom: '10px' }} preload="none" poster="/assets/pixelawbsintro.png" />
          <p style={{marginBottom: '10px'}}>
            2222 Pixelated Lawbsters inspired by <a href="https://pixeladymaker.net/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>PixeladyMaker</a>
          </p>
          <p style={{marginBottom: '10px'}}>
            <a href="https://opensea.io/collection/pixelawbsters" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
          </p>
        </MobilePopup98>
      )}
      {/* Mobile Menu Modal */}
      {menuOpen && (
        <div className={classes.menuOverlay} onClick={() => setMenuOpen(false)}>
          <div className={classes.menuModal} onClick={e => e.stopPropagation()}>
            <a href="https://www.geckoterminal.com/solana/pools/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep?embed=1&info=1&swaps=0&grayscale=0&light_chart=0&chart_type=market_cap&resolution=15m" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>GeckoTerminal</a>
            <a href="https://x.com/lawbstation" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>LawbStation Twitter</a>
            <a href="https://x.com/lawbnexus" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>LawbNexus Twitter</a>
            <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/info/" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>NFTX - Lawbsters</a>
            <a href="https://purity.finance/lawb" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Purity</a>
            <a href="https://uwu.pro/memoji/ulawb" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>UwU LAWB</a>
            <a href="https://t.me/lawblawblawb" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Telegram</a>
            <a href="https://discord.gg/JdkzUHYmMy" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Discord</a>
            <a href="https://store.fun/lawbshop" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Lawb.Shop</a>
          </div>
        </div>
      )}
      {/* Mobile Mint Popup */}
      {mintPopupType === 'selection' && (
        <MobilePopup98 
          isOpen={showMintPopup} 
          onClose={() => setShowMintPopup(false)} 
          title="Select Mint Type"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            <button
              onClick={() => {
                setMintPopupType('pixelawbs');
                if (chainId !== mainnet.id) {
                  alert('Please switch to Ethereum mainnet to mint Pixelawbs');
                }
              }}
              style={{
                background: '#00ffff',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 24px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '1px 1px 0 #aaa',
                minHeight: '48px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              PIXELAWBS (ETH)
            </button>
            <button
              onClick={() => setMintPopupType('asciilawbs')}
              style={{
                background: '#00ffff',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 24px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '1px 1px 0 #aaa',
                minHeight: '48px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ASCIILAWBS (BASE)
            </button>
          </div>
        </MobilePopup98>
      )}
      {mintPopupType === 'pixelawbs' && (
        <>
          <MobileMintPopup 
            isOpen={showMintPopup} 
            onClose={() => { setShowMintPopup(false); setMintPopupType('selection'); }} 
            walletAddress={address || ''} 
          />
        </>
      )}
      {mintPopupType === 'asciilawbs' && (
        <MobilePopup98 
          isOpen={showMintPopup} 
          onClose={() => { setShowMintPopup(false); setMintPopupType('selection'); }} 
          title="Mint ASCII Lawbsters"
        >
          <button
            onClick={() => setMintPopupType('selection')}
            style={{
              background: '#c0c0c0',
              color: '#000',
              border: '2px outset #fff',
              borderRadius: '4px',
              padding: '8px 16px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '12px',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ← Back
          </button>
          <div style={{ padding: '10px', maxHeight: '70vh', overflowY: 'auto' }}>
            <AsciiLawbsterMint walletAddress={address || ''} />
          </div>
        </MobilePopup98>
      )}
      
      {/* EVM Folder Popup */}
      <FolderPopup open={showEvmFolder} onClose={() => setShowEvmFolder(false)} title="EVM NFT'S FOLDER" nfts={EVM_NFTS} />
      {/* SOL Folder Popup */}
      <FolderPopup open={showSolFolder} onClose={() => setShowSolFolder(false)} title="SOL NFTS FOLDER" nfts={SOL_NFTS} />
      {/* $LAWB Popup */}
      <LawbPopup open={showLawbPopup} onClose={() => setShowLawbPopup(false)} />
      {/* Lawbsters Popup */}
      <MobilePopup98 isOpen={showLawbsters} onClose={() => setShowLawbsters(false)} title="Lawbsters">
        <p style={{marginBottom: '10px'}}>
          420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Cigawrette Packs</a> derivative.
        </p>
        <p>Chain: Ethereum</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://magiceden.us/collections/ethereum/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a> or <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/buy/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>NFTX</a>
        </p>
        <div id="twitter-embed-lawbsters-mobile" style={{ marginTop: '10px', width: '100%', minHeight: '200px' }}>
          <blockquote className="twitter-tweet" data-media-max-width="560">
            <p lang="en" dir="ltr">420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A <a href="https://www.cigawrettepacks.shop/">Cigawrette Packs</a> derivative.</p>&mdash; wables (@wables411) <a href="https://twitter.com/wables411/status/1620879129850834944?ref_src=twsrc%5Etfw">March 2, 2023</a>
          </blockquote>
        </div>
        <img src="/assets/lawbsters.gif" alt="Lawbsters" style={{ width: '100%', marginTop: '10px' }} />
      </MobilePopup98>
      {/* Lawbstarz Popup */}
      <MobilePopup98 isOpen={showLawbstarz} onClose={() => setShowLawbstarz(false)} title="Lawbstarz">
        <p style={{marginBottom: '10px'}}>
          ☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ LAWBSTARZ IS AN <a href="https://allstarz.world" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>ALLSTARZ</a> DERIVATIVE ☆ LAWBSTARZ IS INSPIRED BY <a href="https://www.remilia.org/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>REMILIA CORP</a> ☆ LED BY NETWORK SPIRITUALITY ☆ 666 <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>CIGAWRETTEPACKS</a> WERE CONSUMED BY <a href="https://x.com/portionclub69" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>PORTIONCLUB69</a> AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆
        </p>
        <p>Chain: Ethereum</p>
        <p>
          Collect on <a href="https://magiceden.us/collections/ethereum/0xd7922cd333da5ab3758c95f774b092a7b13a5449" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbstarz.gif" alt="Lawbstarz" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <div id="twitter-embed-lawbstarz-mobile" style={{ marginTop: '10px', width: '100%', minHeight: '200px' }}>
          <blockquote className="twitter-tweet" data-media-max-width="560">
            <p lang="en" dir="ltr">The following 🧵 has been transcripted from a live news broadcast:<br/><br/>Anchor: &ldquo;Good evening, viewers. Tonight, we embark on an extraordinary journey that defies rational explanation. It all began with February&apos;s Cigawrette Packs cargo ship hijacking, little did we know that the.. <a href="https://t.co/BWgLOk59N4">pic.twitter.com/BWgLOk59N4</a></p>&mdash; wables (@wables411) <a href="https://twitter.com/wables411/status/1669009492007354369?ref_src=twsrc%5Etfw">June 14, 2023</a>
          </blockquote>
        </div>
        <img src="/assets/lawbstarzhotelroom.png" alt="Lawbstarz Hotel Room" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <img src="/assets/tile-06-audio-image0-lawbstarz dj set 1.0 copy.png" alt="Lawbstarz DJ Set" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </MobilePopup98>
      {/* Pixelawbs Popup */}
      <MobilePopup98 isOpen={showPixelawbs} onClose={() => setShowPixelawbs(false)} title="Pixelawbs">
        <p style={{marginBottom: '10px'}}>
          PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{color: '#ff0000', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => { setShowPixelawbs(false); setShowMintPopup(true); }}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>SCATTER.ART</a>
        </p>
        <video controls src="/assets/pixelawbs.mp4" style={{ width: '100%', marginBottom: '10px' }} preload="none" poster="/assets/pixelawbsintro.png" />
        <p style={{marginBottom: '10px'}}>
          2222 Pixelated Lawbsters inspired by <a href="https://pixeladymaker.net/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>PixeladyMaker</a>
        </p>
      </MobilePopup98>
      {/* Halloween Popup */}
      <MobilePopup98 isOpen={showHalloween} onClose={() => setShowHalloween(false)} title="A Lawbster Halloween">
        <h3 style={{marginBottom: '10px'}}>A LAWBSTER HALLOWEEN</h3>
        <p style={{marginBottom: '10px'}}>
          a Lawbster Halloween party seems nice but a a group of what seems to be humans controlled by lobsters just hijacked the Spirit Halloween Superstore.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Base</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://magiceden.us/collections/base/0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbsterhalloween.gif" alt="Lawbster Halloween" style={{ width: '100%', marginBottom: '10px' }} />
      </MobilePopup98>
      {/* ASCII Lawbsters Popup */}
      <MobilePopup98 isOpen={showAsciilawbs} onClose={() => setShowAsciilawbs(false)} title="ASCII Lawbsters">
        <h3 style={{marginBottom: '10px', fontSize: '16px'}}>
          MINT ASCIILAWBS <span 
            style={{
              color: 'blue', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              touchAction: 'manipulation',
              padding: '4px 8px',
              display: 'inline-block',
              minHeight: '44px',
              lineHeight: '44px'
            }} 
            onClick={() => {
              setShowAsciilawbs(false);
              if (!address) {
                alert('Please connect your wallet first!');
                return;
              }
              setMintPopupType('asciilawbs');
              setShowMintPopup(true);
            }}
          >*HERE*</span>
        </h3>
        <p style={{marginBottom: '10px', fontSize: '14px', lineHeight: '1.5'}}>
          420 ascii lawbsters inspired by ascii milady, milady, cigawrette packs, allstarz and rusty rollers. brought to you in part by portion club.
        </p>
        <p style={{marginBottom: '10px', fontSize: '14px'}}>Chain: Base</p>
        <p style={{marginBottom: '10px', fontSize: '14px'}}>
          Collect on <a 
            href="https://opensea.io/collection/asciilawbs" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              color: 'blue', 
              textDecoration: 'underline',
              touchAction: 'manipulation',
              padding: '4px 8px',
              display: 'inline-block',
              minHeight: '44px',
              lineHeight: '44px'
            }}
          >Secondary</a>
        </p>
        <img 
          src="/assets/asciilawb.GIF" 
          alt="ASCII Lawbsters" 
          style={{ width: '100%', marginTop: '16px', height: 'auto' }} 
        />
      </MobilePopup98>
      {/* Lawbstation Popup */}
      <MobilePopup98 isOpen={showLawbstation} onClose={() => setShowLawbstation(false)} title="Lawbstation">
        <p style={{marginBottom: '10px'}}>
          Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on <a href="https://www.miladystation2.net/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>MiladyStation</a> technology. Inspired by Milady, Allstarz, Rusty Rollers, Cigawrette Packs, SPX6900 and Radbro. Brought to you in part by PortionClub and Mony Corp Group. LawbStations seem nice but a lobster controlled by MiladyStation will never achieve anything without a roadmap.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Solana</p>
        <p style={{marginBottom: '10px'}}>
          <a href="https://magiceden.us/marketplace/lawbstation" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Collect Lawbstations on Secondary</a>
        </p>
        <img src="/assets/lawbstation.GIF" alt="Lawbstation" style={{ width: '100%', marginTop: '10px' }} />
        <video controls src="/assets/lawbstation.mp4" style={{ width: '100%', marginTop: '10px' }} />
      </MobilePopup98>
      {/* Nexus Popup */}
      <MobilePopup98 isOpen={showNexus} onClose={() => setShowNexus(false)} title="Nexus">
        <p style={{marginBottom: '10px'}}>
          1000 Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana. Collect on <a href="https://magiceden.us/marketplace/lawbnexus" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/nexus.gif" alt="Nexus" style={{ width: '100%', marginBottom: '10px' }} />
        <video controls src="/assets/nexusminting.mp4" style={{ width: '100%' }} />
      </MobilePopup98>
      {/* Meme Generator Popup */}
      <MobilePopup98 isOpen={showMemeGenerator} onClose={() => setShowMemeGenerator(false)} title="Meme Generator">
        <MemeGenerator />
      </MobilePopup98>
      {/* Claim Popup */}
      <MobilePopup98 isOpen={showClaimPopup} onClose={() => setShowClaimPopup(false)} title="Claim $CLAWB">
        <Suspense fallback={<div>Loading claim panel...</div>}>
          <ClawbClaimPanel />
        </Suspense>
      </MobilePopup98>
      {/* Linux NavBar */}
      <LinuxNavBar
        walletButton={
          <div 
            onClick={() => {
              if (!connectionDisplay.connected) {
                void open({ view: 'Connect' });
              } else {
                void open({ view: 'Account' });
              }
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{
              height: '8px',
              width: '8px',
              borderRadius: '50%',
              backgroundColor: connectionDisplay.connected ? '#48bb78' : '#f56565',
              border: '1px solid rgba(0, 0, 0, 0.3)',
              display: 'inline-block',
            }}></span>
            <span style={{ fontSize: '11px', color: '#cbd5e0' }}>
              {connectionDisplay.connected ? (connectionDisplay.ens || `${connectionDisplay.address?.slice(0, 6)}...${connectionDisplay.address?.slice(-4)}`) : 'Disconnected'}
            </span>
          </div>
        }
        connectionStatus={{
          connected: connectionDisplay.connected,
          address: connectionDisplay.address,
          ens: connectionDisplay.ens
        }}
      />
    </div>
  );
};

export default Mobile; 