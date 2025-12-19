import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { ThemeToggle } from './ThemeToggle';
import { isBaseMiniApp } from '../utils/baseMiniapp';

interface TaskbarStyleProps {
  isOpen: boolean;
  isMobile?: boolean;
}

const useStyles = createUseStyles({
  taskbar: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100%',
    height: ({ isMobile }: TaskbarStyleProps) => isMobile ? 60 : 40,
    minHeight: ({ isMobile }: TaskbarStyleProps) => isMobile ? 60 : 40,
    background: '#c0c0c0',
    borderTop: '2px outset #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 200,
    paddingLeft: '10%',
    paddingRight: '10%',
    boxSizing: 'border-box',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '5px',
    height: '100%',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    marginRight: '4px',
    border: '2px inset #fff',
    height: 'calc(100% - 8px)',
  },
  menuBtn: {
    marginLeft: ({ isMobile }: TaskbarStyleProps) => isMobile ? '20px' : '5px',
    padding: ({ isMobile }: TaskbarStyleProps) => isMobile ? '12px 16px' : '8px 12px',
    minWidth: ({ isMobile }: TaskbarStyleProps) => isMobile ? '44px' : 'auto',
    minHeight: ({ isMobile }: TaskbarStyleProps) => isMobile ? '44px' : 'auto',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'MS Sans Serif, sans-serif',
    color: '#000',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box'
  },
  menu: {
    position: 'absolute',
    bottom: ({ isMobile }: TaskbarStyleProps) => isMobile ? '65px' : '45px',
    left: '5px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '2px',
    display: ({ isOpen }: TaskbarStyleProps) => (isOpen ? 'block' : 'none'),
    zIndex: 100000, // Higher than all popups to open over windows
    maxHeight: ({ isMobile }: TaskbarStyleProps) => isMobile ? 'calc(100vh - 120px)' : '400px',
    maxWidth: ({ isMobile }: TaskbarStyleProps) => isMobile ? 'calc(100vw - 20px)' : '220px',
    overflowY: 'auto',
    minWidth: ({ isMobile }: TaskbarStyleProps) => isMobile ? '200px' : '220px',
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  menuLink: {
    padding: ({ isMobile }: TaskbarStyleProps) => isMobile ? '14px 16px' : '10px 14px',
    minHeight: ({ isMobile }: TaskbarStyleProps) => isMobile ? '44px' : 'auto',
    color: '#000 !important',
    textDecoration: 'none !important',
    background: '#c0c0c0 !important',
    border: 'none',
    borderBottom: '1px solid #808080',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'MS Sans Serif, sans-serif',
    width: '100%',
    textAlign: 'left',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    '&:first-child': {
      borderTop: 'none'
    },
    '&:last-child': {
      borderBottom: 'none'
    },
    '&:hover': {
      background: '#d4d0c8 !important',
      color: '#000 !important'
    },
    '&:active': {
      background: '#a0a0a0 !important',
      borderTop: '1px inset #808080',
      borderBottom: '1px inset #808080',
      color: '#000 !important'
    },
    '&:visited': {
      color: '#000 !important'
    },
    '&:link': {
      color: '#000 !important'
    }
  },
  themeMenuItem: {
    display: 'block',
    padding: '4px 12px',
    color: '#000',
    textDecoration: 'none',
    background: '#c0c0c0',
    border: '2px outset #fff',
    marginBottom: '1px',
    cursor: 'pointer',
    fontSize: '12px',
    width: '100%',
    textAlign: 'left',
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
    fontFamily: 'monospace',
    height: 'calc(100% - 8px)',
    display: 'flex',
    alignItems: 'center',
  },
  windows: {
    display: 'flex',
    alignItems: 'center'
  },
  windowButton: {
    marginLeft: '5px',
    padding: ({ isMobile }: TaskbarStyleProps) => isMobile ? '12px 16px' : '8px 12px',
    minWidth: ({ isMobile }: TaskbarStyleProps) => isMobile ? '44px' : 'auto',
    minHeight: ({ isMobile }: TaskbarStyleProps) => isMobile ? '44px' : 'auto',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
    fontSize: ({ isMobile }: TaskbarStyleProps) => isMobile ? '12px' : '12px'
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
  onOpenPublicChat?: () => void;
  onOpenProfile?: () => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ minimizedWindows, onRestoreWindow, walletButton, connectionStatus, onOpenPublicChat, onOpenProfile }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Base Mini App should ALWAYS use mobile/miniapp layout (vertical, mobile-like)
  // regardless of actual device or window width
  // This ensures consistent appearance in Farcaster/Base on both mobile and desktop browsers
  const isBaseApp = typeof window !== 'undefined' && isBaseMiniApp();
  const isMobile = isBaseApp || (typeof window !== 'undefined' && window.innerWidth <= 768);
  const classes = useStyles({ isOpen: isMenuOpen, isMobile });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className={classes.taskbar}>
      <div className={classes.leftSection}>
        <button className={classes.menuBtn} onClick={handleMenuClick} type="button">
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
        <div className={classes.statusSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <span style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: connectionStatus.connected ? '#00ff00' : 'red',
              marginRight: 4,
              border: '1px solid #222'
            }} />
          </div>
          {walletButton}
        </div>
        <div className={classes.clock}>
          {formatTime(currentTime)}
        </div>
      </div>
      
      {isMenuOpen && (
        <div className={classes.menu}>
          {onOpenProfile && (
            <button
              type="button"
              className={classes.menuLink}
              onClick={() => {
                handleMenuLinkClick();
                onOpenProfile();
              }}
            >
              Profile
            </button>
          )}
          <button
            type="button"
            className={classes.menuLink}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              // Close menu FIRST, then open chat
              setIsMenuOpen(false);
              // Use setTimeout to ensure menu closes before chat opens
              setTimeout(() => {
                if (onOpenPublicChat) {
                  onOpenPublicChat();
                }
              }, 50);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              // Close menu FIRST, then open chat
              setIsMenuOpen(false);
              // Use setTimeout to ensure menu closes before chat opens
              setTimeout(() => {
                if (onOpenPublicChat) {
                  onOpenPublicChat();
                }
              }, 50);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Public Chat
          </button>
          <div style={{ 
            height: '1px', 
            background: '#808080', 
            margin: '4px 0',
            borderTop: '1px solid #fff',
            borderBottom: '1px solid #808080'
          }} />
          <a 
            href="https://www.geckoterminal.com/solana/pools/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep?embed=1&info=1&swaps=0&grayscale=0&light_chart=0&chart_type=market_cap&resolution=15m" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            GeckoTerminal
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
          <a 
            href="https://store.fun/lawbshop" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.menuLink} 
            onClick={handleMenuLinkClick}
          >
            Lawb.Shop
          </a>
          <div style={{ 
            height: '1px', 
            background: '#808080', 
            margin: '4px 0',
            borderTop: '1px solid #fff',
            borderBottom: '1px solid #808080'
          }} />
          <div onClick={(e) => e.stopPropagation()}>
            <ThemeToggle asMenuItem={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Taskbar;