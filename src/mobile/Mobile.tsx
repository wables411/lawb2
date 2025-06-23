import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import MobileNFTGallery from './MobileNFTGallery';

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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '0.75rem 0',
    border: 'none',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    color: '#00ffff',
    letterSpacing: '2px',
    textShadow: '2px 2px 0 #000',
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
    width: '100vw',
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
});

type ActiveView = 'main' | 'gallery';

const Mobile = () => {
  const classes = useStyles();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ens } = useEnsName({ address });
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [showPixelawbsPopup, setShowPixelawbsPopup] = useState(true);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const handleOpenGallery = () => {
    if (!address) {
      alert('Please connect your wallet to view your collection.');
      return;
    }
    setActiveView('gallery');
  };

  const icons = [
    { label: 'EVM LAWB GALLERY', icon: '/assets/folder.png', action: handleOpenGallery },
    { label: 'Mint Pixelawbs', icon: '/assets/mint.gif', action: () => alert('Minting coming soon to mobile!') },
    { 
      label: isConnected ? (ens || `${address?.slice(0, 6)}...${address?.slice(-4)}`) : 'Connect Wallet', 
      icon: '/assets/wallet.png', 
      action: () => {
        if (!isConnected) {
          void open();
        } else {
          disconnect();
        }
      },
      disabled: isPending
    },
    { label: 'Twitter', icon: '/assets/icon1.png', action: () => window.open('https://twitter.com/lawbsterdao', '_blank') },
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

  if (activeView === 'gallery') {
    return <MobileNFTGallery onBack={() => setActiveView('main')} walletAddress={address || undefined} />;
  }

  return (
    <div className={classes.mobileContainer}>
      <header className={classes.header}>
        <h1 className={classes.title}>LAWB</h1>
      </header>
      <div className={classes.iconGrid}>
        {icons.map(icon => (
          <div key={icon.label} className={classes.icon} onClick={() => handleIconClick(icon)}>
            <img src={icon.icon} alt={icon.label} />
            <span>{icon.label}</span>
          </div>
        ))}
      </div>
      {/* Pixelawbs Popup */}
      {showPixelawbsPopup && (
        <div className={classes.pixelawbsPopupOverlay}>
          <div className={classes.pixelawbsPopup}>
            <button className={classes.closeButton} onClick={() => setShowPixelawbsPopup(false)}>&times;</button>
            <img src="/assets/mint.gif" alt="Pixelawbs" style={{ width: '100%', marginBottom: '1rem' }} />
            <h2 style={{ color: '#008080', fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif", marginBottom: '1rem' }}>PIXELAWBS</h2>
            <video src="/assets/pixelawbs.mp4" controls style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} poster="/assets/pixelawb.png" preload="none" />
            <p style={{ color: '#000', fontFamily: "'MS Sans Serif', Arial, sans-serif", fontSize: '1rem', textAlign: 'center' }}>
              2222 Pixelated Lawbsters inspired by PixeladyMaker. Mint now on Ethereum!
            </p>
          </div>
        </div>
      )}
      {/* Bottom Taskbar */}
      <div className={classes.taskbar}>
        <button className={classes.menuButton}>Menu</button>
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