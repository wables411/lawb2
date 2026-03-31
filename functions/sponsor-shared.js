const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { ethers } = require('ethers');

const BASE_CHAIN_ID = 8453;
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const REQUIRED_CONFIRMATIONS = Number(process.env.SPONSOR_REQUIRED_CONFIRMATIONS || 2);
const MAX_FILE_BYTES = 103809024; // 99 MB hard cap
const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429'.toLowerCase();
const CLAWB_ADSPACE_CONTRACT = '0x4152D2A4283663bb5B677dfC9d0d8924Dd46C3D1'.toLowerCase();
const ADS_ROOT = String(process.env.SPONSOR_DB_ROOT || 'clawb/ads/onchain_indexer').replace(/^\/+|\/+$/g, '');

const TIERS = {
  one_time: {
    id: 'one_time',
    label: 'One-time play',
    fixedWei: ethers.parseEther('0.01').toString(),
    playOnce: true,
  },
  rotation: {
    id: 'rotation',
    label: 'Rotation auction',
    reserveWei: ethers.parseEther('0.02').toString(),
    auctionMs: 24 * 60 * 60 * 1000,
    playOnce: false,
  },
};
const ROTATION_MIN_INCREMENT_WEI = ethers.parseEther('0.001').toString();
const ONE_TIME_EXACT_WEI = ethers.parseEther('0.01').toString();
const ADSPACE_IFACE = new ethers.Interface([
  'function buyOneTimeAd(bytes32 submissionIdHash, string mediaRef) payable',
  'function placeBid(bytes32 submissionIdHash, string mediaRef) payable',
  'function settleAuction()',
  'function minimumNextBid() view returns (uint256)',
  'function currentAuction() view returns (uint256 auctionId, uint256 startAt, uint256 endAt, bool settled, address winner, uint256 highestBid, uint256 nextMinBid, bool extensionUsed)',
  'function pendingRefunds(address) view returns (uint256)',
  'function withdrawRefund()',
]);

const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const RESUMABLE_STATUSES = new Set([
  'PENDING_PAYMENT',
  'PAID',
  'UPLOADED',
  'VERIFIED',
  'QUEUED',
]);

let firebaseApp = null;
const ipHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.SPONSOR_RATE_LIMIT_MAX || 20);

function nowIso() {
  return new Date().toISOString();
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

function getClientIp(event) {
  const xff = event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'];
  if (xff) return xff.split(',')[0].trim();
  return event.headers?.['client-ip'] || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowHits = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  windowHits.push(now);
  ipHits.set(ip, windowHits);
  return windowHits.length > RATE_LIMIT_MAX;
}

function isWallet(address) {
  return ethers.isAddress(address || '');
}

function normalizeAddress(address) {
  return String(address || '').toLowerCase();
}

function normalizeSponsorName(value) {
  return String(value || '').trim();
}

function normalizeWebsiteUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function getTierConfig(tier) {
  return TIERS[tier] || null;
}

function generateSessionId() {
  return `sps_${crypto.randomUUID().replace(/-/g, '')}`;
}

function buildSubmissionIdHash(sessionId) {
  return ethers.keccak256(ethers.toUtf8Bytes(String(sessionId || '')));
}

function getRpcProvider() {
  return new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || DEFAULT_BASE_RPC, BASE_CHAIN_ID);
}

function getAdSpaceContract(providerOrSigner) {
  return new ethers.Contract(CLAWB_ADSPACE_CONTRACT, ADSPACE_IFACE, providerOrSigner);
}

function normalizeTimestampMs(rawValue) {
  const n = Number(rawValue || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 1_000_000_000_000 ? n * 1000 : n;
}

function sanitizeFilename(name) {
  return String(name || 'ad-upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  if (!admin.apps.length) {
    const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const dbUrl = process.env.FIREBASE_DATABASE_URL;
    if (!serviceJson || !dbUrl) {
      throw new Error('Missing Firebase env vars: FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_DATABASE_URL');
    }

    const parsedCreds = JSON.parse(serviceJson);
    const init = {
      credential: admin.credential.cert(parsedCreds),
      databaseURL: dbUrl,
    };
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      init.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    }
    firebaseApp = admin.initializeApp(init);
  } else {
    firebaseApp = admin.app();
  }
  return firebaseApp;
}

