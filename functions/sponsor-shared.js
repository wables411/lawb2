const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { ethers } = require('ethers');

const BASE_CHAIN_ID = 8453;
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const REQUIRED_CONFIRMATIONS = Number(process.env.SPONSOR_REQUIRED_CONFIRMATIONS || 2);
const MAX_FILE_BYTES = 103809024; // 99 MB hard cap
const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429'.toLowerCase();

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

function getRpcProvider() {
  return new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || DEFAULT_BASE_RPC, BASE_CHAIN_ID);
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

function getBucket() {
  const app = getFirebaseApp();
  return app.storage().bucket();
}

async function getSession(sessionId) {
  const snap = await getDb().ref(`clawb/ads/sessions/${sessionId}`).get();
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
  await getDb().ref(`clawb/ads/sessions/${sessionId}`).update({
    ...patch,
    updated_at: timestamp,
  });
}

async function pushStatusTransition(sessionId, toStatus, extra = {}) {
  const db = getDb();
  const ts = nowIso();
  await db.ref(`clawb/ads/sessions/${sessionId}/status_history`).push({
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
  const ref = getDb().ref(`clawb/ads/tx_index/${txHash.toLowerCase()}`);
  const snap = await ref.get();
  if (!snap.exists()) return false;
  const ownerSession = String(snap.val() || '');
  return ownerSession !== sessionId;
}

async function reserveTxHash(txHash, sessionId) {
  await getDb().ref(`clawb/ads/tx_index/${txHash.toLowerCase()}`).set(sessionId);
}

async function getOrCreateRotationAuction() {
  const db = getDb();
  const auctionsRef = db.ref('clawb/ads/rotation_auctions');
  const activeRef = db.ref('clawb/ads/rotation_auctions_meta/active_auction_id');
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

async function recordRotationBid({ sessionId, wallet, paidWei }) {
  const db = getDb();
  const { auctionId, auction } = await getOrCreateRotationAuction();
  const currentHighest = BigInt(auction.highest_bid_wei || '0');
  const nextHighest = BigInt(paidWei) > currentHighest ? String(paidWei) : String(currentHighest);
  const isHighest = BigInt(paidWei) > currentHighest;

  await db.ref(`clawb/ads/rotation_auctions/${auctionId}/bids/${sessionId}`).set({
    session_id: sessionId,
    wallet,
    bid_wei: String(paidWei),
    created_at: nowIso(),
  });

  if (isHighest) {
    await db.ref(`clawb/ads/rotation_auctions/${auctionId}`).update({
      highest_bid_wei: String(nextHighest),
      highest_session_id: sessionId,
      updated_at: nowIso(),
    });
  }

  return {
    auctionId,
    endsAtMs: Number(auction.ends_at_ms),
    highestBidWei: isHighest ? String(paidWei) : String(auction.highest_bid_wei || '0'),
    highestSessionId: isHighest ? sessionId : auction.highest_session_id || null,
    isHighest,
  };
}

async function isRotationWinner(session) {
  if (!session.auction_id) return false;
  const snap = await getDb().ref(`clawb/ads/rotation_auctions/${session.auction_id}`).get();
  if (!snap.exists()) return false;
  const auction = snap.val();
  return String(auction.highest_session_id || '') === String(session.session_id || '');
}

async function queueApprovedAd(session, uploadInfo) {
  const db = getDb();
  const approvedAt = Date.now();
  const isOneTime = session.tier === 'one_time';
  const adRecord = buildPlaybackAdRecord(session, uploadInfo, approvedAt, isOneTime);
  await db.ref(`clawb/ads/playback_ads/${session.session_id}`).set(adRecord);
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
    consumed: false,
    local_path: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function upsertPlaybackAdMetadata(sessionId, sponsorName, websiteUrl) {
  await getDb().ref(`clawb/ads/playback_ads/${sessionId}`).update({
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
  await db.ref(`clawb/ads/intake_notifications/${sessionId}`).set({
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
  ALLOWED_VIDEO_MIME,
  BASE_CHAIN_ID,
  CLAWB_WALLET,
  MAX_FILE_BYTES,
  REQUIRED_CONFIRMATIONS,
  RESUMABLE_STATUSES,
  TIERS,
  checkDuplicateTx,
  enqueueNotification,
  generateSessionId,
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
  parseBody,
  pickLatestResumableSession,
  pushStatusTransition,
  queueApprovedAd,
  buildPlaybackAdRecord,
  recordRotationBid,
  reserveTxHash,
  sanitizeFilename,
  saveSession,
  upsertPlaybackAdMetadata,
  evaluateTransferForSession,
  verifyBaseTransfer,
};
