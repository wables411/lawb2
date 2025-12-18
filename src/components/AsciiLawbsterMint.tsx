import React, { useState, useEffect, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { getClaimConditionForUser, getClaimedAmount, getRemainingSupply, type ClaimCondition } from '../utils/asciiLawbsterClaimConditions';
import { createMintCalls } from '../utils/asciiLawbsterCalls';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import { ASCII_LAWBSTER_CONTRACT_ADDRESS, ASCII_LAWBSTER_CONTRACT_ABI } from '../utils/asciiLawbsterContract';
import { getAlchemyNFTsForCollection, type NFT } from '../mint';

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
  onMintSuccess?: (hash: string) => void;
}

const AsciiLawbsterMint: React.FC<AsciiLawbsterMintProps> = ({ walletAddress, onMintSuccess }) => {
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
  const [recentlyMinted, setRecentlyMinted] = useState<NFT[]>([]);
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [maxSupply, setMaxSupply] = useState<number>(420);

  // Read total minted and max supply from contract
  const { data: totalMintedData } = useReadContract({
    address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
    abi: ASCII_LAWBSTER_CONTRACT_ABI,
    functionName: 'totalMinted',
    chainId: base.id,
    query: {
      enabled: chainId === base.id,
    },
  });

  const { data: maxSupplyData } = useReadContract({
    address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
    abi: ASCII_LAWBSTER_CONTRACT_ABI,
    functionName: 'maxTotalSupply',
    chainId: base.id,
    query: {
      enabled: chainId === base.id,
    },
  });

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

  // Auto-switch to Base chain when in Base Mini App
  useEffect(() => {
    const isBaseMiniApp = typeof window !== 'undefined' && (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })();
    
    if (isBaseMiniApp && isConnected && chainId !== base.id && switchChain) {
      void switchChain({ chainId: base.id });
    }
  }, [isConnected, chainId, switchChain]);

  useEffect(() => {
    if (isConnected && address && publicClient && chainId === base.id) {
      void loadClaimCondition();
      void loadRecentlyMinted();
    }
  }, [isConnected, address, publicClient, chainId]);

  useEffect(() => {
    if (totalMintedData !== undefined) {
      setTotalMinted(Number(totalMintedData));
    }
  }, [totalMintedData]);

  useEffect(() => {
    if (maxSupplyData !== undefined) {
      setMaxSupply(Number(maxSupplyData) || 420);
    }
  }, [maxSupplyData]);

  async function loadRecentlyMinted() {
    try {
      if (!publicClient || chainId !== base.id) {
        setRecentlyMinted([]);
        return;
      }

      // Use Base RPC to query Transfer events to find most recently minted NFTs
      // This is more accurate than relying on token ID order
      const { JsonRpcProvider } = await import('ethers');
      const BASE_RPC_ENDPOINTS = [
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://base-rpc.publicnode.com',
      ];
      
      let provider;
      for (const rpcUrl of BASE_RPC_ENDPOINTS) {
        try {
          provider = new JsonRpcProvider(rpcUrl);
          await provider.getBlockNumber();
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!provider) {
        throw new Error('Failed to connect to Base RPC');
      }

      const TRANSFER_EVENT_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
      const zeroAddressPadded = '0x' + ZERO_ADDRESS.slice(2).padStart(64, '0');
      
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000); // Last ~100k blocks
      
      // Query Transfer events where from = zero address (mint events)
      const logs = await provider.getLogs({
        address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
        topics: [
          TRANSFER_EVENT_SIGNATURE,
          zeroAddressPadded, // from = zero address (mint)
          null // to = any address
        ],
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
      
      // Extract token IDs and block numbers, sort by block number descending (most recent first)
      const mintEvents = logs.map(log => ({
        tokenId: BigInt(log.topics[3] || '0').toString(),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash
      })).sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
      
      // Get top 6 most recent mints
      const recentTokenIds = mintEvents.slice(0, 6).map(e => e.tokenId);
      
      // Fetch metadata for each using Alchemy API (more reliable than IPFS)
      // Get all NFTs from Alchemy and match by token ID
      try {
        const response = await getAlchemyNFTsForCollection(ASCII_LAWBSTER_CONTRACT_ADDRESS, 100, 8453);
        const alchemyNftsMap = new Map(response.data.map(nft => [nft.token_id, nft]));
        
        const nftsWithMetadata = recentTokenIds.map((tokenId) => {
          const tokenIdNum = Number(tokenId);
          const alchemyNft = alchemyNftsMap.get(tokenIdNum);
          
          // If Alchemy has it, use that (most reliable)
          if (alchemyNft) {
            return alchemyNft;
          }
          
          // Otherwise create a placeholder NFT (token exists, metadata fetch just failed)
          return {
            id: `${ASCII_LAWBSTER_CONTRACT_ADDRESS}-${tokenId}`,
            address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
            token_id: tokenIdNum,
            name: `ASCII Lawbster #${tokenId}`,
            image_url: '/assets/asciilawb.GIF',
            image: '/assets/asciilawb.GIF',
            image_url_shrunk: '/assets/asciilawb.GIF',
            attributes: '',
            owner_of: '',
            block_minted: 0,
            contract_type: 'ERC721',
            description: '',
            animation_url: '',
            metadata: '',
            chain_id: 8453,
            old_image_url: '',
            old_token_uri: '',
            token_uri: '',
            log_index: 0,
            transaction_index: 0,
            collection_id: ASCII_LAWBSTER_CONTRACT_ADDRESS,
            num_items: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owners: []
          } as NFT;
        });
        
        setRecentlyMinted(nftsWithMetadata);
      } catch (alchemyErr) {
        console.error('Failed to fetch from Alchemy, using placeholders:', alchemyErr);
        // Fallback: create placeholder NFTs for each token ID
        const placeholderNfts = recentTokenIds.map((tokenId) => ({
          id: `${ASCII_LAWBSTER_CONTRACT_ADDRESS}-${tokenId}`,
          address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
          token_id: Number(tokenId),
          name: `ASCII Lawbster #${tokenId}`,
          image_url: '/assets/asciilawb.GIF',
          image: '/assets/asciilawb.GIF',
          image_url_shrunk: '/assets/asciilawb.GIF',
          attributes: '',
          owner_of: '',
          block_minted: 0,
          contract_type: 'ERC721',
          description: '',
          animation_url: '',
          metadata: '',
          chain_id: 8453,
          old_image_url: '',
          old_token_uri: '',
          token_uri: '',
          log_index: 0,
          transaction_index: 0,
          collection_id: ASCII_LAWBSTER_CONTRACT_ADDRESS,
          num_items: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owners: []
        } as NFT));
        setRecentlyMinted(placeholderNfts);
      }
    } catch (err) {
      console.error('Error loading recently minted NFTs:', err);
      // Fallback: try Alchemy API with large page size
      try {
        const response = await getAlchemyNFTsForCollection(ASCII_LAWBSTER_CONTRACT_ADDRESS, 100, 8453);
        const topRecent = response.data.slice(0, 6);
        setRecentlyMinted(topRecent);
      } catch (fallbackErr) {
        console.error('Fallback to Alchemy also failed:', fallbackErr);
        setRecentlyMinted([]);
      }
    }
  }

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
    // Reload claim condition and recently minted after successful mint
    if (address) {
      void loadClaimCondition();
      void loadRecentlyMinted();
    }
    setQuantity(1); // Reset quantity
  }

  useEffect(() => {
    if (isSuccess && hash) {
      handleTransactionSuccess();
      // Notify parent component of successful mint
      if (onMintSuccess) {
        onMintSuccess(hash);
      }
    }
  }, [isSuccess, hash, onMintSuccess]);

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
      <p className={classes.subtitle} style={{ marginTop: '4px', fontSize: '11px' }}>
        INSPIRED BY{' '}
        <a 
          href="https://www.scatter.art/ascii-milady" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#0000FF', textDecoration: 'underline' }}
        >
          ASCII MILADY
        </a>
      </p>

      {loading ? (
        <div className={classes.loading}>Loading claim status...</div>
      ) : (
        <>
          <div className={classes.claimStatusSection}>
            <div className={classes.claimStatusTitle}>Mint Status</div>
            <div className={classes.claimStatusRow}>
              <span className={classes.claimStatusLabel}>Max Quantity:</span>
              <span>{maxSupply}</span>
            </div>
            <div className={classes.claimStatusRow}>
              <span className={classes.claimStatusLabel}>Currently Minted:</span>
              <span>{totalMinted}</span>
            </div>
            {condition && (
              <>
                <div className={classes.claimStatusRow}>
                  <span className={classes.claimStatusLabel}>Your Claimed:</span>
                  <span>{claimed} / {condition.quantityLimit === 0 ? '∞' : condition.quantityLimit}</span>
                </div>
                {!canMint && (
                  <div className={classes.error} style={{ 
                    marginTop: isMobile ? '12px' : '8px', 
                    marginBottom: '0',
                    padding: isMobile ? '12px' : '10px',
                    fontSize: isMobile ? '14px' : '12px'
                  }}>
                    You have reached your mint limit for this condition
                  </div>
                )}
              </>
            )}
          </div>

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

          {/* Recently Minted NFTs */}
          {recentlyMinted.length > 0 && (
            <div style={{
              marginTop: isMobile ? '24px' : '20px',
              borderTop: '2px solid #808080',
              paddingTop: isMobile ? '16px' : '15px'
            }}>
              <h3 style={{ 
                marginBottom: isMobile ? '12px' : '10px', 
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: 'bold'
              }}>Recently Minted</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile 
                  ? 'repeat(auto-fill, minmax(70px, 1fr))' 
                  : 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: isMobile ? '8px' : '10px',
                marginTop: isMobile ? '12px' : '10px',
              }}>
                {recentlyMinted.map((nft) => (
                  <div key={nft.id} style={{
                    border: '1px solid #808080',
                    padding: isMobile ? '6px' : '5px',
                    backgroundColor: '#ffffff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}>
                    <img 
                      src={nft.image_url || nft.image || nft.image_url_shrunk || '/assets/asciilawb.GIF'} 
                      alt={nft.name || `#${nft.token_id}`}
                      style={{
                        width: '100%',
                        height: isMobile ? '70px' : '80px',
                        objectFit: 'cover',
                        marginBottom: isMobile ? '6px' : '5px'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/asciilawb.GIF';
                      }}
                    />
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '10px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {nft.name || `#${nft.token_id}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AsciiLawbsterMint;

