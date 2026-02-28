/**
 * lawb-points.js — Lawb Ecosystem Points & Rewards Engine
 *
 * Unified points/rewards system across all Lawb platforms:
 * - Points: awarded for chess, stream participation, world games, holdings
 * - Rewards: claimable $CLAWB/$LAWB tokens tracked in Firebase
 * - Bounties: milestone-based prizes (first to X points, first to beat Clawb, etc.)
 * - Retake linking: connects stream viewer usernames to wallet addresses
 *
 * Firebase paths managed:
 *   leaderboard/{wallet}                — points + breakdown (shared with frontend)
 *   profiles/{wallet}/claimable         — pending token rewards
 *   retake_links/{retake_username}      — viewer <-> wallet mapping
 *   retake_points/{retake_username}     — unclaimed points (pre-link)
 *   bounties/{bountyId}                 — bounty definitions + status
 *   bounty_claims/{pushId}              — claim records for processing
 *   claims/{pushId}                     — manual reward claim requests
 */

import { db } from './lawb-firebase.js';

// ---------------------------------------------------------------------------
// Tunable point values per action
// ---------------------------------------------------------------------------
export const POINT_VALUES = {
  chess_win: 3,
  chess_draw: 1,
  chess_beat_clawb: 5,
  stream_command: 1,    // per command (rate-limited)
  stream_hourly: 1,     // passive watch (per interval)
  game_race_win: 5,
  game_prediction: 3,
  game_treasure: 2,
};

// $CLAWB reward amounts per action (human-readable units, 18 decimals on-chain)
export const REWARD_VALUES = {
  chess_win: 50,
  chess_draw: 10,
  chess_beat_clawb: 200,
  game_race_win: 100,
  game_prediction: 50,
  game_treasure: 25,
  stream_hourly: 10,
  weekly_rank_1: 1000,
  weekly_rank_2: 500,
  weekly_rank_3: 250,
};

const CLAWB_WALLET = '0x5bba58218914f2e9b6b5434e0306fa2c6ca0e429';
const IS_EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const IS_SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const FIRST_WIN_BOUNTY_IDS = {
  VS_CLAWB_SOL_CLAWB_5M: 'first_vs_clawb_win_sol_clawb_5m',
  PVP_WIN_KEMONOKAKI_9978: 'first_pvp_win_kemonokaki_9978',
};

// ---------------------------------------------------------------------------
// Retake <-> Wallet Linking
// ---------------------------------------------------------------------------

export async function linkRetakeViewer(retakeUsername, walletAddress) {
  const isEvm = IS_EVM_ADDRESS.test(walletAddress);
  const isSolana = IS_SOLANA_ADDRESS.test(walletAddress);
  if (!isEvm && !isSolana) {
    return { success: false, error: 'invalid wallet address. use EVM (0x...) or Solana format.' };
  }

  const normalized = retakeUsername.toLowerCase().trim();
  const wallet = isEvm ? walletAddress.toLowerCase() : walletAddress;

  const existing = await db.ref(`retake_links/${normalized}`).once('value');
  if (existing.exists() && existing.val().wallet !== wallet) {
    return { success: false, error: 'already linked to a different wallet.' };
  }

  await db.ref(`retake_links/${normalized}`).set({
    wallet,
    chain: isEvm ? 'evm' : 'solana',
    linked_at: Date.now(),
  });

  await transferUnclaimedPoints(normalized, wallet);
  console.log(`[LawbPoints] linked ${normalized} → ${wallet}`);
  return { success: true, wallet };
}

export async function getLinkedWallet(retakeUsername) {
  const normalized = retakeUsername.toLowerCase().trim();
  const snap = await db.ref(`retake_links/${normalized}`).once('value');
  if (!snap.exists()) return null;
  return snap.val().wallet;
}

