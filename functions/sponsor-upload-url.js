const {
  ALLOWED_VIDEO_MIME,
  MAX_FILE_BYTES,
  getBucket,
  getClientIp,
  getSession,
  isRateLimited,
  json,
  normalizeSponsorName,
  normalizeWebsiteUrl,
  parseBody,
  sanitizeFilename,
  saveSession,
  upsertPlaybackAdMetadata,
} = require('./sponsor-shared');

let corsConfigured = false;

async function ensureBucketCors(bucket) {
  if (corsConfigured) return;
  const origin = process.env.SPONSOR_UPLOAD_ORIGIN || 'https://lawb.xyz';
  const maxAgeSeconds = Number(process.env.SPONSOR_UPLOAD_CORS_MAX_AGE || 3600);
  const corsEntry = {
    origin: [origin],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'OPTIONS'],
    responseHeader: ['Content-Type', 'x-goog-resumable'],
    maxAgeSeconds,
  };

  try {
    const [metadata] = await bucket.getMetadata();
    const existing = Array.isArray(metadata.cors) ? metadata.cors : [];
    const hasMatch = existing.some((entry) => Array.isArray(entry.origin) && entry.origin.includes(origin));
    if (!hasMatch) {
      await bucket.setMetadata({ cors: [...existing, corsEntry] });
    }
    corsConfigured = true;
  } catch (error) {
    console.warn('[sponsor-upload-url] failed to ensure bucket CORS', error);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const ip = getClientIp(event);
    if (isRateLimited(ip)) {
      return json(429, { error: 'Too many upload attempts. Please retry shortly.' });
    }

    const body = parseBody(event);
    const sessionId = String(body.sessionId || '');
    const session = await getSession(sessionId);
    if (!session) return json(404, { error: 'Session not found.' });
    if (!['PAID', 'UPLOADED', 'VERIFIED'].includes(String(session.status || ''))) {
      return json(400, { error: `Upload is not allowed in status ${session.status}.` });
    }

    const sponsorName = normalizeSponsorName(body.sponsorName || session.sponsor_name || '');
    if (!sponsorName) return json(400, { error: 'Sponsor name is required.' });
    const websiteUrl = normalizeWebsiteUrl(body.websiteUrl || session.website_url || '');

    const filename = sanitizeFilename(body.filename || '');
    const mime = String(body.mime || '').toLowerCase();
    const bytes = Number(body.bytes || 0);
    if (!filename) return json(400, { error: 'filename is required.' });
    if (!ALLOWED_VIDEO_MIME.has(mime)) return json(400, { error: 'Unsupported video format. Use mp4, webm, or mov.' });
    if (!Number.isFinite(bytes) || bytes <= 0) return json(400, { error: 'bytes must be a positive number.' });
    if (bytes > MAX_FILE_BYTES) return json(413, { error: `File exceeds hard 99MB cap (${MAX_FILE_BYTES} bytes).`, code: 'TOO_LARGE' });

    const storagePath = `sponsor-ads/${sessionId}/${Date.now()}-${filename}`;
    const bucket = getBucket();
    await ensureBucketCors(bucket);
    const file = bucket.file(storagePath);
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: mime,
    });

    await saveSession(sessionId, {
      sponsor_name: sponsorName,
      website_url: websiteUrl,
      pending_upload: {
        filename,
        mime,
        bytes,
        storage_path: storagePath,
        created_at: new Date().toISOString(),
      },
    });
    await upsertPlaybackAdMetadata(sessionId, sponsorName, websiteUrl);

    return json(200, {
      ok: true,
      uploadUrl,
      storagePath,
      expiresInSec: 900,
      maxBytes: MAX_FILE_BYTES,
    });
  } catch (error) {
    console.error('[sponsor-upload-url] error', error);
    return json(500, { error: error?.message || 'Failed to initialize upload.', code: 'UPLOAD_INIT_FAILED' });
  }
};
