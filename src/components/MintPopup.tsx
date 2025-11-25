import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { getEligibleInviteLists, mintNFT, getCollectionStats, getRecentlyMintedNFTsGlobal, type NFT } from '../mint';
import { createUseStyles } from 'react-jss';
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { mainnet } from 'wagmi/chains';

const useStyles = createUseStyles({
  popup: {
    position: 'absolute',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '600px',
    height: '480px',
    minWidth: '360px',
    minHeight: '240px',
    top: 'calc(50vh - 240px)',
    left: 'calc(50vw - 300px)',
    display: ({ isOpen }: { isOpen: boolean }) => (isOpen ? 'block' : 'none'),
    resize: 'both',
    overflow: 'auto',
    zIndex: 5000
  },
  header: {
    background: 'navy',
    color: '#fff',
    padding: '2px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'move',
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none'
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1px'
  },
  titleBarButton: {
    width: '16px',
    height: '14px',
    border: '1px outset #c0c0c0',
    backgroundColor: '#c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    color: 'black',
    '&:active': {
      border: '1px inset #c0c0c0'
    }
  },
  content: {
    padding: '10px',
    height: 'calc(100% - 30px)',
    overflow: 'auto'
  },
  statsContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
    fontSize: '11px'
  },
  statBox: {
    border: '1px solid #808080',
    padding: '8px',
    backgroundColor: '#ffffff',
    minWidth: '100px'
  },
  statLabel: {
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  recentlyMinted: {
    marginTop: '20px',
    borderTop: '2px solid #808080',
    paddingTop: '15px'
  },
  nftGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  nftItem: {
    border: '1px solid #808080',
    padding: '5px',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  nftImage: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    marginBottom: '5px'
  },
  revealOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    flexDirection: 'column',
    gap: '20px'
  },
  revealVideo: {
    maxWidth: '600px',
    maxHeight: '600px',
    width: 'auto',
    height: 'auto',
    border: '4px solid #fff',
    borderRadius: '8px'
  },
  revealImage: {
    maxWidth: '400px',
    maxHeight: '400px',
    border: '4px solid #fff',
    borderRadius: '8px',
    animation: '$fadeIn 0.5s ease-in'
  },
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'scale(0.9)'
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1)'
    }
  }
});

interface InviteList {
  id: string;
  root: string;
  address: string;
  name: string;
  currency_address: string;
  currency_symbol: string;
  token_price: string;
  decimals: number;
  start_time: string;
  end_time: string | null;
  wallet_limit: number;
  list_limit: number;
  unit_size: number;
  created_at: string;
  updated_at: string;
}

interface MintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  walletAddress: string;
}

