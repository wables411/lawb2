const { ethers } = require('ethers');
const {
  CLAWB_ADSPACE_CONTRACT,
  TIERS,
  json,
  readOnchainAuctionState,
} = require('./sponsor-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const wallet = String(event.queryStringParameters?.wallet || '');
    const snapshot = await readOnchainAuctionState(wallet);
    return json(200, {
      ok: true,
      auction: {
        source: 'onchain',
        contract: CLAWB_ADSPACE_CONTRACT,
        status: snapshot.lifecycle === 'ended' ? 'ended' : 'active',
        lifecycle: snapshot.lifecycle,
        auction_id: String(snapshot.auctionId),
        starts_at_ms: snapshot.startsAt,
        ends_at_ms: snapshot.endsAt,
        settled: snapshot.settled,
        winner: snapshot.winner,
        reserve_wei: TIERS.rotation.reserveWei,
        reserve_eth: ethers.formatEther(TIERS.rotation.reserveWei),
        highest_bid_wei: snapshot.highestBidWei,
        highest_bid_eth: ethers.formatEther(snapshot.highestBidWei),
        next_valid_bid_wei: snapshot.nextMinBidWei,
        next_valid_bid_eth: ethers.formatEther(snapshot.nextMinBidWei),
        extension_used: snapshot.extensionUsed,
        pending_refund_wei: snapshot.pendingRefundWei,
        pending_refund_eth: ethers.formatEther(snapshot.pendingRefundWei || '0'),
      },
    });
  } catch (error) {
    console.error('[sponsor-auction-status] error', error);
    return json(500, { error: 'Failed to load rotation auction status.' });
  }
};
