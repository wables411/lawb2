// Tides — the ambient activity feed for lawb.xyz (dive-console overhaul step 2).
//
// Assembles recent game events into ONE static JSON the frontend polls from
// https://chess.lawb.xyz/tides.json — the elo.json pattern: droplet cron writes a
// file, nginx serves it CDN-cacheably, zero Firebase reads, no credentials.
//
// Sources (all cheap):
//   1. Chess  — the ELO indexer's own event cache (state/events-<chain>.jsonl,
//               already timestamped for cross-chain ordering). Zero RPC calls.
//   2. Reef   — the validator's accepted.jsonl (local file on the same droplet;
//               falls back to the public /reef/proofs feed for local dev).
//   3. Jackpot — ReefRunJackpot logs on ETH mainnet, incremental cursor scan
//               (a few getLogs per tick once caught up).
//
// Run:  node tides.mjs [--dry-run]
// Env:  TIDES_OUT_DIR (default ./public; droplet: /var/www/elo)
//       TIDES_ACCEPTED_PATH (default /root/reef-validator/accepted.jsonl, then
//         ../reef-validator/accepted.jsonl), TIDES_PROOFS_URL fallback fetch
//       TIDES_JACKPOT_FROM_BLOCK (first scan lower bound; default pre-deploy)
//
// Cron: every 2 minutes (deploy-elo-indexer.sh installs it). State lives in the
// indexer's state/ dir: tides-cursor.json + tides-jackpot.jsonl (append-only).

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(ROOT, 'state');
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_EVENTS = 60;
const MAX_REEF = 25; // reef runs are frequent; don't let them drown everything else

// ---------------------------------------------------------------- jackpot chain
// ETH mainnet ReefRunJackpot proxy (src/config/reefJackpotOnchain.ts). Deployed
// at block 25,704,909 (verified via full log scan 2026-08-27); floor sits just under it.
const JACKPOT_PROXY = '0x0cfa2d2702523dd7c95bb90d8c4015018fd7315d';
const JACKPOT_FROM = Number(process.env.TIDES_JACKPOT_FROM_BLOCK || 25_704_900);
const ETH_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.drpc.org',
  'https://1rpc.io/eth',
  'https://rpc.ankr.com/eth',
];
const CHUNK = 5_000;
const CONFIRMATIONS = 5;

// keccak256 of the event signatures (onchain-chess/src/ReefRunJackpot.sol)
const T_ENTERED = '0x6ffb5ea2afe4f9360cde0a19797c02a398ed6dbe89e07cf7e84e90986cbc97b1'; // Entered(address,uint64,uint32,uint256)
const T_SCORE = '0x16ffa41f3226ae0250a69e10c139acdd933918812a67107e3b49cb4cd7623183'; // ScoreSubmitted(address,uint64,uint64,uint64,bool)
const T_WON = '0x3b90e511146de0b7ff09188f88a73b1927a18e667b7554d19db7a8664bf09135'; // JackpotWon(address,uint64,uint256,uint256)
const T_BAR_RESET = '0xf9f5ad5f6d204998d560fb7f983db2f25a365e156b52b8ac08343e38263ef8ad'; // BarReset(uint64,address)
const T_FUNDED = '0x46a8a8b4e358500059b36e80a404fde94536dc748c4a99d4c107c62c0c6aeb4b'; // PotFunded(address,uint256,uint256)
const T_DEFENDED = '0x541f82dbc5d1250417c28f343697bb415a530df3c73c6e2a268a698902e62f52'; // ChampionDefended(address,address,uint64,uint256,uint256)

const word = (data, i) => data.slice(2 + i * 64, 2 + (i + 1) * 64);
const topicAddr = (t) => '0x' + t.slice(26).toLowerCase();

async function rpcPost(payload) {
  for (const url of ETH_RPCS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
      const body = await res.json();
      if (Array.isArray(payload)) { if (Array.isArray(body)) return body; continue; }
      if (body && !body.error) return body;
    } catch {
      // next RPC
    }
  }
  throw new Error('all ETH RPCs failed');
}

const rpc = async (method, params) => (await rpcPost({ jsonrpc: '2.0', id: 1, method, params })).result;

