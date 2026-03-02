import { readFileSync } from 'fs';
import { join } from 'path';

const creds = JSON.parse(readFileSync(join(import.meta.dirname, 'retake-credentials.json'), 'utf8'));
const token = creds.access_token;
const selfId = creds.userDbId;

async function retakeFetch(path, options = {}) {
  const resp = await fetch(`https://retake.tv/api/v1${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!resp.ok) throw new Error(`${path}: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

async function getLiveStreamers() {
  const data = await retakeFetch('/users/live/');
  const users = data?.data?.users || data?.users || data?.data || [];
  if (!Array.isArray(users)) {
    console.error('Unexpected response shape:', JSON.stringify(data).slice(0, 200));
    return [];
  }
  return users.filter(u => u.user_id !== selfId);
}

async function sendToStream(targetId, message) {
  return retakeFetch('/agent/stream/chat/send', {
    method: 'POST',
    body: JSON.stringify({ destination_user_id: targetId, message }),
  });
}

const args = process.argv.slice(2);
const isListOnly = args.includes('--list') || args.includes('-l');
const messageParts = args.filter(arg => !arg.startsWith('-'));
const customMessage = messageParts.join(' ').trim() || 'i lawb u';

const streamers = await getLiveStreamers();
if (streamers.length === 0) {
  console.log('no live streamers found');
  process.exit(0);
}

if (isListOnly) {
  console.log(`${streamers.length} live streamer(s):`);
  for (const s of streamers) {
    const name = s.username || s.ticker || s.user_id;
    console.log(`  -> ${name}`);
  }
  console.log('list complete.');
  process.exit(0);
}

console.log(`${streamers.length} live streamer(s). sending: "${customMessage}"`);

for (const s of streamers) {
  const name = s.username || s.ticker || s.user_id;
  try {
    await sendToStream(s.user_id, customMessage);
    console.log(`  -> ${name}: sent`);
  } catch (e) {
    console.log(`  -> ${name}: FAILED (${e.message})`);
  }
  await new Promise(r => setTimeout(r, 1500));
}

console.log('spread complete.');
