/** Desktop background — embeds Retake stream (no cost; stream served by Retake). */
import React from 'react';

const RETAKE_URL = 'https://retake.tv/clawb';

const WorldBackground2D: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      background: 'linear-gradient(180deg, #0c1e36 0%, #1a4a6c 50%, #0a1628 100%)',
    }}
  >
    <iframe
      src={RETAKE_URL}
      title="Clawb stream"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        pointerEvents: 'none',
      }}
    />
  </div>
);

export default WorldBackground2D;
