// Live proof of popup-free moves on Base Sepolia against the REAL deployed LawbChess proxy.
// Uses the exact shipping module (src/utils/lawbChessSession.ts) - what's tested is what ships.
//
// Choreography:
//   1. A (testnet throwaway deployer) creates a tiny native-wager game.
//   2. B (fresh key funded by A) joins - game ACTIVE.
//   3. A registers an ephemeral session move-key + fronts it gas (the "one-time setup").
//   4. White's moves are signed by the session key and SUBMITTED BY THE SESSION KEY -
//      A's wallet is never touched again (this is the popup-free claim, proven on-chain).
//   5. B plays a direct makeMove in between (mixed mode).
//   6. B resigns -> contract settles (frees both players' active-game slots).
//   7. Session key + B sweep leftover gas back to A.
//
// Run: npx tsx scripts/proveSessionMoves.mts   (testnet only - never touches mainnet keys)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPublicClient, createWalletClient, http, formatEther, type Chain, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, foundry } from 'viem/chains';
import { LAWB_CHESS_ABI } from '../src/config/lawbChessAbi';
import {
  createAndStoreMoveKey,
  loadMoveKey,
  sessionKeyBalance,
  submitMoveBySessionKey,
  sweepSessionKey,
  computeSessionFunding,
  type KeyStore,
} from '../src/utils/lawbChessSession';
import { stringToCode } from '../src/utils/lawbChessMoves';

// Defaults = Base Sepolia (handoff S3/S4). Overridable for a local anvil run:
//   PROOF_RPC=http://127.0.0.1:8545 PROOF_PROXY=0x... PROOF_CHAIN=31337 PROOF_KEY=0x...(anvil dev key)
const PROXY = (process.env.PROOF_PROXY ?? '0xCF4131302Ed9685309F2c1Ca01b282409D1fBCE4') as `0x${string}`;
const RPC = process.env.PROOF_RPC ?? 'https://base-sepolia-rpc.publicnode.com';
const CHAIN: Chain = process.env.PROOF_CHAIN === String(foundry.id) ? foundry : baseSepolia;
const CHAIN_ID = CHAIN.id;
const WAGER = 10_000_000_000_000n; // 0.00001 ETH each side

// square helpers: a1=0..h8=63
const sq = (file: number, rank: number) => rank * 8 + file;
const E2 = sq(4, 1), E4 = sq(4, 3), E7 = sq(4, 6), E5 = sq(4, 4), G1 = sq(6, 0), F3 = sq(5, 2);

// Game struct positional indices (mapping getter returns fields in declaration order)
const F_SIDE = 6, F_STATUS = 10, F_WHITE_MOVEKEY = 17, F_MOVE_NONCE = 19;

function loadDeployerKey(): Hex {
  if (process.env.PROOF_KEY) return process.env.PROOF_KEY as Hex; // local anvil dev key
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'onchain-chess', '.env');
  const m = readFileSync(envPath, 'utf8').match(/^PRIVATE_KEY=(0x[0-9a-fA-F]{64})/m);
  if (!m) throw new Error('PRIVATE_KEY not found in onchain-chess/.env');
  return m[1] as Hex;
}

// in-memory store stands in for the browser's localStorage
const memStore: KeyStore = (() => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
})();

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) });
const wait = (hash: Hex, label: string) =>
  pub.waitForTransactionReceipt({ hash }).then((r) => {
    if (r.status !== 'success') throw new Error(`${label} reverted (${hash})`);
    console.log(`  OK ${label} - ${hash.slice(0, 14)}...`);
    return r;
  });

async function game(code: Hex): Promise<readonly unknown[]> {
  return (await pub.readContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'games', args: [code] })) as readonly unknown[];
}

async function freeSlot(who: ReturnType<typeof createWalletClient>, addr: Hex, label: string) {
  const active = (await pub.readContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'playerActiveGame', args: [addr] })) as Hex;
  if (active === '0x000000000000') return;
  const g = await game(active);
  const status = Number(g[F_STATUS]);
  console.log(`  ${label} stuck in game ${active} (status ${status}) - clearing...`);
  if (status === 1) await wait(await who.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'cancelGame', args: [active], chain: CHAIN, account: who.account! }), `${label} cancelGame`);
  else if (status === 2) await wait(await who.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'resign', args: [active], chain: CHAIN, account: who.account! }), `${label} resign`);
}

