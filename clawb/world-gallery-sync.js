/**
 * world-gallery-sync.js
 *
 * Keeps `clawb/nft_gallery` populated with Solana Lawb NFTs held by Clawb.
 * This augments existing EVM gallery entries instead of replacing them.
 */

import { db } from './lawb-firebase.js';

const DEFAULT_BANKR_SOLANA_WALLET = 'GDt1ZmAtCfqbK8iFAEyJUCbnu1TPjVeg3HaJ1wKaqhvC';
const MAGIC_EDEN_API = 'https://api-mainnet.magiceden.dev/v2';
const SYNC_INTERVAL_MS = Number(process.env.CLAWB_GALLERY_SYNC_INTERVAL_MS || 10 * 60_000);
const MAX_SOL_NFTS = Number(process.env.CLAWB_GALLERY_MAX_SOL_NFTS || 24);
const SUPPORTED_COLLECTIONS = new Set(['lawbstation', 'lawbnexus']);

function resolveClawbSolanaWalletAddress() {
  const explicitWallet = process.env.RETAKE_SOLANA_WALLET_ADDRESS?.trim();
  if (explicitWallet) return explicitWallet;
  return process.env.BANKR_SOLANA_WALLET_ADDRESS || DEFAULT_BANKR_SOLANA_WALLET;
}

const CLAWB_SOL_WALLET = resolveClawbSolanaWalletAddress();

function normalizeCollection(value) {
  return String(value || '').toLowerCase().trim();
}

async function fetchClawbSolanaNfts() {
  const url = `${MAGIC_EDEN_API}/wallets/${encodeURIComponent(CLAWB_SOL_WALLET)}/tokens?offset=0&limit=200`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Magic Eden wallet fetch failed: ${res.status}`);
  }

  const tokens = await res.json();
  if (!Array.isArray(tokens)) return [];

  const filtered = tokens
    .filter((token) => SUPPORTED_COLLECTIONS.has(normalizeCollection(token?.collection)))
    .slice(0, MAX_SOL_NFTS);

  return filtered.map((token) => {
    const collection = normalizeCollection(token?.collection);
    const mint = String(token?.mintAddress || '').trim();
    return {
      chain: 'solana',
      contract: mint,
      tokenId: mint,
      name: token?.name || `${collection} #${mint.slice(0, 6)}`,
      collection,
      image_url: token?.image || '',
      description: token?.description || '',
      owner: CLAWB_SOL_WALLET,
      updated_at: Date.now(),
    };
  });
}

function mergeGalleryNfts(existing, solanaNfts) {
  const existingArray = Array.isArray(existing) ? existing : [];

  // Remove old solana lawb entries managed by this sync.
  const keep = existingArray.filter((nft) => {
    if (String(nft?.chain || '').toLowerCase() !== 'solana') return true;
    const c = normalizeCollection(nft?.collection);
    return !SUPPORTED_COLLECTIONS.has(c);
  });

  const dedupe = new Set();
  const merged = [...keep, ...solanaNfts].filter((nft) => {
    const key = `${String(nft?.chain || '').toLowerCase()}:${String(nft?.tokenId || '')}`;
    if (!nft?.tokenId || dedupe.has(key)) return false;
    dedupe.add(key);
    return true;
  });

  return merged;
}

async function syncGalleryOnce() {
  try {
    const solanaNfts = await fetchClawbSolanaNfts();
    const galleryRef = db.ref('clawb/nft_gallery');
    const snap = await galleryRef.once('value');
    const current = snap.val() || {};
    const mergedNfts = mergeGalleryNfts(current.nfts, solanaNfts);

    await galleryRef.update({
      ...current,
      nfts: mergedNfts,
      wallet_solana: CLAWB_SOL_WALLET,
      updated_at: Date.now(),
    });

    console.log(`[World Gallery] synced ${solanaNfts.length} Solana NFTs (total gallery: ${mergedNfts.length})`);
  } catch (err) {
    console.warn(`[World Gallery] sync failed: ${err?.message || err}`);
  }
}

export async function startWorldGallerySync() {
  console.log(`[World Gallery] starting sync for ${CLAWB_SOL_WALLET}`);
  await syncGalleryOnce();

  const timer = setInterval(() => {
    void syncGalleryOnce();
  }, Math.max(60_000, SYNC_INTERVAL_MS));

  return () => {
    clearInterval(timer);
    console.log('[World Gallery] stopped');
  };
}

