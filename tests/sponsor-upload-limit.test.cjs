const test = require('node:test');
const assert = require('node:assert/strict');
const { isFileTooLarge } = require('../functions/sponsor-upload');

const MAX_BYTES = 103809024;

test('accepts file at exact 99MB hard cap', () => {
  assert.equal(isFileTooLarge(MAX_BYTES), false);
});

test('rejects file above 99MB hard cap', () => {
  assert.equal(isFileTooLarge(MAX_BYTES + 1), true);
});
