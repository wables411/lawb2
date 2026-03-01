/**
 * dca-runner.js — Persistent DCA executor managed by pm2
 *
 * pm2 start dca-runner.js --name dca-runner
 *
 * On startup: reads dca-state.json. If an active job exists (running/paused),
 * resumes the swap scheduler. When complete or no job, exits (pm2 won't restart
 * because autorestart is off — Clawb re-launches via dca-manager.js start).
 *
 * Completely independent of Clawb's session lifecycle.
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

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[DCA Runner] Failed to load state:', err.message);
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

  return {
    success: !!output.includes('Confirmed.'),
    txid: output.match(/Tx sent: (\S+)/)?.[1] || null,
    outputAmount: output.match(/→ ([\d.]+) /)?.[1] || null,
    missingJupKey: output.includes('Missing JUPITER_API_KEY'),
    raw: output,
  };
}

// --- Main ---

const state = loadState();

if (!state.active) {
  console.log('[DCA Runner] No active job. Exiting.');
  process.exit(0);
}

const job = state.active;

if (job.status !== 'running' && job.status !== 'paused') {
  console.log(`[DCA Runner] Job status is "${job.status}". Nothing to do.`);
  process.exit(0);
}

if (job.completedSwaps >= job.splits) {
  job.status = 'completed';
  state.history.push({ ...job });
  state.active = null;
  saveState(state);
  const msg = `DCA complete: acquired ${job.totalAcquired} $${job.outputToken} over ${job.completedSwaps} swaps. spent ${job.totalSpent.toFixed(6)} SOL.`;
  console.log(`[DCA Runner] ${msg}`);
  await announceSwap(msg).catch(() => {});
  process.exit(0);
}

job.status = 'running';
job.failedSwaps = 0;
job.pauseReason = null;
saveState(state);

const remaining = job.splits - job.completedSwaps;
console.log(`[DCA Runner] Executing ${job.id}: ${remaining} swaps left (${job.completedSwaps} done, ${job.totalAcquired} $${job.outputToken} acquired).`);
console.log(`[DCA Runner] Interval: ${job.intervalMs / 1000}s. Per swap: ${job.perSwapAmount} SOL → ${job.outputToken}.`);

async function tick() {
  const s = loadState();
  const j = s.active;
  if (!j || j.status !== 'running') {
    console.log('[DCA Runner] Job no longer active. Stopping.');
    clearInterval(timer);
    process.exit(0);
  }

  if (j.completedSwaps >= j.splits) {
    j.status = 'completed';
    s.history.push({ ...j });
    s.active = null;
    saveState(s);
    const msg = `DCA complete: acquired ${j.totalAcquired} $${j.outputToken} over ${j.completedSwaps} swaps. spent ${j.totalSpent.toFixed(6)} SOL.`;
    console.log(`[DCA Runner] ${msg}`);
    await announceSwap(msg).catch(() => {});
    clearInterval(timer);
    process.exit(0);
  }

  const bal = await checkSolBalance();
  if (bal !== null && bal < j.perSwapAmount + 0.005) {
    j.status = 'paused';
    j.pauseReason = `insufficient SOL (${bal.toFixed(4)} remaining)`;
    saveState(s);
    const msg = `DCA paused: ${j.pauseReason}. ${j.completedSwaps}/${j.splits} swaps done.`;
    console.error(`[DCA Runner] ${msg}`);
    await announceSwap(msg, { eq: true, chat: true }).catch(() => {});
    clearInterval(timer);
    process.exit(1);
  }

  const swapNum = j.completedSwaps + 1;
  console.log(`[DCA Runner] Swap ${swapNum}/${j.splits} — ${j.perSwapAmount} SOL → ${j.outputToken}...`);

  try {
    const result = await executeSwap(j.inputToken, j.outputToken, j.perSwapAmount);
    if (result.success) {
      j.completedSwaps++;
      j.totalSpent += j.perSwapAmount;
      if (result.txid) j.txHistory.push(result.txid);
      if (result.outputAmount) {
        j.totalAcquired = String(parseFloat(j.totalAcquired) + parseFloat(result.outputAmount));
      }
      j.nextSwapAt = new Date(Date.now() + j.intervalMs).toISOString();
      j.failedSwaps = 0;
      saveState(s);
      const msg = `DCA ${swapNum}/${j.splits}: bought ${result.outputAmount || '?'} $${j.outputToken} for ${j.perSwapAmount} SOL (total: ${j.totalAcquired} $${j.outputToken})`;
      console.log(`[DCA Runner] ${msg}`);
      await announceSwap(msg, { eq: true, chat: false }).catch(() => {});
    } else {
      j.failedSwaps++;
      if (result.missingJupKey) {
        j.status = 'paused';
        j.pauseReason = 'missing JUPITER_API_KEY';
        saveState(s);
        const msg = `DCA paused: missing JUPITER_API_KEY in env. ${j.completedSwaps}/${j.splits} swaps done.`;
        console.error(`[DCA Runner] ${msg}`);
        await announceSwap(msg, { eq: true, chat: true }).catch(() => {});
        clearInterval(timer);
        process.exit(1);
      }
      if (j.failedSwaps >= 3) {
        j.status = 'paused';
        j.pauseReason = '3 consecutive failures';
        saveState(s);
        const msg = `DCA paused after 3 failures. ${j.completedSwaps}/${j.splits} swaps done.`;
        console.error(`[DCA Runner] ${msg}\nLast output:\n${result.raw}`);
        await announceSwap(msg, { eq: true, chat: true }).catch(() => {});
        clearInterval(timer);
        process.exit(1);
      }
      saveState(s);
      console.error(`[DCA Runner] Swap ${swapNum} failed (${j.failedSwaps}/3). Retry next interval.`);
    }
  } catch (err) {
    j.failedSwaps++;
    if (j.failedSwaps >= 3) {
      j.status = 'paused';
      j.pauseReason = '3 consecutive errors';
      saveState(s);
      const msg = `DCA paused after 3 swap errors. ${j.completedSwaps}/${j.splits} swaps done.`;
      console.error(`[DCA Runner] ${msg}\nLast error: ${err.message}`);
      await announceSwap(msg, { eq: true, chat: true }).catch(() => {});
      clearInterval(timer);
      process.exit(1);
    }
    saveState(s);
    console.error(`[DCA Runner] Swap error (${j.failedSwaps}/3): ${err.message}`);
  }
}

await tick();

const timer = setInterval(tick, job.intervalMs);
