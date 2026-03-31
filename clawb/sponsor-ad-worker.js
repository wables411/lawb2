const fs = require('node:fs/promises');
const path = require('node:path');
const admin = require('firebase-admin');
const { markPlayed, pickNextAd } = require('./ad-playback-engine');

const DOWNLOAD_DIR = process.env.CLAWB_AD_DOWNLOAD_DIR || path.resolve(process.cwd(), 'clawb', 'commercials');

function initAdmin() {
  if (admin.apps.length) return admin.app();
  const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!serviceJson || !dbUrl) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_DATABASE_URL');
  }
  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceJson)),
    databaseURL: dbUrl,
  });
}

async function ensureDownloadDir() {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
}

function safeFilename(input) {
  return String(input || 'ad.bin').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

async function downloadToLocal(downloadUrl, fileName) {
  const targetName = `${Date.now()}-${safeFilename(fileName)}`;
  const targetPath = path.join(DOWNLOAD_DIR, targetName);
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Download failed with status ${res.status}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(targetPath, bytes);
  return targetPath;
}

async function processIntakeNotifications() {
  const db = initAdmin().database();
  await ensureDownloadDir();
  const notificationsSnap = await db.ref('clawb/ads/intake_notifications').orderByChild('status').equalTo('pending').get();
  if (!notificationsSnap.exists()) return { processed: 0 };

  const notifications = notificationsSnap.val();
  let processed = 0;
  const ids = Object.keys(notifications);
  for (const sessionId of ids) {
    const notifyRef = db.ref(`clawb/ads/intake_notifications/${sessionId}`);
    try {
      const adSnap = await db.ref(`clawb/ads/playback_ads/${sessionId}`).get();
      if (!adSnap.exists()) {
        await notifyRef.update({ status: 'waiting_queue', updated_at: new Date().toISOString() });
        continue;
      }
      const ad = adSnap.val();
      if (!ad.local_path && ad.download_url) {
        const localPath = await downloadToLocal(ad.download_url, ad.filename);
        await db.ref(`clawb/ads/playback_ads/${sessionId}`).update({
          local_path: localPath,
          updated_at: new Date().toISOString(),
        });
      }
      await notifyRef.update({ status: 'done', updated_at: new Date().toISOString() });
      processed += 1;
    } catch (error) {
      await notifyRef.update({
        status: 'retry',
        last_error: String(error.message || error),
        updated_at: new Date().toISOString(),
      });
    }
  }
  return { processed };
}

async function getNextBreakAd() {
  const db = initAdmin().database();
  const adsSnap = await db.ref('clawb/ads/playback_ads').get();
  const ads = adsSnap.exists() ? adsSnap.val() : {};
  return pickNextAd(ads);
}

async function markBreakPlayed(sessionId) {
  const db = initAdmin().database();
  const adRef = db.ref(`clawb/ads/playback_ads/${sessionId}`);
  const adSnap = await adRef.get();
  if (!adSnap.exists()) return { ok: false, reason: 'ad_missing' };

  const ad = adSnap.val();
  const next = await markPlayed(ad, { deleteFile: true });
  await adRef.update(next);
  await db.ref(`clawb/ads/sessions/${sessionId}`).update({
    status: next.consumed ? 'PLAYED_ONCE' : 'QUEUED',
    updated_at: new Date().toISOString(),
  });
  return { ok: true, ad: next };
}

module.exports = {
  getNextBreakAd,
  markBreakPlayed,
  processIntakeNotifications,
};
