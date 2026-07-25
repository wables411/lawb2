#!/usr/bin/env node
// LawbChess global ELO indexer (LAWBCHESS_ONCHAIN_SPEC.md §8b).
//
// Replays GameEnded events from every deployed chain in time order through the same
// K=32 integer math as onchain-chess/src/Elo.sol and writes per-player GLOBAL +
// per-chain ratings to the read-only Firebase node /chessElo (rules: world-readable,
// no client writes — only this service writes, via the Admin service account which
// bypasses rules).
//
// Runs as a cron job on the Stockfish droplet (see deploy-elo-indexer.sh). $0/month:
// no Netlify functions, no new servers. Zero npm dependencies — Node >= 18 only.
//
// State (./state/): events-<chain>.jsonl append-only event cache + cursor.json.
// Each run scans only new blocks, then replays the full cached history (ELO is
// order-dependent; full replay keeps cross-chain ordering correct and the output
// recomputable by anyone, per spec).
//
// Self-check: per-chain replayed ratings are asserted against the whiteElo/blackElo
// the contract itself emitted in each GameEnded — any drift from Elo.sol is loud.
//
// Usage:
//   node indexer.mjs --dry-run          # scan + replay + print, no Firebase write
//   FIREBASE_SA=/root/elo-indexer/service-account.json node indexer.mjs
//
// Hard-mode (spec §8b, phase 2): signed vs-Clawb results are ingested from
// state/hard-results.jsonl once the Stockfish service signs results — see
// replayHardResults() below. Until then that file simply doesn't exist and the
// PvP-only global rating ships.

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { createSign, createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(ROOT, 'state');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------- chain config
// Deploy blocks from onchain-chess/broadcast/Deploy.s.sol/<chainid>/run-latest.json.
// Several fallback RPCs per chain: the droplet's datacenter IP gets rate-limited harder
// than residential ones, and some providers answer those blocks with HTML error pages.
const CHAINS = [
  {
    key: 'arbitrum', chainId: 42161,
    rpcs: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arbitrum.drpc.org',
      'https://1rpc.io/arb',
    ],
    proxy: '0x3112af5728520f52fd1c6710dd7bd52285a68e47',
    deployBlock: 0x1cfd359b, chunk: 50_000, confirmations: 20,
  },
  {
    key: 'ethereum', chainId: 1,
    rpcs: [
      'https://ethereum-rpc.publicnode.com',
      'https://eth.drpc.org',
      'https://1rpc.io/eth',
      'https://rpc.ankr.com/eth',
    ],
    proxy: '0x6aa574b21212c6e7436eb26a27542f1aefffad87',
    deployBlock: 0x186b44e, chunk: 5_000, confirmations: 5,
  },
  {
    key: 'base', chainId: 8453,
    rpcs: [
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
      'https://base.drpc.org',
      'https://1rpc.io/base',
    ],
    proxy: '0xbe0c68afe6f412d052c8fa306e9191d2b6371aec',
    deployBlock: 0x2ecbb31, chunk: 10_000, confirmations: 10,
  },
];

// keccak256 of the event signatures (see onchain-chess/src/LawbChess.sol)
const TOPIC_CREATED = '0x5ce5fc766d5309e3898ec2dc81ff05af7ed687765657aad97ed44aed892e5c5c'; // GameCreated(bytes6,address,uint8,address,uint256)
const TOPIC_JOINED = '0x2bef9c051ec5eb0287df56a84b7bbad6f552aad9a11ba94784ede92581927b70'; // GameJoined(bytes6,address)
const TOPIC_ENDED = '0x80be58e7bd3e094b3b6d671a2ef016178d6640c5014d5cd4df2d62ffbf28dc26'; // GameEnded(bytes6,address,uint8,uint256,uint256,uint32,uint32)

const FIREBASE_DB = 'https://chess-220ee-default-rtdb.firebaseio.com';

