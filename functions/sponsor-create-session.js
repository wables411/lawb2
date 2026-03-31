const { ethers } = require('ethers');
const {
  TIERS,
  generateSessionId,
  getClientIp,
  getTierConfig,
  getRotationAuctionSnapshot,
  isRateLimited,
  isWallet,
  json,
  normalizeAddress,
  normalizeSponsorName,
  normalizeWebsiteUrl,
  parseBody,
  saveSession,
  upsertPlaybackAdMetadata,
} = require('./sponsor-shared');

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
      return json(429, { error: 'Too many sponsor attempts. Please retry shortly.' });
    }

    const body = parseBody(event);
    const tier = String(body.tier || '');
    const wallet = normalizeAddress(body.wallet || '');
    const sponsorName = normalizeSponsorName(body.sponsorName || '');
    const websiteUrl = normalizeWebsiteUrl(body.websiteUrl || '');

    if (!isWallet(wallet)) {
      return json(400, { error: 'Wallet address is required.' });
    }
    if (!sponsorName) {
      return json(400, { error: 'Sponsor name is required.' });
    }

    const tierConfig = getTierConfig(tier);
    if (!tierConfig) {
      return json(400, { error: 'Invalid tier selected.' });
    }

    let requiredWei = '0';
    let rotationAuction = null;
    if (tier === 'one_time') {
      requiredWei = TIERS.one_time.fixedWei;
    } else {
      rotationAuction = await getRotationAuctionSnapshot({ ensureActive: true });
      const floorWei = BigInt(String(rotationAuction.next_valid_bid_wei || TIERS.rotation.reserveWei));
      const bidEthRaw = body.bidEth;
      const parsedBid = bidEthRaw ? ethers.parseEther(String(bidEthRaw)) : BigInt(0);
      requiredWei = (parsedBid > floorWei ? parsedBid : floorWei).toString();
    }

    const now = new Date().toISOString();
    const sessionId = generateSessionId();
    const session = {
      session_id: sessionId,
      wallet,
      tier,
      required_wei: requiredWei,
      sponsor_name: sponsorName,
      website_url: websiteUrl,
      status: 'PENDING_PAYMENT',
      tx_hash: null,
      tx_confirmed_at: null,
      upload: null,
      auction_id: tier === 'rotation' ? String(rotationAuction?.auctionId || '') || null : null,
      created_at: now,
      updated_at: now,
    };

    await saveSession(sessionId, session);
    await upsertPlaybackAdMetadata(sessionId, sponsorName, websiteUrl);

    return json(200, {
      ok: true,
      sessionId,
      status: session.status,
      wallet,
      tier,
      sponsorName,
      websiteUrl,
      payment: {
        chainId: 8453,
        chainName: 'Base',
        recipient: '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429',
        minWei: requiredWei,
        minEth: ethers.formatEther(requiredWei),
      },
      auction: rotationAuction || undefined,
    });
  } catch (error) {
    console.error('[sponsor-create-session] error', error);
    return json(500, { error: 'Failed to create sponsor session.' });
  }
};
