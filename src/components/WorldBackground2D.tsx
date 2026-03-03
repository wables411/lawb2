/** 2D replacement for WorldBackground — no 3D models. */
import React from 'react';

const WorldBackground2D: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #0c1e36 0%, #1a4a6c 50%, #0a1628 100%)',
      zIndex: -1,
    }}
  />
);

export default WorldBackground2D;
