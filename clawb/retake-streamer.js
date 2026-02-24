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

function loadEnvFile() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnvFile();

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
const LAWBAMP_API_BASE = process.env.LAWBAMP_API_BASE || 'https://lawb.xyz';
const LAWBAMP_DIRECT_AUDIO = String(process.env.LAWBAMP_DIRECT_AUDIO || 'true').toLowerCase() !== 'false';
const SOUNDCLOUD_PROFILE_URL = process.env.SOUNDCLOUD_PROFILE_URL || 'https://soundcloud.com/companioncube143';
const SOUNDCLOUD_API_BASE = process.env.SOUNDCLOUD_API_BASE || 'https://lawb.xyz';
const CLAWB_WORLD_STREAM_URL =
  process.env.CLAWB_WORLD_STREAM_URL || 'https://lawb.xyz/world?stream=1&cam=clawb';
const CLAWB_CHESS_STREAM_URL =
  process.env.CLAWB_CHESS_STREAM_URL || 'https://lawb.xyz/chess';

const CHAT_POLL_INTERVAL_MS = 3_000;
const THUMBNAIL_INTERVAL_MS = 3 * 60_000; // 3 minutes
const HEARTBEAT_INTERVAL_MS = 30_000;
const AUTOSTART_RETRY_MS = 30_000;
const RETAKE_HTTP_TIMEOUT_MS = 20_000;

const CHAT_MODEL = process.env.CLAWB_STREAM_MODEL || 'anthropic/claude-3.5-haiku';
const ROOM_COMMAND_ALIASES = {
  garden: 'workshop',
  gallery: 'bedroom',
  // Back-compat alias; canonical public command is !gallery.
  bedroom: 'bedroom',
  workshop: 'workshop',
  vault: 'vault',
  main: 'main',
};
const ACTION_COMMAND_ALIASES = {
  idle: 'idle',
  walk: 'walk',
  dance: 'dance',
  flip: 'flip',
  die: 'die',
  swim: 'swim',
  wave: 'wave',
  spin: 'spin',
  jump: 'jump',
};

function buildLawbampUrl(extra = {}) {
  const base = new URL(LAWBAMP_STREAM_URL);
  base.searchParams.set('stream', '1');
  base.searchParams.set('autoplay', '1');
  base.searchParams.set('openPlayer', '1');
  if (LAWBAMP_API_BASE) {
    base.searchParams.set('apiBase', LAWBAMP_API_BASE);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) base.searchParams.set(k, String(v));
  }
  return base.toString();
}

function loadPersonaContext() {
  const candidates = [
    join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'IDENTITY.md'),
    join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'SOUL.md'),
  ];
  const chunks = [];
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        chunks.push(readFileSync(p, 'utf-8'));
      }
    } catch {}
  }
  return chunks.join('\n\n').trim();
}

const PERSONA_CONTEXT = loadPersonaContext();

