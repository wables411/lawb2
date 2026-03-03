/** 2D replacement for Clawb — no 3D/FBX models. */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export type EmoteAnimationId = 'idle' | 'dance1' | 'dance2' | 'dance3' | 'walk' | 'death';

export interface ClawbHandle {
  cycleAnimation: () => void;
  playEmote: (emoteId: EmoteAnimationId) => void;
}

interface Clawb2DProps {
  onClawbClick?: () => void;
}

const IMAGES = ['/assets/lawbticker.gif', '/assets/lawbstarz.gif', '/assets/lawbsterhalloween.gif'];

const Clawb2D = forwardRef<ClawbHandle, Clawb2DProps>(({ onClawbClick }, ref) => {
  const [imgIndex, setImgIndex] = useState(0);
  const clickPosRef = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    cycleAnimation: () => setImgIndex((i) => (i + 1) % IMAGES.length),
    playEmote: () => {},
  }));

  const handlePointerDown = (e: React.PointerEvent) => {
    clickPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = clickPosRef.current;
    if (!start) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx < 10 && dy < 10) onClawbClick?.();
    clickPosRef.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 52,
        width: 80,
        height: 80,
        cursor: 'pointer',
        zIndex: 9998,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <img
        src={IMAGES[imgIndex]}
        alt="Clawb"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
});

Clawb2D.displayName = 'Clawb2D';
export default Clawb2D;
