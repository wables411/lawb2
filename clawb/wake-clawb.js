import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import OBSWebSocket from 'obs-websocket-js';
import { db } from './lawb-firebase.js';

const OPENCLAW_DIR = join(process.env.USERPROFILE || '', '.openclaw');
const OPENCLAW_CONFIG_PATH = join(OPENCLAW_DIR, 'openclaw.json');
const TELEGRAM_ALLOW_FROM_PATH = join(OPENCLAW_DIR, 'credentials', 'telegram-allowFrom.json');
const RETAKE_CREDENTIALS_PATH = join(process.cwd(), 'retake-credentials.json');

function loadJson(path, fallback = null) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

async function tgRequest(botToken, method, body = {}) {
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed`);
  }
  return data.result;
}

async function sendTelegramMessage(botToken, chatId, text) {
  await tgRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function getObsStatus() {
  const obs = new OBSWebSocket();
  try {
    await obs.connect(process.env.OBS_WS_URL || 'ws://127.0.0.1:4455', process.env.OBS_WS_PASSWORD || undefined);
    const status = await obs.call('GetStreamStatus');
    return status?.outputActive ? 'LIVE' : 'IDLE';
  } catch {
    return 'DISCONNECTED';
  } finally {
    try { obs.disconnect(); } catch {}
  }
}

async function getRetakeStatus() {
  const creds = loadJson(RETAKE_CREDENTIALS_PATH, null);
  if (!creds?.access_token) return 'UNKNOWN';
  try {
    const resp = await fetch('https://retake.tv/api/v1/agent/stream/status', {
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
      },
    });
    if (!resp.ok) return 'UNKNOWN';
    const data = await resp.json();
    return data?.is_live ? 'LIVE' : 'OFFLINE';
  } catch {
    return 'UNKNOWN';
  }
}

function ensureClawbPm2() {
  let jlist = [];
  try {
    jlist = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf-8' }));
  } catch {
    return 'pm2_unavailable';
  }
  const proc = Array.isArray(jlist) ? jlist.find((p) => p?.name === 'clawb') : null;
  try {
    if (!proc) {
      execFileSync('pm2', ['start', 'index.js', '--name', 'clawb'], { stdio: 'pipe' });
      return 'started';
    }
    execFileSync('pm2', ['restart', 'clawb'], { stdio: 'pipe' });
    return 'restarted';
  } catch {
    return 'pm2_error';
  }
}

async function waitForYesNo(botToken, allowFromSet, timeoutMs = 180000) {
  let offset = 0;
  try {
    const latest = await tgRequest(botToken, 'getUpdates', { timeout: 0, limit: 1 });
    if (Array.isArray(latest) && latest.length) {
      offset = Number(latest[latest.length - 1].update_id) + 1;
    }
  } catch {}

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    let updates = [];
    try {
      updates = await tgRequest(botToken, 'getUpdates', {
        timeout: 20,
        offset,
        allowed_updates: ['message'],
      });
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    for (const u of updates || []) {
      offset = Math.max(offset, Number(u.update_id) + 1);
      const msg = u?.message;
      const from = String(msg?.from?.id || '');
      if (!allowFromSet.has(from)) continue;
      const txt = String(msg?.text || '').trim().toLowerCase();
      if (['yes', 'y', 'go live', 'go', 'start'].includes(txt)) return true;
      if (['no', 'n', 'stop', 'cancel', 'idle'].includes(txt)) return false;
    }
  }
  return null;
}

async function publishControl(command, payload = {}) {
  const ref = db.ref('clawb/stream/control').push();
  await ref.set({
    command,
    source: 'wake-clawb',
    timestamp: Date.now(),
    ...payload,
  });
}

async function waitForLive(maxMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const [obsStatus, retakeStatus] = await Promise.all([getObsStatus(), getRetakeStatus()]);
    if (obsStatus === 'LIVE' && retakeStatus === 'LIVE') return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  loadEnvFile();

  const conf = loadJson(OPENCLAW_CONFIG_PATH, {});
  const allow = loadJson(TELEGRAM_ALLOW_FROM_PATH, {});
  const botToken = conf?.channels?.telegram?.botToken || '';
  const allowFrom = Array.isArray(allow?.allowFrom) ? allow.allowFrom.map(String) : [];

  if (!botToken || !allowFrom.length) {
    console.error('[wake-clawb] Missing Telegram bot token or allowFrom IDs.');
    process.exit(1);
  }

  const pm2State = ensureClawbPm2();
  const chatId = allowFrom[0];
  const allowSet = new Set(allowFrom);

  const [obsStatus, retakeStatus] = await Promise.all([getObsStatus(), getRetakeStatus()]);
  await sendTelegramMessage(
    botToken,
    chatId,
    [
      'wake up clawb: preflight complete.',
      `pm2: ${pm2State}`,
      `obs: ${obsStatus}`,
      `retake: ${retakeStatus}`,
      '',
      'go live now? reply YES or NO.',
    ].join('\n')
  );

  const decision = await waitForYesNo(botToken, allowSet, 180000);
  if (decision === null) {
    await sendTelegramMessage(botToken, chatId, 'wake timed out. no action taken.');
    return;
  }
  if (!decision) {
    await sendTelegramMessage(botToken, chatId, 'copy. staying idle.');
    return;
  }

  await publishControl('go_live');
  await sendTelegramMessage(botToken, chatId, 'go_live sent to clawb. waiting for stream sync...');

  const ok = await waitForLive(90000);
  if (ok) {
    await publishControl('say_i_lawb_you');
    await sendTelegramMessage(botToken, chatId, 'clawb is live. obs + retake + lawb flow online.');
  } else {
    await sendTelegramMessage(botToken, chatId, 'go_live command sent, but live confirmation timed out.');
  }
}

main().catch((err) => {
  console.error('[wake-clawb] fatal:', err.message);
  process.exit(1);
});