function getDb() {
  return getFirebaseApp().database();
}

function adsPath(subPath = '') {
  const clean = String(subPath || '').replace(/^\/+/, '');
  return clean ? `${ADS_ROOT}/${clean}` : ADS_ROOT;
}

function adsRef(subPath = '') {
  return getDb().ref(adsPath(subPath));
}

function getBucket() {
  const app = getFirebaseApp();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || app.options.storageBucket;
  if (!bucketName) {
    throw new Error('Upload storage is not configured. Set FIREBASE_STORAGE_BUCKET.');
  }
  return app.storage().bucket(bucketName);
}

async function getSession(sessionId) {
  const snap = await adsRef(`sessions/${sessionId}`).get();
  return snap.exists() ? snap.val() : null;
}

function pickLatestResumableSession(sessionsById) {
  const entries = Object.entries(sessionsById || {}).filter(([, value]) => {
    const status = String(value?.status || '');
    return RESUMABLE_STATUSES.has(status);
  });
  if (!entries.length) return null;
  entries.sort((a, b) => {
    const aTs = Date.parse(a[1]?.updated_at || a[1]?.created_at || 0);
    const bTs = Date.parse(b[1]?.updated_at || b[1]?.created_at || 0);
    return bTs - aTs;
  });
  const [sessionId, session] = entries[0];
  return { sessionId, session };
}

async function saveSession(sessionId, patch) {
  const timestamp = nowIso();
  await adsRef(`sessions/${sessionId}`).update({
    ...patch,
    updated_at: timestamp,
  });
}

async function pushStatusTransition(sessionId, toStatus, extra = {}) {
  const db = getDb();
  const ts = nowIso();
  await db.ref(adsPath(`sessions/${sessionId}/status_history`)).push({
    to_status: toStatus,
    timestamp: ts,
    ...extra,
  });
  await saveSession(sessionId, { status: toStatus });
}

async function verifyBaseTransfer({ txHash, expectedFrom, minWei }) {
  const provider = getRpcProvider();
  const [tx, receipt, latestBlock] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
    provider.getBlockNumber(),
  ]);

  return evaluateTransferForSession({
    tx,
    receipt,
    latestBlock,
    expectedFrom,
    minWei,
  });
}

async function verifyAdSpacePayment({ txHash, expectedFrom, tier, submissionIdHash }) {
  const provider = getRpcProvider();
  const [tx, receipt, latestBlock] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
    provider.getBlockNumber(),
  ]);

  if (!tx || !receipt) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Transaction not found or pending' };
  }
  const evaluated = evaluateAdSpaceTransaction({
    tx,
    receipt,
    expectedFrom,
    tier,
    submissionIdHash,
  });
  if (!evaluated.ok) return evaluated;

  const confirmations = latestBlock - receipt.blockNumber + 1;
  if (confirmations < REQUIRED_CONFIRMATIONS) {
    return {
      ok: false,
      reason: 'TX_INVALID',
      detail: `Waiting for confirmations (${confirmations}/${REQUIRED_CONFIRMATIONS})`,
      pendingConfirmations: true,
    };
  }

  return {
    ok: true,
    tx,
    receipt,
    confirmations,
    valueWei: tx.value.toString(),
    method: evaluated.method,
  };
}

