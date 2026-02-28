/**
 * announce-swap.js — Push swap notifications to EQ feed + Retake chat
 *
 * Usage:
 *   node announce-swap.js "swapped 0.02 SOL for 590,000 $CLAWB"
 *   node announce-swap.js --eq-only "text for eq only"
 *   node announce-swap.js --chat-only "text for chat only"
 *
 * Or import as a module:
 *   import { announceSwap } from './announce-swap.js';
 *   await announceSwap('swapped 0.02 SOL for 590,000 $CLAWB');
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EQ_PROXY_URL = 'http://127.0.0.1:18181/display-text';
const RETAKE_CREDS_PATH = path.join(__dirname, 'retake-credentials.json');
const RETAKE_CHAT_URL = 'https://retake.tv/api/v1/agent/stream/chat/send';

function loadRetakeCreds() {
  try {
    return JSON.parse(fs.readFileSync(RETAKE_CREDS_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

async function pushToEq(text) {
  try {
    const res = await fetch(EQ_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Announce] EQ push failed:', err.message);
    return false;
  }
}

async function pushToChat(text) {
  const creds = loadRetakeCreds();
  if (!creds?.access_token || !creds?.userDbId) {
    console.warn('[Announce] No Retake credentials — skipping chat');
    return false;
  }
  try {
    const res = await fetch(RETAKE_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: text,
        destination_user_id: creds.userDbId,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Announce] Chat send failed:', err.message);
    return false;
  }
}

export async function announceSwap(text, { eq = true, chat = true } = {}) {
  const results = {};
  if (eq) results.eq = await pushToEq(text);
  if (chat) results.chat = await pushToChat(text);
  return results;
}

// CLI mode
if (process.argv[1] && process.argv[1].includes('announce-swap')) {
  const args = process.argv.slice(2);
  let eqOnly = false, chatOnly = false;
  const textParts = [];

  for (const arg of args) {
    if (arg === '--eq-only') eqOnly = true;
    else if (arg === '--chat-only') chatOnly = true;
    else textParts.push(arg);
  }

  const text = textParts.join(' ');
  if (!text) {
    console.error('Usage: node announce-swap.js [--eq-only|--chat-only] "swap message"');
    process.exit(1);
  }

  const opts = {
    eq: !chatOnly,
    chat: !eqOnly,
  };

  const res = await announceSwap(text, opts);
  console.log('[Announce]', JSON.stringify(res));
}
