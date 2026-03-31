const { ethers } = require('ethers');
const { getRotationAuctionSnapshot, json } = require('./sponsor-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const snapshot = await getRotationAuctionSnapshot({ ensureActive: false });
    return json(200, {
      ok: true,
      auction: {
        ...snapshot,
        reserve_eth: snapshot.reserve_wei ? ethers.formatEther(snapshot.reserve_wei) : null,
        highest_bid_eth: snapshot.highest_bid_wei ? ethers.formatEther(snapshot.highest_bid_wei) : null,
        next_valid_bid_eth: snapshot.next_valid_bid_wei ? ethers.formatEther(snapshot.next_valid_bid_wei) : null,
      },
    });
  } catch (error) {
    console.error('[sponsor-auction-status] error', error);
    return json(500, { error: 'Failed to load rotation auction status.' });
  }
};