function evaluateAdSpaceTransaction({ tx, receipt, expectedFrom, tier, submissionIdHash }) {
  if (tx.chainId !== BigInt(BASE_CHAIN_ID)) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Wrong chain' };
  }
  if (!tx.to || tx.to.toLowerCase() !== CLAWB_ADSPACE_CONTRACT) {
    return { ok: false, reason: 'HASH_MISMATCH', detail: 'Tx target is not ClawbAdSpace contract' };
  }
  if (expectedFrom && tx.from.toLowerCase() !== String(expectedFrom).toLowerCase()) {
    return { ok: false, reason: 'HASH_MISMATCH', detail: 'Sender mismatch' };
  }
  if (receipt.status !== 1) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Transaction reverted' };
  }

  let parsed;
  try {
    parsed = ADSPACE_IFACE.parseTransaction({ data: tx.data, value: tx.value });
  } catch {
    return { ok: false, reason: 'HASH_MISMATCH', detail: 'Unsupported contract method' };
  }
  if (!parsed) {
    return { ok: false, reason: 'HASH_MISMATCH', detail: 'Could not decode transaction method' };
  }

  const method = String(parsed.name || '');
  const expectedMethod = tier === 'one_time' ? 'buyOneTimeAd' : 'placeBid';
  if (method !== expectedMethod) {
    return { ok: false, reason: 'HASH_MISMATCH', detail: `Expected ${expectedMethod} transaction` };
  }
  if (submissionIdHash) {
    const txHashArg = String(parsed.args?.[0] || '').toLowerCase();
    if (txHashArg !== String(submissionIdHash).toLowerCase()) {
      return { ok: false, reason: 'HASH_MISMATCH', detail: 'Submission hash mismatch' };
    }
  }
  if (tier === 'one_time' && tx.value.toString() !== ONE_TIME_EXACT_WEI) {
    return { ok: false, reason: 'TX_INVALID', detail: 'One-time payment must be exactly 0.01 ETH' };
  }
  if (tier === 'rotation' && tx.value <= BigInt(0)) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Rotation bid must be greater than 0 ETH' };
  }

  return { ok: true, method };
}

function evaluateTransferForSession({ tx, receipt, latestBlock, expectedFrom, minWei }) {
  if (!tx || !receipt) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Transaction not found or pending' };
  }
  if (tx.chainId !== BigInt(BASE_CHAIN_ID)) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Wrong chain' };
  }
  if (!tx.to || tx.to.toLowerCase() !== CLAWB_WALLET) {
    return { ok: false, reason: 'HASH_MISMATCH', detail: 'Recipient mismatch' };
  }
  if (expectedFrom && tx.from.toLowerCase() !== expectedFrom.toLowerCase()) {
    return { ok: false, reason: 'HASH_MISMATCH', detail: 'Sender mismatch' };
  }
  if (tx.value < BigInt(minWei)) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Underpaid transaction' };
  }
  if (receipt.status !== 1) {
    return { ok: false, reason: 'TX_INVALID', detail: 'Transaction reverted' };
  }
  const confirmations = latestBlock - receipt.blockNumber + 1;
  if (confirmations < REQUIRED_CONFIRMATIONS) {
    return {
      ok: false,
      reason: 'TX_INVALID',
      detail: `Waiting for confirmations (${confirmations}/${REQUIRED_CONFIRMATIONS})`,
      pendingConfirmations: true,
    };
  }

  return {
    ok: true,
    tx,
    receipt,
    confirmations,
    valueWei: tx.value.toString(),
    to: tx.to.toLowerCase(),
    from: tx.from.toLowerCase(),
  };
}

async function checkDuplicateTx(txHash, sessionId) {
  const ref = adsRef(`tx_index/${txHash.toLowerCase()}`);
  const snap = await ref.get();
  if (!snap.exists()) return false;
  const ownerSession = String(snap.val() || '');
  return ownerSession !== sessionId;
}

async function getTxOwnerSession(txHash) {
  const ref = adsRef(`tx_index/${txHash.toLowerCase()}`);
  const snap = await ref.get();
  if (!snap.exists()) return null;
  return String(snap.val() || '');
}

async function reserveTxHash(txHash, sessionId) {
  await adsRef(`tx_index/${txHash.toLowerCase()}`).set(sessionId);
}

async function getOrCreateRotationAuction() {
  const db = getDb();
  const auctionsRef = db.ref(adsPath('rotation_auctions'));
  const activeRef = db.ref(adsPath('rotation_auctions_meta/active_auction_id'));
  const activeSnap = await activeRef.get();
  const activeId = activeSnap.exists() ? String(activeSnap.val()) : '';
  const now = Date.now();

  if (activeId) {
    const activeAuctionSnap = await auctionsRef.child(activeId).get();
    if (activeAuctionSnap.exists()) {
      const active = activeAuctionSnap.val();
      if (Number(active.ends_at_ms || 0) > now) {
        return { auctionId: activeId, auction: active };
      }
    }
  }

  const auctionId = `auc_${now}`;
  const startsAt = now;
  const endsAt = now + TIERS.rotation.auctionMs;
  const auction = {
    auction_id: auctionId,
    starts_at_ms: startsAt,
    ends_at_ms: endsAt,
    reserve_wei: TIERS.rotation.reserveWei,
    highest_bid_wei: '0',
    highest_session_id: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    status: 'active',
  };

  await auctionsRef.child(auctionId).set(auction);
  await activeRef.set(auctionId);
  return { auctionId, auction };
}

