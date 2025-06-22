import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  taskbar: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100vw',
    height: 40,
    background: '#c0c0c0',
    borderTop: '2px outset #fff',
    display: 'flex',
    alignItems: 'center',
    zIndex: 200,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '10px'
  },
  menuBtn: {
    marginLeft: '5px',
    padding: '5px 10px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer'
  },
  menu: {
    position: 'absolute',
    bottom: '40px',
    left: '5px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '5px',
    display: ({ isOpen }: { isOpen: boolean }) => (isOpen ? 'block' : 'none'),
    zIndex: 9999
  },
  menuLink: {
    display: 'block',
    padding: '8px 12px',
    color: '#000',
    textDecoration: 'none',
    background: '#c0c0c0',
    border: '2px outset #fff',
    marginBottom: '2px',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      background: '#d0d0d0',
      border: '2px inset #fff'
    },
    '&:active': {
      border: '2px inset #c0c0c0'
    }
  },
  minimizedWindow: {
    marginLeft: '5px',
    padding: '5px 10px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    fontSize: '12px'
  },
  clock: {
    padding: '5px 10px',
    background: '#c0c0c0',
    border: '2px inset #fff',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  windows: {
    display: 'flex',
    alignItems: 'center'
  },
  windowButton: {
    marginLeft: '5px',
    padding: '5px 10px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer'
  }
});

interface TaskbarProps {
  minimizedWindows: string[];
  onRestoreWindow: (popupId: string) => void;
  walletButton?: React.ReactNode;
  connectionStatus: {
    connected: boolean;
    address?: string;
    ens?: string;
  };
}

const Taskbar: React.FC<TaskbarProps> = ({ minimizedWindows, onRestoreWindow, walletButton, connectionStatus }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const classes = useStyles({ isOpen: isMenuOpen });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className={classes.taskbar}>
      <div className={classes.leftSection}>
        <button className={classes.menuBtn} onClick={handleMenuClick}>
          Menu
        </button>
        
        {/* Minimized windows */}
        <div className={classes.windows}>
          {minimizedWindows.map((id) => (
            <button
              key={id}
              className={classes.windowButton}
              onClick={() => onRestoreWindow(id)}
            >
              {id.replace('-popup', '').replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className={classes.rightSection}>
        <div className={classes.clock}>
          {formatTime(currentTime)}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <span style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: connectionStatus.connected ? 'limegreen' : 'red',
              marginRight: 4,
              border: '1px solid #222'
            }} />
            <span style={{ color: connectionStatus.connected ? 'limegreen' : 'red', fontWeight: 600 }}>
              {connectionStatus.connected
                ? (connectionStatus.ens || (connectionStatus.address ? `${connectionStatus.address.slice(0, 6)}...${connectionStatus.address.slice(-4)}` : 'Connected'))
                : 'Disconnected'}
            </span>
          </div>
          {walletButton}
        </div>
      </div>
      
      {isMenuOpen && (
        <div className={classes.menu}>
          <a 
            href="https://dexscreener.com/solana/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            Dexscreener
          </a>
          <a 
            href="https://x.com/lawbstation" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            LawbStation Twitter
          </a>
          <a 
            href="https://x.com/lawbnexus" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            LawbNexus Twitter
          </a>
          <a 
            href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/info/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            NFTX - Lawbsters
          </a>
          <a 
            href="https://uwu.pro/memoji/ulawb" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            UwU LAWB
          </a>
          <a 
            href="https://t.me/lawblawblawb" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            Telegram
          </a>
          <a 
            href="https://discord.gg/JdkzUHYmMy" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            Discord
          </a>
        </div>
      )}
    </div>
  );
};

export default Taskbar;