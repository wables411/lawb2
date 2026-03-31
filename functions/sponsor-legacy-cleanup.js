const {
  adsPath,
  getDb,
  getSession,
  json,
  nowIso,
  parseBody,
} = require('./sponsor-shared');

const TARGET_SESSION_ID = 'sps_432e95cd2b604c5483391f06edb5e8f0';
const TARGET_AUCTION_ID = 'auc_1774933085808';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const enabled = String(process.env.SPONSOR_LEGACY_CLEANUP_ENABLED || '').toLowerCase() === 'true';
  if (!enabled) {
    return json(403, { error: 'Legacy cleanup is disabled.' });
  }

  const expectedToken = String(process.env.SPONSOR_LEGACY_CLEANUP_TOKEN || '');
  const providedToken = String(
    event.headers?.['x-legacy-cleanup-token']
      || event.headers?.['X-Legacy-Cleanup-Token']
      || '',
  );
  if (!expectedToken || !providedToken || providedToken !== expectedToken) {
    return json(401, { error: 'Unauthorized' });
  }

  try {
    const body = parseBody(event);
    const refundTxHash = String(body.refundTxHash || '').trim();
    if (!refundTxHash) {
      return json(400, { error: 'refundTxHash is required.' });
    }

    const db = getDb();
    const session = await getSession(TARGET_SESSION_ID);
    if (!session) {
      return json(404, { error: `Target session not found: ${TARGET_SESSION_ID}` });
    }

    const existingStatus = String(session.refund_status || '');
    if (existingStatus === 'manual_refunded') {
      return json(200, {
        ok: true,
        alreadyDone: true,
        sessionId: TARGET_SESSION_ID,
        auctionId: TARGET_AUCTION_ID,
      });
    }

    const now = nowIso();
    const refundWei = String(session.auction_bid_wei || session.paid_wei || '0');
    const updates = {
      [adsPath(`sessions/${TARGET_SESSION_ID}/refund_status`)]: 'manual_refunded',
      [adsPath(`sessions/${TARGET_SESSION_ID}/refund_amount_wei`)]: refundWei,
      [adsPath(`sessions/${TARGET_SESSION_ID}/refund_tx_hash`)]: refundTxHash,
      [adsPath(`sessions/${TARGET_SESSION_ID}/auction_result`)]: 'legacy_manual_refund',
      [adsPath(`sessions/${TARGET_SESSION_ID}/updated_at`)]: now,
      [adsPath(`rotation_auctions/${TARGET_AUCTION_ID}/status`)]: 'legacy_closed_manual_refund',
      [adsPath(`rotation_auctions/${TARGET_AUCTION_ID}/winner_session_id`)]: null,
      [adsPath(`rotation_auctions/${TARGET_AUCTION_ID}/updated_at`)]: now,
      [adsPath('meta/legacy_cleanup_executed_at')]: now,
      [adsPath('meta/legacy_cleanup_target_session')]: TARGET_SESSION_ID,
      [adsPath('meta/legacy_cleanup_target_auction')]: TARGET_AUCTION_ID,
    };

    const activeRef = db.ref(adsPath('rotation_auctions_meta/active_auction_id'));
    const activeSnap = await activeRef.get();
    if (activeSnap.exists() && String(activeSnap.val()) === TARGET_AUCTION_ID) {
      updates[adsPath('rotation_auctions_meta/active_auction_id')] = null;
    }

    await db.ref().update(updates);

    return json(200, {
      ok: true,
      sessionId: TARGET_SESSION_ID,
      auctionId: TARGET_AUCTION_ID,
      refundAmountWei: refundWei,
      refundTxHash,
    });
  } catch (error) {
    console.error('[sponsor-legacy-cleanup] error', error);
    return json(500, { error: 'Failed to execute legacy cleanup.' });
  }
};