function normalizeWei(weiValue) {
  try {
    return BigInt(String(weiValue || '0'));
  } catch {
    return BigInt(0);
  }
}

function computeRotationBidFloorWei(auction) {
  const reserveWei = normalizeWei(auction?.reserve_wei || TIERS.rotation.reserveWei);
  const highestBidWei = normalizeWei(auction?.highest_bid_wei || '0');
  const base = highestBidWei > reserveWei ? highestBidWei : reserveWei;
  return (base + normalizeWei(ROTATION_MIN_INCREMENT_WEI)).toString();
}

function getAuctionLifecycleStatus(auction, nowMs = Date.now()) {
  if (!auction) return 'upcoming';
  const startsAt = Number(auction.starts_at_ms || 0);
  const endsAt = Number(auction.ends_at_ms || 0);
  const declaredStatus = String(auction.status || '').toLowerCase();
  if (declaredStatus === 'closed' || declaredStatus === 'closed_no_winner') return 'ended';
  if (endsAt > 0 && nowMs >= endsAt) return 'ended';
  if (startsAt > nowMs) return 'upcoming';
  return 'active';
}

async function readLatestRotationAuction() {
  const db = getDb();
  const activeIdSnap = await db.ref(adsPath('rotation_auctions_meta/active_auction_id')).get();
  if (activeIdSnap.exists()) {
    const activeId = String(activeIdSnap.val() || '');
    if (activeId) {
      const auctionSnap = await db.ref(adsPath(`rotation_auctions/${activeId}`)).get();
      if (auctionSnap.exists()) {
        return { auctionId: activeId, auction: auctionSnap.val() };
      }
    }
  }

  const latestSnap = await db.ref(adsPath('rotation_auctions')).orderByChild('ends_at_ms').limitToLast(1).get();
  if (!latestSnap.exists()) return { auctionId: null, auction: null };
  const value = latestSnap.val() || {};
  const entries = Object.entries(value);
  if (!entries.length) return { auctionId: null, auction: null };
  const [auctionId, auction] = entries[0];
  return { auctionId: String(auctionId), auction };
}

async function getRotationAuctionSnapshot({ ensureActive = false } = {}) {
  let { auctionId, auction } = await readLatestRotationAuction();
  const nowMs = Date.now();
  const lifecycle = getAuctionLifecycleStatus(auction, nowMs);

  if (ensureActive && (!auction || lifecycle === 'ended')) {
    const created = await getOrCreateRotationAuction();
    auctionId = created.auctionId;
    auction = created.auction;
  }

  if (!auction || !auctionId) {
    return {
      found: false,
      auctionId: null,
      lifecycle: 'upcoming',
      starts_at_ms: null,
      ends_at_ms: null,
      reserve_wei: TIERS.rotation.reserveWei,
      highest_bid_wei: '0',
      next_valid_bid_wei: computeRotationBidFloorWei({ reserve_wei: TIERS.rotation.reserveWei, highest_bid_wei: '0' }),
      highest_session_id: null,
      highest_wallet: null,
      winner_session_id: null,
      winner_wallet: null,
      ms_remaining: null,
    };
  }

  const bids = auction.bids || {};
  const highestSessionId = String(auction.highest_session_id || '');
  const winnerSessionId = String(auction.winner_session_id || '');
  const highestWallet = highestSessionId && bids[highestSessionId] ? String(bids[highestSessionId].wallet || '') : null;
  const winnerWallet = winnerSessionId && bids[winnerSessionId] ? String(bids[winnerSessionId].wallet || '') : null;
  const auctionLifecycle = getAuctionLifecycleStatus(auction, nowMs);

  return {
    found: true,
    auctionId,
    lifecycle: auctionLifecycle,
    status: auction.status || 'active',
    starts_at_ms: Number(auction.starts_at_ms || 0),
    ends_at_ms: Number(auction.ends_at_ms || 0),
    reserve_wei: String(auction.reserve_wei || TIERS.rotation.reserveWei),
    highest_bid_wei: String(auction.highest_bid_wei || '0'),
    next_valid_bid_wei: computeRotationBidFloorWei(auction),
    highest_session_id: highestSessionId || null,
    highest_wallet: highestWallet,
    winner_session_id: winnerSessionId || null,
    winner_wallet: winnerWallet,
    ms_remaining: Math.max(0, Number(auction.ends_at_ms || 0) - nowMs),
  };
}

