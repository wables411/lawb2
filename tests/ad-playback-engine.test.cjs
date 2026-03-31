const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { markPlayed, pickBreakAds, pickNextAd } = require('../clawb/ad-playback-engine');

test('newest approved ad plays first on next break', () => {
  const ads = {
    older: {
      session_id: 'older',
      status: 'QUEUED',
      consumed: false,
      tier: 'one_time',
      first_play_pending: true,
      approved_at_ms: 1000,
    },
    newest: {
      session_id: 'newest',
      status: 'QUEUED',
      consumed: false,
      tier: 'one_time',
      first_play_pending: true,
      approved_at_ms: 2000,
    },
  };
  const next = pickNextAd(ads, 3000);
  assert.equal(next.session_id, 'newest');
});

test('break selection fills to 3 with paid priority and no duplicates', () => {
  const paidAds = {
    paidA: { session_id: 'paidA', status: 'QUEUED', consumed: false, tier: 'one_time', first_play_pending: true, approved_at_ms: 20, plays_completed: 0, required_total_plays: 2 },
    paidB: { session_id: 'paidB', status: 'QUEUED', consumed: false, tier: 'rotation', first_play_pending: false, approved_at_ms: 10 },
  };
  const fallbackAds = [
    { id: 'fallback1', status: 'QUEUED' },
    { id: 'fallback2', status: 'QUEUED' },
    { id: 'fallback3', status: 'QUEUED' },
  ];
  const breakAds = pickBreakAds({ paidAds, fallbackAds, nowMs: 1000 });
  assert.equal(breakAds.length, 3);
  assert.equal(breakAds[0].session_id || breakAds[0].id, 'paidA');
  const ids = breakAds.map((ad) => ad.session_id || ad.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('one-time ad is consumed and local file removed after second break play', async () => {
  const tmp = path.join(os.tmpdir(), `clawb-ad-${Date.now()}.mp4`);
  await fs.writeFile(tmp, Buffer.from('ad-bytes'));
  const first = await markPlayed({
    session_id: 'one',
    tier: 'one_time',
    status: 'QUEUED',
    first_play_pending: true,
    consumed: false,
    plays_completed: 0,
    required_total_plays: 2,
    local_path: tmp,
  }, { deleteFile: true });
  assert.equal(first.status, 'QUEUED');
  assert.equal(first.consumed, false);
  await fs.stat(tmp);

  const second = await markPlayed({
    ...first,
    local_path: tmp,
  }, { deleteFile: true });
  assert.equal(second.status, 'PLAYED_ONCE');
  assert.equal(second.consumed, true);
  await assert.rejects(() => fs.stat(tmp));
});
