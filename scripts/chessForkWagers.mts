// Fork E2E for the ERC-20 and ERC-721 wager paths against the real deployed LawbChess on a
// local Base Sepolia fork. Deploys mock tokens, allowlists them (impersonating the owner),
// and exercises the exact ABI calls the frontend hooks make (approve -> create -> join ->
// resign -> payout). No real funds, no testnet NFTs needed.
//
// Run (archive-capable fork RPC required):
//   ~/.foundry/bin/anvil --fork-url https://base-sepolia.g.alchemy.com/v2/<KEY> --silent &
//   npx tsx scripts/chessForkWagers.mts

import { createRequire } from 'node:module';
import {
  createPublicClient, createWalletClient, createTestClient, http, parseEther, formatEther, type Address,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { LAWB_CHESS_ABI } from '../src/config/lawbChessAbi';
import { stringToCode } from '../src/utils/lawbChessMoves';
import { WagerKind } from '../src/utils/lawbChessBoard';

const require = createRequire(import.meta.url);
const MockERC20 = require('../onchain-chess/out/LawbChess.t.sol/MockERC20.json');
const MockERC721 = require('../onchain-chess/out/LawbChess.t.sol/MockERC721.json');

const RPC = 'http://127.0.0.1:8545';
const CONTRACT = '0xCF4131302Ed9685309F2c1Ca01b282409D1fBCE4' as Address;
const OWNER = '0x170FA63c701b00651f475948b512Ae9F45E735Ad' as Address; // testnet deployer = proxy owner

const pub = createPublicClient({ chain: baseSepolia, transport: http(RPC) });
const test = createTestClient({ chain: baseSepolia, mode: 'anvil', transport: http(RPC) });

const white = privateKeyToAccount(generatePrivateKey());
const black = privateKeyToAccount(generatePrivateKey());
const wWhite = createWalletClient({ account: white, chain: baseSepolia, transport: http(RPC) });
const wBlack = createWalletClient({ account: black, chain: baseSepolia, transport: http(RPC) });
const wOwner = createWalletClient({ account: OWNER, chain: baseSepolia, transport: http(RPC) });

let failures = 0;
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ✓' : '  ✗ FAIL:'} ${m}`); if (!c) failures++; };
const mined = (hash: `0x${string}`) => pub.waitForTransactionReceipt({ hash });

async function deploy(artifact: { abi: unknown[]; bytecode: { object: string } }): Promise<Address> {
  const bytecode = (artifact.bytecode.object.startsWith('0x') ? artifact.bytecode.object : `0x${artifact.bytecode.object}`) as `0x${string}`;
  const hash = await wWhite.deployContract({ abi: artifact.abi as never, bytecode, args: [] });
  const rc = await mined(hash);
  return rc.contractAddress as Address;
}

async function main() {
  console.log(`\nLawbChess fork wager E2E  contract=${CONTRACT}\n`);
  // fund players + owner; impersonate owner for allowlisting
  for (const a of [white.address, black.address, OWNER]) await test.setBalance({ address: a, value: parseEther('100') });
  await test.impersonateAccount({ address: OWNER });

  // ---------------------------------------------------------------- ERC-20 ----
  console.log('ERC-20 wager (create -> join -> resign -> payout):');
  const tok = await deploy(MockERC20);
  const wager = parseEther('10');
  await mined(await wWhite.writeContract({ address: tok, abi: MockERC20.abi, functionName: 'mint', args: [white.address, wager] }));
  await mined(await wBlack.writeContract({ address: tok, abi: MockERC20.abi, functionName: 'mint', args: [black.address, wager] }));
  await mined(await wOwner.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'setAllowedToken', args: [tok, true] }));
  ok(await pub.readContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'allowedToken', args: [tok] }) as boolean, 'token allowlisted');

  const code20 = stringToCode('e20' + Math.floor(Date.now() / 1000).toString(36).slice(-3));
  await mined(await wWhite.writeContract({ address: tok, abi: MockERC20.abi, functionName: 'approve', args: [CONTRACT, wager] }));
  await mined(await wWhite.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'createGame', args: [code20, WagerKind.ERC20, tok, wager, 600, 0] }));
  await mined(await wBlack.writeContract({ address: tok, abi: MockERC20.abi, functionName: 'approve', args: [CONTRACT, wager] }));
  await mined(await wBlack.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'joinGame', args: [code20] }));
  ok((await pub.getBalance({ address: white.address })) > 0n, 'erc20 game active');
  // white resigns -> black wins
  await mined(await wWhite.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'resign', args: [code20] }));
  const feeBps = await pub.readContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'houseFeeBps' }) as number;
  const pot = wager * 2n;
  const fee = (pot * BigInt(feeBps)) / 10000n;
  const blackBal = await pub.readContract({ address: tok, abi: MockERC20.abi, functionName: 'balanceOf', args: [black.address] }) as bigint;
  const accrued = await pub.readContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'accruedFees', args: [tok] }) as bigint;
  ok(blackBal === pot - fee, `winner received pot - fee (${formatEther(blackBal)} MOCK)`);
  ok(accrued === fee, `house fee accrued (${formatEther(accrued)} MOCK)`);

  // --------------------------------------------------------------- ERC-721 ----
  console.log('ERC-721 wager (create -> join -> resign -> winner takes both):');
  const nft = await deploy(MockERC721);
  await mined(await wWhite.writeContract({ address: nft, abi: MockERC721.abi, functionName: 'mint', args: [white.address, 1n] }));
  await mined(await wBlack.writeContract({ address: nft, abi: MockERC721.abi, functionName: 'mint', args: [black.address, 2n] }));
  await mined(await wOwner.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'setAllowedNftCollection', args: [nft, true] }));

  const code721 = stringToCode('e71' + Math.floor(Date.now() / 1000).toString(36).slice(-3));
  await mined(await wWhite.writeContract({ address: nft, abi: MockERC721.abi, functionName: 'setApprovalForAll', args: [CONTRACT, true] }));
  await mined(await wWhite.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'createGameERC721', args: [code721, nft, 1n, 600, 0] }));
  await mined(await wBlack.writeContract({ address: nft, abi: MockERC721.abi, functionName: 'setApprovalForAll', args: [CONTRACT, true] }));
  await mined(await wBlack.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'joinGameERC721', args: [code721, 2n] }));
  // black resigns -> white wins both NFTs
  await mined(await wBlack.writeContract({ address: CONTRACT, abi: LAWB_CHESS_ABI, functionName: 'resign', args: [code721] }));
  const owner1 = await pub.readContract({ address: nft, abi: MockERC721.abi, functionName: 'ownerOf', args: [1n] }) as Address;
  const owner2 = await pub.readContract({ address: nft, abi: MockERC721.abi, functionName: 'ownerOf', args: [2n] }) as Address;
  ok(owner1.toLowerCase() === white.address.toLowerCase(), 'winner owns NFT #1');
  ok(owner2.toLowerCase() === white.address.toLowerCase(), 'winner owns NFT #2 (took both)');

  console.log(`\n${failures === 0 ? '✅ ALL WAGER CHECKS PASSED' : `❌ ${failures} FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('\n💥 harness error:', e); process.exit(1); });
