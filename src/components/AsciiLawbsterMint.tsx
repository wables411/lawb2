import React, { useState, useEffect, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { getClaimConditionForUser, getClaimedAmount, getRemainingSupply, type ClaimCondition } from '../utils/asciiLawbsterClaimConditions';
import { createMintCalls } from '../utils/asciiLawbsterCalls';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';

const useStyles = createUseStyles({
  container: {
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    fontSize: '12px',
    color: '#000',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#000',
  },
  subtitle: {
    fontSize: '12px',
    textAlign: 'center',
    marginBottom: '20px',
    color: '#666',
  },
  claimStatusSection: {
    border: '1px solid #808080',
    padding: '10px',
    marginBottom: '15px',
    backgroundColor: '#ffffff',
    fontSize: '11px',
  },
  claimStatusTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '12px',
  },
  claimStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '11px',
  },
  claimStatusLabel: {
    fontWeight: 'bold',
  },
  mintSection: {
    marginTop: '15px',
  },
  quantitySelector: {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  quantityLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  quantityInput: {
    width: '60px',
    padding: '2px 5px',
    border: '1px solid #808080',
    fontSize: '12px',
    minHeight: 'auto',
  },
  mintButton: {
    background: '#c0c0c0',
    border: '2px outset #c0c0c0',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
    minHeight: 'auto',
    touchAction: 'manipulation',
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    '&:active:not(:disabled)': {
      border: '2px inset #c0c0c0',
    },
  },
  mintPrice: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#000',
    marginTop: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    fontSize: '12px',
  },
  error: {
    backgroundColor: '#ffcccc',
    border: '1px solid #ff0000',
    padding: '10px',
    marginBottom: '10px',
    color: '#cc0000',
    fontSize: '12px',
    borderRadius: '0',
  },
  success: {
    backgroundColor: '#ccffcc',
    border: '1px solid #00cc00',
    padding: '10px',
    marginBottom: '10px',
    color: '#006600',
    fontSize: '12px',
    borderRadius: '0',
  },
  switchChainButton: {
    backgroundColor: '#008000',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '0',
    cursor: 'pointer',
    fontSize: '12px',
    minHeight: 'auto',
    touchAction: 'manipulation',
    marginTop: '10px',
  },
  '@media (max-width: 768px)': {
    title: {
      fontSize: '20px',
      marginBottom: '12px',
    },
    subtitle: {
      fontSize: '14px',
      marginBottom: '24px',
    },
    claimStatusSection: {
      padding: '12px',
      fontSize: '14px',
    },
    claimStatusTitle: {
      fontSize: '16px',
      marginBottom: '12px',
    },
    claimStatusRow: {
      fontSize: '14px',
      marginBottom: '8px',
    },
    quantitySelector: {
      marginBottom: '20px',
    },
    quantityLabel: {
      fontSize: '14px',
    },
    quantityInput: {
      width: '80px',
      padding: '8px 5px',
      fontSize: '16px',
      minHeight: '44px',
    },
    mintButton: {
      padding: '14px 24px',
      fontSize: '16px',
      minHeight: '48px',
    },
    mintPrice: {
      fontSize: '14px',
      marginTop: '12px',
    },
    loading: {
      fontSize: '14px',
      padding: '24px',
    },
    error: {
      fontSize: '14px',
      padding: '12px',
    },
    success: {
      fontSize: '14px',
      padding: '12px',
    },
    switchChainButton: {
      padding: '12px 20px',
      fontSize: '14px',
      minHeight: '44px',
    },
  },
});

interface AsciiLawbsterMintProps {
  walletAddress: string;
}

