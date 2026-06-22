// End-to-end test of the Phase 4 on-chain chess integration against a LOCAL FORK of
// Base Sepolia (the real already-deployed LawbChess contract — no new deploy, no real gas).
//
// Run (needs an ARCHIVE-capable Base Sepolia RPC — free publicnode 403s on anvil_setBalance):
//   ~/.foundry/bin/anvil --fork-url https://base-sepolia.g.alchemy.com/v2/<ALCHEMY_KEY> --silent &
//   npx tsx scripts/chessForkE2E.mts
// The harness itself only talks to the local fork (127.0.0.1:8545) — no key in this file.
//
// It drives a full Fool's-mate game: createGame -> joinGame -> moves (white via direct
// makeMove, black via the popup-free signed makeMoveBySig) -> checkmate -> auto-payout,
// using the ACTUAL frontend code (ABI + decoders + EIP-712 signing) the app will use.

import {
  createPublicClient, createWalletClient, createTestClient, http, parseEther, zeroAddress,
  decodeEventLog, formatEther, type Address,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

import { LAWB_CHESS_ABI } from '../src/config/lawbChessAbi';
import {
  decodeOnchainBoard, parseGameTuple, GameStatus, Side, WagerKind,
} from '../src/utils/lawbChessBoard';
import { stringToCode, generateMoveKey, signMoveWithKey } from '../src/utils/lawbChessMoves';

const RPC = 'http://127.0.0.1:8545';
const CONTRACT = '0xCF4131302Ed9685309F2c1Ca01b282409D1fBCE4' as Address;
const CHAIN_ID = baseSepolia.id; // 84532, preserved by the fork

// Fresh random accounts — NOT anvil's default dev keys. Those well-known keys correspond
// to addresses that already carry EIP-7702 delegations on real Base Sepolia, which the fork
// inherits (so a payout call{value} would hit delegated code instead of a plain EOA).
const white = privateKeyToAccount(generatePrivateKey());
const black = privateKeyToAccount(generatePrivateKey());
const relayer = privateKeyToAccount(generatePrivateKey());

const pub = createPublicClient({ chain: baseSepolia, transport: http(RPC) });
const test = createTestClient({ chain: baseSepolia, mode: 'anvil', transport: http(RPC) });
const wWhite = createWalletClient({ account: white, chain: baseSepolia, transport: http(RPC) });
const wBlack = createWalletClient({ account: black, chain: baseSepolia, transport: http(RPC) });
const wRelayer = createWalletClient({ account: relayer, chain: baseSepolia, transport: http(RPC) });

let failures = 0;
function ok(cond: boolean, msg: string) {
  console.log(`${cond ? '  ✓' : '  ✗ FAIL:'} ${msg}`);
  if (!cond) failures++;
}
const sq = (file: string, rank: number) => (rank - 1) * 8 + (file.charCodeAt(0) - 97);

async function readGame(code: `0x${string}`) {
  const raw = await pub.readContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'games', args: [code] });
  return parseGameTuple(raw as Parameters<typeof parseGameTuple>[0]);
}
async function mined(hash: `0x${string}`) {
  return pub.waitForTransactionReceipt({ hash });
}

