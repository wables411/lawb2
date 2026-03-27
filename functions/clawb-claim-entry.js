const fs = require('node:fs/promises');
const path = require('node:path');
const { ethers } = require('ethers');

const CLAIM_CHAIN_ID = 8453;
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const CLAIM_ABI = ['function isClaimed(uint256 index) view returns (bool)'];

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

function getClaimsUrl(event) {
  const explicitUrl = process.env.CLAWB_CLAIMS_URL;
  if (explicitUrl) return explicitUrl;
  const host = event.headers?.host || event.headers?.Host;
  const proto = event.headers?.['x-forwarded-proto'] || 'https';
  if (host) return `${proto}://${host}/claims/clawb-base-claims.json`;
  return null;
}

async function readClaims(event) {
  const candidatePaths = [
    path.resolve(process.cwd(), 'public', 'claims', 'clawb-base-claims.json'),
    path.resolve(__dirname, '..', 'public', 'claims', 'clawb-base-claims.json'),
    path.resolve('/var/task/public/claims/clawb-base-claims.json'),
  ];

  for (const claimsPath of candidatePaths) {
    try {
      const raw = await fs.readFile(claimsPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      // try next source
    }
  }

  const url = getClaimsUrl(event);
  if (!url) {
    throw new Error('No local claims file found and no claims URL available');
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch claims JSON: ${res.status}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const accountRaw = (event.queryStringParameters?.account || '').toLowerCase();
    if (!ethers.isAddress(accountRaw)) {
      return json(400, { error: 'Valid account query param required.' });
    }

    const claims = await readClaims(event);
    const claim = claims[accountRaw];
    if (!claim) {
      return json(200, { ok: true, eligible: false });
    }

    let alreadyClaimed = false;
    const contractAddress = process.env.CLAWB_CLAIM_CONTRACT_ADDRESS;
    if (contractAddress && ethers.isAddress(contractAddress)) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || DEFAULT_BASE_RPC, CLAIM_CHAIN_ID);
        const distributor = new ethers.Contract(contractAddress, CLAIM_ABI, provider);
        alreadyClaimed = await distributor.isClaimed(BigInt(claim.index));
      } catch (error) {
        console.warn('[clawb-claim-entry] failed isClaimed read:', error?.message || error);
      }
    }

    return json(200, {
      ok: true,
      eligible: true,
      claim: {
        index: claim.index,
        account: claim.account,
        amount: claim.amount,
        proof: claim.proof,
      },
      alreadyClaimed,
    });
  } catch (error) {
    console.error('[clawb-claim-entry] error', error);
    return json(500, { error: 'Failed to load claim entry.' });
  }
};
