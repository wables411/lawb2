import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface LinuxNavBarStyleProps {
  isOpen: boolean;
  isMobile?: boolean;
}

const useStyles = createUseStyles({
  navbar: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100%',
    height: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? 50 : 36,
    minHeight: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? 50 : 36,
    background: 'linear-gradient(to bottom, #4a5568, #2d3748)',
    borderTop: '1px solid #1a202c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 200,
    paddingLeft: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '8px' : '12px',
    paddingRight: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '8px' : '12px',
    boxSizing: 'border-box',
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.3)',
    fontFamily: 'DejaVu Sans, Liberation Sans, Arial, sans-serif',
    fontSize: '12px',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    justifyContent: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  menuButton: {
    background: 'linear-gradient(to bottom, #5a6578, #4a5568)',
    border: '1px solid #2d3748',
    borderRadius: '4px',
    color: '#e2e8f0',
    padding: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '8px 12px' : '6px 10px',
    minWidth: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '44px' : 'auto',
    minHeight: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '44px' : 'auto',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'DejaVu Sans, Liberation Sans, Arial, sans-serif',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
    '&:hover': {
      background: 'linear-gradient(to bottom, #6a7588, #5a6578)',
      borderColor: '#4a5568',
    },
    '&:active': {
      background: 'linear-gradient(to bottom, #4a5568, #3a4558)',
      borderColor: '#2d3748',
    },
  },
  navButton: {
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#cbd5e0',
    padding: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '8px 12px' : '6px 10px',
    minWidth: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '44px' : 'auto',
    minHeight: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '44px' : 'auto',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'DejaVu Sans, Liberation Sans, Arial, sans-serif',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
    },
    '&.active': {
      background: 'rgba(66, 153, 225, 0.3)',
      color: '#90cdf4',
      borderBottom: '2px solid #4299e1',
    },
  },
  menu: {
    position: 'absolute',
    bottom: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '55px' : '41px',
    left: '12px',
    background: '#2d3748',
    border: '1px solid #1a202c',
    borderRadius: '6px',
    padding: '4px',
    display: ({ isOpen }: LinuxNavBarStyleProps) => (isOpen ? 'block' : 'none'),
    zIndex: 100000,
    maxHeight: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? 'calc(100vh - 120px)' : '500px',
    maxWidth: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? 'calc(100vw - 20px)' : '280px',
    overflowY: 'auto',
    minWidth: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '240px' : '280px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  menuItem: {
    padding: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '12px 16px' : '10px 14px',
    minHeight: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '44px' : 'auto',
    color: '#e2e8f0',
    textDecoration: 'none',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'DejaVu Sans, Liberation Sans, Arial, sans-serif',
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '4px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
    },
    '&:active': {
      background: 'rgba(255, 255, 255, 0.15)',
    },
  },
  menuSeparator: {
    height: '1px',
    background: '#4a5568',
    margin: '4px 0',
    border: 'none',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '6px 10px' : '4px 8px',
    borderRadius: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    fontSize: '11px',
    color: '#cbd5e0',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '1px solid rgba(0, 0, 0, 0.3)',
  },
  clock: {
    padding: ({ isMobile }: LinuxNavBarStyleProps) => isMobile ? '6px 10px' : '4px 8px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#cbd5e0',
    display: 'flex',
    alignItems: 'center',
    minWidth: '60px',
    justifyContent: 'center',
  },
});

interface LinuxNavBarProps {
  walletButton?: React.ReactNode;
  connectionStatus: {
    connected: boolean;
    address?: string;
    ens?: string;
  };
  onOpenPublicChat?: () => void;
  onOpenProfile?: () => void;
  onChessClose?: () => void;
  showChessMenu?: boolean;
}

const LinuxNavBar: React.FC<LinuxNavBarProps> = ({ walletButton, connectionStatus, onOpenPublicChat, onOpenProfile, onChessMenuClick, onChessClose, showChessMenu }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
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

  const handleMenuLinkClick = (path?: string, action?: () => void) => {
    setIsMenuOpen(false);
    if (action) {
      action();
    } else if (path) {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <div className={classes.navbar}>
        <div className={classes.leftSection}>
          <button className={classes.menuButton} onClick={handleMenuClick} type="button">
            <span>☰</span>
            <span>Applications</span>
          </button>
        </div>
        
        <div className={classes.centerSection}>
          <button
            className={`${classes.navButton} ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
            type="button"
          >
            Home
          </button>
          <button
            className={`${classes.navButton} ${isActive('/chess') ? 'active' : ''}`}
            onClick={() => navigate('/chess')}
            type="button"
          >
            Chess
          </button>
        </div>
        
        <div className={classes.rightSection}>
          <div className={classes.statusIndicator}>
            <div
              className={classes.statusDot}
              style={{
                backgroundColor: connectionStatus.connected ? '#48bb78' : '#f56565',
              }}
            />
            {walletButton || (
              <span style={{ fontSize: '11px' }}>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            )}
          </div>
          <div className={classes.clock}>
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className={classes.menu} onClick={(e) => e.stopPropagation()}>
          <button
            className={classes.menuItem}
            onClick={() => handleMenuLinkClick('/')}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
          <button
            className={classes.menuItem}
            onClick={() => handleMenuLinkClick('/chess')}
          >
            <span>♟️</span>
            <span>Chess</span>
          </button>
          <hr className={classes.menuSeparator} />
          {onOpenPublicChat && (
            <button
              className={classes.menuItem}
              onClick={() => handleMenuLinkClick(undefined, onOpenPublicChat)}
            >
              <span>💬</span>
              <span>Public Chat</span>
            </button>
          )}
          {onOpenProfile && (
            <button
              className={classes.menuItem}
              onClick={() => handleMenuLinkClick(undefined, onOpenProfile)}
            >
              <span>👤</span>
              <span>Profile</span>
            </button>
          )}
          {showChessMenu && (
            <>
              <hr className={classes.menuSeparator} />
              <button
                className={classes.menuItem}
                onClick={() => {
                  setIsMenuOpen(false);
                  if ((window as any).__chessMenuToggle) {
                    (window as any).__chessMenuToggle();
                  }
                }}
              >
                <span>☰</span>
                <span>Chess Menu</span>
              </button>
            </>
          )}
          {onChessClose && (
            <button
              className={classes.menuItem}
              onClick={() => handleMenuLinkClick(undefined, onChessClose)}
            >
              <span>×</span>
              <span>Close Chess</span>
            </button>
          )}
          <hr className={classes.menuSeparator} />
          <div style={{ padding: '8px 14px' }}>
            <ThemeToggle />
          </div>
        </div>
      )}
    </>
  );
};

export default LinuxNavBar;



