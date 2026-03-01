/**
 * dca-manager.js — DCA CLI (writes state, delegates execution to dca-runner.js via pm2)
 *
 * CLI:
 *   node dca-manager.js start --input SOL --output LAWB --total 0.5 --splits 24 --interval 3600
 *   node dca-manager.js status
 *   node dca-manager.js cancel
 *   node dca-manager.js resume
 *
 * The actual swap execution runs in dca-runner.js as a separate pm2 process,
 * completely independent of Clawb's session lifecycle.
 */

import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'dca-state.json');
const RUNNER_SCRIPT = path.join(__dirname, 'dca-runner.js');

const MAX_TOTAL_SOL = 2;
const MIN_INTERVAL_MS = 5 * 60 * 1000;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[DCA] Failed to load state:', err.message);
  }
  return { active: null, history: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function checkSolBalance() {
  try {
    const { stdout } = await execFileAsync('node', ['-e', `
      import('@solana/web3.js').then(({Connection,PublicKey,LAMPORTS_PER_SOL})=>{
        const c=new Connection('https://api.mainnet-beta.solana.com');
        c.getBalance(new PublicKey('FveSNArbJsdx5JTmGE8cti9pBt5gH8NVTrUvcp1C2Mbp'))
          .then(b=>console.log(b/LAMPORTS_PER_SOL))
      })
    `], { cwd: __dirname, timeout: 15000 });
    return parseFloat(stdout.trim());
  } catch {
    return null;
  }
}

async function pm2Run(args) {
  return execAsync(`pm2 ${args}`, { cwd: __dirname, timeout: 10000 });
}

async function launchRunner() {
  try {
    await pm2Run('delete dca-runner').catch(() => {});
    await pm2Run(`start "${RUNNER_SCRIPT}" --name dca-runner --no-autorestart --node-args "--env-file=.env"`);
    console.log('DCA runner launched as pm2 process (independent of Clawb session).');
    return true;
  } catch (err) {
    console.error('Failed to launch dca-runner via pm2:', err.message);
    return false;
  }
}

async function stopRunner() {
  try {
    await pm2Run('delete dca-runner');
  } catch {
    // may not exist
  }
}

function formatStatus(job) {
  if (!job) return 'No active DCA.';
  const pct = ((job.completedSwaps / job.splits) * 100).toFixed(0);
  const remaining = job.splits - job.completedSwaps;
  const nextIn = job.nextSwapAt ? Math.max(0, new Date(job.nextSwapAt) - Date.now()) : 0;
  const nextMins = Math.ceil(nextIn / 60000);
  return [
    `DCA ${job.id}`,
    `${job.completedSwaps}/${job.splits} swaps (${pct}%)`,
    `Spent: ${job.totalSpent?.toFixed(6) || '0'} / ${job.totalAmount} SOL`,
    `Acquired: ${job.totalAcquired} ${job.outputToken}`,
    `Status: ${job.status}`,
    remaining > 0 ? `Next swap in ~${nextMins}m (${remaining} remaining)` : 'Complete.',
    job.status === 'paused' ? `Paused: ${job.pauseReason}` : '',
  ].filter(Boolean).join('\n');
}

// --- CLI ---
const command = process.argv[2];

if (command === 'start') {
  const args = process.argv.slice(3);
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    flags[args[i].replace('--', '')] = args[i + 1];
  }

  const inputToken = (flags.input || 'SOL').toUpperCase();
  const outputToken = (flags.output || 'LAWB').toUpperCase();
  const totalAmount = parseFloat(flags.total);
  const splits = parseInt(flags.splits, 10);
  const intervalSec = parseInt(flags.interval, 10);

  if (!totalAmount || !splits || !intervalSec) {
    console.error('Usage: node dca-manager.js start --input SOL --output LAWB --total 0.5 --splits 24 --interval 3600');
    process.exit(1);
  }

  if (totalAmount > MAX_TOTAL_SOL) {
    console.error(`Safety limit: max ${MAX_TOTAL_SOL} SOL per DCA. Requested: ${totalAmount}`);
    process.exit(1);
  }

  const intervalMs = intervalSec * 1000;
  if (intervalMs < MIN_INTERVAL_MS) {
    console.error(`Safety limit: min interval ${MIN_INTERVAL_MS / 60000} minutes. Requested: ${intervalSec / 60}m`);
    process.exit(1);
  }

  const state = loadState();
  if (state.active && (state.active.status === 'running' || state.active.status === 'paused')) {
    console.error(`Already have an active DCA: ${state.active.id} (${state.active.status}). Cancel it first.`);
    process.exit(1);
  }

  const balance = await checkSolBalance();
  if (balance !== null && balance < totalAmount + 0.01) {
    console.error(`Insufficient SOL. Balance: ${balance}, need: ${totalAmount} + gas`);
    process.exit(1);
  }

  const perSwapAmount = parseFloat((totalAmount / splits).toFixed(6));
  const jobId = `dca_${outputToken.toLowerCase()}_${Date.now()}`;

  const job = {
    id: jobId,
    inputToken,
    outputToken,
    totalAmount,
    perSwapAmount,
    splits,
    intervalMs,
    completedSwaps: 0,
    failedSwaps: 0,
    totalAcquired: '0',
    totalSpent: 0,
    status: 'running',
    startedAt: new Date().toISOString(),
    nextSwapAt: new Date().toISOString(),
    txHistory: [],
    pauseReason: null,
  };

  state.active = job;
  saveState(state);

  console.log(`DCA created: ${jobId}`);
  console.log(`${totalAmount} SOL → ${outputToken} in ${splits} swaps over ${(splits * intervalSec / 3600).toFixed(1)} hours`);
  console.log(`Per swap: ${perSwapAmount} SOL every ${intervalSec / 60} minutes`);

  await launchRunner();

} else if (command === 'status') {
  const state = loadState();
  console.log(formatStatus(state.active));
  if (state.history.length > 0) {
    console.log(`\nPast DCAs: ${state.history.length}`);
    for (const h of state.history.slice(-3)) {
      console.log(`  ${h.id}: ${h.totalAcquired} ${h.outputToken} over ${h.completedSwaps} swaps (${h.status})`);
    }
  }

} else if (command === 'cancel') {
  const state = loadState();
  if (!state.active) {
    console.log('No active DCA to cancel.');
    process.exit(0);
  }
  await stopRunner();
  state.active.status = 'cancelled';
  state.history.push({ ...state.active });
  const summary = `Cancelled: ${state.active.completedSwaps}/${state.active.splits} swaps done. Acquired ${state.active.totalAcquired} ${state.active.outputToken}. Spent ${state.active.totalSpent?.toFixed(6) || '0'} SOL.`;
  state.active = null;
  saveState(state);
  console.log(summary);

} else if (command === 'resume') {
  const state = loadState();
  if (!state.active) {
    console.log('No DCA to resume.');
    process.exit(0);
  }
  if (state.active.completedSwaps >= state.active.splits) {
    state.active.status = 'completed';
    state.history.push({ ...state.active });
    state.active = null;
    saveState(state);
    console.log('DCA was already complete.');
    process.exit(0);
  }
  state.active.status = 'running';
  state.active.failedSwaps = 0;
  state.active.pauseReason = null;
  state.active.nextSwapAt = new Date().toISOString();
  saveState(state);

  const remaining = state.active.splits - state.active.completedSwaps;
  console.log(`Resuming: ${state.active.id}. ${remaining} swaps left (${state.active.completedSwaps} done, ${state.active.totalAcquired} ${state.active.outputToken} acquired).`);

  await launchRunner();

} else {
  console.log('Usage:');
  console.log('  node dca-manager.js start --input SOL --output LAWB --total 0.5 --splits 24 --interval 3600');
  console.log('  node dca-manager.js status');
  console.log('  node dca-manager.js cancel');
  console.log('  node dca-manager.js resume');
}
