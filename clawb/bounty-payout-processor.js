/**
 * bounty-payout-processor.js
 *
 * Processes bounty_claims in safe queue mode:
 * pending_approval -> approved -> processing -> completed/failed
 *
 * Only approved claims are executed.
 */

import { db } from './lawb-firebase.js';
import { ethers } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import bs58 from 'bs58';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} from '@solana/spl-token';

const CLAWB_WALLET = '0x5bba58218914f2e9b6b5434e0306fa2c6ca0e429';
const BOUNTY_IDS = {
  VS_CLAWB_SOL_CLAWB_5M: 'first_vs_clawb_win_sol_clawb_5m',
  PVP_WIN_KEMONOKAKI_9978: 'first_pvp_win_kemonokaki_9978',
};

const ERC721_ABI = [
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
];

const DEFAULT_POLL_MS = Number(process.env.BOUNTY_PAYOUT_POLL_MS || 12000);
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const AUTO_APPROVE = envBool('BOUNTY_AUTO_APPROVE', true);

function nowIso() {
  return new Date().toISOString();
}

function isEvmAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || ''));
}

function isSolAddress(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || ''));
}

function envBool(name, fallback = false) {
  if (process.env[name] == null) return fallback;
  return String(process.env[name]).toLowerCase() === 'true';
}

function normalizeWallet(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  return isEvmAddress(s) ? s.toLowerCase() : s;
}

function resolveWinnerWallet(game) {
  const winner = String(game?.winner || '').trim();
  if (!winner) return '';
  if (winner === 'blue') return normalizeWallet(game?.blue_player);
  if (winner === 'red') return normalizeWallet(game?.red_player);
  return normalizeWallet(winner);
}