const MintPopup: React.FC<MintPopupProps> = ({ isOpen, onClose, onMinimize, walletAddress }) => {
  const classes = useStyles({ isOpen });
  const nodeRef = useRef(null);
  const [inviteLists, setInviteLists] = useState<InviteList[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [collectionStats, setCollectionStats] = useState<any>(null);
  const [recentlyMinted, setRecentlyMinted] = useState<NFT[]>([]);
  const [revealedNFT, setRevealedNFT] = useState<NFT | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [nftReady, setNftReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (isOpen && walletAddress) {
      void loadEligibleLists();
      void loadCollectionData();
    }
  }, [isOpen, walletAddress]);

  const loadCollectionData = async () => {
    setLoadingStats(true);
    try {
      const [stats, recent] = await Promise.all([
        getCollectionStats('pixelawbs'),
        getRecentlyMintedNFTsGlobal('pixelawbs', 6)
      ]);
      setCollectionStats(stats);
      setRecentlyMinted(recent);
    } catch (err) {
      console.error('Error loading collection data:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadEligibleLists = async () => {
    setLoading(true);
    setError(null);
    
    // Check if user is on Ethereum mainnet
    if (chainId !== mainnet.id) {
      setError(`Please switch to Ethereum mainnet to mint Pixelawbs. Current network: ${chainId}`);
      setLoading(false);
      return;
    }
    
    try {
      const lists = await getEligibleInviteLists(walletAddress);
      setInviteLists(lists);
      // Initialize quantities to 0
      const initialQuantities: Record<string, number> = {};
      lists.forEach(list => {
        initialQuantities[list.id] = 0;
      });
      setSelectedQuantities(initialQuantities);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (listId: string, quantity: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [listId]: Math.max(0, quantity)
    }));
  };

  const handleMint = async () => {
    const selectedLists = Object.entries(selectedQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({ id, quantity }));

    if (selectedLists.length === 0) {
      setError('Please select at least one item to mint');
      return;
    }

    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }

    // Check if user is on Ethereum mainnet
    if (chainId !== mainnet.id) {
      setError('Please switch to Ethereum mainnet to mint Pixelawbs');
      return;
    }

    setMinting(true);
    setError(null);

    try {
      console.log('Starting mint process for address:', walletAddress);
      const result = await mintNFT(walletAddress, selectedLists);
      console.log('Mint API result:', result);
      
      if (result.success && result.mintTransaction) {
        console.log('Got mint transaction:', result.mintTransaction);
        alert('Please confirm the transaction in your wallet.');
        
        try {
          console.log('Sending transaction to wallet...');
          const txHash = await walletClient.sendTransaction({
            to: result.mintTransaction.to as `0x${string}`,
            value: BigInt(result.mintTransaction.value),
            data: result.mintTransaction.data as `0x${string}`,
          });
          console.log('Transaction sent successfully:', txHash);
          
          // Show video immediately and start looping
          setShowVideo(true);
          setNftReady(false);
          setRevealedNFT({} as NFT); // Placeholder to show overlay
          
          // Poll for the newly minted NFT
          let attempts = 0;
          const maxAttempts = 20; // Poll for up to 20 attempts (60 seconds)
          
          pollingIntervalRef.current = setInterval(async () => {
            attempts++;
            try {
              const recent = await getRecentlyMintedNFTsGlobal('pixelawbs', 1);
              if (recent.length > 0) {
                const newNFT = recent[0];
                // Check if this NFT was minted recently (within last 5 minutes)
                const mintTime = new Date(newNFT.created_at || newNFT.updated_at || 0).getTime();
                const now = Date.now();
                const fiveMinutesAgo = now - 5 * 60 * 1000;
                
                if (mintTime > fiveMinutesAgo) {
                  // Found the newly minted NFT!
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                  // Stop video loop
                  if (videoRef.current) {
                    videoRef.current.pause();
                  }
                  setRevealedNFT(newNFT);
                  setNftReady(true);
                  setShowVideo(false);
                  
                  // Auto-close after showing NFT for 5 seconds
                  setTimeout(() => {
                    handleCloseReveal();
                  }, 5000);
                  return;
                }
              }
              
              // If max attempts reached, stop polling
              if (attempts >= maxAttempts) {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                alert(`NFT Minted Successfully: Transaction Hash - ${txHash}\n\nThe NFT may take a moment to appear. Please check your wallet.`);
                handleCloseReveal();
              }
            } catch (err) {
              console.error('Error fetching revealed NFT:', err);
              // Continue polling on error
              if (attempts >= maxAttempts) {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                alert(`NFT Minted Successfully: Transaction Hash - ${txHash}\n\nThere was an error fetching the NFT details. Please check your wallet.`);
                handleCloseReveal();
              }
            }
          }, 3000); // Poll every 3 seconds
        } catch (txError) {
          console.error('Transaction sending failed:', txError);
          setError('Transaction failed: ' + (txError as Error).message);
        }
      } else {
        throw new Error(result.message || 'Could not retrieve minting transaction.');
      }
    } catch (err) {
      console.error('Minting failed:', err);
      setError('Minting failed: ' + (err as Error).message);
    } finally {
      setMinting(false);
    }
  };

  const formatPrice = (price: string, symbol: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice} ${symbol}`;
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
  };

  const handleCloseReveal = () => {
    // Stop video if playing
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // Reset states
    setRevealedNFT(null);
    setShowVideo(false);
    setNftReady(false);
    setImageLoaded(false);
    setImageError(false);
    setImageUrl(null);
  };

  // Preload image function
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log('Image preloaded successfully:', url);
        resolve();
      };
      img.onerror = () => {
        console.error('Image preload failed:', url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  // Effect to preload image when NFT is ready
  useEffect(() => {
    if (nftReady && revealedNFT && revealedNFT.token_id) {
      const url = revealedNFT.image_url || revealedNFT.image || revealedNFT.image_url_shrunk;
      if (url) {
        setImageUrl(url);
        setImageLoaded(false);
        setImageError(false);
        
        // Preload the image with retry logic
        const loadImage = async (retries = 3) => {
          try {
            await preloadImage(url);
            setImageLoaded(true);
            setImageError(false);
          } catch (err) {
            console.error('Image preload error, retries left:', retries - 1);
            if (retries > 1) {
              // Wait 2 seconds before retrying
              setTimeout(() => {
                loadImage(retries - 1);
              }, 2000);
            } else {
              // All retries failed, show error state
              setImageError(true);
              setImageLoaded(false);
            }
          }
        };
        
        // Add a small delay before starting preload to ensure URL is available
        setTimeout(() => {
          loadImage();
        }, 500);
      }
    }
  }, [nftReady, revealedNFT]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <Draggable nodeRef={nodeRef} handle={`.${classes.header}`}>
      <div ref={nodeRef} className={classes.popup}>
        <div className={classes.header}>
          <span>Mint Pixelawbster</span>
          <div className={classes.titleBarButtons}>
            <button
              className={classes.titleBarButton}
              onClick={handleMinimize}
              title="Minimize"
            >
              _
            </button>
            <button
              className={classes.titleBarButton}
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className={classes.content}>
          {/* Collection Stats */}
          {collectionStats && (
            <div className={classes.statsContainer}>
              {collectionStats.mintedCount !== undefined && (
                <div className={classes.statBox}>
                  <div className={classes.statLabel}>Minted</div>
                  <div>{collectionStats.mintedCount.toLocaleString()}</div>
                </div>
              )}
              {collectionStats.totalSupply !== undefined && (
                <div className={classes.statBox}>
                  <div className={classes.statLabel}>Total Supply</div>
                  <div>{collectionStats.totalSupply.toLocaleString()}</div>
                </div>
              )}
              {collectionStats.uniqueOwners !== undefined && (
                <div className={classes.statBox}>
                  <div className={classes.statLabel}>Owners</div>
                  <div>{collectionStats.uniqueOwners.toLocaleString()}</div>
                </div>
              )}
              {collectionStats.floorPrice !== undefined && (
                <div className={classes.statBox}>
                  <div className={classes.statLabel}>Floor Price</div>
                  <div>{collectionStats.floorPrice} ETH</div>
                </div>
              )}
            </div>
          )}

          {/* Reveal Animation Overlay */}
          {revealedNFT && (
            <div className={classes.revealOverlay}>
              {/* Close Button */}
              <button
                onClick={handleCloseReveal}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#000',
                  zIndex: 10001
                }}
                title="Close"
              >
                ✕ Close
              </button>
              
              {showVideo && !nftReady ? (
                <>
                  <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                    🎉 Revealing Your NFT! 🎉
                  </div>
                  <video
                    ref={videoRef}
                    src="/assets/pixelawbmint.mp4"
                    className={classes.revealVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      // Fallback to image if video fails
                      setShowVideo(false);
                    }}
                  />
                  <div style={{ color: '#fff', fontSize: '14px', marginTop: '20px', opacity: 0.8 }}>
                    Waiting for your NFT to be revealed...
                  </div>
                </>
              ) : nftReady && revealedNFT.token_id ? (
                <>
                  <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>🎉 Your NFT Has Been Revealed! 🎉</div>
                  {imageUrl ? (
                    <div style={{ position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!imageLoaded && !imageError && (
                        <div style={{ 
                          position: 'absolute',
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#fff',
                          zIndex: 1
                        }}>
                          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading your NFT image...</div>
                          <div style={{ fontSize: '14px', opacity: 0.8 }}>Please wait...</div>
                        </div>
                      )}
                      {imageError && (
                        <div style={{ 
                          position: 'absolute',
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#fff',
                          zIndex: 1
                        }}>
                          <div style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Image loading...</div>
                          <div style={{ fontSize: '14px', opacity: 0.8 }}>
                            The image may take a moment to appear.
                          </div>
                        </div>
                      )}
                      <img 
                        ref={imageRef}
                        src={imageUrl} 
                        alt={revealedNFT.name || `#${revealedNFT.token_id}`}
                        className={classes.revealImage}
                        onLoad={() => {
                          console.log('Image loaded successfully in img tag');
                          setImageLoaded(true);
                          setImageError(false);
                        }}
                        onError={(e) => {
                          console.error('Image load error in img tag, trying fallback');
                          setImageError(true);
                          // Try fallback image if not already using it
                          if (imageUrl !== '/assets/pixelawb.png') {
                            setTimeout(() => {
                              setImageUrl('/assets/pixelawb.png');
                              setImageError(false);
                              setImageLoaded(false);
                            }, 1000);
                          }
                        }}
                        style={{ 
                          opacity: imageLoaded ? 1 : 0, 
                          transition: 'opacity 0.5s ease-in-out',
                          maxWidth: '100%',
                          maxHeight: '400px'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minHeight: '300px',
                      color: '#fff'
                    }}>
                      <div style={{ fontSize: '18px' }}>Preparing your NFT...</div>
                    </div>
                  )}
                  <div style={{ color: '#fff', fontSize: '18px', marginTop: '10px' }}>
                    {revealedNFT.name || `Pixelawb #${revealedNFT.token_id}`}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {error && (
            <div style={{ 
              backgroundColor: '#ffcccc', 
              border: '1px solid #ff0000', 
              padding: '10px', 
              marginBottom: '10px',
              color: '#cc0000'
            }}>
              {error}
              {chainId !== mainnet.id && (
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={() => switchChain({ chainId: mainnet.id })}
                    style={{
                      backgroundColor: '#008000',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Switch to Ethereum
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div>Loading eligible invite lists...</div>
          ) : inviteLists.length === 0 ? (
            <div>No eligible invite lists found for your wallet.</div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3>Available Lists:</h3>
                {inviteLists.map(list => (
                  <div key={list.id} style={{
                    border: '1px solid #808080',
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#ffffff'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {list.name}
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                      Price: {formatPrice(list.token_price, list.currency_symbol)}
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                      Limit: {list.wallet_limit === 4294967295 ? 'Unlimited' : list.wallet_limit} per wallet
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ fontSize: '12px' }}>Quantity:</label>
                      <input
                        type="number"
                        min="0"
                        max={list.wallet_limit === 4294967295 ? 999 : list.wallet_limit}
                        value={selectedQuantities[list.id] || 0}
                        onChange={(e) => handleQuantityChange(list.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: '60px',
                          padding: '2px 5px',
                          border: '1px solid #808080'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => void handleMint()}
                disabled={minting}
                style={{
                  background: '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '10px 20px',
                  cursor: minting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {minting ? 'Minting...' : 'Mint Selected NFTs'}
              </button>
            </>
          )}

          {/* Recently Minted NFTs */}
          {recentlyMinted.length > 0 && (
            <div className={classes.recentlyMinted}>
              <h3 style={{ marginBottom: '10px', fontSize: '14px' }}>Recently Minted</h3>
              <div className={classes.nftGrid}>
                {recentlyMinted.map((nft) => (
                  <div key={nft.id} className={classes.nftItem}>
                    <img 
                      src={nft.image_url || nft.image || nft.image_url_shrunk || '/assets/pixelawb.png'} 
                      alt={nft.name || `#${nft.token_id}`}
                      className={classes.nftImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/pixelawb.png';
                      }}
                    />
                    <div style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {nft.name || `#${nft.token_id}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default MintPopup; 