async function readOnchainAuctionState(refundWallet) {
  const provider = getRpcProvider();
  const contract = getAdSpaceContract(provider);
  const current = await contract.currentAuction();
  const minimum = await contract.minimumNextBid();
  const auctionId = Number(current.auctionId ?? current[0] ?? 0);
  const startsAt = normalizeTimestampMs(current.startAt ?? current[1] ?? 0);
  const endsAt = normalizeTimestampMs(current.endAt ?? current[2] ?? 0);
  const settled = Boolean(current.settled ?? current[3] ?? false);
  const winner = String(current.winner ?? current[4] ?? ethers.ZeroAddress);
  const highestBid = String(current.highestBid ?? current[5] ?? '0');
  const nextMinBid = String(current.nextMinBid ?? current[6] ?? minimum ?? '0');
  const extensionUsed = Boolean(current.extensionUsed ?? current[7] ?? false);
  const now = Date.now();
  const lifecycle = settled ? 'ended' : now < startsAt ? 'upcoming' : now >= endsAt ? 'ended' : 'active';
  let pendingRefundWei = '0';
  if (refundWallet && ethers.isAddress(refundWallet)) {
    pendingRefundWei = String(await contract.pendingRefunds(refundWallet));
  }
  return {
    auctionId,
    startsAt,
    endsAt,
    settled,
    winner,
    highestBidWei: highestBid,
    nextMinBidWei: nextMinBid,
    extensionUsed,
    lifecycle,
    pendingRefundWei,
  };
}

async function recordRotationBid({ sessionId, wallet, paidWei, auctionId }) {
  const db = getDb();
  let targetAuctionId = String(auctionId || '');
  if (!targetAuctionId) {
    const created = await getOrCreateRotationAuction();
    targetAuctionId = created.auctionId;
  }

  const auctionRef = db.ref(adsPath(`rotation_auctions/${targetAuctionId}`));
  let rejection = null;
  let computedFloorWei = null;
  const bidWei = normalizeWei(paidWei);
  const txTime = nowIso();
  const nowMs = Date.now();

  const txResult = await auctionRef.transaction((auction) => {
    if (!auction) {
      rejection = { code: 'AUCTION_NOT_FOUND', error: 'Active rotation auction not found.' };
      return;
    }
    const lifecycle = getAuctionLifecycleStatus(auction, nowMs);
    if (lifecycle !== 'active') {
      rejection = { code: 'AUCTION_ENDED', error: 'Auction has ended. New bids are closed.' };
      return;
    }

    computedFloorWei = computeRotationBidFloorWei(auction);
    const floor = normalizeWei(computedFloorWei);
    if (bidWei < floor) {
      rejection = {
        code: 'BID_TOO_LOW',
        error: `Bid too low. Next valid bid is at least ${ethers.formatEther(floor)} ETH.`,
        floorWei: floor.toString(),
      };
      return;
    }

    const currentHighest = normalizeWei(auction.highest_bid_wei || '0');
    if (!auction.bids || typeof auction.bids !== 'object') {
      auction.bids = {};
    }
    auction.bids[sessionId] = {
      session_id: sessionId,
      wallet,
      bid_wei: bidWei.toString(),
      created_at: txTime,
    };

    if (bidWei > currentHighest) {
      auction.highest_bid_wei = bidWei.toString();
      auction.highest_session_id = sessionId;
    }
    auction.updated_at = txTime;
    return auction;
  });

  if (!txResult.committed || !txResult.snapshot.exists()) {
    const err = new Error(rejection?.error || 'Could not record rotation bid.');
    err.code = rejection?.code || 'BID_REJECTED';
    err.floorWei = rejection?.floorWei || computedFloorWei || null;
    throw err;
  }

  const auction = txResult.snapshot.val();
  const highestSessionId = String(auction.highest_session_id || '');
  const isHighest = highestSessionId === sessionId;

  return {
    auctionId: targetAuctionId,
    endsAtMs: Number(auction.ends_at_ms),
    highestBidWei: String(auction.highest_bid_wei || '0'),
    highestSessionId: highestSessionId || null,
    nextValidBidWei: computeRotationBidFloorWei(auction),
    isHighest,
  };
}

