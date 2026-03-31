const {
  checkDuplicateTx,
  getClientIp,
  getTxOwnerSession,
  getSession,
  isRateLimited,
  json,
  normalizeAddress,
  parseBody,
  pushStatusTransition,
  reserveTxHash,
  saveSession,
  verifyAdSpacePayment,
} = require('./sponsor-shared');

const RETRYABLE_SESSION_STATUSES = new Set([
  'PENDING_PAYMENT',
  'TX_INVALID',
  'HASH_MISMATCH',
  'DUPLICATE_TX',
]);

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
      return json(429, { error: 'Too many verification attempts. Slow down and retry.' });
    }

    const body = parseBody(event);
    const sessionId = String(body.sessionId || '');
    const txHash = String(body.txHash || '').toLowerCase();
    if (!sessionId || !txHash.startsWith('0x')) {
      return json(400, { error: 'sessionId and txHash are required.' });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return json(404, { error: 'Session not found.' });
    }
    if (session.status === 'PAID' && String(session.tx_hash || '').toLowerCase() === txHash) {
      return json(200, {
        ok: true,
        status: 'PAID',
        txHash,
        uploadUnlocked: true,
      });
    }
    if (!RETRYABLE_SESSION_STATUSES.has(String(session.status || ''))) {
      return json(400, { error: `Session is already ${session.status}.` });
    }

    const duplicate = await checkDuplicateTx(txHash, sessionId);
    if (duplicate) {
      const ownerSessionId = await getTxOwnerSession(txHash);
      await saveSession(sessionId, { status: 'DUPLICATE_TX' });
      return json(409, {
        error: 'Tx hash already used by another sponsor session.',
        code: 'DUPLICATE_TX',
        existingSessionId: ownerSessionId,
      });
    }

    const verification = await verifyAdSpacePayment({
      txHash,
      expectedFrom: normalizeAddress(session.wallet),
      tier: String(session.tier || ''),
      submissionIdHash: session.submission_id_hash || '',
    });
    let resolvedVerification = verification;
    let inferredTier = null;
    if (!verification.ok && verification.reason === 'HASH_MISMATCH') {
      const currentTier = String(session.tier || '');
      const alternateTier = currentTier === 'one_time' ? 'rotation' : currentTier === 'rotation' ? 'one_time' : null;
      if (alternateTier) {
        const alternateCheck = await verifyAdSpacePayment({
          txHash,
          expectedFrom: normalizeAddress(session.wallet),
          tier: alternateTier,
          submissionIdHash: session.submission_id_hash || '',
        });
        if (alternateCheck.ok) {
          resolvedVerification = alternateCheck;
          inferredTier = alternateTier;
        }
      }
    }
    if (!resolvedVerification.ok) {
      await saveSession(sessionId, { status: verification.reason });
      return json(400, {
        error: verification.detail || 'Transaction failed verification.',
        code: verification.reason,
        retryable: Boolean(verification.pendingConfirmations),
      });
    }

    await reserveTxHash(txHash, sessionId);
    await pushStatusTransition(sessionId, 'PAID', {
      tx_hash: txHash,
      confirmations: resolvedVerification.confirmations,
    });

    const patch = {
      tx_hash: txHash,
      tx_confirmed_at: new Date().toISOString(),
      paid_wei: resolvedVerification.valueWei,
    };
    if (inferredTier) {
      patch.tier = inferredTier;
      patch.required_wei = String(resolvedVerification.valueWei);
    }

    await saveSession(sessionId, patch);
    return json(200, {
      ok: true,
      status: 'PAID',
      txHash,
      uploadUnlocked: true,
    });
  } catch (error) {
    console.error('[sponsor-verify-tx] error', error);
    return json(500, { error: 'Failed to verify transaction.' });
  }
};
