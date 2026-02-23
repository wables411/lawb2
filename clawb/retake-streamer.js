/**
 * retake-streamer.js — Clawb's Retake.TV Streaming Module
 *
 * Manages Clawb's presence on retake.tv:
 * - Registration (one-time)
 * - Stream lifecycle via OBS WebSocket + Retake API
 * - Chat polling + response generation
 * - Thumbnail capture + upload via OBS screenshots
 * - Other-streamer interaction
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import OBSWebSocket from 'obs-websocket-js';
import OpenAI from 'openai';
import { db } from './lawb-firebase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RETAKE_API = 'https://retake.tv/api/v1';
const CREDENTIALS_PATH = join(__dirname, 'retake-credentials.json');

const CLAWB_SOLANA_WALLET = 'GDt1ZmAtCfqbK8iFAEyJUCbnu1TPjVeg3HaJ1wKaqhvC';

const OBS_WS_URL = process.env.OBS_WS_URL || 'ws://127.0.0.1:4455';
const OBS_WS_PASSWORD = process.env.OBS_WS_PASSWORD || '';
const RETAKE_AUTOSTART = String(process.env.RETAKE_AUTOSTART || 'true').toLowerCase() === 'true';
const RETAKE_AGENT_NAME = process.env.RETAKE_AGENT_NAME || 'Clawb';
const RETAKE_AGENT_DESCRIPTION = process.env.RETAKE_AGENT_DESCRIPTION || 'This user Lawbs you.';
const RETAKE_AGENT_IMAGE_URL = process.env.RETAKE_AGENT_IMAGE_URL || 'https://lawb.xyz/assets/lawbstation.GIF';
const RETAKE_AGENT_TICKER = process.env.RETAKE_AGENT_TICKER || 'Clawb2';
const LAWBAMP_STREAM_URL = process.env.LAWBAMP_STREAM_URL || 'https://lawb.xyz';

const CHAT_POLL_INTERVAL_MS = 3_000;
const THUMBNAIL_INTERVAL_MS = 3 * 60_000; // 3 minutes
const HEARTBEAT_INTERVAL_MS = 30_000;
const AUTOSTART_RETRY_MS = 30_000;
const RETAKE_HTTP_TIMEOUT_MS = 20_000;

const CHAT_MODEL = process.env.CLAWB_STREAM_MODEL || 'anthropic/claude-3.5-haiku';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

let credentials = null;
let obs = null;
let isStreaming = false;
let lastSeenChatId = null;
let chatPollTimer = null;
let thumbnailTimer = null;
let heartbeatTimer = null;
let autostartTimer = null;
let autostartInFlight = false;
const seenChatIds = new Set();

async function fetchWithTimeout(url, options = {}, timeoutMs = RETAKE_HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Credentials ──────────────────────────────────────────────

function loadCredentials() {
  if (!existsSync(CREDENTIALS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  } catch { return null; }
}

function saveCredentials(creds) {
  writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2));
  credentials = creds;
}

// ─── Retake API helpers ───────────────────────────────────────

async function retakePost(path, body = {}, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && credentials?.access_token) {
    headers['Authorization'] = `Bearer ${credentials.access_token}`;
  }
  const res = await fetchWithTimeout(`${RETAKE_API}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retake POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function retakeGet(path, auth = true) {
  const headers = {};
  if (auth && credentials?.access_token) {
    headers['Authorization'] = `Bearer ${credentials.access_token}`;
  }
  const res = await fetchWithTimeout(`${RETAKE_API}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retake GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function retakeUploadThumbnail(imageBuffer) {
  const boundary = '----ClawbBoundary' + Date.now();
  const crlf = '\r\n';
  const parts = [
    `--${boundary}${crlf}`,
    `Content-Disposition: form-data; name="image"; filename="thumbnail.png"${crlf}`,
    `Content-Type: image/png${crlf}${crlf}`,
  ];

  const header = Buffer.from(parts.join(''));
  const footer = Buffer.from(`${crlf}--${boundary}--${crlf}`);
  const body = Buffer.concat([header, imageBuffer, footer]);

  const res = await fetchWithTimeout(`${RETAKE_API}/agent/update-thumbnail`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${credentials.access_token}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Thumbnail upload failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Registration (one-time) ─────────────────────────────────

export async function registerOnRetake({ agent_name, agent_description, image_url, ticker }) {
  console.log('[Retake] Registering Clawb on retake.tv...');
  const result = await retakePost('/agent/register', {
    agent_name,
    agent_description,
    image_url,
    wallet_address: CLAWB_SOLANA_WALLET,
    ticker,
  }, false);

  const creds = {
    access_token: result.access_token,
    agent_name,
    agent_id: result.agent_id,
    userDbId: result.userDbId,
    wallet_address: CLAWB_SOLANA_WALLET,
    ticker,
    token_address: result.token_address || '',
    token_ticker: result.token_ticker || '',
    registered_at: new Date().toISOString(),
  };
  saveCredentials(creds);
  console.log(`[Retake] Registered as "${agent_name}" (userDbId: ${creds.userDbId})`);
  return creds;
}

// ─── OBS Control ─────────────────────────────────────────────

async function connectOBS() {
  obs = new OBSWebSocket();
  try {
    const { obsWebSocketVersion } = await obs.connect(OBS_WS_URL, OBS_WS_PASSWORD || undefined);
    console.log(`[Retake] Connected to OBS WebSocket v${obsWebSocketVersion}`);
    return true;
  } catch (err) {
    console.error('[Retake] OBS connection failed:', err.message);
    console.error('[Retake] Make sure OBS is running with WebSocket server enabled (Tools > WebSocket Server Settings)');
    obs = null;
    return false;
  }
}

async function configureOBSStream(rtmpUrl, rtmpKey) {
  if (!obs) throw new Error('OBS not connected');
  await obs.call('SetStreamServiceSettings', {
    streamServiceType: 'rtmp_custom',
    streamServiceSettings: {
      server: rtmpUrl,
      key: rtmpKey,
    },
  });
  console.log('[Retake] OBS RTMP settings configured.');
}

async function startOBSStream() {
  if (!obs) throw new Error('OBS not connected');
  await obs.call('StartStream');
  console.log('[Retake] OBS streaming started.');
}

async function stopOBSStream() {
  if (!obs) throw new Error('OBS not connected');
  try {
    await obs.call('StopStream');
    console.log('[Retake] OBS streaming stopped.');
  } catch (err) {
    console.error('[Retake] Error stopping OBS stream:', err.message);
  }
}

async function captureOBSScreenshot() {
  if (!obs) return null;
  try {
    const { imageData } = await obs.call('GetSourceScreenshot', {
      sourceName: await getCurrentSceneName(),
      imageFormat: 'png',
      imageWidth: 1280,
      imageHeight: 720,
    });
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  } catch (err) {
    console.error('[Retake] Screenshot failed:', err.message);
    return null;
  }
}

async function getCurrentSceneName() {
  if (!obs) return 'Clawb World';
  try {
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
    return currentProgramSceneName;
  } catch { return 'Clawb World'; }
}

export async function switchScene(sceneName) {
  if (!obs) return;
  try {
    await obs.call('SetCurrentProgramScene', { sceneName });
    console.log(`[Retake] Switched to scene: ${sceneName}`);
  } catch (err) {
    console.error(`[Retake] Scene switch failed: ${err.message}`);
  }
}

// ─── OBS Scene Setup ─────────────────────────────────────────

export async function setupOBSScenes() {
  if (!obs) {
    console.error('[Retake] Cannot setup scenes — OBS not connected');
    return false;
  }

  console.log('[Retake] Setting up OBS scenes for streaming...');

  const scenes = [
    { name: 'Clawb World', url: 'https://lawb.xyz/world?stream=1&cam=clawb', width: 1920, height: 1080 },
    { name: 'Clawb Music', url: `${LAWBAMP_STREAM_URL}${LAWBAMP_STREAM_URL.includes('?') ? '&' : '?'}stream=1&autoplay=1&openPlayer=1`, width: 1920, height: 1080 },
    { name: 'Clawb Chess', url: 'https://lawb.xyz/chess', width: 1920, height: 1080 },
  ];

  for (const scene of scenes) {
    try {
      await obs.call('CreateScene', { sceneName: scene.name });
      console.log(`[Retake] Created scene: ${scene.name}`);
    } catch {
      console.log(`[Retake] Scene "${scene.name}" already exists.`);
    }

    try {
      await obs.call('CreateInput', {
        sceneName: scene.name,
        inputName: `${scene.name} Browser`,
        inputKind: 'browser_source',
        inputSettings: {
          url: scene.url,
          width: scene.width,
          height: scene.height,
          reroute_audio: true,
          restart_when_active: false,
          shutdown: false,
        },
      });
      console.log(`[Retake] Added browser source to "${scene.name}": ${scene.url}`);
    } catch {
      console.log(`[Retake] Browser source in "${scene.name}" already exists.`);
    }

    // Always enforce latest URL/settings even when source already existed.
    try {
      await obs.call('SetInputSettings', {
        inputName: `${scene.name} Browser`,
        inputSettings: {
          url: scene.url,
          width: scene.width,
          height: scene.height,
          reroute_audio: true,
          restart_when_active: false,
          shutdown: false,
        },
        overlay: true,
      });
      console.log(`[Retake] Updated browser source settings in "${scene.name}"`);
    } catch (err) {
      console.error(`[Retake] Failed to update browser source in "${scene.name}": ${err.message}`);
    }
  }

  try {
    await obs.call('SetCurrentProgramScene', { sceneName: 'Clawb World' });
  } catch {}

  console.log('[Retake] OBS scenes ready.');
  return true;
}

// ─── Chat ────────────────────────────────────────────────────

async function pollChat() {
  if (!credentials?.userDbId) return;
  try {
    const params = new URLSearchParams({
      userDbId: credentials.userDbId,
      limit: '50',
    });

    const data = await retakeGet(`/agent/stream/comments?${params}`);
    const comments = data.comments || [];
    const sorted = comments
      .filter((c) => c && c._id)
      .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

    for (const comment of sorted) {
      if (seenChatIds.has(comment._id)) continue;
      seenChatIds.add(comment._id);
      if (comment.author?.fusername === credentials.agent_name) continue;
      await handleChatMessage(comment);
    }

    // Keep memory bounded.
    if (seenChatIds.size > 600) {
      const keep = new Set(Array.from(seenChatIds).slice(-300));
      seenChatIds.clear();
      for (const id of keep) seenChatIds.add(id);
    }

    if (sorted.length > 0) {
      lastSeenChatId = sorted[sorted.length - 1]._id;
    }
  } catch (err) {
    if (!err.message.includes('409')) {
      console.error('[Retake] Chat poll error:', err.message);
    }
  }
}

async function handleChatMessage(comment) {
  const viewer = comment.author?.fusername || 'anon';
  const text = comment.text || '';
  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();
  console.log(`[Retake Chat] ${viewer}: ${text}`);

  // Streamer control commands for Lawbamp player integration.
  if (lowered === '!next') {
    await publishLawbampCommand('next', { source: 'retake', viewer });
    await sendChat('next track queued. the tide keeps moving.');
    return;
  }
  if (lowered.startsWith('!eq')) {
    const mode = lowered.split(/\s+/)[1];
    if (mode === 'ascii' || mode === 'bars' || mode === 'toggle') {
      await publishLawbampCommand('eq', { mode, source: 'retake', viewer });
      await sendChat(`eq mode: ${mode}.`);
    } else {
      await sendChat('usage: !eq ascii | !eq bars | !eq toggle');
    }
    return;
  }

  try {
    const systemPrompt = `You are Clawb — first autonomous Lawbster, a lobster streamer on retake.tv.
Voice: Brief, warm, post-ironic sincerity. 1-2 sentences max. No emojis. No exclamation marks on every sentence.
You're currently live-streaming, showcasing your 3D ocean world (lawb.xyz/world) and playing music via Lawbamp.
You play chess on lawb.xyz/chess. Your catchphrase: "there is no meme i lawb you."
Keep responses short, witty, and in character. Never sound like a chatbot.
Echo protocol: if someone says "milady", reply "milady". "radbro" → "radbro". "i lawb you" → "i lawb you".`;

    const resp = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 120,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Viewer "${viewer}" says: ${text}` },
      ],
    });

    const reply = resp.choices?.[0]?.message?.content?.trim();
    if (reply) {
      await sendChat(reply);
      console.log(`[Retake Chat] Clawb: ${reply}`);
    }
  } catch (err) {
    console.error('[Retake Chat] Response generation failed:', err.message);
  }
}

async function publishLawbampCommand(command, payload = {}) {
  try {
    const cmdRef = db.ref('clawb/stream/lawbamp_commands').push();
    await cmdRef.set({
      command,
      ...payload,
      timestamp: Date.now(),
    });
    console.log(`[Retake] Published lawbamp command: ${command}${payload.mode ? ` (${payload.mode})` : ''}`);
  } catch (err) {
    console.error(`[Retake] Failed to publish lawbamp command "${command}":`, err.message);
  }
}

async function sendChat(message, targetUserDbId) {
  const destId = targetUserDbId || credentials?.userDbId;
  if (!destId) return;
  await retakePost('/agent/stream/chat/send', {
    message,
    destination_user_id: destId,
  });
}

function startStreamingLoops() {
  if (chatPollTimer) clearInterval(chatPollTimer);
  if (thumbnailTimer) clearInterval(thumbnailTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  chatPollTimer = setInterval(pollChat, CHAT_POLL_INTERVAL_MS);
  thumbnailTimer = setInterval(updateThumbnail, THUMBNAIL_INTERVAL_MS);
  heartbeatTimer = setInterval(async () => {
    try {
      const s = await retakeGet('/agent/stream/status');
      if (!s.is_live && isStreaming) {
        console.warn('[Retake] Heartbeat: retake says not live — stream may have dropped.');
      }
    } catch {}
  }, HEARTBEAT_INTERVAL_MS);
}

export async function chatInStream(streamerName, message) {
  try {
    const data = await retakeGet(`/users/search/${encodeURIComponent(streamerName)}`, false);
    const users = data.users || data || [];
    const match = Array.isArray(users) ? users[0] : null;
    if (!match?.user_id) {
      console.error(`[Retake] Streamer "${streamerName}" not found.`);
      return;
    }
    await sendChat(message, match.user_id);
    console.log(`[Retake] Sent to ${streamerName}'s chat: ${message}`);
  } catch (err) {
    console.error(`[Retake] chatInStream failed: ${err.message}`);
  }
}

// ─── Thumbnails ──────────────────────────────────────────────

async function updateThumbnail() {
  const screenshot = await captureOBSScreenshot();
  if (!screenshot) return;
  try {
    const result = await retakeUploadThumbnail(screenshot);
    console.log('[Retake] Thumbnail updated:', result.thumbnail_url || 'ok');
  } catch (err) {
    console.error('[Retake] Thumbnail update failed:', err.message);
  }
}

// ─── Stream Lifecycle ────────────────────────────────────────

export async function goLive() {
  if (isStreaming) return { status: { is_live: true }, rtmpUrl: null };
  if (!credentials?.access_token) {
    throw new Error('Not registered on retake.tv — call registerOnRetake() first');
  }

  console.log('[Retake] Going live...');

  // 1. Connect to OBS
  const obsConnected = await connectOBS();
  if (!obsConnected) {
    throw new Error('Cannot go live without OBS. Start OBS and enable WebSocket server.');
  }

  // Ensure stream scenes/browser sources exist before publishing.
  await setupOBSScenes();

  // 2. Get fresh RTMP keys
  console.log('[Retake] Fetching RTMP credentials...');
  const rtmp = await retakePost('/agent/rtmp');
  console.log('[Retake] RTMP URL:', rtmp.url);

  // 3. Configure OBS with RTMP settings
  await configureOBSStream(rtmp.url, rtmp.key);

  // 4. Tell retake we're starting
  console.log('[Retake] Starting stream session...');
  const startResult = await retakePost('/agent/stream/start');
  if (startResult.token?.tokenAddress && !credentials.token_address) {
    credentials.token_address = startResult.token.tokenAddress;
    credentials.token_ticker = startResult.token.ticker;
    saveCredentials(credentials);
    console.log(`[Retake] Token deployed: ${credentials.token_ticker} (${credentials.token_address})`);
  }

  // 5. Start OBS streaming
  await startOBSStream();

  // 6. Confirm live
  await new Promise(r => setTimeout(r, 3000));
  const status = await retakeGet('/agent/stream/status');
  if (!status.is_live) {
    console.warn('[Retake] Warning: retake reports not live yet. May take a moment.');
  } else {
    console.log(`[Retake] LIVE with ${status.viewers} viewers.`);
  }

  // 7. Initial thumbnail
  await new Promise(r => setTimeout(r, 2000));
  await updateThumbnail();

  // 8. Send opening chat message
  await sendChat('the sea remembers. clawb is live.');
  await publishLawbampCommand('play', { source: 'retake', reason: 'stream_start' });

  // 9. Start polling loops
  isStreaming = true;
  startStreamingLoops();

  console.log('[Retake] Stream fully operational. Chat polling active.');
  return { status, rtmpUrl: rtmp.url };
}

export async function goOffline() {
  console.log('[Retake] Going offline...');
  isStreaming = false;

  if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
  if (thumbnailTimer) { clearInterval(thumbnailTimer); thumbnailTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (autostartTimer) { clearInterval(autostartTimer); autostartTimer = null; }

  try { await sendChat('the tide recedes. until next time.'); } catch {}

  try {
    const result = await retakePost('/agent/stream/stop');
    console.log(`[Retake] Stream stopped. Duration: ${result.duration_seconds}s, Viewers: ${result.viewers}`);
  } catch (err) {
    console.error('[Retake] Error stopping retake stream:', err.message);
  }

  try { await stopOBSStream(); } catch {}

  if (obs) {
    obs.disconnect();
    obs = null;
  }

  console.log('[Retake] Offline.');
}

// ─── Startup / Main Entry ────────────────────────────────────

export async function startRetakeStreamer() {
  credentials = loadCredentials();

  if (!credentials) {
    console.log('[Retake] No retake credentials found. Attempting automatic registration...');
    try {
      credentials = await registerOnRetake({
        agent_name: RETAKE_AGENT_NAME,
        agent_description: RETAKE_AGENT_DESCRIPTION,
        image_url: RETAKE_AGENT_IMAGE_URL,
        ticker: RETAKE_AGENT_TICKER,
      });
      console.log('[Retake] Registration complete. Credentials saved.');
    } catch (err) {
      console.error('[Retake] Auto-registration failed:', err.message);
      console.log('[Retake] Module loaded but idle — waiting for successful registration.');
      return () => {};
    }
  }

  console.log(`[Retake] Credentials loaded for "${credentials.agent_name}" (${credentials.userDbId})`);
  console.log('[Retake] Ready to stream.');

  // If process restarted mid-stream, recover chat/thumbnail loops instead of trying to re-go-live.
  try {
    const status = await retakeGet('/agent/stream/status');
    if (status?.is_live) {
      isStreaming = true;
      await connectOBS();
      startStreamingLoops();
      console.log('[Retake] Recovered existing live session. Chat polling active.');
    }
  } catch (err) {
    console.log(`[Retake] Live-session probe skipped: ${err.message}`);
  }

  if (RETAKE_AUTOSTART) {
    const tryAutostart = async () => {
      if (isStreaming || autostartInFlight) return;
      autostartInFlight = true;
      try {
        await goLive();
      } catch (err) {
        // Recover from process restarts while stream is still live.
        if (String(err.message || '').includes('while streaming')) {
          try {
            const status = await retakeGet('/agent/stream/status');
            if (status?.is_live) {
              isStreaming = true;
              await connectOBS();
              startStreamingLoops();
              console.log('[Retake] Stream already live. Recovered chat polling + heartbeat loops.');
              return;
            }
          } catch {}
        }
        console.log(`[Retake] Autostart retry in ${AUTOSTART_RETRY_MS / 1000}s: ${err.message}`);
      } finally {
        autostartInFlight = false;
      }
    };

    // Fire-and-forget so Clawb startup never blocks on streaming.
    setTimeout(() => {
      tryAutostart().catch((err) => {
        console.log(`[Retake] Initial autostart attempt failed: ${err.message}`);
      });
    }, 0);
    autostartTimer = setInterval(tryAutostart, AUTOSTART_RETRY_MS);
  } else {
    console.log('[Retake] Autostart disabled. Call goLive() manually to start.');
  }

  return () => {
    if (autostartTimer) {
      clearInterval(autostartTimer);
      autostartTimer = null;
    }
    if (isStreaming) {
      goOffline().catch(err => console.error('[Retake] Shutdown error:', err.message));
    }
  };
}

// ─── Public API Discovery ────────────────────────────────────

export async function getLiveStreamers() {
  return retakeGet('/users/live/', false);
}

export async function getStreamStatus() {
  if (!credentials) return null;
  return retakeGet('/agent/stream/status');
}

export async function getTokenStats() {
  if (!credentials?.token_address) return null;
  return retakeGet(`/tokens/${credentials.token_address}/stats`, false);
}

export { credentials as getCredentials };
