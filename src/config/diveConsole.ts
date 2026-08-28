// Dive-console overhaul flag (step 3 — see memory dive-console-overhaul + the
// "Lawb Dive Console" design artifact). Same rollout pattern as reefJackpotOnchain:
// defaults OFF, `?diveconsole=1` opts a single session in so it's testable on prod
// before the env flip.

function readViteEnv(name: string): string {
  if (typeof import.meta === 'undefined' || !import.meta.env) return '';
  const value = import.meta.env[name as keyof ImportMetaEnv];
  return typeof value === 'string' ? value.trim() : '';
}

function readBooleanFlag(name: string, fallback: boolean): boolean {
  const raw = readViteEnv(name).toLowerCase();
  if (!raw) return fallback;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export const ENABLE_DIVE_CONSOLE =
  readBooleanFlag('VITE_DIVE_CONSOLE', false) ||
  (typeof window !== 'undefined' && /[?&]diveconsole=1/.test(window.location.search));

/**
 * The Tides activity feed (droplet-published static JSON — elo.json pattern,
 * zero Firebase reads; see elo-indexer/tides.mjs). chess.lawb.xyz is already
 * in the CSP connect-src.
 */
export const TIDES_URL = readViteEnv('VITE_TIDES_URL') || 'https://chess.lawb.xyz/tides.json';
