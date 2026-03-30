const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { evaluateTransferForSession } = require('../functions/sponsor-shared');

const wallet = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
const sender = '0x1111111111111111111111111111111111111111';

test('accepts valid Base transfer to Clawb wallet', () => {
  const tx = {
    chainId: BigInt(8453),
    to: wallet,
    from: sender,
    value: ethers.parseEther('0.01'),
  };
  const receipt = { status: 1, blockNumber: 100 };
  const result = evaluateTransferForSession({
    tx,
    receipt,
    latestBlock: 105,
    expectedFrom: sender,
    minWei: ethers.parseEther('0.01').toString(),
  });
  assert.equal(result.ok, true);
});

test('rejects underpaid transfer', () => {
  const tx = {
    chainId: BigInt(8453),
    to: wallet,
    from: sender,
    value: ethers.parseEther('0.001'),
  };
  const receipt = { status: 1, blockNumber: 100 };
  const result = evaluateTransferForSession({
    tx,
    receipt,
    latestBlock: 105,
    expectedFrom: sender,
    minWei: ethers.parseEther('0.01').toString(),
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'TX_INVALID');
});
