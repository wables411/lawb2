/**
 * Cross-encoding tests for the jackpot score signer bundle.
 *
 * The critical property: the digest _scoreSigner.cjs signs must be BYTE-IDENTICAL
 * to what ReefRunJackpot.sol computes (domain "ReefRunJackpot"/"1" + the Score
 * struct). We rebuild the Solidity-side encoding by hand with abi primitives and
 * compare — so a drift in the types object (e.g. uint64 vs uint256) fails here
 * instead of silently producing signatures the contract rejects.
 *
 * Run: npm run test:signer  (builds the bundle first)
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AbiCoder, keccak256, toUtf8Bytes, concat, recoverAddress } = require('ethers');

const signer = require('../reef-validator/_scoreSigner.cjs');

const PRIV = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // well-known test key
const CHAIN_ID = 8453;
const CONTRACT = '0x1111111111111111111111111111111111111111';

const VALUE = {
  player: '0x2222222222222222222222222222222222222222',
  entryNonce: 7,
  seed: 692103587,
  survivalMs: 104783,
  deadline: 1790000000,
};

/** Solidity-side digest, reconstructed exactly as ReefRunJackpot.sol does it. */
function solidityDigest() {
  const abi = AbiCoder.defaultAbiCoder();
  const domainTypehash = keccak256(
    toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
  );
  const scoreTypehash = keccak256(
    toUtf8Bytes('Score(address player,uint64 entryNonce,uint32 seed,uint64 survivalMs,uint256 deadline)'),
  );
  const domainSep = keccak256(
    abi.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [domainTypehash, keccak256(toUtf8Bytes('ReefRunJackpot')), keccak256(toUtf8Bytes('1')), CHAIN_ID, CONTRACT],
    ),
  );
  const structHash = keccak256(
    abi.encode(
      ['bytes32', 'address', 'uint64', 'uint32', 'uint64', 'uint256'],
      [scoreTypehash, VALUE.player, VALUE.entryNonce, VALUE.seed, VALUE.survivalMs, VALUE.deadline],
    ),
  );
  return keccak256(concat(['0x1901', domainSep, structHash]));
}

test('signer digest matches the Solidity encoding byte-for-byte', () => {
  const domain = signer.scoreDomain(CHAIN_ID, CONTRACT);
  assert.equal(signer.scoreDigest(domain, VALUE), solidityDigest());
});

test('signature recovers to the signer address with v in {27,28}', () => {
  const domain = signer.scoreDomain(CHAIN_ID, CONTRACT);
  const sig = signer.signScore(PRIV, domain, VALUE);
  assert.equal(sig.length, 2 + 65 * 2, '65-byte signature');
  const v = parseInt(sig.slice(-2), 16);
  assert.ok(v === 27 || v === 28, `v=${v} must be 27/28 for ecrecover`);
  assert.equal(recoverAddress(solidityDigest(), sig), signer.signerAddress(PRIV));
});

test('different value -> different digest (fields are actually bound)', () => {
  const domain = signer.scoreDomain(CHAIN_ID, CONTRACT);
  const base = signer.scoreDigest(domain, VALUE);
  for (const [k, v] of [
    ['player', '0x3333333333333333333333333333333333333333'],
    ['entryNonce', 8],
    ['seed', 1],
    ['survivalMs', 104784],
    ['deadline', 1790000001],
  ]) {
    assert.notEqual(signer.scoreDigest(domain, { ...VALUE, [k]: v }), base, `changing ${k} must change digest`);
  }
  assert.notEqual(signer.scoreDigest(signer.scoreDomain(1, CONTRACT), VALUE), base, 'chainId bound');
  assert.notEqual(
    signer.scoreDigest(signer.scoreDomain(CHAIN_ID, '0x4444444444444444444444444444444444444444'), VALUE),
    base,
    'contract bound',
  );
});
