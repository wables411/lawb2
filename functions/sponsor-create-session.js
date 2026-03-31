const { ethers } = require('ethers');
const {
  buildSubmissionIdHash,
  CLAWB_ADSPACE_CONTRACT,
  TIERS,
  generateSessionId,
  getClientIp,
  getTierConfig,
  readOnchainAuctionState,
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

    const sessionId = generateSessionId();
    const submissionIdHash = buildSubmissionIdHash(sessionId);
    let requiredWei = '0';
    let rotationAuction = null;
    if (tier === 'one_time') {
      requiredWei = TIERS.one_time.fixedWei;
    } else {
      const onchain = await readOnchainAuctionState();
      const floorWei = BigInt(String(onchain.nextMinBidWei || TIERS.rotation.reserveWei));
      const bidEthRaw = body.bidEth;
      const parsedBid = bidEthRaw ? ethers.parseEther(String(bidEthRaw)) : BigInt(0);
      requiredWei = (parsedBid > floorWei ? parsedBid : floorWei).toString();
      rotationAuction = {
        source: 'onchain',
        auctionId: String(onchain.auctionId),
        lifecycle: onchain.lifecycle,
        starts_at_ms: onchain.startsAt,
        ends_at_ms: onchain.endsAt,
        reserve_wei: TIERS.rotation.reserveWei,
        highest_bid_wei: onchain.highestBidWei,
        next_valid_bid_wei: onchain.nextMinBidWei,
        extension_used: onchain.extensionUsed,
      };
    }

    const now = new Date().toISOString();
    const session = {
      session_id: sessionId,
      submission_id_hash: submissionIdHash,
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
      submissionIdHash,
      sponsorName,
      websiteUrl,
      payment: {
        chainId: 8453,
        chainName: 'Base',
        recipient: CLAWB_ADSPACE_CONTRACT,
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
