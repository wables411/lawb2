import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { Wallet } from 'ethers';

const TARGET_ENV_PATH = 'C:/Users/wable/.openclaw/clawb/.env';

async function main() {
  const wallet = Wallet.createRandom();
  const envPath = process.argv[2] || TARGET_ENV_PATH;

  const block = [
    '',
    '# lawb.xyz sponsored claim relayer',
    `BASE_RELAYER_ADDRESS=${wallet.address}`,
    `BASE_RELAYER_PRIVATE_KEY=${wallet.privateKey}`,
    'BASE_RPC_URL=https://mainnet.base.org',
  ].join('\n');

  await appendFile(path.resolve(envPath), block, 'utf8');
  console.log('Relayer wallet created and appended to env file.');
  console.log(`Address: ${wallet.address}`);
  console.log(`Env file: ${envPath}`);
}

main().catch((error) => {
  console.error('[generate-relayer-wallet] failed:', error.message);
  process.exit(1);
});
