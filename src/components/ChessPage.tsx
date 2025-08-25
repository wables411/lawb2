import React, { useState } from 'react';
import { ChessGame } from './ChessGame';
import { ChessMultiplayer } from './ChessMultiplayer';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');
  // Remove the showModeSelector state and always show the detailed mode selection
  // const [showModeSelector, setShowModeSelector] = useState(true);

  const handleClose = () => {
    // Navigate back to main site
    window.location.href = '/';
  };

  const handleModeSelect = (mode: 'singleplayer' | 'multiplayer') => {
    setGameMode(mode);
    // Remove the setShowModeSelector(false) call
  };

  const handleBackToModeSelect = () => {
    // This function is no longer needed since we're always showing the mode selection
    // setShowModeSelector(true);
  };

  // Always show the detailed mode selection interface instead of the intermediate 3-button page
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