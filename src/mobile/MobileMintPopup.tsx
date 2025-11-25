import React, { useState, useEffect, useRef } from 'react';
import { getEligibleInviteLists, mintNFT, getCollectionStats, getCollectionData, getRecentlyMintedNFTsGlobal, type NFT, type CollectionData } from '../mint';
import { useWalletClient, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import MobilePopup98 from './MobilePopup98';

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
  // Scatter API may return these fields with different names
  minted?: number;
  minted_count?: number;
  mintedCount?: number;
  remaining?: number;
  remaining_count?: number;
  [key: string]: any; // Allow any additional fields from API
}

interface MobileMintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

const MobileMintPopup: React.FC<MobileMintPopupProps> = ({ isOpen, onClose, walletAddress }) => {
  const [inviteLists, setInviteLists] = useState<InviteList[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [collectionStats, setCollectionStats] = useState<any>(null);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [recentlyMinted, setRecentlyMinted] = useState<NFT[]>([]);
  const [revealedNFT, setRevealedNFT] = useState<NFT | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isOpen && walletAddress) {
      void loadEligibleLists();
      void loadCollectionData();
    }
  }, [isOpen, walletAddress]);

  const loadCollectionData = async () => {
    setLoadingStats(true);
    try {
      const [collection, stats, recent] = await Promise.all([
        getCollectionData('pixelawbs'),
        getCollectionStats('pixelawbs'),
        getRecentlyMintedNFTsGlobal('pixelawbs', 6)
      ]);
      setCollectionData(collection);
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
          setRevealedNFT({} as NFT); // Placeholder to show overlay
          
          // Auto-close after 15 seconds with success message
          revealTimeoutRef.current = setTimeout(() => {
            handleCloseReveal();
            alert(`NFT Minted Successfully!\n\nTransaction Hash: ${txHash}\n\nYour Pixelawb is revealing soon. Please check your wallet in a few moments.`);
          }, 15000); // Show for 15 seconds
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

  const handleCloseReveal = () => {
    // Stop video if playing
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    // Clear timeout
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    // Reset states
    setRevealedNFT(null);
    setShowVideo(false);
  };

  // Effect to ensure video plays on mobile
  useEffect(() => {
    if (showVideo && videoRef.current) {
      // Force play on mobile
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Video play error:', error);
          // If autoplay fails, try again after user interaction
          const tryPlay = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          };
          document.addEventListener('touchstart', tryPlay, { once: true });
          document.addEventListener('click', tryPlay, { once: true });
        });
      }
    }
  }, [showVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  // Component to display list info with contract-read minted count
  const ListMintInfo: React.FC<{
    list: InviteList;
    collectionData: CollectionData | null;
    chainId: number;
    selectedQuantity: number;
    onQuantityChange: (qty: number) => void;
    walletLimit: number;
  }> = ({ list, collectionData, chainId, selectedQuantity, onQuantityChange, walletLimit }) => {
    // Read listSupply from contract to get how many have been minted from this list
    const { data: listMinted } = useReadContract({
      abi: collectionData?.abi,
      address: collectionData?.address as `0x${string}` | undefined,
      functionName: 'listSupply',
      chainId: collectionData?.chain_id,
      args: [list.root as `0x${string}`],
      query: {
        enabled: !!collectionData && !!collectionData.abi && !!collectionData.address && chainId === collectionData.chain_id
      }
    }) as { data: bigint | undefined };

    const totalAvailable = list.list_limit;
    const minted = listMinted ? Number(listMinted) : 0;
    const remaining = Math.max(0, totalAvailable - minted);

    return (
      <div style={{
        border: '1px solid #808080',
        padding: '12px',
        marginBottom: '12px',
        backgroundColor: '#ffffff',
        borderRadius: '4px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '16px' }}>
          {list.name}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>
          Price: {formatPrice(list.token_price, list.currency_symbol)}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>
          {minted.toLocaleString()} minted / {totalAvailable.toLocaleString()} total ({remaining.toLocaleString()} remaining)
        </div>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          Limit: {walletLimit === 4294967295 ? 'Unlimited' : walletLimit} per wallet
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '14px' }}>Quantity:</label>
          <input
            type="number"
            min="0"
            max={walletLimit === 4294967295 ? 999 : walletLimit}
            value={selectedQuantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
            style={{
              width: '80px',
              padding: '8px 5px',
              border: '1px solid #808080',
              fontSize: '16px',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          />
        </div>
      </div>
    );
  };

  const listBoxStyle: React.CSSProperties = {
    border: '1px solid #808080',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    textAlign: 'left',
  };
  const errorStyle: React.CSSProperties = {
    backgroundColor: '#ffcccc',
    border: '1px solid #ff0000',
    padding: '10px',
    marginBottom: '10px',
    color: '#cc0000',
    borderRadius: '8px',
  };

  return (
    <>
      {/* Reveal Animation Overlay */}
      {revealedNFT && (
        <div style={{
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
          gap: '16px',
          padding: '20px',
          paddingTop: 'max(20px, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))'
        }}>
          {/* Close Button */}
          <button
            onClick={handleCloseReveal}
            style={{
              position: 'absolute',
              top: 'max(20px, env(safe-area-inset-top, 0px))',
              right: 'max(20px, env(safe-area-inset-right, 0px))',
              background: '#c0c0c0',
              border: '2px outset #fff',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000',
              zIndex: 10001,
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
            title="Close"
          >
            ✕ Close
          </button>
          
          {showVideo && (
            <>
              <div style={{ 
                color: '#fff', 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                textAlign: 'center',
                padding: '0 10px'
              }}>
                🎉 Minting Your Pixelawb! 🎉
              </div>
              <video
                ref={videoRef}
                src="/assets/pixelawbmint.mp4"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '50vh',
                  width: '100%',
                  height: 'auto',
                  border: '4px solid #fff',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={() => {
                  // Ensure video plays when loaded
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
                onCanPlay={() => {
                  // Force play when video can play
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
                onError={(e) => {
                  console.error('Video playback error:', e);
                }}
              />
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                marginTop: '20px', 
                fontWeight: 'bold',
                textAlign: 'center',
                padding: '0 10px'
              }}>
                Your Pixelawb is revealing soon. . .
              </div>
            </>
          )}
        </div>
      )}

      <MobilePopup98 isOpen={isOpen} onClose={onClose} title="Mint Pixelawbs">
        {/* Collection Stats */}
        {collectionStats && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '12px',
            flexWrap: 'wrap'
          }}>
            {collectionStats.mintedCount !== undefined && (
              <div style={{
                border: '1px solid #808080',
                padding: '10px',
                backgroundColor: '#ffffff',
                minWidth: '80px',
                flex: '1 1 calc(50% - 4px)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Minted</div>
                <div>{collectionStats.mintedCount.toLocaleString()}</div>
              </div>
            )}
            {collectionStats.totalSupply !== undefined && (
              <div style={{
                border: '1px solid #808080',
                padding: '10px',
                backgroundColor: '#ffffff',
                minWidth: '80px',
                flex: '1 1 calc(50% - 4px)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Total Supply</div>
                <div>{collectionStats.totalSupply.toLocaleString()}</div>
              </div>
            )}
            {collectionStats.uniqueOwners !== undefined && (
              <div style={{
                border: '1px solid #808080',
                padding: '10px',
                backgroundColor: '#ffffff',
                minWidth: '80px',
                flex: '1 1 calc(50% - 4px)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Owners</div>
                <div>{collectionStats.uniqueOwners.toLocaleString()}</div>
              </div>
            )}
            {collectionStats.floorPrice !== undefined && (
              <div style={{
                border: '1px solid #808080',
                padding: '10px',
                backgroundColor: '#ffffff',
                minWidth: '80px',
                flex: '1 1 calc(50% - 4px)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Floor Price</div>
                <div>{collectionStats.floorPrice} ETH</div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={errorStyle}>
            {error}
            {chainId !== mainnet.id && (
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => switchChain({ chainId: mainnet.id })}
                  style={{
                    backgroundColor: '#008000',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    minHeight: '44px',
                    touchAction: 'manipulation'
                  }}
                >
                  Switch to Ethereum
                </button>
              </div>
            )}
          </div>
        )}
        {loading ? (
          <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
            Loading eligible invite lists...
          </div>
        ) : inviteLists.length === 0 ? (
          <div style={{ fontSize: '16px', textAlign: 'center', padding: '20px' }}>
            No eligible invite lists found for your wallet.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Pixelawb Mint Tiers:</h3>
              {inviteLists.map(list => (
                <ListMintInfo
                  key={list.id}
                  list={list}
                  collectionData={collectionData}
                  chainId={chainId}
                  selectedQuantity={selectedQuantities[list.id] || 0}
                  onQuantityChange={(qty) => handleQuantityChange(list.id, qty)}
                  walletLimit={list.wallet_limit}
                />
              ))}
            </div>
            <button style={{
              background: '#00ffff',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 32px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              marginTop: '1.5rem',
              cursor: minting ? 'not-allowed' : 'pointer',
              boxShadow: '1px 1px 0 #aaa',
              width: '100%',
              minHeight: '48px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }} onClick={handleMint} disabled={minting}>
              {minting ? 'Minting...' : 'Mint Selected NFTs'}
            </button>
          </>
        )}

        {/* Recently Minted NFTs */}
        {recentlyMinted.length > 0 && (
          <div style={{
            marginTop: '20px',
            borderTop: '2px solid #808080',
            paddingTop: '15px'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Recently Minted</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: '8px',
              marginTop: '10px'
            }}>
              {recentlyMinted.map((nft) => (
                <div key={nft.id} style={{
                  border: '1px solid #808080',
                  padding: '5px',
                  backgroundColor: '#ffffff',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <img 
                    src={nft.image_url || nft.image || nft.image_url_shrunk || '/assets/pixelawb.png'} 
                    alt={nft.name || `#${nft.token_id}`}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      marginBottom: '5px'
                    }}
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
      </MobilePopup98>
    </>
  );
};

export default MobileMintPopup;
