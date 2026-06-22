// Chess sound effects, reusing the existing assets the live game uses (public/images/*.mp3).
// Best-effort: autoplay restrictions / load failures are swallowed so gameplay never breaks.

const SOUNDS: Record<string, string> = {
  move: '/images/move.mp3',
  capture: '/images/capture.mp3',
  check: '/images/play.mp3',
  victory: '/images/victory.mp3',
  loser: '/images/loser.mp3',
  promote: '/images/upgrade.mp3',
};

export type ChessSound = keyof typeof SOUNDS | 'move' | 'capture' | 'check' | 'victory' | 'loser' | 'promote';

let muted = false;
export function setChessMuted(m: boolean): void { muted = m; }
export function isChessMuted(): boolean { return muted; }

export function playChessSound(type: ChessSound): void {
  if (muted || typeof Audio === 'undefined') return;
  const src = SOUNDS[type];
  if (!src) return;
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
