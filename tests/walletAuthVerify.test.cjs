/**
 * E2E test of functions/wallet-auth.js signature verification (no Firebase creds needed):
 * a VALID signature passes verification and then dies at token mint (500 'Token mint failed'),
 * a TAMPERED signature must return 401 'Bad signature'. That boundary is exactly the
 * verification logic. Tests EOA fast path + (implicitly) that the viem CJS import works.
 */
const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts');
const { handler } = require('../functions/wallet-auth.js');

function buildMessage(addr) {
  return [
    'lawb.xyz wallet login',
    `address: ${addr}`,
    `issued: ${new Date().toISOString()}`,
    '',
    'This signature only proves wallet ownership to save your scores and profile.',
    'It costs nothing and sends no transaction.',
  ].join('\n');
}

async function post(body) {
  const res = await handler({
    httpMethod: 'POST',
    headers: { 'x-nf-client-connection-ip': `10.0.0.${Math.floor(Math.random() * 250)}` },
    body: JSON.stringify(body),
  });
  return { status: res.statusCode, body: JSON.parse(res.body) };
}

(async () => {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const address = account.address.toLowerCase();
  const message = buildMessage(address);
  const signature = await account.signMessage({ message });

  // 1. Valid EOA signature: verification must PASS (reaches mint -> 500 without creds)
  const good = await post({ address, chain: 'evm', message, signature });
  const goodPass = good.status === 500 && good.body.error === 'Token mint failed';
  console.log(`valid EOA sig -> ${good.status} ${good.body.error ?? 'ok'} ${goodPass ? 'PASS' : 'FAIL'}`);

  // 2. Tampered signature: must 401 (falls into smart-wallet RPC loop, all chains reject)
  const tampered = signature.slice(0, -4) + (signature.endsWith('abcd') ? 'dcba' : 'abcd');
  const bad = await post({ address, chain: 'evm', message, signature: tampered });
  const badPass = bad.status === 401;
  console.log(`tampered sig  -> ${bad.status} ${bad.body.error} ${badPass ? 'PASS' : 'FAIL'}`);

  // 3. Signature from a DIFFERENT key claiming our address: must 401
  const other = privateKeyToAccount(generatePrivateKey());
  const forged = await post({ address, chain: 'evm', message, signature: await other.signMessage({ message }) });
  const forgedPass = forged.status === 401;
  console.log(`forged sig    -> ${forged.status} ${forged.body.error} ${forgedPass ? 'PASS' : 'FAIL'}`);

  // 4. Expired message: must 400
  const oldMsg = message.replace(/^issued: .*$/m, 'issued: 2026-01-01T00:00:00.000Z');
  const expired = await post({ address, chain: 'evm', message: oldMsg, signature: await account.signMessage({ message: oldMsg }) });
  const expiredPass = expired.status === 400;
  console.log(`expired msg   -> ${expired.status} ${expired.body.error} ${expiredPass ? 'PASS' : 'FAIL'}`);

  process.exit(goodPass && badPass && forgedPass && expiredPass ? 0 : 1);
})().catch((e) => { console.error('TEST CRASH:', e); process.exit(1); });
