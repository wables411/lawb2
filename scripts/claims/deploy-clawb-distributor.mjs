import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ContractFactory, JsonRpcProvider, Wallet } from 'ethers';

const BASE_CHAIN_ID = 8453;
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const TOKEN_ADDRESS = '0x26a43bd8a28a0423afb5725b8242ec0a40947b07';

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Missing DEPLOYER_PRIVATE_KEY in environment');
  }

  const provider = new JsonRpcProvider(process.env.BASE_RPC_URL || DEFAULT_BASE_RPC, BASE_CHAIN_ID);
  const wallet = new Wallet(privateKey, provider);

  const metadataPath = path.resolve('public/claims/clawb-base-metadata.json');
  const artifactPath = path.resolve('artifacts/claims/ClawbMerkleDistributor.json');
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));

  const merkleRoot = metadata.merkleRoot;
  if (!merkleRoot || !merkleRoot.startsWith('0x')) {
    throw new Error('Invalid merkleRoot in clawb-base-metadata.json');
  }

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(TOKEN_ADDRESS, merkleRoot);
  const deploymentTx = contract.deploymentTransaction();

  console.log(`Deployment submitted by ${wallet.address}`);
  console.log(`Tx: ${deploymentTx?.hash || 'unknown'}`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`Distributor deployed at: ${address}`);
  console.log(`Merkle root: ${merkleRoot}`);
  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`CSV sha256: ${metadata.csvSha256}`);
}

main().catch((error) => {
  console.error('[deploy-clawb-distributor] failed:', error.message);
  process.exit(1);
});
