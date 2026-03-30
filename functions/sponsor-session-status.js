const { getSession, json } = require('./sponsor-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const sessionId = String(event.queryStringParameters?.sessionId || '');
    if (!sessionId) {
      return json(400, { error: 'sessionId is required.' });
    }
    const session = await getSession(sessionId);
    if (!session) return json(404, { error: 'Session not found.' });
    return json(200, { ok: true, session });
  } catch (error) {
    console.error('[sponsor-session-status] error', error);
    return json(500, { error: 'Failed to load session status.' });
  }
};