async function transferUnclaimedPoints(retakeUsername, wallet) {
  const normalized = retakeUsername.toLowerCase().trim();
  const snap = await db.ref(`retake_points/${normalized}`).once('value');
  if (!snap.exists()) return;

  const unclaimed = snap.val();
  for (const [source, amount] of Object.entries(unclaimed)) {
    if (source === 'total' || source === 'updated_at') continue;
    if (typeof amount === 'number' && amount > 0) {
      await addPoints(wallet, source, amount);
    }
  }

  await db.ref(`retake_points/${normalized}`).remove();
  console.log(`[LawbPoints] transferred unclaimed points from ${normalized} to ${wallet}`);
}

// ---------------------------------------------------------------------------
// Points
// ---------------------------------------------------------------------------

/**
 * Award points to a wallet address or retake username.
 * If the identifier is a retake username without a linked wallet, points are
 * stored under retake_points/ for later transfer.
 *
 * @param {string} identifier  Wallet address (EVM/Solana) or retake username
 * @param {string} source      Category key: 'chess' | 'stream' | 'games' | 'holdings'
 * @param {number} amount      Points to add (positive integer)
 */
export async function addPoints(identifier, source, amount) {
  if (!identifier || amount <= 0) return false;

  let wallet = identifier;
  const isEvm = IS_EVM_ADDRESS.test(wallet);
  const isSolana = IS_SOLANA_ADDRESS.test(wallet);

  if (!isEvm && !isSolana) {
    const linked = await getLinkedWallet(identifier);
    if (linked) {
      wallet = linked;
    } else {
      const key = identifier.toLowerCase().trim();
      const ref = db.ref(`retake_points/${key}`);
      const snap = await ref.once('value');
      const current = snap.exists() ? snap.val() : {};
      await ref.set({
        ...current,
        [source]: (current[source] || 0) + amount,
        total: (current.total || 0) + amount,
        updated_at: Date.now(),
      });
      console.log(`[LawbPoints] +${amount} ${source} pts stored for unlinked viewer ${identifier}`);
      return true;
    }
  }

  if (isEvm) wallet = wallet.toLowerCase();

  const entryRef = db.ref(`leaderboard/${wallet}`);
  const snap = await entryRef.once('value');
  const entry = snap.exists() ? snap.val() : null;

  const now = new Date().toISOString();
  const breakdown = entry?.points_breakdown || {
    chess: entry?.points || 0,
    stream: 0,
    games: 0,
    holdings: 0,
  };
  breakdown[source] = (breakdown[source] || 0) + amount;

  const totalPoints = Object.values(breakdown).reduce(
    (sum, v) => sum + (typeof v === 'number' ? v : 0),
    0,
  );

  const updates = {
    points: totalPoints,
    points_breakdown: breakdown,
    updated_at: now,
  };
  if (!entry) {
    updates.username = wallet;
    updates.chain_type = 'base';
    updates.wins = 0;
    updates.losses = 0;
    updates.draws = 0;
    updates.total_games = 0;
    updates.created_at = now;
  }

  await entryRef.update(updates);
  console.log(`[LawbPoints] +${amount} ${source} pts → ${wallet} (total: ${totalPoints})`);

  await checkBounties(wallet, totalPoints);
  return true;
}

// ---------------------------------------------------------------------------
// Claimable Rewards ($CLAWB / $LAWB)
// ---------------------------------------------------------------------------

export async function addClaimableReward(wallet, token, amount) {
  if (!wallet || amount <= 0) return;
  const key = wallet.toLowerCase();
  const ref = db.ref(`profiles/${key}/claimable`);
  const snap = await ref.once('value');
  const current = snap.exists() ? snap.val() : { clawb: 0, lawb: 0 };
  await ref.set({
    ...current,
    [token]: (current[token] || 0) + amount,
    updated_at: Date.now(),
  });
  console.log(`[LawbPoints] +${amount} $${token.toUpperCase()} claimable → ${key}`);
}

