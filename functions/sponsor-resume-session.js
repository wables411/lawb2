const {
  getDb,
  isWallet,
  json,
  normalizeAddress,
  pickLatestResumableSession,
} = require('./sponsor-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const walletRaw = String(event.queryStringParameters?.wallet || '');
    const wallet = normalizeAddress(walletRaw);
    if (!isWallet(wallet)) {
      return json(400, { error: 'wallet is required.' });
    }

    const snap = await getDb().ref('clawb/ads/sessions').orderByChild('wallet').equalTo(wallet).get();
    if (!snap.exists()) {
      return json(200, { ok: true, found: false });
    }

    const picked = pickLatestResumableSession(snap.val());
    if (!picked) {
      return json(200, { ok: true, found: false });
    }

    return json(200, {
      ok: true,
      found: true,
      sessionId: picked.sessionId,
      session: picked.session,
    });
  } catch (error) {
    console.error('[sponsor-resume-session] error', error);
    return json(500, { error: 'Failed to resume sponsor session.' });
  }
};
