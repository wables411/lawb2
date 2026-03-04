/**
 * world-ws-bridge.js — Local WebSocket bridge for world actions
 *
 * Broadcasts world actions to local clients (OBS browser) so they don't need
 * to subscribe to Firebase. Reduces Firebase reads when streaming.
 */

import { WebSocketServer } from 'ws';

const WORLD_WS_PORT = Number(process.env.CLAWB_WORLD_WS_PORT || 18183);

let wss = null;
const clients = new Set();

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === 1) {
      try {
        ws.send(msg);
      } catch (err) {
        console.warn('[World WS] send failed:', err.message);
      }
    }
  }
}

/** Local command queue for Firebase-free mode. world-responder subscribes. */
const localCommandListeners = new Set();

/**
 * Inject a world command locally (no Firebase). Used when CLAWB_LOCAL_STREAM=1.
 * Payload: { type, action?, targetRoom?, targetNftIndex?, source, viewer, command?, ... }
 */
export function injectWorldCommand(payload) {
  const cmd = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...payload,
    timestamp: payload.timestamp || Date.now(),
  };
  for (const fn of localCommandListeners) {
    try {
      fn(cmd);
    } catch (err) {
      console.warn('[World WS] local command listener error:', err.message);
    }
  }
}

/**
 * Subscribe to locally injected commands. Returns unsubscribe fn.
 */
export function onLocalCommand(callback) {
  localCommandListeners.add(callback);
  return () => localCommandListeners.delete(callback);
}

/**
 * Broadcast a world action to all connected clients.
 * Call this from world-responder after publishing to Firebase (or locally).
 */
export function broadcastWorldAction(payload) {
  if (clients.size === 0) return;
  const envelope = {
    type: 'action',
    id: payload.id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...payload,
    timestamp: payload.timestamp || Date.now(),
  };
  broadcast(envelope);
}

export function startWorldWsBridge() {
  if (wss) return () => {};

  try {
    wss = new WebSocketServer({ port: WORLD_WS_PORT, host: '127.0.0.1' });
  } catch (err) {
    console.warn('[World WS] Server start failed:', err.message);
    return () => {};
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[World WS] client connected (${clients.size} total)`);
    ws.on('close', () => {
      clients.delete(ws);
    });
    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  wss.on('error', (err) => {
    console.warn('[World WS] server error:', err.message);
  });

  console.log(`[World WS] listening on ws://127.0.0.1:${WORLD_WS_PORT} (Firebase bypass for local clients)`);

  return () => {
    for (const ws of clients) {
      try { ws.close(); } catch {}
    }
    clients.clear();
    if (wss) {
      wss.close();
      wss = null;
    }
    console.log('[World WS] stopped');
  };
}