async function isRotationWinner(session) {
  if (!session.auction_id) return false;
  const snap = await adsRef(`rotation_auctions/${session.auction_id}`).get();
  if (!snap.exists()) return false;
  const auction = snap.val();
  return String(auction.highest_session_id || '') === String(session.session_id || '');
}

async function queueApprovedAd(session, uploadInfo) {
  const db = getDb();
  const approvedAt = Date.now();
  const isOneTime = session.tier === 'one_time';
  const adRecord = buildPlaybackAdRecord(session, uploadInfo, approvedAt, isOneTime);
  await db.ref(adsPath(`playback_ads/${session.session_id}`)).set(adRecord);
}

function buildPlaybackAdRecord(session, uploadInfo, approvedAt, isOneTime) {
  return {
    session_id: session.session_id,
    wallet: session.wallet,
    tx_hash: session.tx_hash,
    sponsor_name: normalizeSponsorName(session.sponsor_name),
    website_url: normalizeWebsiteUrl(session.website_url),
    tier: session.tier,
    status: 'QUEUED',
    first_play_pending: true,
    approved_at_ms: approvedAt,
    queued_at_ms: approvedAt,
    filename: uploadInfo.filename,
    mime: uploadInfo.mime,
    bytes: uploadInfo.bytes,
    storage_path: uploadInfo.storagePath,
    download_url: uploadInfo.downloadUrl,
    play_once: isOneTime,
    required_total_plays: isOneTime ? 2 : null,
    plays_completed: 0,
    consumed: false,
    local_path: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function upsertPlaybackAdMetadata(sessionId, sponsorName, websiteUrl) {
  await adsRef(`playback_ads/${sessionId}`).update({
    session_id: sessionId,
    sponsor_name: normalizeSponsorName(sponsorName),
    website_url: normalizeWebsiteUrl(websiteUrl),
    updated_at: nowIso(),
  });
}

async function enqueueNotification(sessionId, wallet) {
  const db = getDb();
  const ts = nowIso();
  const walletText = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  await db.ref(adsPath(`intake_notifications/${sessionId}`)).set({
    session_id: sessionId,
    type: 'sponsor_upload_ready',
    status: 'pending',
    created_at: ts,
    updated_at: ts,
  });

  await db.ref(`clawb/chat/visitor_messages/ad_sponsor_${sessionId}`).set({
    author: 'system',
    message: `thank you ${walletText} for sponsoring clawb tv`,
    page: '/sponsor',
    timestamp: Date.now(),
  });
}

module.exports = {
  ADSPACE_IFACE,
  CLAWB_ADSPACE_CONTRACT,
  ALLOWED_VIDEO_MIME,
  BASE_CHAIN_ID,
  CLAWB_WALLET,
  MAX_FILE_BYTES,
  REQUIRED_CONFIRMATIONS,
  RESUMABLE_STATUSES,
  TIERS,
  checkDuplicateTx,
  getTxOwnerSession,
  enqueueNotification,
  generateSessionId,
  buildSubmissionIdHash,
  getAdSpaceContract,
  ADS_ROOT,
  adsPath,
  adsRef,
  getBucket,
  getClientIp,
  getDb,
  getSession,
  getTierConfig,
  isRateLimited,
  isRotationWinner,
  isWallet,
  json,
  nowIso,
  normalizeAddress,
  normalizeSponsorName,
  normalizeWebsiteUrl,
  evaluateAdSpaceTransaction,
  parseBody,
  pickLatestResumableSession,
  pushStatusTransition,
  queueApprovedAd,
  buildPlaybackAdRecord,
  recordRotationBid,
  getRotationAuctionSnapshot,
  getRpcProvider,
  readOnchainAuctionState,
  computeRotationBidFloorWei,
  getAuctionLifecycleStatus,
  ROTATION_MIN_INCREMENT_WEI,
  reserveTxHash,
  sanitizeFilename,
  saveSession,
  upsertPlaybackAdMetadata,
  evaluateTransferForSession,
  verifyBaseTransfer,
  verifyAdSpacePayment,
};