// ------------------------------------------------------------------- Elo port
// Exact port of onchain-chess/src/Elo.sol (K=32, MIN 100, initial 1200,
// expected-score table bucketed by 25 and clamped at ±800, ×1000 fixed point).
// All-integer; Solidity's int division truncates toward zero => Math.trunc.
const K = 32, MIN_ELO = 100, INITIAL_ELO = 1200;
const EXPECTED_T = [
  500, 536, 571, 606, 640, 672, 703, 732, 760, 785, 808, 830, 849, 867, 882, 896, 909, 920, 930,
  939, 947, 954, 960, 965, 969, 973, 977, 980, 983, 985, 987, 989, 990,
];

export function expectedTimes1000(a, b) {
  const diff = a - b;
  let ad = Math.abs(diff);
  if (ad > 800) ad = 800;
  const base = EXPECTED_T[Math.floor(ad / 25)];
  return diff >= 0 ? base : 1000 - base;
}

export function eloUpdate(a, b, sA) {
  const eA = expectedTimes1000(a, b);
  const delta = Math.trunc((K * (sA - eA)) / 1000);
  const apply = (r, d) => Math.max(MIN_ELO, r + d);
  return [apply(a, delta), apply(b, -delta)];
}

// --------------------------------------------------------------- JSON-RPC I/O
// POST to the first RPC that answers with valid JSON; rate-limit pages (HTML, 429s)
// just rotate to the next endpoint instead of blowing up the run.
async function rpcPost(chain, payload) {
  let lastErr;
  for (const url of chain.rpcs) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 80)}`);
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function rpc(chain, method, params) {
  const body = await rpcPost(chain, { jsonrpc: '2.0', id: 1, method, params });
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

// getLogs with adaptive range-halving for public-RPC limits.
async function getLogsRange(chain, from, to) {
  try {
    return await rpc(chain, 'eth_getLogs', [{
      address: chain.proxy,
      topics: [[TOPIC_CREATED, TOPIC_JOINED, TOPIC_ENDED]],
      fromBlock: '0x' + from.toString(16),
      toBlock: '0x' + to.toString(16),
    }]);
  } catch (e) {
    if (to - from < 2) throw e;
    const mid = Math.floor((from + to) / 2);
    return [...await getLogsRange(chain, from, mid), ...await getLogsRange(chain, mid + 1, to)];
  }
}

// ------------------------------------------------------------- event decoding
const word = (data, i) => data.slice(2 + i * 64, 2 + (i + 1) * 64);
const topicAddr = (t) => '0x' + t.slice(26).toLowerCase();

function decodeLog(log) {
  const code = log.topics[1].slice(0, 14); // bytes6, left-aligned: 0x + 12 hex chars
  const base = {
    code,
    blockNumber: parseInt(log.blockNumber, 16),
    logIndex: parseInt(log.logIndex, 16),
  };
  switch (log.topics[0]) {
    case TOPIC_CREATED:
      return { ...base, type: 'created', white: topicAddr(log.topics[2]) };
    case TOPIC_JOINED:
      return { ...base, type: 'joined', black: topicAddr(log.topics[2]) };
    case TOPIC_ENDED:
      return {
        ...base, type: 'ended', winner: topicAddr(log.topics[2]),
        whiteElo: parseInt(word(log.data, 3), 16),
        blackElo: parseInt(word(log.data, 4), 16),
      };
    default:
      return null;
  }
}

// ------------------------------------------------------------------ scanning
function loadCursors() {
  const p = join(STATE_DIR, 'cursor.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
}

function loadEvents(chainKey) {
  const p = join(STATE_DIR, `events-${chainKey}.jsonl`);
  if (!existsSync(p)) return [];
  const events = readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  // Dedupe by (block, logIndex): a run that appended events but crashed before saving
  // cursor.json re-appends them on the next scan.
  const seen = new Set();
  return events.filter((e) => {
    const k = `${e.blockNumber}:${e.logIndex}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function scanChain(chain, cursors) {
  const head = parseInt(await rpc(chain, 'eth_blockNumber', []), 16) - chain.confirmations;
  const from = (cursors[chain.key] ?? chain.deployBlock - 1) + 1;
  const fresh = [];
  for (let lo = from; lo <= head; lo += chain.chunk) {
    const hi = Math.min(lo + chain.chunk - 1, head);
    for (const log of await getLogsRange(chain, lo, hi)) {
      const ev = decodeLog(log);
      if (ev) fresh.push(ev);
    }
  }
  // Stamp block timestamps (cross-chain ordering key), batched per unique block.
  const blocks = [...new Set(fresh.map((e) => e.blockNumber))];
  const stamps = {};
  for (let i = 0; i < blocks.length; i += 50) {
    const batch = blocks.slice(i, i + 50).map((bn, j) => ({
      jsonrpc: '2.0', id: j, method: 'eth_getBlockByNumber', params: ['0x' + bn.toString(16), false],
    }));
    const replies = await rpcPost(chain, batch);
    // Some providers answer a batch of one (or reject batches) with a bare object.
    for (const r of Array.isArray(replies) ? replies : [replies]) {
      if (r.result) stamps[parseInt(r.result.number, 16)] = parseInt(r.result.timestamp, 16);
    }
  }
  for (const ev of fresh) {
    ev.ts = stamps[ev.blockNumber];
    if (ev.ts === undefined) throw new Error(`${chain.key}: no timestamp for block ${ev.blockNumber}`);
  }
  if (fresh.length) {
    appendFileSync(join(STATE_DIR, `events-${chain.key}.jsonl`), fresh.map((e) => JSON.stringify(e)).join('\n') + '\n');
  }
  cursors[chain.key] = head;
  return fresh.length;
}

