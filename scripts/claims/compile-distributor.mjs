import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import solc from 'solc';

const CONTRACT_PATH = path.resolve('contracts/ClawbMerkleDistributor.sol');
const OUT_DIR = path.resolve('artifacts/claims');

async function main() {
  const source = await readFile(CONTRACT_PATH, 'utf8');
  const input = {
    language: 'Solidity',
    sources: {
      'ClawbMerkleDistributor.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors?.length) {
    const fatal = output.errors.filter((e) => e.severity === 'error');
    output.errors.forEach((e) => console.log(e.formattedMessage));
    if (fatal.length) {
      throw new Error(`Compilation failed with ${fatal.length} error(s)`);
    }
  }

  const contract = output.contracts['ClawbMerkleDistributor.sol']?.ClawbMerkleDistributor;
  if (!contract?.abi || !contract?.evm?.bytecode?.object) {
    throw new Error('Compiled contract artifact missing ABI or bytecode');
  }

  await mkdir(OUT_DIR, { recursive: true });
  const artifactPath = path.join(OUT_DIR, 'ClawbMerkleDistributor.json');
  await writeFile(
    artifactPath,
    JSON.stringify(
      {
        contractName: 'ClawbMerkleDistributor',
        abi: contract.abi,
        bytecode: `0x${contract.evm.bytecode.object}`,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Wrote artifact: ${artifactPath}`);
}

main().catch((error) => {
  console.error('[compile-distributor] failed:', error.message);
  process.exit(1);
});
