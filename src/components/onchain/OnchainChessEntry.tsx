// Top-level on-chain chess entry (Phase 4). Mounted ONLY when ENABLE_ONCHAIN_CHESS is on
// (see ChessPage). Switches between the lobby and an open game; the game screen itself
// detects whether you're a player or a spectator.

import React, { useState } from 'react';
import { OnchainChessLobby } from './OnchainChessLobby';
import { OnchainChessGame } from './OnchainChessGame';
import type { GameCode } from '../../utils/lawbChessMoves';

export const OnchainChessEntry: React.FC = () => {
  const [code, setCode] = useState<GameCode | null>(null);

  return (
    <div style={{ width: '100%', minHeight: '60vh', display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
      {code ? (
        <OnchainChessGame code={code} onLeave={() => setCode(null)} />
      ) : (
        <OnchainChessLobby onEnterGame={setCode} />
      )}
    </div>
  );
};
