const {
  enqueueNotification,
  getClientIp,
  getSession,
  isRateLimited,
  json,
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
      return json(429, { error: 'Too many notify attempts. Please retry shortly.' });
    }

    const body = JSON.parse(event.body || '{}');
    const sessionId = String(body.sessionId || '');
    if (!sessionId) {
      return json(400, { error: 'sessionId is required.' });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return json(404, { error: 'Session not found.' });
    }
    if (!session.upload) {
      return json(400, { error: 'Session has no upload yet.' });
    }

    await enqueueNotification(sessionId, session.wallet);
    return json(200, { ok: true, notified: true });
  } catch (error) {
    console.error('[sponsor-notify-clawb] error', error);
    return json(500, { error: 'Failed to notify Clawb.' });
  }
};
