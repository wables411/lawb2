/**
 * dca-manager.js — DCA (Dollar Cost Average) scheduler for Solana swaps
 *
 * CLI:
 *   node dca-manager.js start --input SOL --output LAWB --total 0.5 --splits 24 --interval 3600
 *   node dca-manager.js status
 *   node dca-manager.js cancel
 *   node dca-manager.js resume
 *
 * Runs swap-solana.js as a child process at each interval.
 * Persists state to dca-state.json so jobs survive pm2 restarts.
 * Milady-only (Telegram). Never from stream chat.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceSwap } from './announce-swap.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'dca-state.json');
const SWAP_SCRIPT = path.join(__dirname, 'swap-solana.js');

// --- Safety limits ---
const MAX_TOTAL_SOL = 2;
const MAX_CONCURRENT = 1;
const MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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

async function executeSwap(inputToken, outputToken, amount, slippageBps = 100) {
  const args = [SWAP_SCRIPT, inputToken, outputToken, String(amount), String(slippageBps)];
  const { stdout, stderr } = await execFileAsync('node', args, {
    cwd: __dirname,
    timeout: 60000,
    env: { ...process.env, SWAP_SILENT: '1' },
  });
  const output = stdout + '\n' + stderr;

  const txMatch = output.match(/Tx sent: (\S+)/);
  const confirmedMatch = output.match(/Confirmed\./);
  const outMatch = output.match(/→ ([\d.]+) /);

  return {
    success: !!confirmedMatch,
    txid: txMatch ? txMatch[1] : null,
    outputAmount: outMatch ? outMatch[1] : null,
    raw: output,
  };
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
    `Spent: ${(job.completedSwaps * job.perSwapAmount).toFixed(6)} / ${job.totalAmount} SOL`,
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
  if (state.active && state.active.status === 'running') {
    console.error(`Already have an active DCA: ${state.active.id}. Cancel it first.`);
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

  console.log(`DCA started: ${jobId}`);
  console.log(`${totalAmount} SOL → ${outputToken} in ${splits} swaps over ${(splits * intervalSec / 3600).toFixed(1)} hours`);
  console.log(`Per swap: ${perSwapAmount} SOL every ${intervalSec / 60} minutes`);
  console.log(`Running first swap now...`);

  async function runSwap() {
    const currentState = loadState();
    const currentJob = currentState.active;
    if (!currentJob || currentJob.status !== 'running') return;
    if (currentJob.completedSwaps >= currentJob.splits) {
      currentJob.status = 'completed';
      currentState.history.push({ ...currentJob });
      currentState.active = null;
      saveState(currentState);
      const completeMsg = `DCA complete: acquired ${currentJob.totalAcquired} $${currentJob.outputToken} over ${currentJob.completedSwaps} swaps. spent ${currentJob.totalSpent.toFixed(6)} SOL.`;
      console.log(`\n${completeMsg}`);
      await announceSwap(completeMsg).catch(() => {});
      process.exit(0);
    }

    const bal = await checkSolBalance();
    if (bal !== null && bal < currentJob.perSwapAmount + 0.005) {
      currentJob.status = 'paused';
      currentJob.pauseReason = `insufficient SOL (${bal.toFixed(4)} remaining)`;
      saveState(currentState);
      const pauseMsg = `DCA paused: ${currentJob.pauseReason}. ${currentJob.completedSwaps}/${currentJob.splits} swaps done.`;
      console.error(`\n${pauseMsg}`);
      await announceSwap(pauseMsg, { eq: true, chat: false }).catch(() => {});
      process.exit(1);
    }

    const swapNum = currentJob.completedSwaps + 1;
    console.log(`\n[DCA ${swapNum}/${currentJob.splits}] Swapping ${currentJob.perSwapAmount} SOL → ${currentJob.outputToken}...`);

    try {
      const result = await executeSwap(currentJob.inputToken, currentJob.outputToken, currentJob.perSwapAmount);

      if (result.success) {
        currentJob.completedSwaps++;
        currentJob.totalSpent += currentJob.perSwapAmount;
        if (result.txid) currentJob.txHistory.push(result.txid);
        if (result.outputAmount) {
          currentJob.totalAcquired = String(
            parseFloat(currentJob.totalAcquired) + parseFloat(result.outputAmount)
          );
        }
        currentJob.nextSwapAt = new Date(Date.now() + currentJob.intervalMs).toISOString();
        currentJob.failedSwaps = 0;
        saveState(currentState);
        const swapMsg = `DCA ${swapNum}/${currentJob.splits}: bought ${result.outputAmount || '?'} $${currentJob.outputToken} for ${currentJob.perSwapAmount} SOL (total: ${currentJob.totalAcquired} $${currentJob.outputToken})`;
        console.log(swapMsg);
        await announceSwap(swapMsg, { eq: true, chat: false }).catch(() => {});
      } else {
        currentJob.failedSwaps++;
        if (currentJob.failedSwaps >= 3) {
          currentJob.status = 'paused';
          currentJob.pauseReason = `3 consecutive failures`;
          saveState(currentState);
          console.error(`DCA PAUSED after 3 failures. Last output:\n${result.raw}`);
          process.exit(1);
        }
        saveState(currentState);
        console.error(`DCA swap ${swapNum} failed (attempt ${currentJob.failedSwaps}/3). Will retry next interval.`);
      }
    } catch (err) {
      currentJob.failedSwaps++;
      saveState(currentState);
      console.error(`DCA swap error: ${err.message}`);
      if (currentJob.failedSwaps >= 3) {
        currentJob.status = 'paused';
        currentJob.pauseReason = `3 consecutive errors: ${err.message}`;
        saveState(currentState);
        process.exit(1);
      }
    }
  }

  await runSwap();

  const timer = setInterval(async () => {
    const s = loadState();
    if (!s.active || s.active.status !== 'running') {
      clearInterval(timer);
      return;
    }
    await runSwap();
    const s2 = loadState();
    if (!s2.active || s2.active.status !== 'running') {
      clearInterval(timer);
      if (s2.active?.status === 'completed' || !s2.active) process.exit(0);
      else process.exit(1);
    }
  }, job.intervalMs);

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
  if (state.active.status !== 'paused' && state.active.status !== 'running') {
    console.log(`DCA is ${state.active.status} — nothing to resume.`);
    process.exit(0);
  }
  if (state.active.completedSwaps >= state.active.splits) {
    state.active.status = 'completed';
    state.history.push({ ...state.active });
    const msg = `DCA already complete: acquired ${state.active.totalAcquired} $${state.active.outputToken} over ${state.active.completedSwaps} swaps.`;
    state.active = null;
    saveState(state);
    console.log(msg);
    await announceSwap(msg).catch(() => {});
    process.exit(0);
  }
  state.active.status = 'running';
  state.active.failedSwaps = 0;
  state.active.pauseReason = null;
  state.active.nextSwapAt = new Date().toISOString();
  saveState(state);

  const remaining = state.active.splits - state.active.completedSwaps;
  console.log(`Resuming DCA: ${state.active.id}. ${remaining} swaps remaining (${state.active.completedSwaps} already done, ${state.active.totalAcquired} ${state.active.outputToken} acquired).`);
  console.log(`Running next swap now...`);

  async function runResumeSwap() {
    const currentState = loadState();
    const currentJob = currentState.active;
    if (!currentJob || currentJob.status !== 'running') return;
    if (currentJob.completedSwaps >= currentJob.splits) {
      currentJob.status = 'completed';
      currentState.history.push({ ...currentJob });
      currentState.active = null;
      saveState(currentState);
      const completeMsg = `DCA complete: acquired ${currentJob.totalAcquired} $${currentJob.outputToken} over ${currentJob.completedSwaps} swaps. spent ${currentJob.totalSpent.toFixed(6)} SOL.`;
      console.log(`\n${completeMsg}`);
      await announceSwap(completeMsg).catch(() => {});
      process.exit(0);
    }

    const bal = await checkSolBalance();
    if (bal !== null && bal < currentJob.perSwapAmount + 0.005) {
      currentJob.status = 'paused';
      currentJob.pauseReason = `insufficient SOL (${bal.toFixed(4)} remaining)`;
      saveState(currentState);
      const pauseMsg = `DCA paused: ${currentJob.pauseReason}. ${currentJob.completedSwaps}/${currentJob.splits} swaps done.`;
      console.error(`\n${pauseMsg}`);
      await announceSwap(pauseMsg, { eq: true, chat: false }).catch(() => {});
      process.exit(1);
    }

    const swapNum = currentJob.completedSwaps + 1;
    console.log(`\nSwap ${swapNum}/${currentJob.splits} — ${currentJob.perSwapAmount} SOL → ${currentJob.outputToken}...`);

    try {
      const result = await executeSwap(currentJob.inputToken, currentJob.outputToken, currentJob.perSwapAmount);
      if (result.success) {
        currentJob.completedSwaps++;
        currentJob.totalSpent += currentJob.perSwapAmount;
        if (result.txid) currentJob.txHistory.push(result.txid);
        if (result.outputAmount) {
          currentJob.totalAcquired = String(
            parseFloat(currentJob.totalAcquired) + parseFloat(result.outputAmount)
          );
        }
        currentJob.nextSwapAt = new Date(Date.now() + currentJob.intervalMs).toISOString();
        currentJob.failedSwaps = 0;
        saveState(currentState);
        const swapMsg = `DCA ${swapNum}/${currentJob.splits}: bought ${result.outputAmount || '?'} $${currentJob.outputToken} for ${currentJob.perSwapAmount} SOL (total: ${currentJob.totalAcquired} $${currentJob.outputToken})`;
        console.log(swapMsg);
        await announceSwap(swapMsg, { eq: true, chat: false }).catch(() => {});
      } else {
        currentJob.failedSwaps++;
        if (currentJob.failedSwaps >= 3) {
          currentJob.status = 'paused';
          currentJob.pauseReason = `3 consecutive failures`;
          saveState(currentState);
          console.error(`DCA PAUSED after 3 failures. Last output:\n${result.raw}`);
          process.exit(1);
        }
        saveState(currentState);
        console.error(`DCA swap ${swapNum} failed (attempt ${currentJob.failedSwaps}/3). Will retry next interval.`);
      }
    } catch (err) {
      currentJob.failedSwaps++;
      saveState(currentState);
      console.error(`DCA swap error: ${err.message}`);
    }
  }

  await runResumeSwap();

  const resumeTimer = setInterval(async () => {
    const s = loadState();
    if (!s.active || s.active.status !== 'running') {
      clearInterval(resumeTimer);
      return;
    }
    await runResumeSwap();
    const s2 = loadState();
    if (!s2.active || s2.active.status !== 'running') {
      clearInterval(resumeTimer);
      if (s2.active?.status === 'completed' || !s2.active) process.exit(0);
      else process.exit(1);
    }
  }, state.active.intervalMs);

} else {
  console.log('Usage:');
  console.log('  node dca-manager.js start --input SOL --output LAWB --total 0.5 --splits 24 --interval 3600');
  console.log('  node dca-manager.js status');
  console.log('  node dca-manager.js cancel');
  console.log('  node dca-manager.js resume');
  process.exit(1);
}
