/**
 * EIP-712 Score signing for the ReefRunJackpot contract — bundled to
 * `_scoreSigner.cjs` by `npm run validator:build-signer` (esbuild tree-shakes
 * ethers down to the signing primitives), committed like `_reefRunSim.cjs`,
 * and curl-fetched by deploy-reef-validator.sh. The droplet never needs
 * node_modules.
 *
 * The struct/domain here MUST stay byte-identical to ReefRunJackpot.sol:
 *   domain  = ("ReefRunJackpot", "1", chainId, verifyingContract)
 *   Score(address player,uint64 entryNonce,uint32 seed,uint64 survivalMs,uint256 deadline)
 * A cross-encoding test lives in tests/reefScoreSigner.test.cjs.
 */

import { SigningKey, TypedDataEncoder, computeAddress } from 'ethers';

export const SCORE_TYPES = {
  Score: [
    { name: 'player', type: 'address' },
    { name: 'entryNonce', type: 'uint64' },
    { name: 'seed', type: 'uint32' },
    { name: 'survivalMs', type: 'uint64' },
    { name: 'deadline', type: 'uint256' },
  ],
};

export function scoreDomain(chainId, verifyingContract) {
  return { name: 'ReefRunJackpot', version: '1', chainId, verifyingContract };
}

export function scoreDigest(domain, value) {
  return TypedDataEncoder.hash(domain, SCORE_TYPES, value);
}

/** @returns 65-byte r||s||v hex signature (v = 27/28, as ecrecover expects). */
export function signScore(privKey, domain, value) {
  const sk = new SigningKey(privKey);
  return sk.sign(scoreDigest(domain, value)).serialized;
}

export function signerAddress(privKey) {
  return computeAddress(privKey);
}
