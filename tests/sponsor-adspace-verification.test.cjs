const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const {
  ADSPACE_IFACE,
  buildSubmissionIdHash,
  evaluateAdSpaceTransaction,
} = require('../functions/sponsor-shared');

const sender = '0x1111111111111111111111111111111111111111';
const contract = '0x4152D2A4283663bb5B677dfC9d0d8924Dd46C3D1';

test('one-time exact 0.01 ETH validates', () => {
  const sessionHash = buildSubmissionIdHash('sps_test_1');
  const data = ADSPACE_IFACE.encodeFunctionData('buyOneTimeAd', [sessionHash, 'session:sps_test_1']);
  const result = evaluateAdSpaceTransaction({
    tx: {
      chainId: 8453n,
      to: contract,
      from: sender,
      value: ethers.parseEther('0.01'),
      data,
    },
    receipt: { status: 1 },
    expectedFrom: sender,
    tier: 'one_time',
    submissionIdHash: sessionHash,
  });
  assert.equal(result.ok, true);
});

test('one-time wrong amount is rejected', () => {
  const sessionHash = buildSubmissionIdHash('sps_test_2');
  const data = ADSPACE_IFACE.encodeFunctionData('buyOneTimeAd', [sessionHash, 'session:sps_test_2']);
  const result = evaluateAdSpaceTransaction({
    tx: {
      chainId: 8453n,
      to: contract,
      from: sender,
      value: ethers.parseEther('0.011'),
      data,
    },
    receipt: { status: 1 },
    expectedFrom: sender,
    tier: 'one_time',
    submissionIdHash: sessionHash,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'TX_INVALID');
});

test('rotation bid tx validates when method/target match', () => {
  const sessionHash = buildSubmissionIdHash('sps_test_3');
  const data = ADSPACE_IFACE.encodeFunctionData('placeBid', [sessionHash, 'session:sps_test_3']);
  const result = evaluateAdSpaceTransaction({
    tx: {
      chainId: 8453n,
      to: contract,
      from: sender,
      value: ethers.parseEther('0.021'),
      data,
    },
    receipt: { status: 1 },
    expectedFrom: sender,
    tier: 'rotation',
    submissionIdHash: sessionHash,
  });
  assert.equal(result.ok, true);
});
