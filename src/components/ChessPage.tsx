import React, { useState } from 'react';
import { ChessGame } from './ChessGame';
import ChessMultiplayer from './ChessMultiplayer';
import './ChessMultiplayer.css';
import './ChessPage.css';

const ChessPage: React.FC = () => {
  const [gameMode, setGameMode] = useState<'singleplayer' | 'multiplayer'>('singleplayer');

  return (
    <div className="chess-page">
      <div className="chess-content">
        {gameMode === 'singleplayer' ? (
          <ChessGame onClose={() => {}} />
        ) : (
          <ChessMultiplayer onClose={() => {}} onMinimize={() => {}} fullscreen={false} />
        )}
      </div>
    </div>
  );
};

export default ChessPage; 