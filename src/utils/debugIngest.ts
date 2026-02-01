/**
 * Debug telemetry - only runs in dev on localhost.
 * Prevents CORS/Private Network Access errors in production (e.g. lawb.xyz).
 */
const DEBUG_INGEST_URL = 'http://127.0.0.1:7243/ingest/e2a7d14a-30cd-4ed1-a169-f9e947c14591';

export function debugIngest(data: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return;
  fetch(DEBUG_INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}
