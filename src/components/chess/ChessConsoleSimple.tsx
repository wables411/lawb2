import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ChessGame } from '../ChessGame';
import './ChessConsole.css';

interface ChessConsoleSimpleProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export const ChessConsoleSimple: React.FC<ChessConsoleSimpleProps> = ({ onClose, isMobile = false }) => {
  const { isConnected } = useAccount();

  return (
    <div className={`chess-console ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="chess-console-content" style={{ padding: 0, gap: 0 }}>
        <ChessGame 
          onClose={onClose || (() => window.location.href = '/')}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

