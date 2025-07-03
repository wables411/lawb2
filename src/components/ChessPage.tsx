import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ChessGame } from './ChessGame';
import { useAppKit } from '@reown/appkit/react';

const ChessPage: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  // Dark mode state and toggle
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('lawb_chess_dark_mode') === 'true';
    }
    return false;
  });
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('lawb_chess_dark_mode', String(!prev));
      }
      return !prev;
    });
  };

  // Add/remove class on <body> for full-page dark mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('chess-dark-mode');
      } else {
        document.body.classList.remove('chess-dark-mode');
      }
    }
  }, [darkMode]);

  const handleBackClick = () => {
    if (!showWarning) {
      setShowWarning(true);
      window.setTimeout(() => setShowWarning(false), 4000); // auto-hide after 4s
    } else {
      // Navigate to the main lawb.xyz site
      window.location.href = 'https://lawb.xyz';
    }
  };

  return (
    <div className={`chess98-main-window${darkMode ? ' chess-dark-mode' : ''}`}>
      <div className="chess98-header">
        <button className="chess98-back-btn" onClick={handleBackClick}>
          {showWarning ? 'warning this will end current game' : 'Back to Desktop'}
        </button>
        <span className="chess98-title">LAWB CHESS</span>
        <span className="chess98-wallet-status">
          {isConnected && address ? (
            <span title={address}>{address.slice(0, 6)}...{address.slice(-4)}</span>
          ) : (
            <span style={{ color: '#fff', cursor: 'pointer' }} onClick={() => { void open(); }}>Connect Wallet</span>
          )}
          {/* Dark mode toggle button next to wallet */}
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ marginLeft: 16 }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </span>
      </div>
      <div className="chess98-content">
        {isConnected && address ? (
          <ChessGame fullscreen={true} onClose={() => {}} onMinimize={() => {}} />
        ) : (
          <div className="wallet-required" style={{ marginTop: 80 }}>
            <h3 style={{ marginBottom: 12, color: darkMode ? '#00ff00' : '#0a2a7a' }}>Wallet Required</h3>
            <p style={{ color: darkMode ? '#00ff00' : '#222' }}>
              You must connect your wallet to play chess and appear on the leaderboard.<br />
              <span style={{ fontSize: 13, opacity: 0.8 }}>(Wallet address is your username.)</span>
            </p>
            <button
              className="start-btn"
              style={{ marginTop: 18, background: darkMode ? '#222' : '#008000', color: darkMode ? '#00ff00' : '#fff', border: darkMode ? '2px solid #00ff00' : undefined }}
              onClick={() => { void open(); }}
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessPage; 