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
  recordRotationBid,
  reserveTxHash,
  saveSession,
  verifyBaseTransfer,
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

    const verification = await verifyBaseTransfer({
      txHash,
      expectedFrom: normalizeAddress(session.wallet),
      minWei: String(session.required_wei),
    });
    if (!verification.ok) {
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
      confirmations: verification.confirmations,
    });

    const patch = {
      tx_hash: txHash,
      tx_confirmed_at: new Date().toISOString(),
      paid_wei: verification.valueWei,
    };

    if (session.tier === 'rotation') {
      let auction;
      try {
        auction = await recordRotationBid({
          sessionId,
          wallet: session.wallet,
          paidWei: verification.valueWei,
          auctionId: session.auction_id,
        });
      } catch (bidError) {
        const code = String(bidError?.code || 'BID_REJECTED');
        return json(400, {
          error: bidError?.message || 'Rotation bid rejected.',
          code,
          nextValidBidWei: bidError?.floorWei || null,
        });
      }
      patch.auction_id = auction.auctionId;
      patch.auction_bid_wei = verification.valueWei;
      patch.auction_leading = auction.isHighest;
      patch.auction_ends_at_ms = auction.endsAtMs;
      await saveSession(sessionId, patch);
      return json(200, {
        ok: true,
        status: 'PAID',
        txHash,
        auction,
        uploadUnlocked: true,
      });
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