async function getLogsRange(from, to) {
  try {
    return await rpc('eth_getLogs', [{
      address: JACKPOT_PROXY,
      fromBlock: '0x' + from.toString(16),
      toBlock: '0x' + to.toString(16),
    }]);
  } catch {
    if (to - from < 100) throw new Error(`getLogs failing below 100 blocks at ${from}`);
    const mid = from + Math.floor((to - from) / 2);
    return [...(await getLogsRange(from, mid)), ...(await getLogsRange(mid + 1, to))];
  }
}

export function decodeJackpotLog(log) {
  const base = { blockNumber: parseInt(log.blockNumber, 16), logIndex: parseInt(log.logIndex, 16) };
  switch (log.topics[0]) {
    case T_ENTERED:
      return { ...base, kind: 'jackpot_enter', wallet: topicAddr(log.topics[1]),
        pot: BigInt('0x' + word(log.data, 1)).toString() };
    case T_SCORE:
      return { ...base, kind: 'jackpot_score', wallet: topicAddr(log.topics[1]),
        survivalMs: parseInt(word(log.data, 0), 16), barMs: parseInt(word(log.data, 1), 16),
        won: parseInt(word(log.data, 2), 16) === 1 };
    case T_WON:
      return { ...base, kind: 'jackpot_won', wallet: topicAddr(log.topics[1]),
        survivalMs: parseInt(word(log.data, 0), 16), payout: BigInt('0x' + word(log.data, 1)).toString() };
    case T_BAR_RESET:
      return { ...base, kind: 'jackpot_bar_reset', wallet: topicAddr(log.topics[1]) };
    case T_FUNDED:
      return { ...base, kind: 'jackpot_funded', wallet: topicAddr(log.topics[1]),
        amount: BigInt('0x' + word(log.data, 0)).toString() };
    case T_DEFENDED:
      return { ...base, kind: 'jackpot_defended', wallet: topicAddr(log.topics[1]),
        challenger: topicAddr(log.topics[2]), payout: BigInt('0x' + word(log.data, 1)).toString() };
    default:
      return null; // config events — not feed material
  }
}

