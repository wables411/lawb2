const {
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
  parseBody,
  pushStatusTransition,
  queueApprovedAd,
  saveSession,
  upsertPlaybackAdMetadata,
} = require('./sponsor-shared');

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
    const storagePath = String(body.storagePath || '');
    const filename = String(body.filename || '');
    const mime = String(body.mime || '').toLowerCase();
    const bytes = Number(body.bytes || 0);
    if (!sessionId || !storagePath || !filename || !mime || !Number.isFinite(bytes)) {
      return json(400, { error: 'sessionId, storagePath, filename, mime, and bytes are required.' });
    }

    const session = await getSession(sessionId);
    if (!session) return json(404, { error: 'Session not found.' });
    if (!['PAID', 'UPLOADED', 'VERIFIED'].includes(String(session.status || ''))) {
      return json(400, { error: `Upload completion is not allowed in status ${session.status}.` });
    }

    const sponsorName = normalizeSponsorName(body.sponsorName || session.sponsor_name || '');
    if (!sponsorName) return json(400, { error: 'Sponsor name is required.' });
    const websiteUrl = normalizeWebsiteUrl(body.websiteUrl || session.website_url || '');
    await saveSession(sessionId, { sponsor_name: sponsorName, website_url: websiteUrl });
    await upsertPlaybackAdMetadata(sessionId, sponsorName, websiteUrl);

    const bucket = getBucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) return json(400, { error: 'Uploaded file not found in storage.', code: 'UPLOAD_MISSING' });

    const [metadata] = await file.getMetadata();
    const actualBytes = Number(metadata.size || 0);
    if (!Number.isFinite(actualBytes) || actualBytes <= 0) {
      return json(400, { error: 'Uploaded file metadata invalid.', code: 'UPLOAD_INVALID' });
    }
    if (actualBytes > MAX_FILE_BYTES) {
      await saveSession(sessionId, { status: 'TOO_LARGE' });
      try { await file.delete({ ignoreNotFound: true }); } catch {}
      return json(413, { error: `File exceeds hard 99MB cap (${MAX_FILE_BYTES} bytes).`, code: 'TOO_LARGE' });
    }

    await pushStatusTransition(sessionId, 'UPLOADED');

    let downloadUrl = '';
    try {
      const [signed] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      downloadUrl = signed;
    } catch {
      downloadUrl = `gs://${bucket.name}/${storagePath}`;
    }

    await saveSession(sessionId, {
      upload: {
        filename,
        mime,
        bytes: actualBytes,
        storage_path: storagePath,
        download_url: downloadUrl,
      },
      pending_upload: null,
    });
    await pushStatusTransition(sessionId, 'VERIFIED');

    const queueSession = {
      ...session,
      session_id: sessionId,
      sponsor_name: sponsorName,
      website_url: websiteUrl,
    };

    let queued = false;
    if (session.tier === 'one_time') {
      await queueApprovedAd(queueSession, { filename, mime, bytes: actualBytes, storagePath, downloadUrl });
      await pushStatusTransition(sessionId, 'QUEUED');
      queued = true;
    } else {
      const winner = await isRotationWinner(queueSession);
      if (winner) {
        await queueApprovedAd(queueSession, { filename, mime, bytes: actualBytes, storagePath, downloadUrl });
        await pushStatusTransition(sessionId, 'QUEUED');
        queued = true;
      }
    }

    try {
      await enqueueNotification(sessionId, session.wallet);
    } catch (notifyError) {
      console.warn('[sponsor-upload-complete] notify failed', notifyError);
      await getDb().ref(`clawb/ads/notify_retry/${sessionId}`).set({
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
        filename,
        bytes: actualBytes,
        mime,
        storagePath,
      },
    });
  } catch (error) {
    console.error('[sponsor-upload-complete] error', error);
    return json(500, { error: error?.message || 'Failed to finalize upload.', code: 'UPLOAD_COMPLETE_FAILED' });
  }
};