function loadSolanaKeypair() {
  const fromInline = process.env.CLAWB_SOLANA_PRIVATE_KEY?.trim();
  if (fromInline) {
    try {
      if (fromInline.startsWith('[')) {
        const arr = JSON.parse(fromInline);
        return Keypair.fromSecretKey(Uint8Array.from(arr));
      }
      return Keypair.fromSecretKey(bs58.decode(fromInline));
    } catch (err) {
      throw new Error(`Invalid CLAWB_SOLANA_PRIVATE_KEY: ${err?.message || err}`);
    }
  }

  const keypairPath =
    process.env.CLAWB_SOLANA_KEYPAIR_PATH ||
    process.env.RETAKE_SOLANA_KEYPAIR_PATH ||
    './credentials/solana/clawb-retake-wallet.json';
  const absolute = resolve(process.cwd(), keypairPath);
  if (!existsSync(absolute)) {
    throw new Error(`Missing Solana keypair file: ${absolute}`);
  }
  const secret = JSON.parse(readFileSync(absolute, 'utf-8'));
  if (!Array.isArray(secret)) throw new Error('Solana keypair file is not a JSON array');
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function requiredConfigSummary() {
  return {
    solMint: process.env.SOL_CLAWB_MINT || '',
    solDecimals: Number(process.env.SOL_CLAWB_DECIMALS || 6),
    baseNftContract: process.env.BASE_KEMONOKAKI_CONTRACT || '',
    baseNftTokenId: Number(process.env.BASE_KEMONOKAKI_TOKEN_ID || 9978),
    dryRun: envBool('BOUNTY_PAYOUT_DRY_RUN', false),
  };
}

function validateConfig() {
  const cfg = requiredConfigSummary();
  if (!cfg.solMint) console.warn('[BountyPayout] SOL_CLAWB_MINT not set.');
  if (!Number.isFinite(cfg.solDecimals)) console.warn('[BountyPayout] SOL_CLAWB_DECIMALS invalid.');
  if (!cfg.baseNftContract) console.warn('[BountyPayout] BASE_KEMONOKAKI_CONTRACT not set.');
  if (!process.env.CLAWB_PRIVATE_KEY) console.warn('[BountyPayout] CLAWB_PRIVATE_KEY missing (Base payout unavailable).');
  if (!process.env.CLAWB_SOLANA_PRIVATE_KEY && !process.env.CLAWB_SOLANA_KEYPAIR_PATH && !process.env.RETAKE_SOLANA_KEYPAIR_PATH) {
    console.warn('[BountyPayout] No Solana signing key env found (Solana payout unavailable).');
  }
  if (!AUTO_APPROVE) {
    console.warn('[BountyPayout] BOUNTY_AUTO_APPROVE=false, claims require manual approval.');
  }
}

async function getGameForClaim(claim) {
  const gameId = claim?.context?.game_id;
  if (!gameId) return null;
  const snap = await db.ref(`chess_games/${gameId}`).once('value');
  return snap.exists() ? snap.val() : null;
}

async function validateClaimForAutoApproval(claim) {
  const claimWallet = normalizeWallet(claim?.wallet);
  const prize = claim?.prize || {};

  if (!claimWallet) return { ok: false, reason: 'missing_claim_wallet' };
  if (!prize?.type || !prize?.chain) return { ok: false, reason: 'missing_prize_payload' };

  if (claim?.bounty_id === BOUNTY_IDS.VS_CLAWB_SOL_CLAWB_5M) {
    if (prize.type !== 'token' || prize.chain !== 'solana') {
      return { ok: false, reason: 'invalid_vs_clawb_prize' };
    }
    if (!isSolAddress(claim?.payout_wallet || claimWallet)) {
      return { ok: false, reason: 'missing_solana_payout_wallet' };
    }

    const game = await getGameForClaim(claim);
    if (!game) return { ok: false, reason: 'vs_clawb_game_not_found' };
    if (game.game_type !== 'vs_clawb') return { ok: false, reason: 'not_vs_clawb_game' };
    if (game.game_state !== 'finished') return { ok: false, reason: 'vs_clawb_game_not_finished' };

    const winnerWallet = resolveWinnerWallet(game);
    const blueWallet = normalizeWallet(game?.blue_player);
    const redWallet = normalizeWallet(game?.red_player);
    if (redWallet !== CLAWB_WALLET) return { ok: false, reason: 'clawb_not_red_player' };
    if (winnerWallet !== blueWallet || winnerWallet !== claimWallet) {
      return { ok: false, reason: 'winner_wallet_mismatch' };
    }
    return { ok: true };
  }

  if (claim?.bounty_id === BOUNTY_IDS.PVP_WIN_KEMONOKAKI_9978) {
    if (prize.type !== 'nft' || prize.chain !== 'base') {
      return { ok: false, reason: 'invalid_pvp_prize' };
    }
    if (!isEvmAddress(claim?.payout_wallet || claimWallet)) {
      return { ok: false, reason: 'missing_evm_payout_wallet' };
    }

    const game = await getGameForClaim(claim);
    if (!game) return { ok: false, reason: 'pvp_game_not_found' };
    if (game.game_state !== 'finished') return { ok: false, reason: 'pvp_game_not_finished' };
    if (game.chain && game.chain !== 'base') return { ok: false, reason: 'pvp_not_base_chain' };

    const wagerAmount = BigInt(game.bet_amount || 0);
    if (wagerAmount <= 0n) return { ok: false, reason: 'pvp_not_wagered' };

    const redWallet = normalizeWallet(game?.red_player);
    const blueWallet = normalizeWallet(game?.blue_player);
    if (redWallet !== CLAWB_WALLET && blueWallet !== CLAWB_WALLET) {
      return { ok: false, reason: 'clawb_not_in_match' };
    }

    const winnerWallet = resolveWinnerWallet(game);
    if (!winnerWallet || winnerWallet === CLAWB_WALLET) {
      return { ok: false, reason: 'clawb_did_not_lose' };
    }
    if (winnerWallet !== claimWallet) return { ok: false, reason: 'winner_wallet_mismatch' };
    return { ok: true };
  }

  return { ok: false, reason: 'unsupported_bounty_id' };
}

async function processPendingAutoApprovals() {
  if (!AUTO_APPROVE) return;

  const claimsSnap = await db.ref('bounty_claims').once('value');
  const claims = claimsSnap.val() || {};
  for (const [claimId, claim] of Object.entries(claims)) {
    if (claim?.status !== 'pending_approval') continue;

    const check = await validateClaimForAutoApproval(claim);
    const claimRef = db.ref(`bounty_claims/${claimId}`);
    const seededClaim = claim;
    if (check.ok) {
      const tx = await claimRef.transaction((current) => {
        const base = current || seededClaim;
        if (!base || base.status !== 'pending_approval') return;
        return {
          ...base,
          status: 'approved',
          approved_at: nowIso(),
          approved_by: 'clawb_auto_approver',
          approval_reason: 'validated_game_result',
          error: null,
        };
      });
      if (tx.committed) {
        console.log(`[BountyPayout] auto-approved claim ${claimId}`);
      }
    } else {
      const tx = await claimRef.transaction((current) => {
        const base = current || seededClaim;
        if (!base || base.status !== 'pending_approval') return;
        return {
          ...base,
          status: 'rejected',
          processed_at: nowIso(),
          error: `auto_approval_failed:${check.reason}`,
        };
      });
      if (tx.committed) {
        console.warn(`[BountyPayout] rejected claim ${claimId}: ${check.reason}`);
      }
    }
  }
}

async function payoutSolanaToken(claim, claimId, cfg) {
  const recipient = claim.payout_wallet || claim.wallet;
  if (!isSolAddress(recipient)) {
    throw new Error('Missing valid Solana payout wallet on claim');
  }

  if (!cfg.solMint) throw new Error('SOL_CLAWB_MINT is required');
  const decimals = Number(claim?.prize?.decimals ?? cfg.solDecimals);
  if (!Number.isFinite(decimals)) throw new Error('Invalid token decimals');

  const amountWhole = BigInt(claim?.prize?.amount ?? 0);
  if (amountWhole <= 0n) throw new Error('Invalid token payout amount');
  const rawAmount = amountWhole * (10n ** BigInt(decimals));

  if (cfg.dryRun) {
    return `dry_run_solana_${claimId}`;
  }

  const signer = loadSolanaKeypair();
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  const mintPk = new PublicKey(cfg.solMint);
  const recipientPk = new PublicKey(recipient);

  const senderAta = await getOrCreateAssociatedTokenAccount(connection, signer, mintPk, signer.publicKey);
  const recipientAta = await getOrCreateAssociatedTokenAccount(connection, signer, mintPk, recipientPk);
  const tx = new Transaction().add(
    createTransferInstruction(senderAta.address, recipientAta.address, signer.publicKey, rawAmount)
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [signer], { commitment: 'confirmed' });
  return sig;
}

async function payoutBaseNft(claim, claimId, cfg) {
  const recipient = claim.payout_wallet || claim.wallet;
  if (!isEvmAddress(recipient)) {
    throw new Error('Missing valid EVM payout wallet on claim');
  }
  if (!cfg.baseNftContract) throw new Error('BASE_KEMONOKAKI_CONTRACT is required');
  if (!process.env.CLAWB_PRIVATE_KEY) throw new Error('CLAWB_PRIVATE_KEY is required');

  const tokenId = BigInt(claim?.prize?.token_id ?? cfg.baseNftTokenId);
  if (cfg.dryRun) {
    return `dry_run_base_${claimId}`;
  }

  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const signer = new ethers.Wallet(process.env.CLAWB_PRIVATE_KEY, provider);
  const nft = new ethers.Contract(cfg.baseNftContract, ERC721_ABI, signer);
  const tx = await nft.safeTransferFrom(signer.address, recipient, tokenId);
  await tx.wait();
  return tx.hash;
}

async function executeApprovedClaim(claimId, claim, cfg) {
  const claimRef = db.ref(`bounty_claims/${claimId}`);
  const seededClaim = claim;
  const lock = await claimRef.transaction((current) => {
    const base = current || seededClaim;
    if (!base || base.status !== 'approved') return;
    return {
      ...base,
      status: 'processing',
      processing_started_at: nowIso(),
      error: null,
    };
  });
  if (!lock.committed || !lock.snapshot?.exists()) return false;

  const activeClaim = lock.snapshot.val();

  try {
    let txHash = null;
    const prize = activeClaim.prize || {};
    if (prize.type === 'token' && prize.chain === 'solana') {
      txHash = await payoutSolanaToken(activeClaim, claimId, cfg);
    } else if (prize.type === 'nft' && prize.chain === 'base') {
      txHash = await payoutBaseNft(activeClaim, claimId, cfg);
    } else {
      throw new Error(`Unsupported payout type: ${prize.type || 'unknown'}:${prize.chain || 'unknown'}`);
    }

    await claimRef.update({
      status: 'completed',
      tx_hash: txHash,
      processed_at: nowIso(),
      completed_at: nowIso(),
      error: null,
    });
    console.log(`[BountyPayout] completed claim ${claimId} tx=${txHash}`);
    return true;
  } catch (err) {
    await claimRef.update({
      status: 'failed',
      processed_at: nowIso(),
      error: err?.message || String(err),
    });
    console.error(`[BountyPayout] failed claim ${claimId}:`, err?.message || err);
    return false;
  }
}

async function processApprovedClaims() {
  const claimsSnap = await db.ref('bounty_claims').once('value');
  const claims = claimsSnap.val() || {};
  const cfg = requiredConfigSummary();
  const ids = Object.keys(claims);
  for (const id of ids) {
    const claim = claims[id];
    if (claim?.status !== 'approved') continue;
    await executeApprovedClaim(id, claim, cfg);
  }
}

export function startBountyPayoutProcessor() {
  validateConfig();
  console.log(`[BountyPayout] starting (poll ${DEFAULT_POLL_MS}ms, dryRun=${envBool('BOUNTY_PAYOUT_DRY_RUN', false)}, autoApprove=${AUTO_APPROVE})`);

  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await processPendingAutoApprovals();
      await processApprovedClaims();
    } catch (err) {
      console.error('[BountyPayout] loop error:', err?.message || err);
    } finally {
      busy = false;
    }
  }, DEFAULT_POLL_MS);

  return () => {
    clearInterval(timer);
    console.log('[BountyPayout] stopped.');
  };
}

