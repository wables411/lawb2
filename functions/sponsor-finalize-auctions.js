const {
  adsPath,
  getDb,
  getSession,
  json,
  nowIso,
  pushStatusTransition,
  queueApprovedAd,
} = require('./sponsor-shared');

function buildLosingRefundEntries(auctionId, auction, winnerSessionId) {
  const bids = auction?.bids && typeof auction.bids === 'object' ? auction.bids : {};
  const entries = [];
  for (const [sessionId, bid] of Object.entries(bids)) {
    if (!sessionId || sessionId === winnerSessionId) continue;
    const wallet = String(bid?.wallet || '');
    const bidWei = String(bid?.bid_wei || '0');
    if (!wallet || bidWei === '0') continue;
    const refundId = `${auctionId}_${sessionId}`;
    entries.push({
      refundId,
      payload: {
        refund_id: refundId,
        auction_id: auctionId,
        session_id: sessionId,
        wallet,
        amount_wei: bidWei,
        reason: 'rotation_auction_lost',
        status: 'pending',
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    });
  }
  return entries;
}

async function finalizeActiveAuction() {
  const db = getDb();
  const activeRef = db.ref(adsPath('rotation_auctions_meta/active_auction_id'));
  const activeSnap = await activeRef.get();
  if (!activeSnap.exists()) return { finalized: false, reason: 'no_active_auction' };
  const auctionId = String(activeSnap.val());
  const auctionRef = db.ref(adsPath(`rotation_auctions/${auctionId}`));
  const auctionSnap = await auctionRef.get();
  if (!auctionSnap.exists()) return { finalized: false, reason: 'auction_missing' };
  const auction = auctionSnap.val();
  if (Number(auction.ends_at_ms || 0) > Date.now()) {
    return { finalized: false, reason: 'still_running', auctionId, endsAtMs: auction.ends_at_ms };
  }

  const winnerSessionId = String(auction.highest_session_id || '');
  if (!winnerSessionId) {
    await auctionRef.update({
      status: 'closed_no_winner',
      finalized_at: nowIso(),
      updated_at: nowIso(),
    });
    await activeRef.remove();
    return { finalized: true, reason: 'closed_no_winner', auctionId };
  }

  // Legacy Firebase refund queue can be toggled on for old auction rounds only.
  // Onchain rounds use contract-native pendingRefunds/withdrawRefund and should not enqueue here.
  const legacyRefundQueueEnabled = process.env.SPONSOR_LEGACY_AUCTION_REFUNDS === 'true';
  const refundEntries = legacyRefundQueueEnabled
    ? buildLosingRefundEntries(auctionId, auction, winnerSessionId)
    : [];
  if (legacyRefundQueueEnabled) {
    const refundUpdates = {};
    for (const entry of refundEntries) {
      refundUpdates[adsPath(`refund_queue/${entry.refundId}`)] = entry.payload;
      refundUpdates[adsPath(`sessions/${entry.payload.session_id}/refund_status`)] = 'pending';
      refundUpdates[adsPath(`sessions/${entry.payload.session_id}/refund_amount_wei`)] = entry.payload.amount_wei;
      refundUpdates[adsPath(`sessions/${entry.payload.session_id}/updated_at`)] = nowIso();
    }
    if (Object.keys(refundUpdates).length) {
      await db.ref().update(refundUpdates);
    }
  }

  const winnerSession = await getSession(winnerSessionId);
  if (winnerSession?.upload) {
    const upload = winnerSession.upload;
    await queueApprovedAd(
      { ...winnerSession, session_id: winnerSessionId },
      {
        filename: upload.filename,
        mime: upload.mime,
        bytes: upload.bytes,
        storagePath: upload.storage_path,
        downloadUrl: upload.download_url,
      },
    );
    await pushStatusTransition(winnerSessionId, 'QUEUED', { source: 'auction_finalize', auction_id: auctionId });
  }

  const winnerBidWei = String(auction.highest_bid_wei || '0');
  const winnerWallet = String(auction?.bids?.[winnerSessionId]?.wallet || '');
  await db.ref(adsPath(`sessions/${winnerSessionId}`)).update({
    auction_result: 'winner',
    auction_winning_bid_wei: winnerBidWei,
    updated_at: nowIso(),
  });

  await auctionRef.update({
    status: 'closed',
    winner_session_id: winnerSessionId,
    winner_wallet: winnerWallet || null,
    final_winning_bid_wei: winnerBidWei,
    refunds_enqueued: refundEntries.length,
    finalized_at: nowIso(),
    updated_at: nowIso(),
  });
  await activeRef.remove();
  return { finalized: true, auctionId, winnerSessionId, refundsEnqueued: refundEntries.length };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }
  try {
    const result = await finalizeActiveAuction();
    return json(200, { ok: true, result });
  } catch (error) {
    console.error('[sponsor-finalize-auctions] error', error);
    return json(500, { error: 'Failed to finalize rotation auctions.' });
  }
};

module.exports = {
  buildLosingRefundEntries,
  finalizeActiveAuction,
};
