const Busboy = require('busboy');
const {
  adsPath,
  ALLOWED_VIDEO_MIME,
  MAX_FILE_BYTES,
  enqueueNotification,
  getBucket,
  getClientIp,
  getDb,
  getSession,
  isRateLimited,
  isRotationWinner,
  json,
  normalizeSponsorName,
  normalizeWebsiteUrl,
  pushStatusTransition,
  queueApprovedAd,
  sanitizeFilename,
  saveSession,
  upsertPlaybackAdMetadata,
} = require('./sponsor-shared');

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const contentType = event.headers?.['content-type'] || event.headers?.['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      reject(new Error('Expected multipart/form-data'));
      return;
    }

    const busboy = Busboy({ headers: { 'content-type': contentType } });
    const fields = {};
    const files = [];
    let tooLarge = false;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, file, info) => {
      const chunks = [];
      let bytes = 0;
      const filename = sanitizeFilename(info.filename || 'ad-upload.bin');
      const mimeType = String(info.mimeType || '').toLowerCase();
      file.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_FILE_BYTES) {
          tooLarge = true;
          file.resume();
          return;
        }
        chunks.push(chunk);
      });
      file.on('end', () => {
        files.push({
          fieldName: name,
          filename,
          mimeType,
          bytes,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on('error', reject);
    busboy.on('finish', () => {
      if (tooLarge) {
        reject(new Error('TOO_LARGE'));
        return;
      }
      resolve({ fields, files });
    });

    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '', 'binary');
    busboy.end(raw);
  });
}

function isFileTooLarge(bytes) {
  return Number(bytes) > MAX_FILE_BYTES;
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

    const parsed = await parseMultipart(event);
    const sessionId = String(parsed.fields.sessionId || '');
    const session = await getSession(sessionId);
    if (!session) {
      return json(404, { error: 'Session not found.' });
    }
    if (session.status !== 'PAID') {
      return json(400, { error: `Upload is not allowed in status ${session.status}.` });
    }

    if (!parsed.files.length) {
      return json(400, { error: 'Video file is required.' });
    }
    const sponsorName = normalizeSponsorName(parsed.fields.sponsorName || session.sponsor_name || '');
    if (!sponsorName) {
      return json(400, { error: 'Sponsor name is required.' });
    }
    const websiteUrl = normalizeWebsiteUrl(parsed.fields.websiteUrl || session.website_url || '');
    await saveSession(sessionId, {
      sponsor_name: sponsorName,
      website_url: websiteUrl,
    });
    await upsertPlaybackAdMetadata(sessionId, sponsorName, websiteUrl);

    const file = parsed.files[0];
    if (!ALLOWED_VIDEO_MIME.has(file.mimeType)) {
      await saveSession(sessionId, { status: 'TX_INVALID' });
      return json(400, { error: 'Unsupported video format. Use mp4, webm, or mov.' });
    }
    if (isFileTooLarge(file.bytes)) {
      await saveSession(sessionId, { status: 'TOO_LARGE' });
      return json(413, { error: `File exceeds hard 99MB cap (${MAX_FILE_BYTES} bytes).`, code: 'TOO_LARGE' });
    }

    await pushStatusTransition(sessionId, 'UPLOADED');
    const bucket = getBucket();
    const storagePath = `sponsor-ads/${sessionId}/${Date.now()}-${file.filename}`;
    const output = bucket.file(storagePath);
    await output.save(file.buffer, {
      contentType: file.mimeType,
      metadata: {
        metadata: {
          sessionId,
          wallet: session.wallet,
          tier: session.tier,
        },
      },
      resumable: false,
    });

    let downloadUrl = '';
    try {
      const signed = await output.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      downloadUrl = signed[0];
    } catch {
      downloadUrl = `gs://${bucket.name}/${storagePath}`;
    }

    await saveSession(sessionId, {
      upload: {
        filename: file.filename,
        mime: file.mimeType,
        bytes: file.bytes,
        storage_path: storagePath,
        download_url: downloadUrl,
      },
    });
    await pushStatusTransition(sessionId, 'VERIFIED');

    let queued = false;
    const queueSession = {
      ...session,
      session_id: sessionId,
      sponsor_name: sponsorName,
      website_url: websiteUrl,
    };
    if (session.tier === 'one_time') {
      await queueApprovedAd(
        queueSession,
        { filename: file.filename, mime: file.mimeType, bytes: file.bytes, storagePath, downloadUrl },
      );
      await pushStatusTransition(sessionId, 'QUEUED');
      queued = true;
    } else {
      const winner = await isRotationWinner(queueSession);
      if (winner) {
        await queueApprovedAd(
          queueSession,
          { filename: file.filename, mime: file.mimeType, bytes: file.bytes, storagePath, downloadUrl },
        );
        await pushStatusTransition(sessionId, 'QUEUED');
        queued = true;
      }
    }

    try {
      await enqueueNotification(sessionId, session.wallet);
    } catch (notifyError) {
      console.warn('[sponsor-upload] notify failed', notifyError);
      await getDb().ref(adsPath(`notify_retry/${sessionId}`)).set({
        session_id: sessionId,
        wallet: session.wallet,
        created_at: new Date().toISOString(),
      });
    }

    return json(200, {
      ok: true,
      status: queued ? 'QUEUED' : 'VERIFIED',
      queued,
      file: {
        filename: file.filename,
        bytes: file.bytes,
        mime: file.mimeType,
        storagePath,
      },
    });
  } catch (error) {
    if (String(error.message || '') === 'TOO_LARGE') {
      return json(413, { error: `File exceeds hard 99MB cap (${MAX_FILE_BYTES} bytes).`, code: 'TOO_LARGE' });
    }
    console.error('[sponsor-upload] error', error);
    return json(500, {
      error: error?.message || 'Failed to upload sponsor video.',
      code: 'UPLOAD_FAILED',
    });
  }
};

module.exports = {
  handler: exports.handler,
  isFileTooLarge,
};
