import React, { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import MobileNFTGallery from './MobileNFTGallery';

const useStyles = createUseStyles({
  mobileContainer: {
    background: '#008080', // Classic Windows teal
    minHeight: '100vh',
    padding: '1rem',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    color: '#fff',
  },
  header: {
    backgroundColor: '#808080',
    padding: '0.5rem',
    border: '2px solid #fff',
    borderRightColor: '#A0A0A0',
    borderBottomColor: '#A0A0A0',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '1rem',
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
  }
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
    { label: 'Farcaster', icon: '/assets/icon2.png', action: () => window.open('https://warpcast.com/lawbster', '_blank') },
  ];

  const handleIconClick = (icon: typeof icons[0]) => {
    if (icon.disabled) return;
    icon.action();
  };

  if (activeView === 'gallery') {
    return <MobileNFTGallery onBack={() => setActiveView('main')} walletAddress={address || undefined} />;
  }

  return (
    <div className={classes.mobileContainer}>
      <header className={classes.header}>
        <h1 className={classes.title}>LAWB.XYZ</h1>
      </header>
      <div className={classes.iconGrid}>
        {icons.map(icon => (
          <div key={icon.label} className={classes.icon} onClick={() => handleIconClick(icon)}>
            <img src={icon.icon} alt={icon.label} />
            <span>{icon.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mobile; 