async function scanJackpot() {
  mkdirSync(STATE_DIR, { recursive: true });
  const cursorPath = join(STATE_DIR, 'tides-cursor.json');
  const cachePath = join(STATE_DIR, 'tides-jackpot.jsonl');
  const cursor = existsSync(cursorPath) ? JSON.parse(readFileSync(cursorPath, 'utf8')) : {};
  const head = parseInt(await rpc('eth_blockNumber', []), 16) - CONFIRMATIONS;
  let from = (cursor.jackpotEth ?? JACKPOT_FROM - 1) + 1;
  const fresh = [];
  while (from <= head) {
    const to = Math.min(from + CHUNK - 1, head);
    for (const log of await getLogsRange(from, to)) {
      const ev = decodeJackpotLog(log);
      if (ev) fresh.push(ev);
    }
    from = to + 1;
  }
  if (fresh.length) {
    // Stamp block timestamps, batched per unique block (indexer.mjs pattern).
    const blocks = [...new Set(fresh.map((e) => e.blockNumber))];
    const batch = blocks.map((bn, j) => ({
      jsonrpc: '2.0', id: j, method: 'eth_getBlockByNumber', params: ['0x' + bn.toString(16), false],
    }));
    const stamps = {};
    for (const r of await rpcPost(batch)) {
      if (r.result) stamps[parseInt(r.result.number, 16)] = parseInt(r.result.timestamp, 16);
    }
    for (const ev of fresh) {
      ev.t = stamps[ev.blockNumber];
      if (ev.t === undefined) throw new Error(`no timestamp for block ${ev.blockNumber}`);
    }
    appendFileSync(cachePath, fresh.map((e) => JSON.stringify(e)).join('\n') + '\n');
  }
  writeFileSync(cursorPath, JSON.stringify({ ...cursor, jackpotEth: head }));
  const all = existsSync(cachePath)
    ? readFileSync(cachePath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
    : [];
  return all;
}

// ------------------------------------------------------------------- chess
const CHESS_CHAINS = ['arbitrum', 'ethereum', 'base'];

function chessEvents() {
  const out = [];
  const now = Math.floor(Date.now() / 1000);
  for (const chain of CHESS_CHAINS) {
    const p = join(STATE_DIR, `events-${chain}.jsonl`);
    if (!existsSync(p)) continue;
    const events = readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const byCode = new Map();
    for (const ev of events) {
      const g = byCode.get(ev.code) ?? {};
      g[ev.type] = ev;
      byCode.set(ev.code, g);
    }
    for (const [code, g] of byCode) {
      if (g.ended) {
        out.push({
          t: g.ended.ts, kind: 'chess_end', chain, code,
          wallet: g.ended.winner, payout: g.ended.payout,
          whiteElo: g.ended.whiteElo, blackElo: g.ended.blackElo,
          wagerKind: g.created?.kind, token: g.created?.token, wager: g.created?.wager,
        });
      } else if (g.created && !g.joined && now - g.created.ts < 24 * 3600) {
        out.push({
          t: g.created.ts, kind: 'chess_open', chain, code,
          wallet: g.created.white, wagerKind: g.created.kind,
          token: g.created.token, wager: g.created.wager,
        });
      }
    }
  }
  return out;
}

// -------------------------------------------------------------------- reef
async function reefEvents() {
  let lines = null;
  const candidates = [
    process.env.TIDES_ACCEPTED_PATH,
    '/root/reef-validator/accepted.jsonl',
    join(ROOT, '..', 'reef-validator', 'accepted.jsonl'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) {
      lines = readFileSync(p, 'utf8').split('\n').filter(Boolean).slice(-200).map((l) => JSON.parse(l));
      break;
    }
  }
  if (!lines) {
    // Local dev fallback: the validator's public transparency feed.
    const url = process.env.TIDES_PROOFS_URL || 'https://chess.lawb.xyz/reef/proofs';
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      const body = await res.json();
      lines = Array.isArray(body) ? body : body.proofs ?? [];
    } catch {
      lines = [];
    }
  }
  return lines
    .map((e) => ({
      t: Math.floor(Date.parse(e.at) / 1000), kind: 'reef_run',
      wallet: (e.wallet || '').toLowerCase(), characterId: e.characterId,
      survivalSec: e.survivalSec, points: e.points, endReason: e.endReason,
    }))
    .filter((e) => Number.isFinite(e.t) && e.wallet)
    .slice(-MAX_REEF);
}

// -------------------------------------------------------------------- main
async function main() {
  const [reef, jackpot] = [await reefEvents(), await scanJackpot().catch((err) => {
    // A chain-scan hiccup must never stop the feed — chess + reef still publish.
    console.error('[tides] jackpot scan failed (feed continues without it):', err.message);
    return [];
  })];
  const chess = chessEvents();

  const events = [...reef, ...chess, ...jackpot]
    .filter((e) => Number.isFinite(e.t))
    .sort((a, b) => b.t - a.t)
    .slice(0, MAX_EVENTS);

  const payload = {
    v: 1,
    updatedAt: Math.floor(Date.now() / 1000),
    source: 'tides.mjs (dive-console overhaul step 2; elo.json pattern)',
    events,
  };

  console.log(`[tides] ${events.length} events (${reef.length} reef, ${chess.length} chess, ${jackpot.length} jackpot cached)`);
  if (DRY_RUN) {
    for (const e of events.slice(0, 12)) console.log('  ', new Date(e.t * 1000).toISOString(), e.kind, e.wallet ?? '');
    console.log('(dry run — nothing written)');
    return;
  }
  const outDir = process.env.TIDES_OUT_DIR || join(ROOT, 'public');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'tides.json');
  writeFileSync(outPath + '.tmp', JSON.stringify(payload));
  renameSync(outPath + '.tmp', outPath); // atomic — nginx never serves a torn file
  console.log(`[tides] wrote ${outPath}`);
}

// Only run when executed directly — tests import decodeJackpotLog without side effects.
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  main().catch((err) => {
    console.error('[tides] fatal:', err);
    process.exitCode = 1;
  });
}
