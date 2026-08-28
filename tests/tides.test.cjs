// Tides feed: jackpot log decoding (elo-indexer/tides.mjs). The decoder is the
// only pure logic in the feed — everything else is file reads + the shared
// getLogs pattern already proven by the ELO indexer.
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const T_ENTERED = '0x6ffb5ea2afe4f9360cde0a19797c02a398ed6dbe89e07cf7e84e90986cbc97b1';
const T_SCORE = '0x16ffa41f3226ae0250a69e10c139acdd933918812a67107e3b49cb4cd7623183';
const T_WON = '0x3b90e511146de0b7ff09188f88a73b1927a18e667b7554d19db7a8664bf09135';

const PLAYER = '0x9387b5a08d050427f74cc9949d811eb6eaee1090';
const pad = (hex) => hex.replace(/^0x/, '').padStart(64, '0');
const topicOf = (addr) => '0x' + pad(addr);
const wordOf = (n) => pad(BigInt(n).toString(16));

test('tides decodeJackpotLog', async (t) => {
  const { decodeJackpotLog } = await import('../elo-indexer/tides.mjs');

  await t.test('Entered -> jackpot_enter with pot', () => {
    // Entered(address indexed player, uint64 indexed nonce, uint32 seed, uint256 potAfter)
    const ev = decodeJackpotLog({
      topics: [T_ENTERED, topicOf(PLAYER), '0x' + wordOf(7)],
      data: '0x' + wordOf(12345) + wordOf(4650n * 10n ** 18n),
      blockNumber: '0x1884000', logIndex: '0x2',
    });
    assert.equal(ev.kind, 'jackpot_enter');
    assert.equal(ev.wallet, PLAYER);
    assert.equal(ev.pot, (4650n * 10n ** 18n).toString());
    assert.equal(ev.blockNumber, 0x1884000);
  });

  await t.test('ScoreSubmitted -> jackpot_score with won flag', () => {
    // ScoreSubmitted(address indexed, uint64 indexed nonce, uint64 survivalMs, uint64 barMs, bool won)
    const ev = decodeJackpotLog({
      topics: [T_SCORE, topicOf(PLAYER), '0x' + wordOf(7)],
      data: '0x' + wordOf(158_000) + wordOf(81_000) + wordOf(1),
      blockNumber: '0x1884001', logIndex: '0x0',
    });
    assert.equal(ev.kind, 'jackpot_score');
    assert.equal(ev.survivalMs, 158_000);
    assert.equal(ev.barMs, 81_000);
    assert.equal(ev.won, true);
  });

  await t.test('JackpotWon -> jackpot_won with payout', () => {
    // JackpotWon(address indexed player, uint64 survivalMs, uint256 payout, uint256 fee)
    const ev = decodeJackpotLog({
      topics: [T_WON, topicOf(PLAYER)],
      data: '0x' + wordOf(158_000) + wordOf(2300n * 10n ** 18n) + wordOf(115n * 10n ** 18n),
      blockNumber: '0x1884001', logIndex: '0x1',
    });
    assert.equal(ev.kind, 'jackpot_won');
    assert.equal(ev.payout, (2300n * 10n ** 18n).toString());
  });

  await t.test('config events decode to null (not feed material)', () => {
    const ev = decodeJackpotLog({
      topics: ['0x3664125300000000000000000000000000000000000000000000000000000000'],
      data: '0x' + wordOf(1800),
      blockNumber: '0x18a52ad', logIndex: '0x0',
    });
    assert.equal(ev, null);
  });
});
