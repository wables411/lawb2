import { execSync } from 'child_process';
import { runPreflight } from './preflight-env.js';

const shouldRestart = process.argv.includes('--restart');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function safeRun(cmd) {
  try {
    return { ok: true, out: run(cmd) };
  } catch (err) {
    return { ok: false, out: (err.stderr || err.message || '').toString().trim() };
  }
}

function checkPm2Process(name) {
  const result = safeRun(`pm2 describe ${name}`);
  if (!result.ok) return { name, online: false, reason: 'missing' };
  const out = result.out.toLowerCase();
  const online = out.includes('status') && out.includes('online');
  return { name, online, reason: online ? 'ok' : 'not-online' };
}

function main() {
  const preflight = runPreflight({ strict: false });
  console.log(`[doctor] preflight ok=${preflight.ok}`);
  preflight.errors.forEach((e) => console.log(`[doctor] error: ${e}`));
  preflight.warnings.forEach((w) => console.log(`[doctor] warning: ${w}`));

  const processes = ['clawb', 'session-guard', 'openclaw-gateway', 'dca-runner'].map(checkPm2Process);
  processes.forEach((p) => console.log(`[doctor] ${p.name}: ${p.online ? 'online' : `issue (${p.reason})`}`));

  if (shouldRestart) {
    console.log('[doctor] restarting critical processes...');
    safeRun('pm2 restart clawb --update-env');
    safeRun('pm2 restart session-guard --update-env');
    safeRun('pm2 restart openclaw-gateway --update-env');
    safeRun('pm2 restart dca-runner --update-env');
    console.log('[doctor] restart commands sent.');
  }

  const hasErrors = preflight.errors.length > 0 || processes.some((p) => !p.online);
  if (hasErrors) process.exit(1);
}

main();

