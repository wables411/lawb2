// Helpers for the LawbChess on-chain write path (Phase 4): game codes, session move-keys,
// and the EIP-712 move signature that the contract's makeMoveBySig verifies.
//
// The signing scheme MUST match onchain-chess/src/LawbChess.sol exactly:
//   domain: EIP712Domain(name="LawbChess", version="1", chainId, verifyingContract)
//   type:   Move(bytes6 code,uint64 nonce,uint8 from,uint8 to,uint8 promo)
// A mismatch here = "bad sig" reverts on-chain.

import { hexToString, stringToHex, type TypedDataDomain } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/** bytes6 game code: 0x + 12 hex chars. */
export type GameCode = `0x${string}`;

/** Encode a human-readable code (<=6 bytes/chars) as bytes6, right-padded with zeros. */
export function stringToCode(value: string): GameCode {
  return stringToHex(value, { size: 6 });
}

/** Decode a bytes6 code back to its string (trailing zero padding stripped). */
export function codeToString(code: GameCode): string {
  return hexToString(code, { size: 6 });
}

// ---- session move-key (app-level popup-free path, spec §6 fallback A) ----

export interface MoveKey {
  /** ephemeral private key — keep client-side only, never send to a server */
  privateKey: `0x${string}`;
  /** address registered on-chain via registerMoveKey(code, address) */
  address: `0x${string}`;
}

/** Generate a fresh ephemeral move-key for one game. */
export function generateMoveKey(): MoveKey {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, address: account.address };
}

// ---- EIP-712 move signature ----

export interface MovePayload {
  code: GameCode;
  /** must equal the game's current moveNonce */
  nonce: bigint;
  from: number;
  to: number;
  /** promotion piece type (0 = none, else 2=N,3=B,4=R,5=Q per ChessEngine) */
  promo: number;
}

const MOVE_TYPES = {
  Move: [
    { name: 'code', type: 'bytes6' },
    { name: 'nonce', type: 'uint64' },
    { name: 'from', type: 'uint8' },
    { name: 'to', type: 'uint8' },
    { name: 'promo', type: 'uint8' },
  ],
} as const;

export function moveDomain(chainId: number, verifyingContract: `0x${string}`): TypedDataDomain {
  return { name: 'LawbChess', version: '1', chainId, verifyingContract };
}

/** Build the viem typed-data object for signing/verifying a move. */
export function buildMoveTypedData(
  chainId: number,
  verifyingContract: `0x${string}`,
  move: MovePayload,
) {
  return {
    domain: moveDomain(chainId, verifyingContract),
    types: MOVE_TYPES,
    primaryType: 'Move' as const,
    message: {
      code: move.code,
      nonce: move.nonce,
      from: move.from,
      to: move.to,
      promo: move.promo,
    },
  };
}

/**
 * Sign a move with an ephemeral move-key (no wallet popup). The resulting signature
 * is submitted by the relayer via makeMoveBySig(code, from, to, promo, nonce, sig).
 */
export async function signMoveWithKey(
  privateKey: `0x${string}`,
  chainId: number,
  verifyingContract: `0x${string}`,
  move: MovePayload,
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(privateKey);
  return account.signTypedData(buildMoveTypedData(chainId, verifyingContract, move));
}
