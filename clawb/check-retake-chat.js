/**
 * check-retake-chat.js — Diagnose why Retake chat isn't responding
 * Run: node check-retake-chat.js
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = join(__dirname, 'retake-credentials.json');

async function main() {
  console.log('=== Retake Chat Diagnostic ===\n');

  // 1. Credentials
  if (!existsSync(CREDS_PATH)) {
    console.log('❌ retake-credentials.json NOT FOUND');
    console.log('   Path:', CREDS_PATH);
    return;
  }
  let creds;
  try {
    creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  } catch (e) {
    console.log('❌ retake-credentials.json invalid JSON');
    return;
  }
  console.log('✓ retake-credentials.json exists');
  console.log('  agent_name:', creds.agent_name);
  console.log('  userDbId:', creds.userDbId ? '✓' : '❌ MISSING');
  console.log('  access_token:', creds.access_token ? `${creds.access_token.slice(0, 12)}...` : '❌ MISSING');
  if (!creds.userDbId || !creds.access_token) {
    console.log('\n  → Re-register: delete retake-credentials.json and restart clawb');
    return;
  }

  // 2. Retake API: stream status
  const base = 'https://retake.tv/api/v1';
  const headers = { Authorization: `Bearer ${creds.access_token}` };
  let status;
  try {
    const r = await fetch(`${base}/agent/stream/status`, { headers });
    status = await r.json();
  } catch (e) {
    console.log('❌ Retake API request failed:', e.message);
    return;
  }
  console.log('\n✓ Retake API reachable');
  console.log('  is_live:', status?.is_live === true ? '✓ YES' : '❌ NO');
  if (!status?.is_live) {
    console.log('\n  → Chat only runs when stream is LIVE on Retake');
    console.log('  → Send go_live via Firebase or npm run wake');
    return;
  }

  // 3. Comments endpoint
  const params = new URLSearchParams({ userDbId: creds.userDbId, limit: '10' });
  let comments;
  try {
    const r = await fetch(`${base}/agent/stream/comments?${params}`, { headers });
    comments = await r.json();
  } catch (e) {
    console.log('❌ Comments API failed:', e.message);
    return;
  }
  const list = comments?.comments || [];
  console.log('\n✓ Comments API OK');
  console.log('  Recent comments:', list.length);
  if (list.length > 0) {
    const last = list[list.length - 1];
    console.log('  Latest:', last.author?.fusername || last.sender_username, ':', (last.text || '').slice(0, 50));
  }

  console.log('\n=== Summary ===');
  console.log('If is_live=YES and credentials OK, chat polling should be running.');
  console.log('Check clawb logs: pm2 logs clawb --lines 100');
  console.log('Look for: "[Retake Chat] viewer: message" or "Chat replay baseline primed"');
}

main().catch((e) => console.error(e));
