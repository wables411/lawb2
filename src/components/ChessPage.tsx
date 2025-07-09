import React, { useState } from 'react';
import { ChessGame } from './ChessGame';
import ChessMultiplayer from './ChessMultiplayer';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');

  return (
    <div className="chess-page">
      <div className="chess-header">
        <h1>♔ Chess</h1>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${gameMode === 'singleplayer' ? 'active' : ''}`}
            onClick={() => setGameMode('singleplayer')}
          >
            Single Player
          </button>
          <button
            className={`mode-btn ${gameMode === 'multiplayer' ? 'active' : ''}`}
            onClick={() => setGameMode('multiplayer')}
          >
            Multiplayer
          </button>
        </div>
      </div>

      <div className="chess-content">
        {gameMode === 'singleplayer' ? (
          <ChessGame onClose={() => {}} />
        ) : (
          <ChessMultiplayer />
        )}
            </div>
    </div>
  );
};

export default ChessPage; 