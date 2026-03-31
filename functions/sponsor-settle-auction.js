const { ethers } = require('ethers');
const {
  CLAWB_ADSPACE_CONTRACT,
  getAdSpaceContract,
  getRpcProvider,
  json,
  readOnchainAuctionState,
} = require('./sponsor-shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (!['POST', 'GET'].includes(event.httpMethod || '')) {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const state = await readOnchainAuctionState();
    if (state.lifecycle !== 'ended' || state.settled) {
      return json(200, {
        ok: true,
        skipped: true,
        reason: state.settled ? 'already_settled' : 'auction_not_ended',
        auctionId: String(state.auctionId),
      });
    }

    const pk = process.env.CLAWB_ADSPACE_SETTLER_PRIVATE_KEY || '';
    if (!pk) {
      return json(500, { error: 'Missing CLAWB_ADSPACE_SETTLER_PRIVATE_KEY for settlement.' });
    }

    const provider = getRpcProvider();
    const signer = new ethers.Wallet(pk, provider);
    const contract = getAdSpaceContract(signer);
    const tx = await contract.settleAuction();
    const receipt = await tx.wait(1);

    return json(200, {
      ok: true,
      settled: true,
      contract: CLAWB_ADSPACE_CONTRACT,
      auctionId: String(state.auctionId),
      txHash: tx.hash,
      blockNumber: Number(receipt?.blockNumber || 0),
    });
  } catch (error) {
    console.error('[sponsor-settle-auction] error', error);
    return json(500, { error: error?.reason || error?.message || 'Auction settlement failed.' });
  }
};
