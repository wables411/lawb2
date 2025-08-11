import React, { useState } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  const [showModeSelector, setShowModeSelector] = useState(true);

  const handleClose = () => {
    // Navigate back to main site
    window.location.href = '/';
  };

  const handleModeSelect = (mode: 'singleplayer' | 'multiplayer') => {
    setGameMode(mode);
    setShowModeSelector(false);
  };

  const handleBackToModeSelect = () => {
    setShowModeSelector(true);
  };

  // Mode selection interface
  if (showModeSelector) {
    return (
      <div className="chess-page">
        <div className="mode-selector" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: "url('/assets/background.gif') no-repeat center center fixed",
          backgroundSize: 'cover',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#ff0000',
            fontFamily: 'Impact, Charcoal, sans-serif',
            fontSize: '48px',
            fontWeight: 'bold',
            textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
            marginBottom: '40px',
            textTransform: 'uppercase'
          }}>
            LAWB CHESS
          </h1>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <button
              onClick={() => handleModeSelect('singleplayer')}
              style={{
                background: 'rgba(255, 0, 0, 0.1)',
                border: '3px solid #ff0000',
                color: '#ff0000',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                textShadow: '0 0 10px #ff0000'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ♟️ SINGLE PLAYER
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
                Play against AI
              </div>
            </button>
            
            <button
              onClick={() => handleModeSelect('multiplayer')}
              style={{
                background: 'rgba(255, 0, 0, 0.1)',
                border: '3px solid #ff0000',
                color: '#ff0000',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                textShadow: '0 0 10px #ff0000'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🦞 MULTIPLAYER
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
                Play against other players
              </div>
            </button>
            
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #666',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                fontSize: '14px',
                marginTop: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              ← Back to Main Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chess-page">
      <div className="chess-content">
        {gameMode === 'singleplayer' ? (
          <ChessGame onClose={handleClose} onBackToModeSelect={handleBackToModeSelect} />
        ) : (
          <ChessMultiplayer onClose={handleClose} onMinimize={() => {}} fullscreen={false} onBackToModeSelect={handleBackToModeSelect} />
        )}
      </div>
    </div>
  );
};

export default ChessPage; 