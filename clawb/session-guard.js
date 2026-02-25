import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { execFileSync, execSync } from 'child_process';

const SESSIONS_PATH = join(
  process.env.USERPROFILE || '',
  '.openclaw', 'agents', 'main', 'sessions', 'sessions.json'
);
const MEMORY_DIR = join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'memory');
const THRESHOLD = 0.65;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const TELEGRAM_CHAT_ID = '5079655617';

function todayMemoryPath() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return join(MEMORY_DIR, `${yyyy}-${mm}-${dd}.md`);
}

function writeMemoryNote(sessionKey, ratio, total, ctx) {
  try {
    if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR, { recursive: true });
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const note = `\n## ${time} - Session Guard Flush\n- Session \`${sessionKey}\` flushed at ${Math.round(ratio * 100)}% context (${total}/${ctx} tokens)\n- Conversation context was lost at this point\n- All file-based memory (SOUL.md, MEMORY.md, daily logs) preserved\n`;
    appendFileSync(todayMemoryPath(), note);
    console.log(`[session-guard] wrote memory note to ${todayMemoryPath()}`);
  } catch (e) {
    console.error(`[session-guard] memory note failed: ${e.message}`);
  }
}

function notifyTelegram(sessionKey, ratio) {
  try {
    execSync(
      `openclaw agent --channel telegram --to ${TELEGRAM_CHAT_ID} --message "session guard flushed context at ${Math.round(ratio * 100)}%. conversation memory reset — file memory intact." --deliver --json`,
      { stdio: 'pipe', shell: true, timeout: 15000 }
    );
    console.log('[session-guard] telegram notified');
  } catch (e) {
    console.error(`[session-guard] telegram notify failed: ${e.message}`);
  }
}

function check() {
  try {
    if (!existsSync(SESSIONS_PATH)) return;
    const sessions = JSON.parse(readFileSync(SESSIONS_PATH, 'utf-8'));

    for (const [key, s] of Object.entries(sessions)) {
      const total = s.totalTokens || 0;
      const ctx = s.contextTokens || 40000;
      const ratio = total / ctx;
      if (ratio < THRESHOLD) continue;

      writeMemoryNote(key, ratio, total, ctx);
      notifyTelegram(key, ratio);

      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backup = SESSIONS_PATH.replace('.json', `.guard-${ts}.json`);
      copyFileSync(SESSIONS_PATH, backup);
      writeFileSync(SESSIONS_PATH, '{}');
      try { execFileSync('pm2', ['restart', 'openclaw-gateway'], { stdio: 'pipe', shell: true }); } catch {}
      console.log(`[session-guard] flushed ${key} at ${Math.round(ratio * 100)}% (${total}/${ctx})`);
      return;
    }
  } catch (e) {
    console.error(`[session-guard] ${e.message}`);
  }
}

check();
setInterval(check, CHECK_INTERVAL_MS);
console.log(`[session-guard] watching (threshold ${THRESHOLD * 100}%, every ${CHECK_INTERVAL_MS / 1000}s)`);
