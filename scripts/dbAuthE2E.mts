/**
 * End-to-end proof of the wallet -> Firebase auth lock, run against PRODUCTION.
 *
 *   npx tsx scripts/dbAuthE2E.mts
 *
 * Flow (uses throwaway keypairs, cleans up after itself):
 *  1. EVM: random key signs the login message -> /api/wallet-auth -> custom token
 *     -> exchange for an idToken (public identitytoolkit endpoint + the site's
 *     public web API key, scraped from the deployed bundle).
 *  2. Solana: same via an ed25519 keypair (node:crypto).
 *  3. RTDB REST assertions:
 *       - write OWN leaderboard entry with token  -> expect ALLOWED
 *       - write ANOTHER wallet's entry with token -> expect DENIED (after rules deploy)
 *       - write with no auth at all               -> expect DENIED (after rules deploy)
 *  4. Deletes the test entry it created.
 *
 * Before the locked rules are deployed, steps marked DENIED will report ALLOWED —
 * run once before (baseline) and once after deploying database.rules.json.
 */
import { generateKeyPairSync, sign as edSign } from 'node:crypto';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

const SITE = 'https://lawb.xyz';

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) num = (num << 8n) + BigInt(b);
  let out = '';
  while (num > 0n) {
    out = B58[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = '1' + out;
    else break;
  }
  return out;
}

function loginMessage(key: string): string {
  return [
    'lawb.xyz wallet login',
    `address: ${key}`,
    `issued: ${new Date().toISOString()}`,
    '',
    'This signature only proves wallet ownership to save your scores and profile.',
    'It costs nothing and sends no transaction.',
  ].join('\n');
}

async function scrapeFirebaseConfig(): Promise<{ apiKey: string; dbUrl: string }> {
  const html = await (await fetch(SITE + '/')).text();
  const bundle = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
  if (!bundle) throw new Error('bundle not found in index.html');
  const js = await (await fetch(SITE + bundle)).text();
  const apiKey = js.match(/AIza[\w-]{35}/)?.[0];
  const dbUrl = js.match(/https:\/\/[a-z0-9-]+default-rtdb\.firebaseio\.com|https:\/\/[a-z0-9-]+\.firebaseio\.com/)?.[0];
  if (!apiKey || !dbUrl) throw new Error(`config scrape failed (apiKey=${!!apiKey} dbUrl=${!!dbUrl})`);
  return { apiKey, dbUrl };
}

async function mintToken(address: string, chain: 'evm' | 'solana', message: string, signature: string) {
  const res = await fetch(SITE + '/.netlify/functions/wallet-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chain, message, signature }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`wallet-auth ${res.status}: ${JSON.stringify(body)}`);
  return body.token as string;
}

async function exchangeForIdToken(apiKey: string, customToken: string): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(`token exchange failed: ${JSON.stringify(body?.error)}`);
  return body.idToken as string;
}

function entryFor(key: string) {
  return {
    username: key,
    chain_type: 'test',
    wins: 0,
    losses: 0,
    draws: 0,
    total_games: 0,
    points: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function tryWrite(dbUrl: string, path: string, data: unknown, idToken?: string) {
  const url = `${dbUrl}/${path}.json${idToken ? `?auth=${idToken}` : ''}`;
  const res = await fetch(url, {
    method: data === null ? 'DELETE' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data === null ? undefined : JSON.stringify(data),
  });
  return { ok: res.ok, status: res.status };
}

const results: Array<[string, boolean, string]> = [];
function report(name: string, pass: boolean, detail: string) {
  results.push([name, pass, detail]);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  (${detail})`);
}

const { apiKey, dbUrl } = await scrapeFirebaseConfig();
console.log('config:', { apiKey: apiKey.slice(0, 10) + '…', dbUrl });

// ---- EVM ----
const evmAccount = privateKeyToAccount(generatePrivateKey());
const evmKey = evmAccount.address.toLowerCase();
const evmMsg = loginMessage(evmKey);
const evmSig = await evmAccount.signMessage({ message: evmMsg });
const evmCustom = await mintToken(evmKey, 'evm', evmMsg, evmSig);
console.log('EVM custom token minted for', evmKey);
const evmIdToken = await exchangeForIdToken(apiKey, evmCustom);

// ---- Solana ----
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const solRaw = new Uint8Array(publicKey.export({ format: 'der', type: 'spki' }).subarray(-32));
const solKey = base58Encode(solRaw);
const solMsg = loginMessage(solKey);
const solSig = base58Encode(new Uint8Array(edSign(null, Buffer.from(solMsg, 'utf8'), privateKey)));
const solCustom = await mintToken(solKey, 'solana', solMsg, solSig);
console.log('Solana custom token minted for', solKey.slice(0, 12) + '…');

// ---- Negative mint checks ----
try {
  await mintToken(evmKey, 'evm', evmMsg, '0x' + 'ab'.repeat(65));
  report('reject bad signature', false, 'minted token for garbage signature!');
} catch {
  report('reject bad signature', true, 'garbage signature rejected');
}
const otherKey = privateKeyToAccount(generatePrivateKey()).address.toLowerCase();
try {
  await mintToken(otherKey, 'evm', evmMsg, evmSig);
  report('reject address mismatch', false, 'minted token for mismatched address!');
} catch {
  report('reject address mismatch', true, 'signature/address mismatch rejected');
}

// ---- Write assertions ----
const own = await tryWrite(dbUrl, `leaderboard/${evmKey}`, entryFor(evmKey), evmIdToken);
report('own entry write WITH auth', own.ok, `status ${own.status} (expect allowed)`);

const spoof = await tryWrite(dbUrl, `leaderboard/${otherKey}`, entryFor(otherKey), evmIdToken);
report('OTHER wallet write with my auth', !spoof.ok, `status ${spoof.status} (expect denied)`);

const unauthed = await tryWrite(dbUrl, `leaderboard/${otherKey}`, entryFor(otherKey), undefined);
report('write with NO auth', !unauthed.ok, `status ${unauthed.status} (expect denied)`);

const profileSpoof = await tryWrite(
  dbUrl,
  `profiles/${otherKey}`,
  { username: 'hacked', updated_at: new Date().toISOString() },
  evmIdToken,
);
report('OTHER profile write with my auth', !profileSpoof.ok, `status ${profileSpoof.status} (expect denied)`);

// ---- Cleanup ----
const del = await tryWrite(dbUrl, `leaderboard/${evmKey}`, null, evmIdToken);
console.log('cleanup own test entry:', del.status);
// Remove any spoof leftovers if the DB is still unlocked (baseline run)
if (spoof.ok) await tryWrite(dbUrl, `leaderboard/${otherKey}`, null, evmIdToken);
if (unauthed.ok) await tryWrite(dbUrl, `leaderboard/${otherKey}`, null, undefined);
if (profileSpoof.ok) await tryWrite(dbUrl, `profiles/${otherKey}`, null, evmIdToken);

const failed = results.filter(([, p]) => !p);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