export async function getClaimableBalance(wallet) {
  const ref = db.ref(`profiles/${wallet.toLowerCase()}/claimable`);
  const snap = await ref.once('value');
  if (!snap.exists()) return { clawb: 0, lawb: 0 };
  const data = snap.val();
  return { clawb: data.clawb || 0, lawb: data.lawb || 0 };
}

// ---------------------------------------------------------------------------
// Bounties
// ---------------------------------------------------------------------------

export async function createBounty(bountyData) {
  const id = bountyData.id || `bounty_${Date.now()}`;
  await db.ref(`bounties/${id}`).set({
    id,
    title: bountyData.title,
    description: bountyData.description,
    type: bountyData.type, // 'points_milestone' | 'chess_beat_clawb' | 'chess_wins' | 'custom'
    condition: bountyData.condition || {},
    prize: bountyData.prize,
    status: 'active',
    claimed_by: null,
    claimed_at: null,
    created_by: bountyData.created_by || 'admin',
    created_at: new Date().toISOString(),
    expires_at: bountyData.expires_at || null,
  });
  console.log(`[LawbPoints] bounty created: ${id} — ${bountyData.title}`);
  return id;
}

export async function getActiveBounties() {
  const snap = await db.ref('bounties').orderByChild('status').equalTo('active').once('value');
  if (!snap.exists()) return [];
  const bounties = [];
  snap.forEach((child) => bounties.push(child.val()));
  return bounties;
}

export async function getBountyById(bountyId) {
  const snap = await db.ref(`bounties/${bountyId}`).once('value');
  return snap.exists() ? snap.val() : null;
}

/**
 * Check all active bounties after a points update.
 * Auto-claims if the wallet meets a bounty's condition.
 */
export async function checkBounties(wallet, totalPoints) {
  try {
    const bounties = await getActiveBounties();
    for (const bounty of bounties) {
      if (bounty.type === 'points_milestone' && bounty.condition?.points_threshold) {
        if (totalPoints >= bounty.condition.points_threshold) {
          await claimBounty(bounty.id, wallet);
        }
      }
    }
  } catch (err) {
    console.warn(`[LawbPoints] bounty check failed: ${err.message}`);
  }
}

/**
 * Check chess-specific bounties after a game ends.
 * Call this from the chess watcher or frontend after a vs-Clawb win.
 */
export async function checkChessBounties(wallet, result, opponent) {
  if (result !== 'win') return;
  const isVsClawb = opponent?.toLowerCase() === CLAWB_WALLET;
  if (!isVsClawb) return;

  try {
    const bounties = await getActiveBounties();
    for (const bounty of bounties) {
      if (bounty.type === 'chess_beat_clawb') {
        await claimBounty(bounty.id, wallet);
      }
    }
  } catch (err) {
    console.warn(`[LawbPoints] chess bounty check failed: ${err.message}`);
  }
}