async function main() {
  const code = stringToCode('e2e' + Math.floor(Date.now() / 1000).toString(36).slice(-3));
  const wager = parseEther('0.01');
  console.log(`\nLawbChess fork E2E  contract=${CONTRACT}  code=${code}\n`);

  // fund the fresh EOAs and confirm they carry no code (no 7702 delegation pollution)
  console.log('0. fund fresh accounts');
  for (const acct of [white, black, relayer]) {
    await test.setBalance({ address: acct.address, value: parseEther('100') });
    const c = await pub.getBytecode({ address: acct.address });
    ok(c === undefined || c === '0x', `clean EOA ${acct.address.slice(0, 10)}…`);
  }

  // ---- create (native wager) ----
  console.log('1. createGame (native, 0.01 ETH)');
  await mined(await wWhite.writeContract({
    address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'createGame',
    args: [code, WagerKind.NATIVE, zeroAddress, wager, 600, 0], value: wager,
  }));
  let g = await readGame(code);
  ok(g.white.toLowerCase() === white.address.toLowerCase(), 'creator recorded as white');
  ok(g.status === GameStatus.OPEN, 'status OPEN');
  ok(g.side === Side.WHITE, 'white to move');
  const startBoard = decodeOnchainBoard(g.board);
  ok(JSON.stringify(startBoard[0]) === JSON.stringify(['R','N','B','Q','K','B','N','R']), 'decoded start: white back rank');
  ok(startBoard[7][3] === 'q' && startBoard[7][4] === 'k', 'decoded start: black queen/king on d8/e8');

  // ---- join ----
  console.log('2. joinGame (black)');
  await mined(await wBlack.writeContract({
    address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'joinGame', args: [code], value: wager,
  }));
  g = await readGame(code);
  ok(g.status === GameStatus.ACTIVE, 'status ACTIVE after join');
  ok(g.black.toLowerCase() === black.address.toLowerCase(), 'joiner recorded as black');
  const escrow = await pub.getBalance({ address: CONTRACT });
  ok(escrow >= wager * 2n, `contract holds both stakes (${formatEther(escrow)} ETH)`);

  // ---- black registers an ephemeral move-key for the popup-free path ----
  console.log('3. registerMoveKey (black, session key)');
  const moveKey = generateMoveKey();
  await mined(await wBlack.writeContract({
    address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'registerMoveKey', args: [code, moveKey.address],
  }));
  g = await readGame(code);
  ok(g.blackMoveKey.toLowerCase() === moveKey.address.toLowerCase(), 'black move-key registered');

  // helper: black move via signed makeMoveBySig submitted by the relayer (no black wallet popup)
  async function blackSigMove(from: number, to: number, promo = 0) {
    const cur = await readGame(code);
    const sig = await signMoveWithKey(moveKey.privateKey, CHAIN_ID, CONTRACT, { code, nonce: cur.moveNonce, from, to, promo });
    return mined(await wRelayer.writeContract({
      address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'makeMoveBySig',
      args: [code, from, to, promo, cur.moveNonce, sig],
    }));
  }
  async function whiteMove(from: number, to: number, promo = 0) {
    return mined(await wWhite.writeContract({
      address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'makeMove', args: [code, from, to, promo],
    }));
  }

  // ---- Fool's mate: 1. f3 e5  2. g4 Qh4#  -> black wins ----
  console.log('4. moves (white=direct makeMove, black=signed makeMoveBySig)');
  await whiteMove(sq('f', 2), sq('f', 3));               // 1. f3
  g = await readGame(code); ok(g.side === Side.BLACK, '  after 1.f3 -> black to move');
  await blackSigMove(sq('e', 7), sq('e', 5));            // 1... e5  (relayed)
  g = await readGame(code);
  ok(g.side === Side.WHITE, '  after 1...e5 -> white to move');
  ok(decodeOnchainBoard(g.board)[4][4] === 'p', '  decoded: black pawn now on e5');

  await whiteMove(sq('g', 2), sq('g', 4));               // 2. g4
  const before = await pub.getBalance({ address: black.address });
  const mateRc = await blackSigMove(sq('d', 8), sq('h', 4)); // 2... Qh4#  (relayed -> black pays no gas)

  // ---- settlement ----
  console.log('5. settlement (auto-payout)');
  g = await readGame(code);
  ok(g.status === GameStatus.FINISHED, 'status FINISHED after checkmate');

  const ended = mateRc.logs
    .map((l) => { try { return decodeEventLog({ abi: LAWB_CHESS_ABI, data: l.data, topics: l.topics }); } catch { return null; } })
    .find((e) => e?.eventName === 'GameEnded') as any;
  ok(!!ended, 'GameEnded event emitted');
  if (ended) {
    ok(ended.args.winner.toLowerCase() === black.address.toLowerCase(), 'winner = black (checkmating side)');
    const feeBps = await pub.readContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'houseFeeBps' }) as number;
    const pot = wager * 2n;
    const fee = (pot * BigInt(feeBps)) / 10000n;
    ok(ended.args.payout === pot - fee, `payout = pot - fee (${formatEther(ended.args.payout)} ETH, feeBps=${feeBps})`);
    const after = await pub.getBalance({ address: black.address });
    console.log(`     before=${formatEther(before)} after=${formatEther(after)} delta=${formatEther(after - before)} payout=${formatEther(ended.args.payout)}`);
    ok(after - before === ended.args.payout, 'black balance increased by exactly payout (relayer paid the gas)');
    const accrued = await pub.readContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'accruedFees', args: [zeroAddress] }) as bigint;
    ok(accrued === fee, 'house fee retained as accruedFees (escrow never drained)');
    const left = await pub.getBalance({ address: CONTRACT });
    ok(left === fee, 'contract balance == fee only (both stakes released)');
  }

  console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('\n💥 harness error:', e); process.exit(1); });
