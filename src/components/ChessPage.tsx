import React, { useState, useEffect } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  const [showLoading, setShowLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('');

  // Loading screen effect
  useEffect(() => {
    const fullText = 'Lawb Chess Loading';
    let dots = '';
    
    const textInterval = setInterval(() => {
      dots = dots.length >= 4 ? '' : dots + '.';
      setLoadingText(fullText + dots);
    }, 500);

    // Hide loading screen after 3 seconds
    const loadingTimeout = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    return () => {
      clearInterval(textInterval);
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handleClose = () => {
    // Navigate back to main site
    window.location.href = '/';
  };

  if (showLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 9999,
        overflow: 'hidden',
      }}>
        {/* Loading Video that fills entire screen */}
        <video
          src="/images/loadingchess.mp4"
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadStart={() => {
            console.log('[CHESS] Video started loading');
          }}
          onCanPlay={() => {
            console.log('[CHESS] Video can play');
          }}
          onPlay={() => {
            console.log('[CHESS] Video started playing');
          }}
          onError={(e) => {
            console.log('[CHESS] Video failed to load:', e);
          }}
        />

        {/* Centered Loading Text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          textAlign: 'center',
        }}>
          <div style={{
            color: '#ff0000',
            fontSize: '32px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #ff0000',
            letterSpacing: '2px',
          }}>
            {loadingText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chess-page">
      <div className="chess-content">
        {gameMode === 'singleplayer' ? (
          <ChessGame onClose={handleClose} />
        ) : (
          <ChessMultiplayer onClose={handleClose} onMinimize={() => {}} fullscreen={false} />
        )}
      </div>
    </div>
  );
};

export default ChessPage; 