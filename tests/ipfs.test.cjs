// ipfsToHttp: dead-gateway rewrite + existing conversions.
// Bundles src/utils/ipfs.ts on the fly (same esbuild pattern as test:reef).
const { execSync } = require('node:child_process');
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

execSync(
  'npx esbuild src/utils/ipfs.ts --bundle --platform=node --format=cjs --outfile=tests/_ipfs.cjs',
  { cwd: path.join(__dirname, '..'), stdio: 'pipe' }
);
const { ipfsToHttp } = require('./_ipfs.cjs');

test('rewrites dead OpenSea CloudFront gateway to ipfs.io', () => {
  assert.strictEqual(
    ipfsToHttp('https://d1kgk9u8ytew77.cloudfront.net/ipfs/QmAbc123/338.jpg'),
    'https://ipfs.io/ipfs/QmAbc123/338.jpg'
  );
});

test('leaves live http(s) URLs untouched', () => {
  const url = 'https://gateway.pinata.cloud/ipfs/QmAbc123/1.png';
  assert.strictEqual(ipfsToHttp(url), url);
  const plain = 'https://example.com/images/pic.jpg';
  assert.strictEqual(ipfsToHttp(plain), plain);
});

test('converts ipfs:// and bare CIDs', () => {
  assert.strictEqual(ipfsToHttp('ipfs://QmAbc123/1.png'), 'https://ipfs.io/ipfs/QmAbc123/1.png');
  assert.strictEqual(ipfsToHttp('QmAbc123'), 'https://ipfs.io/ipfs/QmAbc123');
});

test('empty and null-ish input returns empty string', () => {
  assert.strictEqual(ipfsToHttp(''), '');
  assert.strictEqual(ipfsToHttp(null), '');
  assert.strictEqual(ipfsToHttp(undefined), '');
});
