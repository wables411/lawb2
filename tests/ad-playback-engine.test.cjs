const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { markPlayed, pickNextAd } = require('../clawb/ad-playback-engine');

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

test('one-time ad is consumed and local file removed after first play', async () => {
  const tmp = path.join(os.tmpdir(), `clawb-ad-${Date.now()}.mp4`);
  await fs.writeFile(tmp, Buffer.from('ad-bytes'));
  const played = await markPlayed({
    session_id: 'one',
    tier: 'one_time',
    status: 'QUEUED',
    first_play_pending: true,
    consumed: false,
    local_path: tmp,
  }, { deleteFile: true });
  assert.equal(played.status, 'PLAYED_ONCE');
  assert.equal(played.consumed, true);
  await assert.rejects(() => fs.stat(tmp));
});
