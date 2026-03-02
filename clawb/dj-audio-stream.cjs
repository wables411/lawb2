// Local HTTP audio stream server for DJ line input (AG06/AG03)
// Captures Line (2- AG06/AG03) via DirectShow and serves as MP3 stream
// on http://127.0.0.1:18182/stream for the EQ overlay to consume.
const { createServer } = require('http');
const { spawn } = require('child_process');

const PORT = Number(process.env.DJ_STREAM_PORT || 18182);
const DEVICE = process.env.DJ_AUDIO_DEVICE || 'Line (2- AG06/AG03)';
const FFMPEG = process.env.FFMPEG_PATH
  || 'C:\\Users\\wable\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
const BITRATE = process.env.DJ_STREAM_BITRATE || '128k';
const SAMPLE_RATE = Number(process.env.DJ_STREAM_SAMPLE_RATE || 44100);

let ffmpegProc = null;
const clients = new Set();

function spawnFfmpeg() {
  const args = [
    '-f', 'dshow',
    '-i', `audio=${DEVICE}`,
    '-vn',
    '-ar', String(SAMPLE_RATE),
    '-ac', '2',
    '-f', 'mp3',
    '-b:a', BITRATE,
    '-reservoir', '0',
    '-id3v2_version', '0',
    'pipe:1',
  ];

  console.log(`[dj-stream] starting ffmpeg: ${FFMPEG} ${args.join(' ')}`);
  const proc = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stderr.on('data', (data) => {
    const line = data.toString().trim();
    if (line && !line.startsWith('size=') && !line.startsWith('frame=')) {
      console.log(`[dj-stream/ffmpeg] ${line}`);
    }
  });

  // Always consume stdout so Node never buffers it — discard when no clients.
  proc.stdout.on('data', (chunk) => {
    if (clients.size === 0) return;
    for (const res of clients) {
      try { res.write(chunk); } catch { clients.delete(res); }
    }
  });
  // Prevent Node's internal stream buffer from filling when no one is reading.
  proc.stdout.resume();

  proc.on('close', (code) => {
    console.log(`[dj-stream] ffmpeg exited (${code}). restarting in 3s...`);
    ffmpegProc = null;
    setTimeout(() => { ffmpegProc = spawnFfmpeg(); }, 3000);
  });

  return proc;
}

const server = createServer((req, res) => {
  if (req.url !== '/stream') {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Transfer-Encoding': 'chunked',
  });

  clients.add(res);
  console.log(`[dj-stream] client connected (total: ${clients.size})`);

  req.on('close', () => {
    clients.delete(res);
    console.log(`[dj-stream] client disconnected (total: ${clients.size})`);
  });
});

function startServer(attempt = 0) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[dj-stream] listening on http://127.0.0.1:${PORT}/stream`);
    console.log(`[dj-stream] capturing device: ${DEVICE}`);
    ffmpegProc = spawnFfmpeg();
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[dj-stream] port ${PORT} in use, retrying in 2s...`);
    setTimeout(() => startServer(), 2000);
  } else {
    console.error(`[dj-stream] server error: ${err.message}`);
    process.exit(1);
  }
});

function shutdown() {
  console.log('[dj-stream] shutting down...');
  if (ffmpegProc) { try { ffmpegProc.kill('SIGKILL'); } catch {} }
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
