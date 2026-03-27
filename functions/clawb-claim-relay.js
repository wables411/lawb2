const fs = require('node:fs/promises');
const path = require('node:path');
const { ethers } = require('ethers');

const CLAIM_CHAIN_ID = 8453;
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 20;

const CLAIM_ABI = [
  'function isClaimed(uint256 index) view returns (bool)',
  'function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)',
];

const ipHits = new Map();

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

function getClientIp(event) {
  const xff = event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'];
  if (xff) return xff.split(',')[0].trim();
  return event.headers?.['client-ip'] || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const history = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  history.push(now);
  ipHits.set(ip, history);
  return history.length > RATE_LIMIT_MAX_PER_IP;
}

async function readClaims() {
  const claimsPath = path.resolve(__dirname, '..', 'public', 'claims', 'clawb-base-claims.json');
  const raw = await fs.readFile(claimsPath, 'utf8');
  return JSON.parse(raw);
}

function buildAuthMessage({ account, index, amount, deadline, contractAddress }) {
  return [
    'lawb.xyz sponsored claim authorization',
    `account:${account.toLowerCase()}`,
    `index:${index}`,
    `amount:${amount}`,
    `chainId:${CLAIM_CHAIN_ID}`,
    `contract:${contractAddress.toLowerCase()}`,
    `deadline:${deadline}`,
  ].join('\n');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const ip = getClientIp(event);
    if (isRateLimited(ip)) {
      return json(429, { error: 'Too many requests, slow down and retry.' });
    }

    const contractAddress = process.env.CLAWB_CLAIM_CONTRACT_ADDRESS;
    const privateKey = process.env.BASE_RELAYER_PRIVATE_KEY;
    const baseRpcUrl = process.env.BASE_RPC_URL || DEFAULT_BASE_RPC;

    if (!contractAddress || !privateKey) {
      return json(500, { error: 'Relayer is not configured on server.' });
    }

    const body = JSON.parse(event.body || '{}');
    const account = String(body.account || '').toLowerCase();
    const signature = String(body.signature || '');
    const deadline = Number(body.deadline || 0);

    if (!ethers.isAddress(account) || !signature || !deadline) {
      return json(400, { error: 'Missing or invalid request fields.' });
    }
    if (Date.now() > deadline) {
      return json(400, { error: 'Signature expired. Please request a new sponsored claim.' });
    }

    const claims = await readClaims();
    const claim = claims[account];
    if (!claim) {
      return json(404, { error: 'Address is not eligible for this claim.' });
    }

    const message = buildAuthMessage({
      account,
      index: claim.index,
      amount: claim.amount,
      deadline,
      contractAddress,
    });
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();
    if (recovered !== account) {
      return json(401, { error: 'Signature does not match account.' });
    }

    const provider = new ethers.JsonRpcProvider(baseRpcUrl, CLAIM_CHAIN_ID);
    const relayer = new ethers.Wallet(privateKey, provider);
    const distributor = new ethers.Contract(contractAddress, CLAIM_ABI, relayer);

    const alreadyClaimed = await distributor.isClaimed(BigInt(claim.index));
    if (alreadyClaimed) {
      return json(200, { ok: true, alreadyClaimed: true });
    }

    const tx = await distributor.claim(
      BigInt(claim.index),
      claim.account,
      BigInt(claim.amount),
      claim.proof,
    );
    const receipt = await tx.wait();

    return json(200, {
      ok: true,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (error) {
    console.error('[clawb-claim-relay] error', error);
    return json(500, { error: 'Sponsored claim failed. Please retry shortly.' });
  }
};
