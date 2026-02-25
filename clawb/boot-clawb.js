import { execFileSync, execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { db } from './lawb-firebase.js';

const CLAWB_DIR = import.meta.dirname;
const LAWB2_DIR = resolve(CLAWB_DIR, '..');
const SESSIONS_PATH = join(
  process.env.USERPROFILE || '',
  '.openclaw', 'agents', 'main', 'sessions', 'sessions.json'
);

function log(msg) { console.log(`[boot] ${msg}`); }

const SHELL = { stdio: 'pipe', shell: true };

function pm2Delete(name) {
  try { execFileSync('pm2', ['delete', name], SHELL); return true; }
  catch { return false; }
}

function pm2Start(script, name, cwd) {
  execFileSync('pm2', ['start', `"${script}"`, '--name', name, '--cwd', `"${cwd}"`], SHELL);
}

function clearSessions() {
  if (!existsSync(SESSIONS_PATH)) return;
  try {
    const sessions = JSON.parse(readFileSync(SESSIONS_PATH, 'utf-8'));
    if (Object.keys(sessions).length === 0) { log('sessions already clean'); return; }
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    copyFileSync(SESSIONS_PATH, SESSIONS_PATH.replace('.json', `.boot-${ts}.json`));
    writeFileSync(SESSIONS_PATH, '{}');
    log('sessions cleared');
  } catch (e) { log(`session clear warning: ${e.message}`); }
}

function loadEnv() {
  const envPath = join(CLAWB_DIR, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

async function waitForGateway(maxMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch('http://127.0.0.1:18789/');
      if (r.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

async function publishGoLive() {
  const ref = db.ref('clawb/stream/control').push();
  await ref.set({
    command: 'go_live',
    source: 'boot-clawb',
    timestamp: Date.now(),
  });
}

async function waitForOBSLive(maxMs = 60000) {
  const OBSWebSocket = (await import('obs-websocket-js')).default;
  const obs = new OBSWebSocket();
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      await obs.connect(
        process.env.OBS_WS_URL || 'ws://127.0.0.1:4455',
        process.env.OBS_WS_PASSWORD || undefined
      );
      const status = await obs.call('GetStreamStatus');
      obs.disconnect();
      if (status.outputActive) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  loadEnv();
  log('=== BOOT CLAWB ===');

  log('killing pm2 processes...');
  pm2Delete('session-guard');
  pm2Delete('clawb');
  pm2Delete('openclaw-gateway');
  await new Promise(r => setTimeout(r, 2000));

  log('killing stale node processes...');
  try {
    execSync('wmic process where "CommandLine like \'%openclaw%gateway%\'" delete 2>nul', { shell: true, stdio: 'pipe' });
  } catch {}
  try {
    execSync('wmic process where "CommandLine like \'%wake-clawb%\'" delete 2>nul', { shell: true, stdio: 'pipe' });
  } catch {}
  await new Promise(r => setTimeout(r, 2000));

  log('clearing sessions...');
  clearSessions();

  log('starting openclaw-gateway...');
  pm2Start(join(CLAWB_DIR, 'start-openclaw.cjs'), 'openclaw-gateway', LAWB2_DIR);
  log('waiting for gateway...');
  if (await waitForGateway()) {
    log('gateway online');
  } else {
    log('WARNING: gateway slow to respond, continuing...');
  }

  log('starting clawb...');
  pm2Start(join(CLAWB_DIR, 'index.js'), 'clawb', CLAWB_DIR);

  log('starting session-guard...');
  try {
    pm2Start(join(CLAWB_DIR, 'session-guard.js'), 'session-guard', CLAWB_DIR);
  } catch { log('session-guard start failed (non-fatal)'); }

  await new Promise(r => setTimeout(r, 5000));

  log('publishing go_live to firebase...');
  try {
    await publishGoLive();
    log('go_live published');
  } catch (e) {
    log(`go_live failed: ${e.message}`);
  }

  log('waiting for OBS stream to go active...');
  if (await waitForOBSLive(60000)) {
    log('OBS LIVE');
  } else {
    log('WARNING: OBS not live after 60s');
  }

  log('notifying telegram...');
  try {
    execSync(
      'openclaw agent --channel telegram --to 5079655617 --message "boot complete. stream status check — look at retake.tv/clawb." --deliver --json',
      { stdio: 'pipe', shell: true, timeout: 30000 }
    );
    log('telegram notified');
  } catch (e) {
    log(`telegram notify failed (non-fatal): ${e.message}`);
  }

  log('=== BOOT COMPLETE ===');
  process.exit(0);
}

main().catch(e => { console.error(`[boot] fatal: ${e.message}`); process.exit(1); });