// -------------------------------------------------------------------- replay
export function replay(eventsByChain) {
  const global = {}; // addr -> {elo, games}
  const perChain = {}; // chainKey -> addr -> {elo, games}
  const rating = (tbl, addr) => (tbl[addr] ??= { elo: INITIAL_ELO, games: 0 });
  let mismatches = 0;

  // Merge all chains into one timeline: ts, then chain, then block, then logIndex.
  const merged = [];
  for (const [chainKey, events] of Object.entries(eventsByChain)) {
    for (const ev of events) merged.push({ ...ev, chainKey });
  }
  merged.sort((x, y) =>
    x.ts - y.ts || x.chainKey.localeCompare(y.chainKey) || x.blockNumber - y.blockNumber || x.logIndex - y.logIndex);

  const players = {}; // `${chain}:${code}` -> {white, black} (codes are reusable; latest create wins)
  for (const ev of merged) {
    const gameKey = `${ev.chainKey}:${ev.code}`;
    if (ev.type === 'created') {
      players[gameKey] = { white: ev.white, black: null };
    } else if (ev.type === 'joined') {
      if (players[gameKey]) players[gameKey].black = ev.black;
    } else if (ev.type === 'ended') {
      const g = players[gameKey];
      delete players[gameKey];
      if (!g || !g.black) continue; // cancelled/never-joined games emit no GameEnded; guard anyway
      const sWhite = ev.winner === '0x' + '0'.repeat(40) ? 500 : ev.winner === g.white ? 1000 : 0;
      const chainTbl = (perChain[ev.chainKey] ??= {});
      for (const tbl of [global, chainTbl]) {
        const w = rating(tbl, g.white), b = rating(tbl, g.black);
        [w.elo, b.elo] = eloUpdate(w.elo, b.elo, sWhite);
        w.games++; b.games++;
      }
      // Self-check: per-chain replay must reproduce the contract's own post-game ratings.
      if (chainTbl[g.white].elo !== ev.whiteElo || chainTbl[g.black].elo !== ev.blackElo) {
        mismatches++;
        console.error(`ELO MISMATCH ${gameKey}: replayed w=${chainTbl[g.white].elo}/b=${chainTbl[g.black].elo}, contract emitted w=${ev.whiteElo}/b=${ev.blackElo}`);
      }
    }
  }
  return { global, perChain, mismatches };
}

// Hard-mode ingestion (spec §8b phase 2 — inert until the Stockfish service signs
// results). Expected file: state/hard-results.jsonl, one JSON per line:
//   {player, result: "win"|"loss"|"draw", ts, sig}
// where sig is the house signature over `${player}:${result}:${ts}` — verified here
// against HOUSE_SIGNER_PUBKEY once the droplet signing change ships. Hard games rate
// the player against a virtual "clawb" opponent whose rating evolves by the same math.
function replayHardResults(global) {
  const p = join(STATE_DIR, 'hard-results.jsonl');
  if (!existsSync(p)) return 0;
  const HOUSE_SIGNER_PUBKEY = process.env.HOUSE_SIGNER_PUBKEY;
  if (!HOUSE_SIGNER_PUBKEY) {
    console.error('hard-results.jsonl present but HOUSE_SIGNER_PUBKEY unset — skipping hard-mode results');
    return 0;
  }
  throw new Error('hard-mode signature verification not implemented (phase 2 — droplet signing change first)');
}

