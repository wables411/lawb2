import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Contract, JsonRpcProvider } from 'ethers';

const BASE_CHAIN_ID = 8453;
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const TOKEN_ADDRESS = '0x26a43bd8a28a0423afb5725b8242ec0a40947b07';

const DISTRIBUTOR_ABI = [
  'function merkleRoot() view returns (bytes32)',
  'function token() view returns (address)',
];
const ERC20_ABI = ['function balanceOf(address account) view returns (uint256)'];

async function main() {
  const distributorAddress = process.env.CLAWB_CLAIM_CONTRACT_ADDRESS;
  if (!distributorAddress) {
    throw new Error('Missing CLAWB_CLAIM_CONTRACT_ADDRESS in environment');
  }

  const metadataPath = path.resolve('public/claims/clawb-base-metadata.json');
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  const provider = new JsonRpcProvider(process.env.BASE_RPC_URL || DEFAULT_BASE_RPC, BASE_CHAIN_ID);

  const distributor = new Contract(distributorAddress, DISTRIBUTOR_ABI, provider);
  const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

  const [onchainRoot, onchainToken, contractBalance] = await Promise.all([
    distributor.merkleRoot(),
    distributor.token(),
    tokenContract.balanceOf(distributorAddress),
  ]);

  const rootMatches = onchainRoot.toLowerCase() === String(metadata.merkleRoot).toLowerCase();
  const tokenMatches = onchainToken.toLowerCase() === TOKEN_ADDRESS.toLowerCase();
  const fundedEnough = contractBalance >= BigInt(metadata.totalAllocation);

  console.log('=== Distributor Verification ===');
  console.log(`contract: ${distributorAddress}`);
  console.log(`root expected: ${metadata.merkleRoot}`);
  console.log(`root onchain : ${onchainRoot}`);
  console.log(`token expected: ${TOKEN_ADDRESS}`);
  console.log(`token onchain : ${onchainToken}`);
  console.log(`required total allocation: ${metadata.totalAllocation}`);
  console.log(`contract token balance   : ${contractBalance.toString()}`);
  console.log(`rootMatches=${rootMatches} tokenMatches=${tokenMatches} fundedEnough=${fundedEnough}`);

  if (!rootMatches || !tokenMatches || !fundedEnough) {
    throw new Error('Verification failed. Do not announce claim yet.');
  }
}

main().catch((error) => {
  console.error('[verify-clawb-distributor] failed:', error.message);
  process.exit(1);
});
