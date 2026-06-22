// Top-level on-chain chess entry (Phase 4). Mounted ONLY when ENABLE_ONCHAIN_CHESS is on
// (see ChessPage). Switches between the lobby and an open game; the game screen itself
// detects whether you're a player or a spectator.

import React, { useState } from 'react';
import { OnchainChessLobby } from './OnchainChessLobby';
import { OnchainChessGame } from './OnchainChessGame';
import { OnchainChessDemo } from './OnchainChessDemo';
import type { GameCode } from '../../utils/lawbChessMoves';

type View = { kind: 'lobby' } | { kind: 'game'; code: GameCode } | { kind: 'demo' };

export const OnchainChessEntry: React.FC = () => {
  const [view, setView] = useState<View>({ kind: 'lobby' });

  return (
    <div style={{ width: '100%', minHeight: '60vh', display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
      {view.kind === 'game' ? (
        <OnchainChessGame code={view.code} onLeave={() => setView({ kind: 'lobby' })} />
      ) : view.kind === 'demo' ? (
        <OnchainChessDemo onLeave={() => setView({ kind: 'lobby' })} />
      ) : (
        <OnchainChessLobby
          onEnterGame={(code) => setView({ kind: 'game', code })}
          onPlayDemo={() => setView({ kind: 'demo' })}
        />
      )}
    </div>
  );
};
