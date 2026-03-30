const {
  getDb,
  getSession,
  json,
  pushStatusTransition,
  queueApprovedAd,
} = require('./sponsor-shared');

async function finalizeActiveAuction() {
  const db = getDb();
  const activeRef = db.ref('clawb/ads/rotation_auctions_meta/active_auction_id');
  const activeSnap = await activeRef.get();
  if (!activeSnap.exists()) return { finalized: false, reason: 'no_active_auction' };
  const auctionId = String(activeSnap.val());
  const auctionRef = db.ref(`clawb/ads/rotation_auctions/${auctionId}`);
  const auctionSnap = await auctionRef.get();
  if (!auctionSnap.exists()) return { finalized: false, reason: 'auction_missing' };
  const auction = auctionSnap.val();
  if (Number(auction.ends_at_ms || 0) > Date.now()) {
    return { finalized: false, reason: 'still_running', auctionId, endsAtMs: auction.ends_at_ms };
  }

  const winnerSessionId = String(auction.highest_session_id || '');
  if (!winnerSessionId) {
    await auctionRef.update({ status: 'closed_no_winner', updated_at: new Date().toISOString() });
    await activeRef.remove();
    return { finalized: true, reason: 'closed_no_winner', auctionId };
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

  await auctionRef.update({
    status: 'closed',
    winner_session_id: winnerSessionId,
    updated_at: new Date().toISOString(),
  });
  await activeRef.remove();
  return { finalized: true, auctionId, winnerSessionId };
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
  finalizeActiveAuction,
};
