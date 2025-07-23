import React, { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import ChessMultiplayer from '../components/ChessMultiplayer';
import MobilePopup98 from './MobilePopup98';

const useStyles = createUseStyles({
  mobileChessContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#000',
    color: '#fff',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#c00',
    padding: '0.75rem 0',
    border: 'none',
    textAlign: 'center',
    borderBottom: '2px solid #00ffff',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    color: '#fff',
    letterSpacing: '1px',
    textShadow: '1px 1px 0 #000',
    textTransform: 'uppercase',
  },
  chessContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: '#00ffff',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    fontWeight: 'bold',
    boxShadow: '2px 2px 0 #000',
    zIndex: 1000,
  },
  walletStatus: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    zIndex: 1000,
  },
  statusDot: {
    height: '8px',
    width: '8px',
    borderRadius: '50%',
    backgroundColor: (isConnected: boolean) => isConnected ? 'limegreen' : 'red',
    marginRight: '6px',
    border: '1px solid #000',
  },
  chessWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileChessGame: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    '& .chess-container': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    '& .chess-board': {
      flex: '1 1 auto',
      minHeight: '300px',
      maxHeight: '60vh',
    },
    '& .chess-controls': {
      flex: '0 0 auto',
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderTop: '2px solid #00ffff',
    },
    '& .chess-lobby': {
      flex: '1 1 auto',
      overflow: 'auto',
      padding: '10px',
    },
    '& .chess-waiting': {
      flex: '1 1 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    '& .chess-active': {
      flex: '1 1 auto',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    '& .chess-finished': {
      flex: '1 1 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    '& .game-info': {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderBottom: '1px solid #00ffff',
      fontSize: '0.8rem',
    },
    '& .game-status': {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderTop: '1px solid #00ffff',
      fontSize: '0.8rem',
    },
    '& .create-game-form': {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '10px',
    },
    '& .form-group': {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    '& .form-group label': {
      fontSize: '0.8rem',
      fontWeight: 'bold',
    },
    '& .form-group input, .form-group select': {
      padding: '8px',
      fontSize: '0.9rem',
      border: '2px solid #00ffff',
      backgroundColor: '#000',
      color: '#fff',
      borderRadius: '4px',
    },
    '& .form-group button': {
      padding: '10px',
      fontSize: '0.9rem',
      backgroundColor: '#00ffff',
      color: '#000',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '2px 2px 0 #000',
    },
    '& .open-games': {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '10px',
    },
    '& .game-item': {
      backgroundColor: 'rgba(0,0,0,0.8)',
      border: '1px solid #00ffff',
      borderRadius: '4px',
      padding: '10px',
      cursor: 'pointer',
    },
    '& .game-item:hover': {
      backgroundColor: 'rgba(0,255,255,0.1)',
    },
    '& .leaderboard': {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      padding: '10px',
    },
    '& .leaderboard-item': {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '5px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      border: '1px solid #00ffff',
      borderRadius: '4px',
      fontSize: '0.8rem',
    },
  },
});

interface MobileChessProps {
  onBack: () => void;
}

const MobileChess: React.FC<MobileChessProps> = ({ onBack }) => {
  const classes = useStyles();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const handleWalletClick = () => {
    if (!isConnected) {
      void open();
    } else {
      // Disconnect is handled by the wallet provider
      console.log('Wallet disconnect requested');
    }
  };

  return (
    <div className={classes.mobileChessContainer}>
      <header className={classes.header}>
        <button className={classes.backButton} onClick={onBack}>
          ← BACK
        </button>
        <h1 className={classes.title}>LAWB CHESS</h1>
        <div className={classes.walletStatus} onClick={handleWalletClick}>
          <div className={classes.statusDot} />
          {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Disconnected'}
        </div>
      </header>
      
      <div className={classes.chessContent}>
        <div className={classes.chessWrapper}>
          <div className={classes.mobileChessGame}>
            <ChessMultiplayer 
              onClose={onBack}
              fullscreen={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileChess; 