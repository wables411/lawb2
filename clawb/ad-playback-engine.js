const fs = require('node:fs/promises');

function asArray(input) {
  return Array.isArray(input) ? input.filter(Boolean) : Object.values(input || {}).filter(Boolean);
}

function getAdId(ad) {
  return String(ad?.session_id || ad?.id || '');
}

function isPaidAdEligible(ad) {
  if (!ad) return false;
  if (ad.status !== 'QUEUED') return false;
  if (ad.consumed) return false;
  if (ad.tier === 'one_time') {
    const required = Number(ad.required_total_plays || 2);
    const completed = Number(ad.plays_completed || 0);
    return completed < required;
  }
  return true;
}

function deterministicPick(pool, count, nowMs) {
  const source = [...pool];
  const picked = [];
  let cursor = Math.abs(Number(nowMs || Date.now()));
  while (source.length && picked.length < count) {
    const idx = cursor % source.length;
    picked.push(source.splice(idx, 1)[0]);
    cursor += 17;
  }
  return picked;
}

function isSameSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function pickBreakAds(options = {}) {
  const {
    paidAds = {},
    fallbackAds = [],
    previousBreakIds = [],
    nowMs = Date.now(),
  } = options;

  const paid = asArray(paidAds).filter(isPaidAdEligible);
  const fallback = asArray(fallbackAds);
  const selected = [];
  const seenIds = new Set();

  const take = (pool) => {
    for (const ad of pool) {
      const id = getAdId(ad);
      if (!id || seenIds.has(id)) continue;
      selected.push(ad);
      seenIds.add(id);
      if (selected.length === 3) break;
    }
  };

  const firstPlayPending = paid
    .filter((ad) => ad.first_play_pending)
    .sort((a, b) => Number(b.approved_at_ms || 0) - Number(a.approved_at_ms || 0));
  take(firstPlayPending);

  if (selected.length < 3) {
    const paidRotation = deterministicPick(
      paid.filter((ad) => !ad.first_play_pending),
      3 - selected.length,
      nowMs,
    );
    take(paidRotation);
  }

  if (selected.length < 3) {
    const fallbackPick = deterministicPick(fallback, 3 - selected.length, nowMs + 97);
    take(fallbackPick);
  }

  if (selected.length === 3 && Array.isArray(previousBreakIds) && previousBreakIds.length === 3) {
    const selectedIds = selected.map(getAdId);
    const allPaid = selected.every((ad) => isPaidAdEligible(ad));
    if (!allPaid && isSameSet(selectedIds, previousBreakIds)) {
      const alternatives = [
        ...paid.filter((ad) => !seenIds.has(getAdId(ad))),
        ...fallback.filter((ad) => !seenIds.has(getAdId(ad))),
      ];
      if (alternatives.length) {
        const replacement = deterministicPick(alternatives, 1, nowMs + 193)[0];
        if (replacement) {
          selected[2] = replacement;
        }
      }
    }
  }

  return selected.slice(0, 3);
}

function pickNextAd(ads, nowMs = Date.now()) {
  const [first] = pickBreakAds({ paidAds: ads, nowMs });
  return first || null;
}

async function markPlayed(ad, options = {}) {
  const requiredTotal = Number(ad.required_total_plays || (ad.tier === 'one_time' ? 2 : 0));
  const nextPlaysCompleted = Number(ad.plays_completed || 0) + 1;
  const next = {
    ...ad,
    first_play_pending: false,
    plays_completed: nextPlaysCompleted,
    last_played_at_ms: Date.now(),
    updated_at: new Date().toISOString(),
  };

  if (ad.tier === 'one_time') {
    const shouldConsume = nextPlaysCompleted >= requiredTotal;
    next.status = shouldConsume ? 'PLAYED_ONCE' : 'QUEUED';
    next.consumed = shouldConsume;
    if (shouldConsume && options.deleteFile && ad.local_path) {
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
  pickBreakAds,
  pickNextAd,
};