const AsciiLawbsterMint: React.FC<AsciiLawbsterMintProps> = ({ walletAddress }) => {
  const classes = useStyles();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [condition, setCondition] = useState<ClaimCondition | null>(null);
  const [claimed, setClaimed] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaQueryMatch = useMediaQuery('(max-width: 768px)');
  const capabilities = useMobileCapabilities();
  
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return mediaQueryMatch;
    }
    const ua = navigator.userAgent || '';
    const uaMobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile|BlackBerry/i.test(ua);
    return uaMobile || (capabilities.isTouchDevice && (mediaQueryMatch || capabilities.screenWidth <= 768));
  }, [mediaQueryMatch, capabilities]);

  useEffect(() => {
    if (isConnected && address && publicClient && chainId === base.id) {
      void loadClaimCondition();
    }
  }, [isConnected, address, publicClient, chainId]);

  async function loadClaimCondition() {
    if (!address || !publicClient) return;
    
    setLoading(true);
    setError(null);
    try {
      const claimCondition = await getClaimConditionForUser(publicClient, address);
      setCondition(claimCondition);

      if (claimCondition) {
        const [claimedAmount, remainingSupply] = await Promise.all([
          getClaimedAmount(publicClient, address, claimCondition.id),
          getRemainingSupply(publicClient, claimCondition.id),
        ]);
        setClaimed(claimedAmount);
        setRemaining(remainingSupply);
      }
    } catch (err) {
      console.error('Error loading claim condition:', err);
      setError('Failed to load claim condition');
    } finally {
      setLoading(false);
    }
  }

  function handleTransactionSuccess() {
    // Reload claim condition after successful mint
    if (address) {
      void loadClaimCondition();
    }
    setQuantity(1); // Reset quantity
  }

  useEffect(() => {
    if (isSuccess) {
      handleTransactionSuccess();
    }
  }, [isSuccess]);

  async function handleMint() {
    if (!condition || !address || quantity <= 0) return;

    // Check if on Base chain
    if (chainId !== base.id) {
      setError('Please switch to Base network to mint ASCII Lawbsters');
      return;
    }

    setError(null);
    try {
      const calls = createMintCalls({
        userAddress: address,
        quantity,
        condition,
      });

      if (calls.length === 0) {
        setError('Unable to create mint transaction');
        return;
      }

      const call = calls[0];
      await writeContract({
        address: call.address,
        abi: call.abi,
        functionName: call.functionName,
        args: call.args,
        value: call.value,
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      console.error('Mint error:', err);
    }
  }

  // Prepare transaction calls for wagmi
  const calls = condition && address && chainId === base.id
    ? createMintCalls({
        userAddress: address,
        quantity,
        condition,
      })
    : [];

  const isLoading = isPending || isConfirming;
  const canMint = condition && (condition.quantityLimit === 0 || claimed < condition.quantityLimit);
  const remainingForUser = condition && condition.quantityLimit > 0
    ? Math.max(0, condition.quantityLimit - claimed)
    : remaining;

  const maxQuantity = condition
    ? condition.quantityLimit === 0
      ? 10
      : Math.min(condition.quantityLimit, remainingForUser)
    : 1;

  if (!isConnected || !address) {
    return (
      <div className={classes.container}>
        <div className={classes.loading}>Please connect your wallet to start minting</div>
      </div>
    );
  }

  if (chainId !== base.id) {
    return (
      <div className={classes.container}>
        <div className={classes.error}>
          Please switch to Base network to mint ASCII Lawbsters. Current network: {chainId}
        </div>
        <button
          className={classes.switchChainButton}
          onClick={() => switchChain({ chainId: base.id })}
        >
          Switch to Base
        </button>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <h1 className={classes.title}>MINT ASCII LAWBSTERS</h1>
      <p className={classes.subtitle}>FOR THE LAWB OF THE GAME</p>

      {loading ? (
        <div className={classes.loading}>Loading claim status...</div>
      ) : (
        <>
          {condition && (
            <div className={classes.claimStatusSection}>
              <div className={classes.claimStatusTitle}>Your Mint Status</div>
              <div className={classes.claimStatusRow}>
                <span className={classes.claimStatusLabel}>Condition:</span>
                <span>{condition.name}</span>
              </div>
              <div className={classes.claimStatusRow}>
                <span className={classes.claimStatusLabel}>Price:</span>
                <span>Free</span>
              </div>
              <div className={classes.claimStatusRow}>
                <span className={classes.claimStatusLabel}>Claimed:</span>
                <span>{claimed} / {condition.quantityLimit === 0 ? '∞' : condition.quantityLimit}</span>
              </div>
              <div className={classes.claimStatusRow}>
                <span className={classes.claimStatusLabel}>Remaining:</span>
                <span>{remainingForUser} available</span>
              </div>
              {!canMint && (
                <div className={classes.error} style={{ marginTop: '8px', marginBottom: '0' }}>
                  You have reached your mint limit for this condition
                </div>
              )}
            </div>
          )}

          {condition && canMint && (
            <div className={classes.mintSection}>
              <div className={classes.quantitySelector}>
                <label className={classes.quantityLabel}>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                  className={classes.quantityInput}
                />
              </div>

              {(writeError || error) && (
                <div className={classes.error}>
                  {writeError?.message || error}
                </div>
              )}

              {isSuccess && (
                <div className={classes.success}>
                  ✅ Mint successful! Transaction: {hash?.slice(0, 10)}...
                </div>
              )}

              <button
                className={classes.mintButton}
                onClick={() => void handleMint()}
                disabled={!condition || quantity <= 0 || calls.length === 0 || isLoading || !canMint}
              >
                {isLoading ? 'Processing...' : `Mint ${quantity} NFT${quantity > 1 ? 's' : ''}`}
              </button>

              <div className={classes.mintPrice}>
                Free Mint
              </div>
            </div>
          )}

          {!condition && !loading && (
            <div className={classes.error}>
              Unable to load claim condition
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AsciiLawbsterMint;

