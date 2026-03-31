const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLosingRefundEntries } = require('../functions/sponsor-finalize-auctions');

test('buildLosingRefundEntries creates pending refunds for all losing bids', () => {
  const auctionId = 'auc_123';
  const auction = {
    bids: {
      winnerSession: { wallet: '0x1111111111111111111111111111111111111111', bid_wei: '25000000000000000' },
      loserA: { wallet: '0x2222222222222222222222222222222222222222', bid_wei: '24000000000000000' },
      loserB: { wallet: '0x3333333333333333333333333333333333333333', bid_wei: '23000000000000000' },
    },
  };
  const entries = buildLosingRefundEntries(auctionId, auction, 'winnerSession');
  assert.equal(entries.length, 2);
  const ids = entries.map((entry) => entry.refundId).sort();
  assert.deepEqual(ids, ['auc_123_loserA', 'auc_123_loserB']);
  assert.equal(entries[0].payload.status, 'pending');
});
