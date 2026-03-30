const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPlaybackAdRecord,
  normalizeSponsorName,
  pickLatestResumableSession,
  normalizeWebsiteUrl,
} = require('../functions/sponsor-shared');

test('normalizes sponsor metadata fields', () => {
  assert.equal(normalizeSponsorName('  Test Sponsor  '), 'Test Sponsor');
  assert.equal(normalizeWebsiteUrl('example.com'), 'https://example.com');
  assert.equal(normalizeWebsiteUrl(''), '');
  assert.equal(normalizeWebsiteUrl('https://lawb.xyz'), 'https://lawb.xyz');
});

test('playback ad payload includes sponsor_name and website_url', () => {
  const session = {
    session_id: 'sps_test123',
    wallet: '0x1111111111111111111111111111111111111111',
    tx_hash: '0xtesthash',
    sponsor_name: 'Test Sponsor',
    website_url: 'example.com',
    tier: 'one_time',
  };
  const upload = {
    filename: 'ad.mp4',
    mime: 'video/mp4',
    bytes: 1000,
    storagePath: 'sponsor-ads/sps_test123/ad.mp4',
    downloadUrl: 'https://example-cdn/ad.mp4',
  };
  const record = buildPlaybackAdRecord(session, upload, 123, true);

  assert.equal(record.sponsor_name, 'Test Sponsor');
  assert.equal(record.website_url, 'https://example.com');
  assert.equal(record.session_id, 'sps_test123');
  assert.equal(record.status, 'QUEUED');
});

test('acceptance metadata example for Test Sponsor', () => {
  const normalized = {
    sponsor_name: normalizeSponsorName('Test Sponsor'),
    website_url: normalizeWebsiteUrl('example.com'),
  };
  assert.deepEqual(normalized, {
    sponsor_name: 'Test Sponsor',
    website_url: 'https://example.com',
  });
});

test('picks latest resumable session by updated_at', () => {
  const picked = pickLatestResumableSession({
    sps_old: {
      status: 'PENDING_PAYMENT',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    sps_latest: {
      status: 'PAID',
      updated_at: '2026-01-02T00:00:00.000Z',
    },
    sps_terminal: {
      status: 'PLAYED_ONCE',
      updated_at: '2026-01-03T00:00:00.000Z',
    },
  });

  assert.equal(picked.sessionId, 'sps_latest');
  assert.equal(picked.session.status, 'PAID');
});
