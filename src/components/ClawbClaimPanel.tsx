import React, { useMemo, useState } from 'react';
import { formatUnits } from 'ethers';
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { CLAWB_MERKLE_DISTRIBUTOR_ABI } from '../config/abis';

const CLAIM_CONTRACT_ADDRESS = (import.meta.env.VITE_CLAWB_CLAIM_CONTRACT_ADDRESS as string | undefined) || '';

type ClaimEntry = {
  index: number;
  account: string;
  amount: string;
  proof: string[];
};

function buildAuthMessage(params: {
  account: string;
  index: number;
  amount: string;
  deadline: number;
  contractAddress: string;
}) {
  return [
    'lawb.xyz sponsored claim authorization',
    `account:${params.account.toLowerCase()}`,
    `index:${params.index}`,
    `amount:${params.amount}`,
    'chainId:8453',
    `contract:${params.contractAddress.toLowerCase()}`,
    `deadline:${params.deadline}`,
  ].join('\n');
}

const ClawbClaimPanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [claimEntry, setClaimEntry] = useState<ClaimEntry | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const amountDisplay = useMemo(() => {
    if (!claimEntry) return '';
    return Number(formatUnits(claimEntry.amount, 18)).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  }, [claimEntry]);

  async function loadClaim() {
    if (!address) return;
    setLoading(true);
    setError(null);
    setStatus('Checking eligibility...');
    try {
      const response = await fetch(`/.netlify/functions/clawb-claim-entry?account=${address.toLowerCase()}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Could not load claim entry');
      }
      if (!json.eligible) {
        setClaimEntry(null);
        setAlreadyClaimed(false);
        setStatus('This wallet is not in the current claim snapshot.');
        return;
      }
      setClaimEntry(json.claim);
      setAlreadyClaimed(Boolean(json.alreadyClaimed));
      setStatus(json.alreadyClaimed ? 'This wallet has already claimed.' : 'Eligible and ready to claim.');
    } catch (err) {
      setError((err as Error).message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  async function ensureBase() {
    if (chainId === base.id) return;
    await switchChainAsync({ chainId: base.id });
  }

  async function handleSponsoredClaim() {
    if (!address || !claimEntry) return;
    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract address is not configured yet.');
      return;
    }
    setLoading(true);
    setError(null);
    setStatus('Requesting wallet signature for sponsored claim...');
    try {
      await ensureBase();
      const deadline = Date.now() + 10 * 60 * 1000;
      const message = buildAuthMessage({
        account: address,
        index: claimEntry.index,
        amount: claimEntry.amount,
        deadline,
        contractAddress: CLAIM_CONTRACT_ADDRESS,
      });

      const provider = (window as any).ethereum;
      if (!provider) throw new Error('No wallet provider found');
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });

      setStatus('Submitting sponsored transaction...');
      const relayResponse = await fetch('/.netlify/functions/clawb-claim-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: address,
          signature,
          deadline,
        }),
      });
      const relayJson = await relayResponse.json();
      if (!relayResponse.ok) {
        throw new Error(relayJson.error || 'Sponsored claim failed');
      }
      if (relayJson.alreadyClaimed) {
        setAlreadyClaimed(true);
        setStatus('Already claimed.');
        return;
      }

      setTxHash(relayJson.txHash || null);
      setAlreadyClaimed(true);
      setStatus('Sponsored claim submitted successfully.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDirectClaim() {
    if (!address || !claimEntry) return;
    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract address is not configured yet.');
      return;
    }
    setLoading(true);
    setError(null);
    setStatus('Sending direct claim transaction...');
    try {
      await ensureBase();
      const hash = await writeContractAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAWB_MERKLE_DISTRIBUTOR_ABI,
        functionName: 'claim',
        args: [
          BigInt(claimEntry.index),
          claimEntry.account as `0x${string}`,
          BigInt(claimEntry.amount),
          claimEntry.proof as `0x${string}`[],
        ],
      });
      setTxHash(hash);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setAlreadyClaimed(true);
      setStatus('Direct claim confirmed on Base.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ margin: 0 }}>Claim $CLAWB (Base)</h3>
      <p style={{ margin: 0 }}>
        Sponsored mode signs a message and lawb.xyz pays Base gas for your claim transaction.
      </p>

      {!isConnected && <p style={{ margin: 0 }}>Connect wallet first, then click "Check Eligibility".</p>}
      {isConnected && (
        <p style={{ margin: 0, fontFamily: 'monospace' }}>
          Wallet: {address}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => void loadClaim()} disabled={loading || !isConnected}>
          Check Eligibility
        </button>
        <button
          onClick={() => void handleSponsoredClaim()}
          disabled={loading || !claimEntry || alreadyClaimed || !isConnected}
        >
          Claim (Sponsored)
        </button>
        <button
          onClick={() => void handleDirectClaim()}
          disabled={loading || !claimEntry || alreadyClaimed || !isConnected}
        >
          Claim Direct
        </button>
      </div>

      {claimEntry && (
        <div style={{ border: '2px inset #808080', padding: '8px', background: '#f3f3f3' }}>
          <p style={{ margin: '0 0 6px 0' }}><strong>Allocation:</strong> {amountDisplay} CLAWB</p>
          <p style={{ margin: '0 0 6px 0' }}><strong>Index:</strong> {claimEntry.index}</p>
          <p style={{ margin: 0 }}><strong>Status:</strong> {alreadyClaimed ? 'Claimed' : 'Unclaimed'}</p>
        </div>
      )}

      {status && <p style={{ margin: 0 }}>{status}</p>}
      {error && <p style={{ margin: 0, color: '#b00020' }}>{error}</p>}

      {txHash && (
        <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
          View transaction on BaseScan
        </a>
      )}

      {!CLAIM_CONTRACT_ADDRESS && (
        <p style={{ margin: 0, color: '#b00020' }}>
          Missing `VITE_CLAWB_CLAIM_CONTRACT_ADDRESS` (set this after deploying claim contract).
        </p>
      )}
    </div>
  );
};

export default ClawbClaimPanel;
