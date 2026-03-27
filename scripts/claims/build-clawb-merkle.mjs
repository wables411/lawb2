import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AbiCoder, getAddress, isAddress, keccak256, parseUnits, solidityPackedKeccak256 } from 'ethers';

const DEFAULT_CSV_PATH = 'C:/Users/wable/.openclaw/clawb_weighted_allocation.csv';
const CLAIM_DECIMALS = 18;
const CLAIM_NAME = 'clawb-base';
const OUTPUT_DIR = path.resolve('public/claims');

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) {
    throw new Error('CSV has no data rows');
  }

  const header = splitCsvLine(lines[0]);
  const walletIndex = header.indexOf('wallet');
  const allocationIndex = header.indexOf('allocation_clawb');

  if (walletIndex === -1 || allocationIndex === -1) {
    throw new Error('CSV must include wallet and allocation_clawb columns');
  }

  return lines.slice(1).map((line, row) => {
    const cells = splitCsvLine(line);
    return {
      row: row + 2,
      wallet: (cells[walletIndex] || '').trim(),
      allocation: (cells[allocationIndex] || '').trim(),
    };
  });
}

function leafFor(index, account, amount) {
  return solidityPackedKeccak256(['uint256', 'address', 'uint256'], [BigInt(index), account, amount]);
}

function hashPair(a, b) {
  const [left, right] = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
  return keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [left, right]));
}

function buildTree(leaves) {
  if (leaves.length === 0) {
    throw new Error('No leaves to build Merkle tree');
  }
  const levels = [leaves];
  while (levels[levels.length - 1].length > 1) {
    const prev = levels[levels.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = i + 1 < prev.length ? prev[i + 1] : prev[i];
      next.push(hashPair(left, right));
    }
    levels.push(next);
  }
  return levels;
}

function getProof(levels, index) {
  const proof = [];
  let idx = index;
  for (let level = 0; level < levels.length - 1; level += 1) {
    const layer = levels[level];
    const pairIdx = idx ^ 1;
    if (pairIdx < layer.length) {
      proof.push(layer[pairIdx]);
    }
    idx = Math.floor(idx / 2);
  }
  return proof;
}

function normalizeRows(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!isAddress(row.wallet)) {
      throw new Error(`Invalid wallet at row ${row.row}: ${row.wallet}`);
    }
    const account = getAddress(row.wallet);
    if (!row.allocation) {
      continue;
    }
    const numeric = Number(row.allocation);
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new Error(`Invalid allocation at row ${row.row}: ${row.allocation}`);
    }
    const amount = parseUnits(row.allocation, CLAIM_DECIMALS);
    if (amount <= 0n) {
      continue;
    }
    map.set(account, (map.get(account) || 0n) + amount);
  }
  return Array.from(map.entries())
    .map(([account, amount]) => ({ account, amount }))
    .sort((a, b) => a.account.toLowerCase().localeCompare(b.account.toLowerCase()));
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
  const csvText = await readFile(csvPath, 'utf8');
  const csvHash = createHash('sha256').update(csvText).digest('hex');
  const parsedRows = parseCsv(csvText);
  const normalized = normalizeRows(parsedRows);

  const entries = normalized.map((item, index) => ({
    index,
    account: item.account,
    amount: item.amount.toString(),
    leaf: leafFor(index, item.account, item.amount),
  }));

  const tree = buildTree(entries.map((entry) => entry.leaf));
  const root = tree[tree.length - 1][0];
  const totalAllocation = normalized.reduce((sum, item) => sum + item.amount, 0n);

  const claimsByAddress = {};
  for (const entry of entries) {
    claimsByAddress[entry.account.toLowerCase()] = {
      index: entry.index,
      account: entry.account,
      amount: entry.amount,
      proof: getProof(tree, entry.index),
    };
  }

  const generatedAt = new Date().toISOString();
  const metadata = {
    name: CLAIM_NAME,
    decimals: CLAIM_DECIMALS,
    csvPath,
    csvSha256: csvHash,
    rowCountRaw: parsedRows.length,
    eligibleWalletCount: entries.length,
    totalAllocation: totalAllocation.toString(),
    merkleRoot: root,
    generatedAt,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUTPUT_DIR, `${CLAIM_NAME}-metadata.json`),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );
  await writeFile(
    path.join(OUTPUT_DIR, `${CLAIM_NAME}-claims.json`),
    JSON.stringify(claimsByAddress, null, 2),
    'utf8',
  );

  console.log(JSON.stringify(metadata, null, 2));
}

main().catch((error) => {
  console.error('[build-clawb-merkle] failed:', error.message);
  process.exit(1);
});
