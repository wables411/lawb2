import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { ChessGame } from './ChessGame';

const ChessPage: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  // Dark mode state and toggle
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('lawb_chess_dark_mode') === 'true';
    }
    return false;
  });
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('lawb_chess_dark_mode', String(!prev));
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
      navigate('/');
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
            <span style={{ color: '#fff', cursor: 'pointer' }} onClick={() => window.dispatchEvent(new CustomEvent('open-wallet-connect'))}>Connect Wallet</span>
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
        <ChessGame fullscreen={true} onClose={() => {}} onMinimize={() => {}} />
      </div>
    </div>
  );
};

export default ChessPage; 