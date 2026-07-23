import { dlog } from './utils/devLog';
/**
 * Wallet -> Firebase Auth sign-in (client side).
 *
 * Database rules only accept writes to leaderboard/profiles/usernames/
 * wallet_links entries whose key equals auth.uid, so before any wallet-keyed
 * write the connected wallet must prove ownership once: sign a short login
 * message, exchange it at /api/wallet-auth for a Firebase custom token, and
 * signInWithCustomToken. The session persists in the browser, so users are
 * only prompted to sign again after it expires or on a new device.
 *
 * EVM and Solana wallets get independent auth sessions (separate Firebase app
 * instances — see getFirebaseAppForKey) so both can stay signed in at once.
 */
import { database, getFirebaseAppForKey } from './firebaseApp';
import { normalizeLeaderboardPathKey } from './firebaseLeaderboard';

export type WalletChain = 'evm' | 'solana';

/** Sign function supplied by the caller: gets the login message, returns the signature string (EVM hex / Solana base58). */
export type WalletMessageSigner = (message: string) => Promise<string>;

export function buildWalletLoginMessage(pathKey: string): string {
  return [
    'lawb.xyz wallet login',
    `address: ${pathKey}`,
    `issued: ${new Date().toISOString()}`,
    '',
    'This signature only proves wallet ownership to save your scores and profile.',
    'It costs nothing and sends no transaction.',
  ].join('\n');
}

const inFlight = new Map<string, Promise<boolean>>();

/** True if this wallet key already has a live Firebase auth session. */
export async function isWalletDbAuthed(pathKey: string): Promise<boolean> {
  if (!database) return false;
  const { getAuth } = await import('firebase/auth');
  return getAuth(getFirebaseAppForKey(pathKey)).currentUser?.uid === pathKey;
}

/**
 * Wait for this wallet's auth session to appear (the sign-in prompt may still be
 * open when a caller wants to write). Resolves false on timeout — callers should
 * then degrade to read-only behavior rather than attempt a write the rules reject.
 */
export async function waitForWalletDbAuth(address: string, timeoutMs = 8000): Promise<boolean> {
  const pathKey = normalizeLeaderboardPathKey(address);
  if (!pathKey) return false;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isWalletDbAuthed(pathKey)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return isWalletDbAuthed(pathKey);
}

/**
 * Ensure this wallet has a Firebase auth session, prompting a signature if needed.
 * Resolves true when signed in, false when unavailable/declined (writes will then
 * be rejected by database rules and callers' existing error paths handle it).
 */
export async function ensureWalletDbAuth(
  address: string,
  chain: WalletChain,
  signMessage: WalletMessageSigner,
): Promise<boolean> {
  if (!database) return false; // Firebase not configured (local dev) — nothing to do
  const pathKey = normalizeLeaderboardPathKey(address);
  if (!pathKey) return false;

  const existing = inFlight.get(pathKey);
  if (existing) return existing;

  const task = (async () => {
    try {
      const { getAuth, signInWithCustomToken } = await import('firebase/auth');
      const auth = getAuth(getFirebaseAppForKey(pathKey));
      if (auth.currentUser?.uid === pathKey) return true;

      const message = buildWalletLoginMessage(pathKey);
      const signature = await signMessage(message);

      const res = await fetch('/.netlify/functions/wallet-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: pathKey, chain, message, signature }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('[walletAuth] token exchange failed:', res.status, err?.error);
        return false;
      }
      const { token } = await res.json();
      await signInWithCustomToken(auth, token);
      dlog('[walletAuth] signed in for', pathKey.slice(0, 8) + '…');
      return true;
    } catch (err) {
      // User declined the signature or network hiccup — writes stay read-only.
      console.warn('[walletAuth] sign-in skipped:', (err as Error)?.message);
      return false;
    } finally {
      inFlight.delete(pathKey);
    }
  })();

  inFlight.set(pathKey, task);
  return task;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Encode bytes as base58 (for Solana signature transport). */
export function base58Encode(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) num = (num << 8n) + BigInt(b);
  let out = '';
  while (num > 0n) {
    out = BASE58_ALPHABET[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = '1' + out;
    else break;
  }
  return out;
}
