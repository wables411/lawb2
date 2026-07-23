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
    // Own scroll region: the parent .chess-content-simple is overflow:hidden with a
    // bounded height, so this must be flex:1 + min-height:0 + overflow-y:auto or the
    // (tall) lobby gets clipped with no way to reach the open-games / sandbox below.
    <div style={{
      flex: '1 1 auto', minHeight: 0, width: '100%', overflowY: 'auto', overflowX: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 12px 32px', WebkitOverflowScrolling: 'touch',
    }}>
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
