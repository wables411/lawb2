import React, { useEffect, useState } from 'react';
import { useAccount, useChainId, usePublicClient, useSendTransaction, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { formatEther, parseEther } from 'viem';
import { useMediaQuery } from '../hooks/useMediaQuery';

type Tier = 'one_time' | 'rotation';
type AuctionLifecycle = 'upcoming' | 'active' | 'ended';
type AuctionSnapshot = {
  found: boolean;
  auctionId: string | null;
  lifecycle: AuctionLifecycle;
  status?: string;
  starts_at_ms: number | null;
  ends_at_ms: number | null;
  reserve_wei: string;
  highest_bid_wei: string;
  next_valid_bid_wei: string;
  highest_session_id?: string | null;
  highest_wallet?: string | null;
  winner_session_id?: string | null;
  winner_wallet?: string | null;
  reserve_eth?: string | null;
  highest_bid_eth?: string | null;
  next_valid_bid_eth?: string | null;
};

const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
const HARD_MAX_BYTES = 103809024;

const SESSION_STORAGE_KEY = 'clawb_sponsor_session';
const TX_STORAGE_KEY = 'clawb_sponsor_tx_hash';
const BID_INCREMENT_WEI = BigInt('1000000000000000');

const defaultAuctionSnapshot: AuctionSnapshot = {
  found: false,
  auctionId: null,
  lifecycle: 'upcoming',
  starts_at_ms: null,
  ends_at_ms: null,
  reserve_wei: '20000000000000000',
  highest_bid_wei: '0',
  next_valid_bid_wei: '21000000000000000',
  highest_session_id: null,
  highest_wallet: null,
  winner_session_id: null,
  winner_wallet: null,
  reserve_eth: '0.02',
  highest_bid_eth: '0',
  next_valid_bid_eth: '0.021',
};

async function fetchWithFallback(primaryUrl: string, fallbackUrl: string, init: RequestInit): Promise<Response> {
  const primary = await fetch(primaryUrl, init);
  if (primary.status !== 404) return primary;
  return fetch(fallbackUrl, init);
}

async function readApiResponse(response: Response): Promise<{ ok: boolean; payload: any }> {
  const raw = await response.text();
  if (!raw) return { ok: response.ok, payload: {} };
  try {
    return { ok: response.ok, payload: JSON.parse(raw) };
  } catch {
    return { ok: response.ok, payload: { error: raw } };
  }
}

function formatEthFromWei(wei: string): string {
  try {
    return formatEther(BigInt(String(wei || '0')));
  } catch {
    return '0';
  }
}

function toWei(eth: string): bigint {
  try {
    return parseEther(String(eth || '0'));
  } catch {
    return BigInt(0);
  }
}

function toWeiFromRaw(rawWei: string): bigint {
  try {
    return BigInt(String(rawWei || '0'));
  } catch {
    return BigInt(0);
  }
}

function shortWallet(wallet?: string | null): string {
  if (!wallet) return 'n/a';
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function countdownLabel(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SponsorAdPanel: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [tier, setTier] = useState<Tier>('one_time');
  const [rotationBidEth, setRotationBidEth] = useState('0.02');
  const [sponsorName, setSponsorName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionStatus, setSessionStatus] = useState('PENDING_PAYMENT');
  const [minEth, setMinEth] = useState('0.01');
  const [minWei, setMinWei] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txHashInput, setTxHashInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [auction, setAuction] = useState<AuctionSnapshot>(defaultAuctionSnapshot);
  const [auctionNowMs, setAuctionNowMs] = useState(Date.now());
  const [bidError, setBidError] = useState('');

  const auctionMsRemaining = Math.max(0, Number(auction.ends_at_ms || 0) - auctionNowMs);
  const nextValidBidWei = toWeiFromRaw(String(auction.next_valid_bid_wei || defaultAuctionSnapshot.next_valid_bid_wei));
  const nextValidBidEth = auction.next_valid_bid_eth || formatEthFromWei(nextValidBidWei.toString());
  const rotationBidWei = toWei(rotationBidEth);
  const rotationBidTooLow = tier === 'rotation' && rotationBidWei < nextValidBidWei;
  const canBidAuction = auction.lifecycle === 'active';

  const canCreateSession = isConnected && Boolean(address) && !busy && !(tier === 'rotation' && (rotationBidTooLow || !canBidAuction));
  const uploadEnabled = sessionStatus === 'PAID' && Boolean(sessionId) && !busy;

  async function loadAuctionStatus() {
    try {
      const response = await fetchWithFallback('/.netlify/functions/sponsor-auction-status', '/api/sponsor/auction-status', { method: 'GET' });
      if (!response.ok) return;
      const { payload } = await readApiResponse(response);
      const liveAuction = payload?.auction;
      if (!liveAuction) return;
      setAuction({
        ...defaultAuctionSnapshot,
        ...liveAuction,
      });
      if (tier === 'rotation') {
        const currentWei = toWei(rotationBidEth);
        const floorWei = BigInt(String(liveAuction.next_valid_bid_wei || defaultAuctionSnapshot.next_valid_bid_wei));
        if (!rotationBidEth || currentWei < floorWei) {
          setRotationBidEth(String(liveAuction.next_valid_bid_eth || formatEthFromWei(floorWei.toString())));
        }
      }
    } catch {
      // Non-blocking auction card refresh.
    }
  }

  async function ensureBase() {
    if (chainId === base.id) return;
    await switchChainAsync({ chainId: base.id });
  }

  function persistSession(id: string) {
    if (!address) return;
    localStorage.setItem(`${SESSION_STORAGE_KEY}_${address.toLowerCase()}`, id);
  }

  function persistTx(hash: string) {
    if (!address) return;
    localStorage.setItem(`${TX_STORAGE_KEY}_${address.toLowerCase()}`, hash);
  }

  async function hydrateFromSession(sessionPayload: any, id: string) {
    setSessionId(id);
    setSessionStatus(String(sessionPayload.status || 'PENDING_PAYMENT'));
    setSponsorName(String(sessionPayload.sponsor_name || ''));
    setWebsiteUrl(String(sessionPayload.website_url || ''));
    if (sessionPayload.required_wei) {
      setMinWei(String(sessionPayload.required_wei));
      setMinEth(formatEther(BigInt(String(sessionPayload.required_wei))));
    }
    if (sessionPayload.tx_hash) {
      setTxHash(String(sessionPayload.tx_hash));
      setTxHashInput(String(sessionPayload.tx_hash));
      persistTx(String(sessionPayload.tx_hash));
    }
    persistSession(id);
  }

  async function verifyTransactionHash(hashToVerify: string) {
    const normalizedHash = String(hashToVerify || '').trim();
    if (!sessionId || !normalizedHash) {
      setError('Session and tx hash are required to verify.');
      return;
    }
    const verifyInit: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, txHash: normalizedHash }),
    };
    const verifyResponse = await fetchWithFallback('/.netlify/functions/sponsor-verify-tx', '/api/sponsor/verify', verifyInit);
    const { payload: verifyPayload } = await readApiResponse(verifyResponse);
    if (!verifyResponse.ok) {
      if (verifyPayload?.existingSessionId) {
        const existingId = String(verifyPayload.existingSessionId);
        const statusRes = await fetchWithFallback(
          `/.netlify/functions/sponsor-session-status?sessionId=${encodeURIComponent(existingId)}`,
          `/api/sponsor/session-status?sessionId=${encodeURIComponent(existingId)}`,
          { method: 'GET' },
        );
        if (statusRes.ok) {
          const { payload } = await readApiResponse(statusRes);
          await hydrateFromSession(payload.session || {}, existingId);
          setStatus(`Recovered existing sponsor session ${existingId}. You can continue upload if payment is already confirmed.`);
        }
      }
      throw new Error(verifyPayload.error || 'Transaction verification failed');
    }
    setTxHash(normalizedHash);
    setTxHashInput(normalizedHash);
    persistTx(normalizedHash);
    setSessionStatus(verifyPayload.status || 'PAID');
    setStatus('Payment confirmed. Upload is unlocked.');
  }

  useEffect(() => {
    if (!address) return;
    const walletKey = address.toLowerCase();
    const savedSessionId = localStorage.getItem(`${SESSION_STORAGE_KEY}_${walletKey}`) || '';
    const savedTxHash = localStorage.getItem(`${TX_STORAGE_KEY}_${walletKey}`) || '';
    if (savedTxHash) {
      setTxHash(savedTxHash);
      setTxHashInput(savedTxHash);
    }

    async function recover() {
      try {
        if (savedSessionId) {
          const statusRes = await fetchWithFallback(
            `/.netlify/functions/sponsor-session-status?sessionId=${encodeURIComponent(savedSessionId)}`,
            `/api/sponsor/session-status?sessionId=${encodeURIComponent(savedSessionId)}`,
            { method: 'GET' },
          );
          if (statusRes.ok) {
            const { payload } = await readApiResponse(statusRes);
            await hydrateFromSession(payload.session || {}, savedSessionId);
            return;
          }
        }

        const resumeRes = await fetchWithFallback(
          `/.netlify/functions/sponsor-resume-session?wallet=${encodeURIComponent(walletKey)}`,
          `/api/sponsor/resume-session?wallet=${encodeURIComponent(walletKey)}`,
          { method: 'GET' },
        );
        if (!resumeRes.ok) return;
        const { payload: resumePayload } = await readApiResponse(resumeRes);
        if (resumePayload.found && resumePayload.sessionId) {
          await hydrateFromSession(resumePayload.session || {}, String(resumePayload.sessionId));
        }
      } catch {
        // non-blocking session recovery
      }
    }
    void recover();
  }, [address]);

  useEffect(() => {
    void loadAuctionStatus();
    const refreshId = window.setInterval(() => {
      void loadAuctionStatus();
    }, 15000);
    return () => window.clearInterval(refreshId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useEffect(() => {
    const ticker = window.setInterval(() => setAuctionNowMs(Date.now()), 1000);
    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (tier !== 'rotation') {
      setBidError('');
      return;
    }
    if (auction.lifecycle !== 'active') {
      setBidError('Auction is not live right now. Wait for next round.');
      return;
    }
    if (rotationBidTooLow) {
      setBidError(`Bid too low. Next valid bid is ${nextValidBidEth} ETH or higher.`);
      return;
    }
    setBidError('');
  }, [tier, auction.lifecycle, rotationBidTooLow, nextValidBidEth]);

  async function createSession() {
    if (!address) return;
    const trimmedSponsorName = sponsorName.trim();
    if (!trimmedSponsorName) {
      setError('Sponsor name is required.');
      return;
    }
    if (tier === 'rotation') {
      if (!canBidAuction) {
        setError('Rotation auction is not live. No bids accepted right now.');
        return;
      }
      if (rotationBidTooLow) {
        setError(`Bid too low. Next valid bid is ${nextValidBidEth} ETH.`);
        return;
      }
    }
    setBusy(true);
    setError('');
    setStatus('Creating sponsor session...');
    try {
      const requestInit: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          tier,
          bidEth: tier === 'rotation' ? rotationBidEth : undefined,
          sponsorName: trimmedSponsorName,
          websiteUrl,
        }),
      };
      const finalResponse = await fetchWithFallback('/.netlify/functions/sponsor-create-session', '/api/sponsor/session', requestInit);
      const { payload } = await readApiResponse(finalResponse);
      if (!finalResponse.ok) {
        throw new Error(payload.error || 'Could not create session');
      }
      setSessionId(payload.sessionId);
      setSessionStatus(payload.status);
      setMinEth(payload.payment.minEth);
      setMinWei(payload.payment.minWei);
      if (payload.auction) {
        setAuction({
          ...defaultAuctionSnapshot,
          ...payload.auction,
        });
      }
      setTxHash('');
      setTxHashInput('');
      persistSession(payload.sessionId);
      setStatus(`Session created. Send at least ${payload.payment.minEth} ETH to Clawb wallet.`);
    } catch (err) {
      setError((err as Error).message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  async function payAndVerify() {
    if (!sessionId || !minEth) return;
    setBusy(true);
    setError('');
    try {
      await ensureBase();
      setStatus(`Sending payment (${minEth} ETH) on Base...`);
      const hash = await sendTransactionAsync({
        to: CLAWB_WALLET as `0x${string}`,
        value: parseEther(minEth),
      });
      setTxHash(hash);
      setTxHashInput(hash);
      persistTx(hash);
      setStatus('Payment sent. Waiting for confirmations...');
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
      }
      setStatus('Verifying transaction...');
      await verifyTransactionHash(hash);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadVideo() {
    if (!selectedFile || !sessionId) return;
    const trimmedSponsorName = sponsorName.trim();
    if (!trimmedSponsorName) {
      setError('Sponsor name is required.');
      return;
    }
    if (selectedFile.size > HARD_MAX_BYTES) {
      setError(`File exceeds 99MB hard cap (${HARD_MAX_BYTES} bytes).`);
      return;
    }

    setBusy(true);
    setError('');
    setStatus('Preparing upload...');
    try {
      const uploadInitResponse = await fetchWithFallback('/.netlify/functions/sponsor-upload-url', '/api/sponsor/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sponsorName: trimmedSponsorName,
          websiteUrl: websiteUrl.trim(),
          filename: selectedFile.name,
          mime: selectedFile.type || 'video/mp4',
          bytes: selectedFile.size,
        }),
      });
      const { payload: uploadInitPayload } = await readApiResponse(uploadInitResponse);
      if (!uploadInitResponse.ok) {
        throw new Error(uploadInitPayload.error || 'Upload initialization failed');
      }

      setStatus('Uploading commercial bytes...');
      const uploadPutResponse = await fetch(String(uploadInitPayload.uploadUrl || ''), {
        method: 'PUT',
        headers: {
          'Content-Type': String(selectedFile.type || 'video/mp4'),
        },
        body: selectedFile,
      });
      if (!uploadPutResponse.ok) {
        const putText = await uploadPutResponse.text();
        throw new Error(putText || `Storage upload failed with status ${uploadPutResponse.status}`);
      }

      setStatus('Finalizing upload...');
      const completeResponse = await fetchWithFallback('/.netlify/functions/sponsor-upload-complete', '/api/sponsor/upload-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sponsorName: trimmedSponsorName,
          websiteUrl: websiteUrl.trim(),
          filename: selectedFile.name,
          mime: selectedFile.type || 'video/mp4',
          bytes: selectedFile.size,
          storagePath: uploadInitPayload.storagePath,
        }),
      });
      const { payload } = await readApiResponse(completeResponse);
      if (!completeResponse.ok) {
        throw new Error(payload.error || 'Upload finalization failed');
      }
      setSessionStatus(payload.status || 'VERIFIED');
      setUploaded(true);
      if (payload.status === 'QUEUED') {
        setStatus('Upload approved and queued for Clawb TV. Paid ads are prioritized in next eligible 3-video breaks.');
      } else {
        setStatus('Upload approved. Rotation entry is waiting for auction close.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0 }}>Advertise on Clawb TV</h3>
      <p style={{ margin: 0 }}>Buy a slot, upload your ad, and Clawb runs it automatically during sponsor breaks.</p>
      <div style={{ border: '2px inset #808080', background: '#f3f3f3', padding: 8 }}>
        <p style={{ margin: '0 0 6px 0' }}><strong>Rules</strong></p>
        <p style={{ margin: '0 0 4px 0' }}>Permissionless intake</p>
        <p style={{ margin: '0 0 4px 0' }}>No content review</p>
        <p style={{ margin: '0 0 4px 0' }}>Technical checks only</p>
        <p style={{ margin: '0 0 4px 0' }}>Max file size: 99MB (103,809,024 bytes)</p>
        <p style={{ margin: 0 }}>Accepted formats: mp4, webm, mov</p>
      </div>
      <div style={{ border: '2px inset #808080', background: '#f3f3f3', padding: 8 }}>
        <p style={{ margin: '0 0 6px 0' }}><strong>Products</strong></p>
        <p style={{ margin: '0 0 4px 0' }}><strong>One-Time Play - 0.01 ETH (Base)</strong></p>
        <p style={{ margin: '0 0 6px 0' }}>Your ad is prioritized for next eligible breaks and airs 2 total times across separate breaks.</p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Rotation Auction - 24h (reserve 0.02 ETH)</strong></p>
        <p style={{ margin: 0 }}>Top bid at auction close gets added to recurring rotation and prioritized in upcoming breaks.</p>
      </div>
      <div style={{ border: '2px inset #808080', background: '#f3f3f3', padding: 8 }}>
        <p style={{ margin: '0 0 6px 0' }}><strong>Flow</strong></p>
        <p style={{ margin: '0 0 4px 0' }}>Create sponsor session</p>
        <p style={{ margin: '0 0 4px 0' }}>Pay and verify onchain (Base)</p>
        <p style={{ margin: '0 0 4px 0' }}>Upload commercial (unlocks after PAID)</p>
        <p style={{ margin: 0 }}>Clawb ingests and schedules playback automatically</p>
      </div>
      <div style={{ border: '2px inset #808080', background: '#f3f3f3', padding: 8 }}>
        <p style={{ margin: '0 0 6px 0' }}><strong>Break logic (live)</strong></p>
        <p style={{ margin: '0 0 4px 0' }}>Each commercial break is always 3 videos total.</p>
        <p style={{ margin: '0 0 4px 0' }}>Priority: first-play pending paid ads -&gt; paid rotation/replay ads -&gt; Lawb Inc fallback videos.</p>
        <p style={{ margin: '0 0 4px 0' }}>No duplicate video is played within the same break.</p>
        <p style={{ margin: 0 }}>If paid queue is empty, all 3 slots are Lawb Inc fallback videos.</p>
      </div>
      <div style={{ border: '2px inset #808080', background: '#f3f3f3', padding: 8 }}>
        <p style={{ margin: '0 0 6px 0' }}><strong>Rotation auction</strong></p>
        <p style={{ margin: '0 0 4px 0' }}>
          <strong>{auction.lifecycle === 'active' ? 'Auction live' : auction.lifecycle === 'upcoming' ? 'Auction upcoming' : 'Auction ended'}</strong>
        </p>
        <p style={{ margin: '0 0 4px 0' }}>
          <strong>Time remaining:</strong> {auction.lifecycle === 'active' ? countdownLabel(auctionMsRemaining) : '00:00:00'}
        </p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Reserve:</strong> {auction.reserve_eth || formatEthFromWei(auction.reserve_wei)} ETH</p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Current highest:</strong> {auction.highest_bid_eth || formatEthFromWei(auction.highest_bid_wei)} ETH</p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Next valid bid &gt;=</strong> {nextValidBidEth} ETH</p>
        {auction.lifecycle === 'ended' && (
          <>
            <p style={{ margin: '0 0 4px 0' }}><strong>Winner:</strong> {shortWallet(auction.winner_wallet || auction.highest_wallet)}</p>
            <p style={{ margin: 0 }}><strong>Final bid:</strong> {auction.highest_bid_eth || formatEthFromWei(auction.highest_bid_wei)} ETH</p>
          </>
        )}
      </div>

      {!isConnected && (
        <p style={{ margin: 0, color: '#b00020' }}>Connect wallet first, then create a sponsor session.</p>
      )}

      <div style={{ border: '2px inset #808080', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="sponsor-name">
          Sponsor Name (required)
          <input
            id="sponsor-name"
            type="text"
            value={sponsorName}
            onChange={(event) => setSponsorName(event.target.value)}
            placeholder="Sponsor Name"
            style={{ marginTop: 4, width: '100%', maxWidth: isMobile ? '100%' : 360, minHeight: isMobile ? 40 : 30, boxSizing: 'border-box' }}
            disabled={busy}
          />
          <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>
            Name shown in stream sponsor roll-call after your ad plays.
          </p>
        </label>
        <label htmlFor="website-url">
          Website Link (optional)
          <input
            id="website-url"
            type="text"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="example.com"
            style={{ marginTop: 4, width: '100%', maxWidth: isMobile ? '100%' : 360, minHeight: isMobile ? 40 : 30, boxSizing: 'border-box' }}
            disabled={busy}
          />
          <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>
            Shown with sponsor roll-call (example: example.com).
          </p>
        </label>
        <label htmlFor="sponsor-tier">
          Select Product
          <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>
            Choose one-time (2 total airings across breaks) or rotation auction.
          </p>
        </label>
        <select
          id="sponsor-tier"
          value={tier}
          onChange={(e) => setTier(e.target.value as Tier)}
          style={{ width: '100%', maxWidth: isMobile ? '100%' : 280, minHeight: isMobile ? 40 : 30 }}
          disabled={busy}
        >
          <option value="one_time">One-time: 2 airings across breaks (0.01 ETH)</option>
          <option value="rotation">Rotation auction (reserve 0.02 ETH)</option>
        </select>
        {tier === 'rotation' && (
          <label htmlFor="rotation-bid">
            Bid Amount (ETH)
            <input
              id="rotation-bid"
              type="number"
              min={nextValidBidEth}
              step="0.001"
              value={rotationBidEth}
              onChange={(e) => setRotationBidEth(e.target.value)}
              style={{ marginLeft: 8, width: isMobile ? 140 : 120, minHeight: isMobile ? 36 : 28 }}
              disabled={busy || !canBidAuction}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>
              Next valid bid is {nextValidBidEth} ETH. No soft stuff: underbids get kicked.
            </p>
            {bidError && <p style={{ margin: '4px 0 0 0', color: '#b00020', fontSize: 12 }}>{bidError}</p>}
          </label>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => void createSession()} disabled={!canCreateSession || !sponsorName.trim()} style={{ minHeight: isMobile ? 44 : undefined }}>
          Create Sponsor Session
        </button>
        <button type="button" onClick={() => void payAndVerify()} disabled={!sessionId || busy} style={{ minHeight: isMobile ? 44 : undefined }}>
          Pay & Verify Onchain
        </button>
      </div>

      <div style={{ border: '2px inset #808080', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="sponsor-tx-hash">
          Already paid? Verify existing tx hash
          <input
            id="sponsor-tx-hash"
            type="text"
            value={txHashInput}
            onChange={(event) => setTxHashInput(event.target.value)}
            placeholder="0x..."
            style={{ marginTop: 4, width: '100%', boxSizing: 'border-box', minHeight: isMobile ? 40 : 30 }}
            disabled={!sessionId || busy}
          />
        </label>
        <button
          type="button"
          disabled={!sessionId || !txHashInput.trim() || busy}
          onClick={() => void (async () => {
            setBusy(true);
            setError('');
            setStatus('Verifying existing transaction...');
            try {
              await verifyTransactionHash(txHashInput);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          })()}
          style={{ minHeight: isMobile ? 44 : undefined }}
        >
          Verify existing tx hash
        </button>
      </div>

      {sessionId && (
        <div style={{ border: '2px inset #808080', padding: 8, background: '#f3f3f3' }}>
          <p style={{ margin: '0 0 4px 0' }}><strong>Session:</strong> {sessionId}</p>
          <p style={{ margin: '0 0 4px 0' }}><strong>Status:</strong> {sessionStatus}</p>
          <p style={{ margin: '0 0 4px 0' }}><strong>Recipient:</strong> {CLAWB_WALLET}</p>
          <p style={{ margin: '0 0 4px 0' }}><strong>Min payment:</strong> {minEth} ETH ({minWei} wei)</p>
          {txHash && (
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
              View tx on BaseScan
            </a>
          )}
        </div>
      )}

      <div style={{ border: '2px inset #808080', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="sponsor-file">Upload commercial (enabled after PAID)</label>
        <input
          id="sponsor-file"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          disabled={!uploadEnabled}
          style={{ width: '100%' }}
        />
        <button type="button" onClick={() => void uploadVideo()} disabled={!uploadEnabled || !selectedFile} style={{ minHeight: isMobile ? 44 : undefined }}>
          Upload Commercial
        </button>
      </div>

      {status && <p style={{ margin: 0 }}>{status}</p>}
      {error && <p style={{ margin: 0, color: '#b00020' }}>{error}</p>}
      {uploaded && <p style={{ margin: 0 }}>Thank you for sponsoring Clawb TV.</p>}
    </div>
  );
};

export default SponsorAdPanel;
