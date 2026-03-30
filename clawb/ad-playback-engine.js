const fs = require('node:fs/promises');

function pickNextAd(ads, nowMs = Date.now()) {
  const active = Object.values(ads || {}).filter((ad) => ad && ad.status === 'QUEUED' && !ad.consumed);
  if (!active.length) return null;

  const firstPlayPending = active
    .filter((ad) => ad.first_play_pending)
    .sort((a, b) => Number(b.approved_at_ms || 0) - Number(a.approved_at_ms || 0));
  if (firstPlayPending.length) {
    return firstPlayPending[0];
  }

  const rotationPool = active.filter((ad) => ad.tier === 'rotation');
  if (!rotationPool.length) return null;
  const idx = Math.abs(Number(nowMs)) % rotationPool.length;
  return rotationPool[idx];
}

async function markPlayed(ad, options = {}) {
  const next = {
    ...ad,
    first_play_pending: false,
    last_played_at_ms: Date.now(),
    updated_at: new Date().toISOString(),
  };

  if (ad.tier === 'one_time') {
    next.status = 'PLAYED_ONCE';
    next.consumed = true;
    if (options.deleteFile && ad.local_path) {
      try {
        await fs.unlink(ad.local_path);
      } catch {
        // ignore safe delete failures
      }
    }
    return next;
  }

  next.status = 'QUEUED';
  next.consumed = false;
  return next;
}

module.exports = {
  markPlayed,
  pickNextAd,
};
