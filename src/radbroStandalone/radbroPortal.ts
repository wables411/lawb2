/**
 * Radbro.fun portal integration — postMessage only (the game runs inside their
 * sandboxed iframe; no storage or same-origin API access). Two messages matter:
 *  - `radbro:game-ready`: describes the game so the portal page frames it
 *    correctly. Posted on load and again whenever the page asks via
 *    `radbro:game-ready-request`.
 *  - `radbro:game-result`: one per finished run; drives the page's
 *    plays/clears counter and, for wallet-connected players, the portal's
 *    durable best-score save and "Best run" leaderboard.
 * Their side caps score at 999999 and accepts statuses run/clear/gameover.
 */

const GAME_SLUG = 'reef-run';

const READY_PAYLOAD = {
  type: 'radbro:game-ready',
  game: GAME_SLUG,
  title: 'Reef Run',
  objective:
    'Collect as much ocean trash as you can before your air runs out or you hit the reef.',
  hint: 'Trash is the mission — air tanks refill oxygen, peptides patch your armor.',
  controls: [
    'A/D or arrows change lanes',
    'W speeds up, S slows down',
    'C swaps swimmer',
    'M toggles sound',
    'Touch: tap sides, swipe for speed',
  ],
  viewport: { width: 1280, height: 720 },
} as const;

function embedded(): boolean {
  try {
    return typeof window !== 'undefined' && window.parent !== window;
  } catch {
    return false;
  }
}

function post(message: unknown): void {
  try {
    window.parent.postMessage(message, '*');
  } catch {
    /* portal messaging is best-effort — never let it touch the game */
  }
}

/** Announce the game to the portal; re-announce whenever it asks. Returns cleanup. */
export function announceGameReady(): () => void {
  if (!embedded()) return () => {};
  post(READY_PAYLOAD);
  const onMessage = (ev: MessageEvent): void => {
    const type = (ev.data as { type?: unknown } | null)?.type;
    if (type === 'radbro:game-ready-request') post(READY_PAYLOAD);
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

/** Report a finished run. Endless runner: every run ends in `gameover`; score = survival seconds. */
export function reportRunResult(survivalSec: number): void {
  if (!embedded()) return;
  post({
    type: 'radbro:game-result',
    game: GAME_SLUG,
    status: 'gameover',
    score: Math.max(0, Math.min(999999, Math.round(survivalSec))),
  });
}
