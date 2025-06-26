import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import MobileNFTGallery from './MobileNFTGallery';
import MobileMintPopup from './MobileMintPopup';
import MobilePopup98 from './MobilePopup98';
import MemeGenerator from '../components/MemeGenerator';
import { ChessGame } from '../components/ChessGame';

const useStyles = createUseStyles({
  mobileContainer: {
    minHeight: '100vh',
    minWidth: '100vw',
    width: '100vw',
    height: '100vh',
    background: "url('/assets/background.gif') no-repeat center center fixed",
    backgroundSize: 'cover',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '80px', // space for bottom taskbar
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
      wordBreak: 'break-word',
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
  const { isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ens } = useEnsName({ address });
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
  const [showLawbstation, setShowLawbstation] = useState(false);
  const [showNexus, setShowNexus] = useState(false);
  const [showMemeGenerator, setShowMemeGenerator] = useState(false);
  const [showChessGame, setShowChessGame] = useState(false);

  const icons = [
    { label: 'Chess', icon: '/images/chessboard5.png', action: () => setShowChessGame(true) },
    { label: 'Mint', icon: '/assets/mint.gif', action: () => setShowMintPopup(true) },
    { label: `EVM NFT'S FOLDER`, icon: '/assets/evmfolder.png', action: () => setShowEvmFolder(true) },
    { label: `SOL NFTS FOLDER`, icon: '/assets/solfolder.png', action: () => setShowSolFolder(true) },
    { label: '$LAWB', icon: '/assets/lawbticker.gif', action: () => setShowLawbPopup(true) },
    { label: isConnected ? (ens || `${address?.slice(0, 6)}...${address?.slice(-4)}`) : 'Wallet', icon: '/assets/wallet.png', action: () => {
      if (!isConnected) {
        void open();
      } else {
        disconnect();
      }
    }, disabled: isPending },
  ];

  const handleIconClick = (icon: typeof icons[0]) => {
    if (icon.disabled) return;
    icon.action();
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowPixelawbsPopup(true);
  }, []);

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
      switch (id) {
        case 'lawbsters': setShowLawbsters(true); break;
        case 'lawbstarz': setShowLawbstarz(true); break;
        case 'pixelawbs': setShowPixelawbs(true); break;
        case 'halloween': setShowHalloween(true); break;
        case 'lawbstation': setShowLawbstation(true); break;
        case 'nexus': setShowNexus(true); break;
        default: break;
      }
    };
    return (
      <MobilePopup98 isOpen={open} onClose={onClose} title={title}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
          {nfts.map((nft: FolderNFT) => (
            <div key={nft.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f8f8', borderRadius: 8, padding: 8, cursor: 'pointer' }} onClick={() => handleIconClick(nft.id)}>
              <img src={nft.image} alt={nft.name} style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }} />
              <span style={{ fontWeight: 'bold', fontSize: 14 }}>{nft.name}</span>
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
          <a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>🦞 $LAWB</a>
        </h1>
        <p style={{marginBottom: '10px'}}>
          $lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap. Token created 03.15.24 on <a href="https://www.pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>pump.fun</a>.
        </p>
        <p style={{marginBottom: '10px'}}>$lawb airdropped to LawbStation holders 03.19.24</p>
        <p style={{marginBottom: '10px'}}>THERE IS NO MEME WE $LAWB YOU</p>
        <p style={{marginBottom: '10px'}}>(sol) ca: 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6</p>
        <p style={{marginBottom: '10px'}}>(arb) ca: 0x741f8FbF42485E772D97f1955c31a5B8098aC962</p>
        <p style={{marginBottom: '10px'}}>(dmt) ca: 0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F</p>
        <p style={{marginBottom: '10px'}}>
          if you wish to bridge your $lawb token from solana to arbitrum to sanko, a wormhole is available via <a href="https://portalbridge.com/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>https://portalbridge.com/</a>
        </p>
        <p style={{marginBottom: '10px'}}>step 1. connect solana wallet and select $lawb token (65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6)</p>
        <p style={{marginBottom: '10px'}}>step 2. connect arbitrum wallet and select $lawb token (0x741f8FbF42485E772D97f1955c31a5B8098aC962)</p>
        <p style={{marginBottom: '10px'}}>step 3. select token quantity, confirm transactions.</p>
        <p style={{marginBottom: '10px'}}>step 4. now that you have $lawb on arbitrum, visit <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>https://sanko.xyz/bridge</a> and connect your arb wallet.</p>
        <p style={{marginBottom: '10px'}}>step 5. from arb wallet, select $lawb token.</p>
        <p style={{marginBottom: '10px'}}>step 6. connect to sanko chain. if not already selected, select $lawb token on sanko (0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F)</p>
        <p style={{marginBottom: '10px'}}>step 7. select quantity and confirm transactions.</p>
        <img src="/assets/lawbticker.gif" alt="ticker $lawb" style={{ width: '100%', marginBottom: '10px', marginTop: '10px' }} />
      </MobilePopup98>
    );
  }

  return (
    <div className={classes.mobileContainer}>
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
            PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{color: '#ff0000', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => { setShowPixelawbsPopup(false); setShowMintPopup(true); }}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>SCATTER.ART</a>
          </p>
          <video controls src="/assets/pixelawbs.mp4" style={{ width: '100%', marginBottom: '10px' }} preload="none" poster="/assets/pixelawbsintro.png" />
          <p style={{marginBottom: '10px'}}>
            2222 Pixelated Lawbsters inspired by <a href="https://pixeladymaker.net/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>PixeladyMaker</a>
          </p>
          <p style={{marginBottom: '10px'}}>
            <a href="https://magiceden.us/collections/ethereum/0x2d278e95b2fc67d4b27a276807e24e479d9707f6" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Secondary</a>
          </p>
        </MobilePopup98>
      )}
      {/* Mobile Menu Modal */}
      {menuOpen && (
        <div className={classes.menuOverlay} onClick={() => setMenuOpen(false)}>
          <div className={classes.menuModal} onClick={e => e.stopPropagation()}>
            <a href="https://dexscreener.com/solana/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Dexscreener</a>
            <a href="https://x.com/lawbstation" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>LawbStation Twitter</a>
            <a href="https://x.com/lawbnexus" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>LawbNexus Twitter</a>
            <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/info/" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>NFTX - Lawbsters</a>
            <a href="https://purity.finance/lawb" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Purity</a>
            <a href="https://uwu.pro/memoji/ulawb" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>UwU LAWB</a>
            <a href="https://t.me/lawblawblawb" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Telegram</a>
            <a href="https://discord.gg/JdkzUHYmMy" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Discord</a>
            <a href="https://store.fun/lawbshop" target="_blank" rel="noopener noreferrer" className={classes.menuLink} onClick={() => setMenuOpen(false)}>Lawb.Shop</a>
            <button className={classes.menuLink} onClick={() => { setMenuOpen(false); setShowMemeGenerator(true); }} style={{ border: 'none', cursor: 'pointer', width: '90%', margin: '0 auto', display: 'block' }}>Meme Generator</button>
          </div>
        </div>
      )}
      {/* Mobile Mint Popup */}
      <MobileMintPopup isOpen={showMintPopup} onClose={() => setShowMintPopup(false)} walletAddress={address || ''} />
      {/* EVM Folder Popup */}
      <FolderPopup open={showEvmFolder} onClose={() => setShowEvmFolder(false)} title="EVM NFT'S FOLDER" nfts={EVM_NFTS} />
      {/* SOL Folder Popup */}
      <FolderPopup open={showSolFolder} onClose={() => setShowSolFolder(false)} title="SOL NFTS FOLDER" nfts={SOL_NFTS} />
      {/* $LAWB Popup */}
      <LawbPopup open={showLawbPopup} onClose={() => setShowLawbPopup(false)} />
      {/* Lawbsters Popup */}
      <MobilePopup98 isOpen={showLawbsters} onClose={() => setShowLawbsters(false)} title="Lawbsters">
        <p style={{marginBottom: '10px'}}>
          420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Cigawrette Packs</a> derivative.
        </p>
        <p>Chain: Ethereum</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://magiceden.us/collections/ethereum/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Secondary</a> or <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/buy/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>NFTX</a>
        </p>
        <img src="/assets/lawbsters.gif" alt="Lawbsters" style={{ width: '100%', marginTop: '10px' }} />
      </MobilePopup98>
      {/* Lawbstarz Popup */}
      <MobilePopup98 isOpen={showLawbstarz} onClose={() => setShowLawbstarz(false)} title="Lawbstarz">
        <p style={{marginBottom: '10px'}}>
          ☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ LAWBSTARZ IS AN <a href="https://allstarz.world" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>ALLSTARZ</a> DERIVATIVE ☆ LAWBSTARZ IS INSPIRED BY <a href="https://www.remilia.org/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>REMILIA CORP</a> ☆ LED BY NETWORK SPIRITUALITY ☆ 666 <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>CIGAWRETTEPACKS</a> WERE CONSUMED BY <a href="https://x.com/portionclub69" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>PORTIONCLUB69</a> AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆
        </p>
        <p>Chain: Ethereum</p>
        <p>
          Collect on <a href="https://magiceden.us/collections/ethereum/0xd7922cd333da5ab3758c95f774b092a7b13a5449" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbstarz.gif" alt="Lawbstarz" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <img src="/assets/lawbstarzhotelroom.png" alt="Lawbstarz Hotel Room" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <img src="/assets/tile-06-audio-image0-lawbstarz dj set 1.0 copy.png" alt="Lawbstarz DJ Set" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </MobilePopup98>
      {/* Pixelawbs Popup */}
      <MobilePopup98 isOpen={showPixelawbs} onClose={() => setShowPixelawbs(false)} title="Pixelawbs">
        <p style={{marginBottom: '10px'}}>
          PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{color: '#ff0000', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => { setShowPixelawbs(false); setShowMintPopup(true); }}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>SCATTER.ART</a>
        </p>
        <video controls src="/assets/pixelawbs.mp4" style={{ width: '100%', marginBottom: '10px' }} preload="none" poster="/assets/pixelawbsintro.png" />
        <p style={{marginBottom: '10px'}}>
          2222 Pixelated Lawbsters inspired by <a href="https://pixeladymaker.net/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>PixeladyMaker</a>
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
          Collect on <a href="https://magiceden.us/collections/base/0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbsterhalloween.gif" alt="Lawbster Halloween" style={{ width: '100%', marginBottom: '10px' }} />
      </MobilePopup98>
      {/* Lawbstation Popup */}
      <MobilePopup98 isOpen={showLawbstation} onClose={() => setShowLawbstation(false)} title="Lawbstation">
        <p style={{marginBottom: '10px'}}>
          Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on <a href="https://www.miladystation2.net/" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>MiladyStation</a> technology. Inspired by Milady, Allstarz, Rusty Rollers, Cigawrette Packs, SPX6900 and Radbro. Brought to you in part by PortionClub and Mony Corp Group. LawbStations seem nice but a lobster controlled by MiladyStation will never achieve anything without a roadmap.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Solana</p>
        <p style={{marginBottom: '10px'}}>
          <a href="https://magiceden.us/marketplace/lawbstation" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Collect Lawbstations on Secondary</a>
        </p>
        <img src="/assets/lawbstation.GIF" alt="Lawbstation" style={{ width: '100%', marginTop: '10px' }} />
        <video controls src="/assets/lawbstation.mp4" style={{ width: '100%', marginTop: '10px' }} />
      </MobilePopup98>
      {/* Nexus Popup */}
      <MobilePopup98 isOpen={showNexus} onClose={() => setShowNexus(false)} title="Nexus">
        <p style={{marginBottom: '10px'}}>
          1000 Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana. Collect on <a href="https://magiceden.us/marketplace/lawbnexus" target="_blank" rel="noopener noreferrer" style={{color: '#ff0000', textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/nexus.gif" alt="Nexus" style={{ width: '100%', marginBottom: '10px' }} />
        <video controls src="/assets/nexusminting.mp4" style={{ width: '100%' }} />
      </MobilePopup98>
      {/* Meme Generator Popup */}
      <MobilePopup98 isOpen={showMemeGenerator} onClose={() => setShowMemeGenerator(false)} title="Meme Generator">
        <MemeGenerator />
      </MobilePopup98>
      {/* Chess Game Popup */}
      <MobilePopup98 isOpen={showChessGame} onClose={() => setShowChessGame(false)} title="Chess">
        <ChessGame onClose={() => setShowChessGame(false)} />
      </MobilePopup98>
      {/* Bottom Taskbar */}
      <div className={classes.taskbar}>
        <button className={classes.menuButton} onClick={() => setMenuOpen(true)}>Menu</button>
        <div className={classes.walletStatus}>
          <span style={{
            height: '10px',
            width: '10px',
            borderRadius: '50%',
            backgroundColor: isConnected ? 'limegreen' : 'red',
            marginRight: '6px',
            border: '1px solid #000',
            display: 'inline-block',
          }}></span>
          {isConnected ? (ens || `${address?.slice(0, 6)}...${address?.slice(-4)}`) : 'Disconnected'}
        </div>
        <span className={classes.clock}>{clock}</span>
      </div>
    </div>
  );
};

export default Mobile; 