// ------------------------------------------------------- Firebase (REST + JWT)
// Service-account OAuth2 without npm deps: sign an RS256 JWT with node:crypto,
// swap it for an access token, write with PUT (full-node replace keeps the node
// an exact function of on-chain history — stale keys can't linger).
async function firebaseToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(sa.private_key).toString('base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`token exchange failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function writeFirebase(payload) {
  const saPath = process.env.FIREBASE_SA || join(ROOT, 'service-account.json');
  const sa = JSON.parse(readFileSync(saPath, 'utf8'));
  const token = await firebaseToken(sa);
  const res = await fetch(`${FIREBASE_DB}/chessElo.json`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`firebase write failed: ${res.status} ${await res.text()}`);
}

// ---------------------------------------------------------------------- main
async function main() {
  mkdirSync(STATE_DIR, { recursive: true });
  const cursors = loadCursors();

  const eventsByChain = {};
  for (const chain of CHAINS) {
    const n = await scanChain(chain, cursors);
    eventsByChain[chain.key] = loadEvents(chain.key);
    console.log(`${chain.key}: +${n} new events, ${eventsByChain[chain.key].length} total, cursor ${cursors[chain.key]}`);
  }
  // Persist cursors as soon as the scan lands: the events are already appended, and a
  // later failure (e.g. missing Firebase key) must not cause a rescan-and-reappend.
  writeFileSync(join(STATE_DIR, 'cursor.json'), JSON.stringify(cursors, null, 2));

  const { global, perChain, mismatches } = replay(eventsByChain);
  if (mismatches > 0) throw new Error(`${mismatches} replay/contract ELO mismatches — NOT writing (port drifted from Elo.sol?)`);
  replayHardResults(global);

  const payload = {
    global,
    perChain,
    updatedAt: Date.now(),
    source: 'elo-indexer (PvP GameEnded replay; spec 8b)',
  };
  const players = Object.keys(global).length;
  console.log(`replayed OK: ${players} rated players, chains: ${Object.keys(perChain).join(', ') || 'none yet'}`);

  if (DRY_RUN) {
    console.log(JSON.stringify(payload, null, 2));
    console.log('(dry run — nothing published)');
    return;
  }

  // Primary output: a static JSON file served by the droplet's nginx at
  // https://chess.lawb.xyz/elo.json (see deploy-elo-indexer.sh). No credentials anywhere.
  // Atomic write (tmp + rename) so nginx never serves a half-written file.
  // ELO_OUT_DIR must be readable by nginx's worker user (default /var/www/elo on the droplet).
  const publicDir = process.env.ELO_OUT_DIR || join(ROOT, 'public');
  mkdirSync(publicDir, { recursive: true });
  const outPath = join(publicDir, 'elo.json');
  writeFileSync(outPath + '.tmp', JSON.stringify(payload));
  renameSync(outPath + '.tmp', outPath);
  console.log(`wrote ${outPath}`);

  // Optional secondary output: the Firebase /chessElo node (legacy fallback the frontend
  // still reads if the droplet file is unreachable). Only when a service account exists.
  const saPath = process.env.FIREBASE_SA || join(ROOT, 'service-account.json');
  if (existsSync(saPath)) {
    const hash = createHash('sha256').update(JSON.stringify({ global, perChain })).digest('hex');
    const hashPath = join(STATE_DIR, 'last-write.hash');
    if (existsSync(hashPath) && readFileSync(hashPath, 'utf8') === hash) {
      console.log('no rating changes — skipping Firebase write');
    } else {
      await writeFirebase(payload);
      writeFileSync(hashPath, hash);
      console.log('wrote /chessElo to Firebase');
    }
  }
}

// Run only when executed directly (the Elo functions are importable for testing).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
