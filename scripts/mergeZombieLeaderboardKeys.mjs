/**
 * Merge zombie mixed-case leaderboard keys into their lowercase rows.
 * ([[chess-reefrun-open-items]] item 8d: auth uids are lowercase, so EIP-55
 * checksummed rows like `leaderboard/0x9387B5a…` are frozen/unmergeable by
 * clients and split a player's points across two rows.)
 *
 * OWNER-RUN (needs the authed firebase CLI; agent-side deploys are blocked):
 *
 *   node scripts/mergeZombieLeaderboardKeys.mjs            # dry run: fetch, back up, print plan
 *   node scripts/mergeZombieLeaderboardKeys.mjs --apply    # apply the printed patches
 *
 * Merge semantics MIRROR src/firebaseLeaderboard.ts mergeLeaderboardEntriesForDisplay:
 * sum wins/losses/draws/total_games, sum points_breakdown per field (a row without a
 * breakdown contributes its legacy `points` as chess), points = breakdown total,
 * earliest created_at, username = the lowercase key. A checksummed row with NO
 * lowercase sibling is simply moved to its lowercase key.
 *
 * Each pair is ONE atomic RTDB PATCH ({lower: merged, Zombie: null}) via
 * `firebase database:update`, so a crash can never leave a half-merged pair.
 * The full pre-merge tree is backed up to scripts/leaderboard-backup-<ts>.json first.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PROJECT = 'chess-220ee';
const APPLY = process.argv.includes('--apply');

function fb(args, input) {
  return execFileSync('npx', ['firebase', ...args, '--project', PROJECT], {
    encoding: 'utf8',
    shell: process.platform === 'win32', // npx is npx.cmd on Windows
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
}

const EMPTY_BREAKDOWN = { chess: 0, reef_run: 0, stream: 0, games: 0, holdings: 0, wallet_connect: 0 };

function mergeRows(lowerKey, rows) {
  const breakdown = { ...EMPTY_BREAKDOWN };
  for (const e of rows) {
    const pb = e.points_breakdown;
    if (pb && typeof pb === 'object') {
      for (const k of Object.keys(pb)) {
        if (typeof pb[k] === 'number') breakdown[k] = (breakdown[k] || 0) + pb[k];
      }
    } else {
      breakdown.chess = (breakdown.chess || 0) + (e.points || 0);
    }
  }
  const points = Object.values(breakdown).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
  const createdAts = rows.map((e) => e.created_at).filter((v) => typeof v === 'string').sort();
  const chainType = rows.map((e) => e.chain_type).find((v) => typeof v === 'string');
  const num = (f) => rows.reduce((s, e) => s + (typeof e[f] === 'number' ? e[f] : 0), 0);
  const merged = {
    username: lowerKey,
    wins: num('wins'),
    losses: num('losses'),
    draws: num('draws'),
    total_games: num('total_games'),
    points,
    points_breakdown: breakdown,
    updated_at: new Date().toISOString(),
  };
  if (chainType) merged.chain_type = chainType;
  if (createdAts.length) merged.created_at = createdAts[0];
  return merged;
}

console.log('[merge] fetching /leaderboard …');
const tree = JSON.parse(fb(['database:get', '/leaderboard']));
if (!tree || typeof tree !== 'object') {
  console.error('[merge] /leaderboard is empty or unreadable — nothing to do');
  process.exit(1);
}

const backupPath = join('scripts', `leaderboard-backup-${Date.now()}.json`);
writeFileSync(backupPath, JSON.stringify(tree, null, 2));
console.log(`[merge] ${Object.keys(tree).length} rows fetched; backup: ${backupPath}`);

// Zombies: EVM keys that are not all-lowercase (auth uids are lowercase).
// ONLY 0x keys: Solana base58 keys are case-SIGNIFICANT and stored as-is
// (src/firebaseLeaderboard.ts normalizeLeaderboardPathKey) — never touch them.
const zombies = Object.keys(tree).filter((k) => k.startsWith('0x') && k !== k.toLowerCase());
if (zombies.length === 0) {
  console.log('[merge] no mixed-case keys found — leaderboard is clean.');
  process.exit(0);
}

const patches = [];
for (const zombie of zombies) {
  const lower = zombie.toLowerCase();
  const rows = tree[lower] ? [tree[lower], tree[zombie]] : [tree[zombie]];
  const merged = mergeRows(lower, rows);
  patches.push({ zombie, lower, hadLower: !!tree[lower], merged });
  const before = tree[lower]
    ? `lower pts=${tree[lower].points ?? 0} + zombie pts=${tree[zombie].points ?? 0}`
    : `zombie-only pts=${tree[zombie].points ?? 0}`;
  console.log(`\n[plan] ${zombie}`);
  console.log(`  -> ${lower}  (${before}  =>  merged pts=${merged.points}, games=${merged.total_games})`);
}

if (!APPLY) {
  console.log(`\n[dry-run] ${patches.length} merge(s) planned. Re-run with --apply to write.`);
  process.exit(0);
}

const tmp = mkdtempSync(join(tmpdir(), 'lawb-merge-'));
for (const p of patches) {
  // Atomic pair: write merged lowercase row and delete the zombie in ONE patch.
  const patchFile = join(tmp, `${p.lower}.json`);
  writeFileSync(patchFile, JSON.stringify({ [p.lower]: p.merged, [p.zombie]: null }));
  console.log(`[apply] PATCH /leaderboard { ${p.lower}: merged, ${p.zombie}: null }`);
  fb(['database:update', '/leaderboard', patchFile, '-f']); // -f: skip confirm prompt (this CLI has no -y)
}

console.log(`\n[done] ${patches.length} zombie key(s) merged. Backup kept at ${backupPath}.`);
console.log('[verify] spot-check: node -e "..." or Firebase console — both paths of each pair.');