(async () => {
  const aKey = loadDeployerKey();
  const A = createWalletClient({ account: privateKeyToAccount(aKey), chain: CHAIN, transport: http(RPC) });
  const aAddr = A.account!.address;
  const bKey = generatePrivateKey();
  const B = createWalletClient({ account: privateKeyToAccount(bKey), chain: CHAIN, transport: http(RPC) });
  const bAddr = B.account!.address;

  const startBal = await pub.getBalance({ address: aAddr });
  console.log(`A (deployer) ${aAddr} - ${formatEther(startBal)} ETH`);
  if (startBal < 5_000_000_000_000_000n) throw new Error('deployer below 0.005 ETH - top up Sepolia faucet first');

  await freeSlot(A, aAddr, 'A');

  // fresh 6-char code from timestamp (bytes6)
  const code = stringToCode(('P' + (Date.now() % 60466176).toString(36).toUpperCase()).slice(0, 6));
  console.log(`game code ${code}`);

  console.log('1) A creates native-wager game');
  await wait(await A.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'createGame', args: [code, 0, '0x0000000000000000000000000000000000000000', WAGER, 3600, 0], value: WAGER, chain: CHAIN, account: A.account! }), 'createGame');

  console.log('2) fund B + B joins');
  await wait(await A.sendTransaction({ to: bAddr, value: 1_500_000_000_000_000n, chain: CHAIN, account: A.account! }), 'fund B');
  await wait(await B.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'joinGame', args: [code], value: WAGER, chain: CHAIN, account: B.account! }), 'B joinGame');

  console.log('3) ONE-TIME SETUP: A registers session move-key + fronts it gas');
  const moveKey = createAndStoreMoveKey(CHAIN_ID, PROXY, code, aAddr, memStore);
  await wait(await A.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'registerMoveKey', args: [code, moveKey.address], chain: CHAIN, account: A.account! }), 'registerMoveKey');
  const funding = await computeSessionFunding(CHAIN_ID, RPC);
  console.log(`  funding sized from live gas price: ${formatEther(funding)} ETH`);
  await wait(await A.sendTransaction({ to: moveKey.address, value: funding, chain: CHAIN, account: A.account! }), 'fund session key');
  const reloaded = loadMoveKey(CHAIN_ID, PROXY, code, aAddr, memStore);
  if (!reloaded || reloaded.address !== moveKey.address) throw new Error('key persistence roundtrip failed');
  let g = await game(code);
  if ((g[F_WHITE_MOVEKEY] as string).toLowerCase() !== moveKey.address.toLowerCase()) throw new Error('on-chain whiteMoveKey mismatch');
  console.log(`  OK key ${moveKey.address} registered + persisted (${formatEther(await sessionKeyBalance(CHAIN_ID, moveKey.address, RPC))} ETH gas)`);

  console.log('4) POPUP-FREE: session key signs AND submits white e2-e4 (A wallet untouched)');
  await wait(await submitMoveBySessionKey(CHAIN_ID, PROXY, reloaded, { code, nonce: BigInt(g[F_MOVE_NONCE] as bigint), from: E2, to: E4, promo: 0 }, RPC), 'makeMoveBySig e2e4');
  g = await game(code);
  if (Number(g[F_SIDE]) !== 1 || Number(g[F_MOVE_NONCE] as bigint) !== 1) throw new Error(`state wrong after move 1: side=${g[F_SIDE]} nonce=${g[F_MOVE_NONCE]}`);

  console.log('5) B plays direct makeMove e7-e5 (mixed mode)');
  await wait(await B.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'makeMove', args: [code, E7, E5, 0], chain: CHAIN, account: B.account! }), 'B makeMove e7e5');

  console.log('6) POPUP-FREE again: session key submits Ng1-f3');
  g = await game(code);
  await wait(await submitMoveBySessionKey(CHAIN_ID, PROXY, reloaded, { code, nonce: BigInt(g[F_MOVE_NONCE] as bigint), from: G1, to: F3, promo: 0 }, RPC), 'makeMoveBySig Nf3');
  g = await game(code);
  if (Number(g[F_MOVE_NONCE] as bigint) !== 3) throw new Error('nonce should be 3');

  console.log('7) B resigns - contract settles, slots free');
  await wait(await B.writeContract({ address: PROXY, abi: LAWB_CHESS_ABI, functionName: 'resign', args: [code], chain: CHAIN, account: B.account! }), 'B resign');
  g = await game(code);
  if (Number(g[F_STATUS]) !== 3) throw new Error('game should be FINISHED');

  console.log('8) sweeps back to A');
  const s1 = await sweepSessionKey(CHAIN_ID, reloaded, aAddr, RPC);
  if (s1) await wait(s1, 'sweep session key');
  const s2 = await sweepSessionKey(CHAIN_ID, { privateKey: bKey, address: bAddr }, aAddr, RPC);
  if (s2) await wait(s2, 'sweep B');

  const endBal = await pub.getBalance({ address: aAddr });
  console.log(`\nPROOF COMPLETE - popup-free moves live on ${CHAIN.name} (chain ${CHAIN_ID}) proxy ${PROXY}`);
  console.log(`   game ${code}: 3 moves (2 session-key-submitted, 1 direct), settle, sweeps OK`);
  console.log(`   A balance ${formatEther(startBal)} -> ${formatEther(endBal)} ETH (net cost ${formatEther(startBal - endBal)})`);
})().catch((e) => {
  console.error('PROOF FAILED:', e?.message ?? e);
  process.exit(1);
});