async function claimBounty(bountyId, wallet) {
  const bountyRef = db.ref(`bounties/${bountyId}`);
  const snap = await bountyRef.once('value');
  if (!snap.exists()) return;

  const bounty = snap.val();
  if (bounty.status !== 'active') return;

  await bountyRef.update({
    status: 'claimed',
    claimed_by: wallet,
    claimed_at: new Date().toISOString(),
  });

  if (bounty.prize?.token && bounty.prize?.amount) {
    await addClaimableReward(wallet, bounty.prize.token, bounty.prize.amount);
  }

  await db.ref('bounty_claims').push().set({
    bounty_id: bountyId,
    bounty_title: bounty.title,
    wallet,
    prize: bounty.prize,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  console.log(`[LawbPoints] *** BOUNTY CLAIMED *** ${bounty.title} → ${wallet}`);
}

function normalizeWallet(wallet) {
  if (!wallet) return wallet;
  return IS_EVM_ADDRESS.test(wallet) ? wallet.toLowerCase() : wallet;
}

async function claimBountyToQueue(bountyId, wallet, claimContext = {}) {
  const normalizedWallet = normalizeWallet(wallet);
  const bountyRef = db.ref(`bounties/${bountyId}`);
  const nowIso = new Date().toISOString();
  // Prime server value before transaction. RTDB transactions can invoke callback
  // with null on first run; use the fetched snapshot as fallback.
  const seededSnap = await bountyRef.once('value');
  const seeded = seededSnap.exists() ? seededSnap.val() : null;

  const txResult = await bountyRef.transaction((current) => {
    const base = current || seeded;
    if (!base || base.status !== 'active') return;
    return {
      ...base,
      status: 'claimed',
      claimed_by: normalizedWallet,
      claimed_at: nowIso,
    };
  });

  if (!txResult.committed || !txResult.snapshot?.exists()) {
    return { success: false, reason: 'inactive_or_missing' };
  }

  const bounty = txResult.snapshot.val();
  const prize = bounty.prize || {};
  const requiresWalletType =
    prize.chain === 'solana' ? 'solana' :
    prize.chain === 'base' ? 'evm' :
    'any';

  let payoutWallet = normalizedWallet;
  if (requiresWalletType === 'solana' && !IS_SOLANA_ADDRESS.test(String(normalizedWallet || ''))) {
    payoutWallet = null;
  }
  if (requiresWalletType === 'evm' && !IS_EVM_ADDRESS.test(String(normalizedWallet || ''))) {
    payoutWallet = null;
  }

  const claimRef = db.ref('bounty_claims').push();
  await claimRef.set({
    bounty_id: bountyId,
    bounty_title: bounty.title,
    wallet: normalizedWallet,
    payout_wallet: payoutWallet,
    requires_wallet_type: requiresWalletType,
    prize,
    context: claimContext,
    status: 'pending_approval',
    created_at: nowIso,
    processed_at: null,
    completed_at: null,
    tx_hash: null,
    error: null,
  });

  console.log(`[LawbPoints] queued bounty claim ${bountyId} for ${normalizedWallet} (${claimRef.key})`);
  return { success: true, claim_id: claimRef.key };
}

export async function enqueueVsClawbFirstWinBounty(wallet, claimContext = {}) {
  return claimBountyToQueue(FIRST_WIN_BOUNTY_IDS.VS_CLAWB_SOL_CLAWB_5M, wallet, {
    source: 'vs_clawb',
    ...claimContext,
  });
}

export async function enqueuePvpFirstWinBounty(wallet, claimContext = {}) {
  return claimBountyToQueue(FIRST_WIN_BOUNTY_IDS.PVP_WIN_KEMONOKAKI_9978, wallet, {
    source: 'pvp',
    ...claimContext,
  });
}

// ---------------------------------------------------------------------------
// Viewer Stats (for !points / !rank commands)
// ---------------------------------------------------------------------------

export async function getViewerStats(retakeUsername) {
  const wallet = await getLinkedWallet(retakeUsername);

  if (wallet) {
    const snap = await db.ref(`leaderboard/${wallet}`).once('value');
    if (snap.exists()) {
      const entry = snap.val();
      return {
        linked: true,
        wallet,
        points: entry.points || 0,
        breakdown: entry.points_breakdown || { chess: entry.points || 0 },
      };
    }
    return { linked: true, wallet, points: 0, breakdown: {} };
  }

  const snap = await db.ref(`retake_points/${retakeUsername.toLowerCase().trim()}`).once('value');
  if (snap.exists()) {
    const data = snap.val();
    return { linked: false, wallet: null, points: data.total || 0, breakdown: data };
  }

  return { linked: false, wallet: null, points: 0, breakdown: {} };
}

export async function getLeaderboardRank(wallet) {
  const allSnap = await db.ref('leaderboard').once('value');
  if (!allSnap.exists()) return { rank: null, total: 0 };

  const entries = [];
  allSnap.forEach((child) => entries.push(child.val()));
  entries.sort((a, b) => (b.points || 0) - (a.points || 0));

  const idx = entries.findIndex(
    (e) => e.username?.toLowerCase() === wallet.toLowerCase(),
  );
  return { rank: idx >= 0 ? idx + 1 : null, total: entries.length };
}

// ---------------------------------------------------------------------------
// Seed default bounties (runs once on first boot)
// ---------------------------------------------------------------------------

export async function seedDefaultBounties() {
  const defaults = [
    {
      id: 'first_100_pts',
      title: 'Century Club',
      description: 'First player to reach 100 total points',
      type: 'points_milestone',
      condition: { points_threshold: 100 },
      prize: { token: 'clawb', amount: 5000, chain: 'base' },
    },
    {
      id: 'first_1000_pts',
      title: 'Reef Legend',
      description: 'First player to reach 1,000 total points',
      type: 'points_milestone',
      condition: { points_threshold: 1000 },
      prize: { token: 'clawb', amount: 25000, chain: 'base' },
    },
    {
      id: 'first_10000_pts',
      title: 'Ocean Emperor',
      description: 'First player to reach 10,000 total points',
      type: 'points_milestone',
      condition: { points_threshold: 10000 },
      prize: { token: 'clawb', amount: 100000, chain: 'base' },
    },
    {
      id: FIRST_WIN_BOUNTY_IDS.VS_CLAWB_SOL_CLAWB_5M,
      title: 'First Blood: VS Clawb',
      description: 'First player to defeat Clawb in a vs Clawb match wins 5,000,000 $CLAWB on Solana',
      type: 'custom',
      condition: { mode: 'vs_clawb', first_only: true },
      prize: {
        type: 'token',
        token: 'clawb',
        amount: 5_000_000,
        chain: 'solana',
        mint: process.env.SOL_CLAWB_MINT || null,
        decimals: Number(process.env.SOL_CLAWB_DECIMALS || 6),
      },
    },
    {
      id: FIRST_WIN_BOUNTY_IDS.PVP_WIN_KEMONOKAKI_9978,
      title: 'Clawb Hunter: Wager PVP',
      description: 'First player to defeat Clawb in a wagered Base PVP match wins Kemonokaki #9978',
      type: 'custom',
      condition: { mode: 'pvp_wager_base', first_only: true },
      prize: {
        type: 'nft',
        chain: 'base',
        contract: process.env.BASE_KEMONOKAKI_CONTRACT || null,
        token_id: Number(process.env.BASE_KEMONOKAKI_TOKEN_ID || 9978),
        collection: 'kemonokaki',
      },
    },
  ];

  const legacyRef = db.ref('bounties/beat_clawb_chess');
  const legacySnap = await legacyRef.once('value');
  if (legacySnap.exists()) {
    const legacy = legacySnap.val();
    if (legacy?.status === 'active') {
      await legacyRef.update({
        status: 'expired',
        expired_at: new Date().toISOString(),
        expiry_reason: 'replaced_by_first_win_bounty_queue',
      });
      console.log('[LawbPoints] expired legacy beat_clawb_chess bounty');
    }
  }

  let created = 0;
  for (const b of defaults) {
    const existingSnap = await db.ref(`bounties/${b.id}`).once('value');
    if (!existingSnap.exists()) {
      await createBounty(b);
      created++;
    }
  }
  console.log(`[LawbPoints] seeded ${created} missing default bounties`);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

export async function startLawbPoints() {
  console.log('[LawbPoints] initializing...');
  if (!process.env.SOL_CLAWB_MINT) {
    console.warn('[LawbPoints] SOL_CLAWB_MINT missing — Solana first-win payout cannot execute until configured.');
  }
  if (!process.env.BASE_KEMONOKAKI_CONTRACT) {
    console.warn('[LawbPoints] BASE_KEMONOKAKI_CONTRACT missing — Kemonokaki first-win payout cannot execute until configured.');
  }
  await seedDefaultBounties();
  console.log('[LawbPoints] ready. the reef rewards those who participate.');
  return () => {};
}
