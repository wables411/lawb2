/** 2D replacement for ClawbDanceLoop — no 3D/FBX. */
import React from 'react';

const ClawbDanceLoop2D: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={className} style={{ textAlign: 'center', ...style }}>
    <img src="/assets/lawbstarz.webp" alt="Clawb" style={{ maxWidth: '200px', height: 'auto' }} />
    <p style={{ marginTop: 8, color: '#888', fontSize: 14 }}>Waiting for opponent…</p>
  </div>
);

export default ClawbDanceLoop2D;
