const {
  adsPath,
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

    let sessionsById = null;
    try {
      const indexedSnap = await getDb().ref(adsPath('sessions')).orderByChild('wallet').equalTo(wallet).get();
      sessionsById = indexedSnap.exists() ? indexedSnap.val() : null;
    } catch (queryError) {
      // Fallback scan avoids hard failure when query/index state is inconsistent.
      const allSnap = await getDb().ref(adsPath('sessions')).get();
      if (allSnap.exists()) {
        const allSessions = allSnap.val() || {};
        sessionsById = Object.fromEntries(
          Object.entries(allSessions).filter(([, value]) => String(value?.wallet || '').toLowerCase() === wallet),
        );
      }
    }

    if (!sessionsById || !Object.keys(sessionsById).length) {
      return json(200, { ok: true, found: false });
    }

    const picked = pickLatestResumableSession(sessionsById);
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
