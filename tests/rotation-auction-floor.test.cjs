const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeRotationBidFloorWei,
  getAuctionLifecycleStatus,
  TIERS,
} = require('../functions/sponsor-shared');

test('bid floor uses reserve plus 0.001 ETH when highest is below reserve', () => {
  const floor = computeRotationBidFloorWei({
    reserve_wei: TIERS.rotation.reserveWei,
    highest_bid_wei: '0',
  });
  assert.equal(floor, '21000000000000000');
});

test('bid floor uses highest plus 0.001 ETH when highest beats reserve', () => {
  const floor = computeRotationBidFloorWei({
    reserve_wei: TIERS.rotation.reserveWei,
    highest_bid_wei: '23000000000000000',
  });
  assert.equal(floor, '24000000000000000');
});

test('lifecycle derives active/upcoming/ended from times', () => {
  const now = Date.now();
  const upcoming = getAuctionLifecycleStatus({ starts_at_ms: now + 10000, ends_at_ms: now + 20000, status: 'active' }, now);
  const active = getAuctionLifecycleStatus({ starts_at_ms: now - 10000, ends_at_ms: now + 20000, status: 'active' }, now);
  const ended = getAuctionLifecycleStatus({ starts_at_ms: now - 20000, ends_at_ms: now - 1000, status: 'active' }, now);
  assert.equal(upcoming, 'upcoming');
  assert.equal(active, 'active');
  assert.equal(ended, 'ended');
});