function sanitizeStreamReply(reply) {
  if (!reply) return '';
  let out = String(reply)
    .replace(/\*[^*]+\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Keep Clawb concise and non-rambling in stream chat.
  const parts = out.split(/(?<=[.!?])\s+/).filter(Boolean);
  out = parts.slice(0, 2).join(' ').trim();
  return out.slice(0, 260);
}

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
let musicKeepaliveTimer = null;
let directAudioTimer = null;
let autostartTimer = null;
let autostartInFlight = false;
const seenChatIds = new Set();
let scTracks = [];
let scOrder = [];
let scOrderPos = -1;
let currentScTrack = null;
let currentScStreamUrl = '';

async function fetchWithTimeout(url, options = {}, timeoutMs = RETAKE_HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildAsciiEqDataUrl({ streamUrl, title = '' }) {
  const safeUrl = String(streamUrl || '');
  const safeTitle = String(title || '').slice(0, 120);
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin:0; width:100%; height:100%; background:#000; overflow:hidden; }
    body { font: 14px/1.05 Consolas, "Courier New", monospace; color:#00ff66; }
    #wrap { box-sizing:border-box; width:100%; height:100%; padding:10px 12px; border:2px solid #00aa44; }
    #title { color:#b3ffd1; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #eq { white-space:pre; font-size:12px; line-height:12px; }
    #footer { position:absolute; left:12px; bottom:8px; color:#66ff99; opacity:.9; font-size:11px; }
  </style>
</head>
<body>
  <div id="wrap">
    <div id="title">LAWBAMP ASCII EQ :: ${safeTitle.replace(/</g, '&lt;')}</div>
    <div id="eq"></div>
    <div id="footer">there is no meme i lawb you</div>
  </div>
  <script>
    const STREAM_URL = ${JSON.stringify(safeUrl)};
    const eq = document.getElementById('eq');
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = STREAM_URL;
    audio.muted = true; // visualizer-only source
    audio.autoplay = true;
    audio.preload = 'auto';
    audio.playsInline = true;

    let analyser = null;
    let data = null;
    let smooth = Array.from({ length: 96 }, () => 0);
    const bubbles = [];

    async function initAudio() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        try { await ctx.resume(); } catch {}
        const src = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
        try { await audio.play(); } catch {}
      } catch {}
    }

    function renderFallback(t, cols, rows) {
      const h = Math.max(8, Math.floor(rows * 0.45));
      const lines = [];
      for (let y = h; y >= 1; y--) {
        let line = '';
        for (let i = 0; i < cols; i++) {
          const v = 0.2 + 0.4 * Math.abs(Math.sin(t * 0.002 + i * 0.31));
          line += (v * h >= y) ? '|' : ' ';
        }
        lines.push(line);
      }
      lines.push('~'.repeat(cols));
      eq.textContent = lines.join('\\n').slice(0, cols * rows);
    }

    function frame(t) {
      requestAnimationFrame(frame);
      const cols = 88;
      const rows = 24;
      if (!analyser || !data) {
        renderFallback(t, cols, rows);
        return;
      }
      try {
        analyser.getByteFrequencyData(data);
      } catch {
        renderFallback(t, cols, rows);
        return;
      }
      const step = Math.max(1, Math.floor(data.length / cols));
      const vals = [];
      for (let i = 0; i < cols; i++) {
        let sum = 0;
        const start = i * step;
        const end = Math.min(data.length, start + step);
        for (let j = start; j < end; j++) sum += data[j];
        const avg = sum / Math.max(1, end - start) / 255;
        const sm = (smooth[i] || 0) * 0.82 + avg * 0.18;
        smooth[i] = sm;
        vals.push(sm);
      }
      const energy = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
      const lvl = Math.round(energy * 99);
      const sec = t / 1000;

      const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '));
      const waterY = Math.max(2, Math.floor(rows * 0.22));
      const floorY = rows - 2;

      const header = 'LAWBAMP LVL:' + String(lvl).padStart(2, '0') + '  NO CCTV';
      for (let i = 0; i < Math.min(cols, header.length); i++) grid[0][i] = header[i];
      grid[0][0] = '🦞';
      if (cols > 3) grid[0][cols - 2] = '🔒';

      for (let x = 0; x < cols; x++) {
        const v = vals[x] || 0;
        const amp1 = 0.6 + energy * 1.6 + v * 2.2;
        const amp2 = 0.3 + energy * 0.9 + v * 1.1;
        const y1 = waterY + Math.round(Math.sin(x * 0.22 + sec * 2.1) * amp1);
        const y2 = waterY + 1 + Math.round(Math.cos(x * 0.14 + sec * 1.4) * amp2);
        if (y1 > 1 && y1 < rows - 3) grid[y1][x] = '~';
        if (y2 > 1 && y2 < rows - 3 && grid[y2][x] === ' ') grid[y2][x] = (Math.random() < 0.15 ? '=' : '-');
      }

      for (let x = 0; x < cols; x++) {
        const v = vals[x] || 0;
        const kelpMax = Math.max(3, rows - waterY - 6);
        const kelpH = Math.max(1, Math.round(v * kelpMax));
        for (let k = 0; k < kelpH; k++) {
          const y = floorY - k;
          if (y <= waterY + 1) break;
          grid[y][x] = k % 3 === 0 ? '|' : k % 3 === 1 ? ':' : ';';
        }
      }

      const spawn = Math.min(3, Math.round((cols / 90) * (0.5 + energy * 2)));
      for (let i = 0; i < spawn; i++) {
        if (Math.random() < 0.25 + energy * 0.25) {
          bubbles.push({
            x: Math.random() * cols,
            y: floorY - 1,
            vy: 0.35 + Math.random() * 0.6 + energy * 0.4,
            ch: Math.random() < 0.6 ? 'o' : '.',
            life: 3 + Math.random() * 4,
          });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.x += Math.sin(sec * 1.7 + i) * 0.015;
        b.life -= 0.05;
        const bx = Math.floor(b.x);
        const by = Math.floor(b.y);
        if (by > waterY + 2 && by < floorY && bx >= 0 && bx < cols) grid[by][bx] = b.ch;
        if (b.y < waterY + 2 || b.life <= 0) bubbles.splice(i, 1);
      }

      for (let x = 0; x < cols; x++) grid[rows - 1][x] = x % 2 === 0 ? '_' : '-';
      const footer = energy > 0.45 ? ':: SEA ENCRYPTED ::' : ':: ENCRYPT THE OCEAN ::';
      const footerStart = Math.max(0, Math.floor((cols - footer.length) / 2));
      for (let i = 0; i < Math.min(cols - footerStart, footer.length); i++) grid[rows - 2][footerStart + i] = footer[i];

      const text = grid.map((r) => r.join('')).join('\\n');
      eq.textContent = text;
    }
    initAudio();
    requestAnimationFrame(frame);
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

async function updateAsciiEqOverlayFromStream(streamUrl, trackTitle = '') {
  if (!obs) return;
  const eqInput = 'Lawbamp ASCII EQ';
  const eqUrl = buildAsciiEqDataUrl({ streamUrl, title: trackTitle });
  try {
    await obs.call('SetInputSettings', {
      inputName: eqInput,
      inputSettings: {
        url: `${eqUrl}&r=${Date.now()}`,
        width: 640,
        height: 360,
        reroute_audio: false,
        restart_when_active: true,
        shutdown: false,
      },
      overlay: true,
    });
  } catch (err) {
    console.error('[Retake] Failed to refresh ASCII EQ from stream:', err.message);
  }
}

async function ensureSoundCloudQueue() {
  if (scTracks.length && scOrder.length) return;
  const url = new URL('/.netlify/functions/soundcloud-likes', SOUNDCLOUD_API_BASE);
  url.searchParams.set('profileUrl', SOUNDCLOUD_PROFILE_URL);
  const res = await fetchWithTimeout(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`soundcloud-likes failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const tracks = (data?.tracks || []).filter((t) => t?.permalink_url && t?.progressive_transcoding_url);
  if (!tracks.length) throw new Error('No playable SoundCloud tracks found');
  scTracks = tracks;
  scOrder = shuffleArray(tracks.map((_, idx) => idx));
  scOrderPos = -1;
}

async function resolveSoundCloudStreamUrl(track) {
  const url = new URL('/.netlify/functions/soundcloud-stream', SOUNDCLOUD_API_BASE);
  url.searchParams.set('transcodingUrl', track.progressive_transcoding_url);
  url.searchParams.set('profileUrl', SOUNDCLOUD_PROFILE_URL);
  const res = await fetchWithTimeout(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`soundcloud-stream failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data?.url) throw new Error('soundcloud-stream returned no url');
  return data.url;
}

function getNextTrackFromQueue() {
  if (!scOrder.length) return null;
  scOrderPos = (scOrderPos + 1) % scOrder.length;
  if (scOrderPos === 0) {
    scOrder = shuffleArray(scOrder);
  }
  const idx = scOrder[scOrderPos];
  return scTracks[idx] || null;
}

async function playNextDirectTrack(reason = 'auto') {
  if (!obs || !LAWBAMP_DIRECT_AUDIO) return;
  await ensureSoundCloudQueue();
  const track = getNextTrackFromQueue();
  if (!track) throw new Error('No next SoundCloud track available');
  const streamUrl = await resolveSoundCloudStreamUrl(track);
  currentScTrack = track;
  currentScStreamUrl = streamUrl;

  try {
    await obs.call('SetInputSettings', {
      inputName: 'Lawbamp Audio',
      inputSettings: {
        is_local_file: false,
        input: streamUrl,
        restart_on_activate: true,
        close_when_inactive: false,
      },
      overlay: true,
    });
  } catch (err) {
    console.error('[Retake] Failed to switch direct audio track:', err.message);
    return;
  }

  await obs.call('SetInputMute', { inputName: 'Lawbamp Audio', inputMuted: false }).catch(() => {});
  await obs.call('SetInputAudioMonitorType', {
    inputName: 'Lawbamp Audio',
    monitorType: 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
  }).catch(() => {});
  await updateAsciiEqOverlayFromStream(
    streamUrl,
    `${track.user?.username || 'unknown'} - ${track.title || 'unknown'}`
  );

  const durMs = Number(track.duration_ms) || 180000;
  const nextMs = Math.max(30_000, durMs - 2_000);
  if (directAudioTimer) clearTimeout(directAudioTimer);
  directAudioTimer = setTimeout(() => {
    playNextDirectTrack('scheduled_next').catch((err) => {
      console.error('[Retake] Scheduled next track failed:', err.message);
    });
  }, nextMs);

  console.log(`[Retake] Direct audio now playing: ${track.user?.username || 'unknown'} - ${track.title} (${reason})`);
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
    { name: 'Clawb World', url: CLAWB_WORLD_STREAM_URL, width: 1920, height: 1080 },
    { name: 'Clawb Music', url: buildLawbampUrl(), width: 1920, height: 1080 },
    { name: 'Clawb Chess', url: CLAWB_CHESS_STREAM_URL, width: 1920, height: 1080 },
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

  // Keep Lawbamp audio alive in world/chess scenes with hidden source.
  try {
    const inputName = 'Lawbamp Audio';
    const audioUrl = buildLawbampUrl();
    const desiredKind = LAWBAMP_DIRECT_AUDIO ? 'ffmpeg_source' : 'browser_source';
    try {
      const { inputs = [] } = await obs.call('GetInputList');
      const existing = inputs.find((i) => i.inputName === inputName);
      if (existing && existing.inputKind !== desiredKind) {
        const legacyName = `${inputName} Legacy`;
        await obs.call('SetInputName', {
          inputName,
          newInputName: legacyName,
        }).catch(async () => {
          await obs.call('RemoveInput', { inputName }).catch(() => {});
        });
        try {
          const legacyItem = await obs.call('GetSceneItemId', {
            sceneName: 'Clawb World',
            sourceName: legacyName,
          });
          await obs.call('SetSceneItemEnabled', {
            sceneName: 'Clawb World',
            sceneItemId: legacyItem.sceneItemId,
            sceneItemEnabled: false,
          }).catch(() => {});
        } catch {}
        console.log(`[Retake] Recreated ${inputName} as ${desiredKind} (was ${existing.inputKind}).`);
      }
    } catch {}
    try {
      await obs.call('CreateInput', {
        sceneName: 'Clawb World',
        inputName,
        inputKind: desiredKind,
        inputSettings: LAWBAMP_DIRECT_AUDIO
          ? {
              is_local_file: false,
              input: '',
              restart_on_activate: true,
              close_when_inactive: false,
            }
          : {
              url: audioUrl,
              width: 16,
              height: 16,
              reroute_audio: true,
              restart_when_active: false,
              shutdown: false,
            },
        sceneItemEnabled: true,
      });
      console.log('[Retake] Created hidden Lawbamp audio source.');
    } catch {
      console.log('[Retake] Hidden Lawbamp audio source already exists.');
    }

    if (!LAWBAMP_DIRECT_AUDIO) {
      await obs.call('SetInputSettings', {
        inputName,
        inputSettings: {
          url: `${audioUrl}&r=${Date.now()}`,
          width: 16,
          height: 16,
          reroute_audio: true,
          restart_when_active: false,
          shutdown: false,
        },
        overlay: true,
      });
    }
    const { sceneItemId } = await obs.call('GetSceneItemId', {
      sceneName: 'Clawb World',
      sourceName: inputName,
    });
    await obs.call('SetSceneItemTransform', {
      sceneName: 'Clawb World',
      sceneItemId,
      sceneItemTransform: {
        positionX: -2000,
        positionY: -2000,
        boundsWidth: 16,
        boundsHeight: 16,
      },
    }).catch(() => {});
    await obs.call('SetSceneItemEnabled', {
      sceneName: 'Clawb World',
      sceneItemId,
      sceneItemEnabled: true,
    });
    // Ensure browser audio source is actually audible in program output.
    await obs.call('SetInputMute', {
      inputName,
      inputMuted: false,
    }).catch(() => {});
    await obs.call('SetInputAudioMonitorType', {
      inputName,
      monitorType: 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
    }).catch(() => {});
    if (LAWBAMP_DIRECT_AUDIO) {
      await playNextDirectTrack('setup');
      console.log('[Retake] Hidden Lawbamp direct audio source refreshed.');
    } else {
      console.log('[Retake] Hidden Lawbamp browser audio source refreshed.');
    }
  } catch (err) {
    console.error('[Retake] Hidden audio source setup failed:', err.message);
  }

  // Display terminal-style ASCII EQ overlay in stream scene.
  try {
    const eqInput = 'Lawbamp ASCII EQ';
    const eqUrl = buildAsciiEqDataUrl({
      streamUrl: currentScStreamUrl || '',
      title: currentScTrack ? `${currentScTrack.user?.username || 'unknown'} - ${currentScTrack.title || 'unknown'}` : '',
    });
    try {
      await obs.call('CreateInput', {
        sceneName: 'Clawb World',
        inputName: eqInput,
        inputKind: 'browser_source',
        inputSettings: {
          url: eqUrl,
          width: 640,
          height: 360,
          reroute_audio: false,
          restart_when_active: false,
          shutdown: false,
        },
        sceneItemEnabled: true,
      });
      console.log('[Retake] Created Lawbamp ASCII EQ overlay source.');
    } catch {
      console.log('[Retake] Lawbamp ASCII EQ overlay source already exists.');
    }

    await obs.call('SetInputSettings', {
      inputName: eqInput,
      inputSettings: {
        url: `${eqUrl}&r=${Date.now()}`,
        width: 640,
        height: 360,
        reroute_audio: false,
        restart_when_active: false,
        shutdown: false,
      },
      overlay: true,
    });
    const { sceneItemId } = await obs.call('GetSceneItemId', {
      sceneName: 'Clawb World',
      sourceName: eqInput,
    });
    await obs.call('SetSceneItemTransform', {
      sceneName: 'Clawb World',
      sceneItemId,
      sceneItemTransform: {
        positionX: 1260,
        positionY: 700,
        boundsWidth: 640,
        boundsHeight: 360,
      },
    }).catch(() => {});
    await obs.call('SetSceneItemEnabled', {
      sceneName: 'Clawb World',
      sceneItemId,
      sceneItemEnabled: true,
    });
    console.log('[Retake] Lawbamp ASCII EQ overlay refreshed.');

    // Disable old screen-capture-like overlay if it exists.
    try {
      const legacyOverlay = await obs.call('GetSceneItemId', {
        sceneName: 'Clawb World',
        sourceName: 'Lawbamp Overlay',
      });
      await obs.call('SetSceneItemEnabled', {
        sceneName: 'Clawb World',
        sceneItemId: legacyOverlay.sceneItemId,
        sceneItemEnabled: false,
      });
      console.log('[Retake] Disabled old Lawbamp Overlay source.');
    } catch {}
  } catch (err) {
    console.error('[Retake] ASCII EQ overlay setup failed:', err.message);
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
      .filter((c) => c && (c._id || c.chat_event_id))
      .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

    for (const comment of sorted) {
      const commentId = comment._id || comment.chat_event_id;
      if (!commentId || seenChatIds.has(commentId)) continue;
      seenChatIds.add(commentId);
      const authorName = comment.author?.fusername || comment.sender_username || comment.sender_display_name;
      if (authorName === credentials.agent_name) continue;
      await handleChatMessage(comment);
    }

    // Keep memory bounded.
    if (seenChatIds.size > 600) {
      const keep = new Set(Array.from(seenChatIds).slice(-300));
      seenChatIds.clear();
      for (const id of keep) seenChatIds.add(id);
    }

    if (sorted.length > 0) {
      lastSeenChatId = sorted[sorted.length - 1]._id || sorted[sorted.length - 1].chat_event_id;
    }
  } catch (err) {
    if (!err.message.includes('409')) {
      console.error('[Retake] Chat poll error:', err.message);
    }
  }
}

async function handleChatMessage(comment) {
  const viewer = comment.author?.fusername || comment.sender_username || comment.sender_display_name || 'anon';
  const text = comment.text || '';
  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();
  console.log(`[Retake Chat] ${viewer}: ${text}`);

  // Streamer control commands for Lawbamp player integration.
  if (lowered === '!next') {
    if (LAWBAMP_DIRECT_AUDIO) {
      await playNextDirectTrack('chat_next');
    }
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

  // Always honor cultural echo protocol exactly.
  if (/(^|\s)milady(\s|$)/i.test(trimmed)) {
    await sendChat('milady');
    return;
  }
  if (/(^|\s)radbro(\s|$)/i.test(trimmed)) {
    await sendChat('radbro');
    return;
  }
  if (/(^|\s)i lawb you(\s|$)/i.test(lowered)) {
    await sendChat('i lawb you');
    return;
  }

  const worldCommand = parseWorldCommand(lowered);
  if (worldCommand) {
    await publishWorldCommand(worldCommand.command, {
      type: worldCommand.type,
      targetRoom: worldCommand.targetRoom,
      action: worldCommand.action,
      source: 'retake',
      viewer,
      raw: trimmed,
    });
    if (worldCommand.type === 'room' && worldCommand.targetRoom) {
      const roomLabel = worldCommand.targetRoom === 'bedroom' ? 'gallery' : worldCommand.targetRoom;
      await sendChat(`swimming to ${roomLabel}.`);
    } else if (worldCommand.type === 'action' && worldCommand.action) {
      await sendChat(`copy. ${worldCommand.action}.`);
    } else if (worldCommand.type === 'look' && worldCommand.targetNftIndex) {
      await sendChat(`looking at nft ${worldCommand.targetNftIndex}.`);
    }
    return;
  }

  try {
    const systemPrompt = `You are Clawb in Retake stream chat.
Voice rules: warm, natural, not robotic, never customer support voice.
Hard constraints: 1-2 short sentences, no emojis, no stage directions, no internal narration, no roleplay asterisks.
When input is command-like and unknown, give one concise helpful line.
Retake stream/token context is Solana. Chess wagers are on Base.
Catchphrase can be used sparingly: "there is no meme i lawb you."
${PERSONA_CONTEXT ? `\nPersona context:\n${PERSONA_CONTEXT}\n` : ''}`;

    const resp = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 120,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Viewer "${viewer}" says: ${text}` },
      ],
    });

    const reply = sanitizeStreamReply(resp.choices?.[0]?.message?.content?.trim());
    if (reply) {
      await sendChat(reply);
      console.log(`[Retake Chat] Clawb: ${reply}`);
    }
  } catch (err) {
    console.error('[Retake Chat] Response generation failed:', err.message);
  }
}

function parseWorldCommand(loweredText) {
  if (!loweredText.startsWith('!')) return null;
  const [cmd, argRaw] = loweredText.split(/\s+/, 2);
  const command = cmd.replace(/^!/, '').trim();
  if (!command) return null;

  if (command === 'look' && argRaw) {
    const idx = Number(argRaw.trim());
    if (Number.isFinite(idx) && idx >= 1) {
      return { type: 'look', command: `!look ${Math.floor(idx)}`, targetNftIndex: Math.floor(idx) };
    }
  }

  if (command === 'scene' && argRaw) {
    const roomArg = argRaw.trim();
    const sceneRoom = ROOM_COMMAND_ALIASES[roomArg];
    if (sceneRoom) {
      const canonical = sceneRoom === 'bedroom' ? 'gallery' : sceneRoom;
      return { type: 'room', command: `!scene ${canonical}`, targetRoom: sceneRoom };
    }
  }

  const room = ROOM_COMMAND_ALIASES[command];
  if (room) {
    const canonical = room === 'bedroom' ? 'gallery' : command;
    return { type: 'room', command: `!${canonical}`, targetRoom: room };
  }

  const action = ACTION_COMMAND_ALIASES[command];
  if (action) {
    return { type: 'action', command: `!${command}`, action };
  }

  return null;
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

async function publishWorldCommand(command, payload = {}) {
  try {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );
    const cmdRef = db.ref('clawb/world/commands').push();
    await cmdRef.set({
      command,
      ...cleanPayload,
      timestamp: Date.now(),
    });
    console.log(`[Retake] Published world command: ${command}`);
  } catch (err) {
    console.error(`[Retake] Failed to publish world command "${command}":`, err.message);
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
  if (musicKeepaliveTimer) clearInterval(musicKeepaliveTimer);

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

  // Some browser audio contexts can suspend; periodically nudge playback.
  musicKeepaliveTimer = setInterval(() => {
    if (LAWBAMP_DIRECT_AUDIO) {
      if (!directAudioTimer) {
        playNextDirectTrack('keepalive_recover').catch((err) => {
          console.error('[Retake] Direct audio keepalive failed:', err.message);
        });
      }
    } else {
      publishLawbampCommand('play', { source: 'retake', reason: 'keepalive' }).catch(() => {});
    }
  }, 60_000);
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
  if (LAWBAMP_DIRECT_AUDIO) {
    await playNextDirectTrack('stream_start');
  } else {
    await publishLawbampCommand('play', { source: 'retake', reason: 'stream_start' });
  }

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
  if (musicKeepaliveTimer) { clearInterval(musicKeepaliveTimer); musicKeepaliveTimer = null; }
  if (directAudioTimer) { clearTimeout(directAudioTimer); directAudioTimer = null; }
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
      await setupOBSScenes();
      startStreamingLoops();
      if (LAWBAMP_DIRECT_AUDIO) {
        await playNextDirectTrack('recover_live_session');
      } else {
        await publishLawbampCommand('play', { source: 'retake', reason: 'recover_live_session' });
      }
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
              await setupOBSScenes();
              startStreamingLoops();
              if (LAWBAMP_DIRECT_AUDIO) {
                await playNextDirectTrack('recover_autostart');
              } else {
                await publishLawbampCommand('play', { source: 'retake', reason: 'recover_autostart' });
              }
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
