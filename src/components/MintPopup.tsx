import React, { useState, useEffect, useRef, useMemo } from 'react';
import Draggable from 'react-draggable';
import { getEligibleInviteLists, mintNFT, getCollectionStats, getCollectionData, getRecentlyMintedNFTsGlobal, type NFT, type CollectionData } from '../mint';
import { createUseStyles } from 'react-jss';
import { useChainId, useSwitchChain, useWalletClient, useReadContract, usePublicClient } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useMediaQuery, useMobileCapabilities } from '../hooks/useMediaQuery';
import AsciiLawbsterMint from './AsciiLawbsterMint';

const useStyles = createUseStyles({
  popup: {
    position: 'fixed',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '600px',
    height: '480px',
    minWidth: '360px',
    minHeight: '240px',
    top: 0,
    left: 0,
    display: ({ isOpen, isBaseMiniApp }: { isOpen: boolean; isBaseMiniApp?: boolean }) => (isOpen ? 'block' : 'none'),
    resize: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? 'none' : 'both',
    overflow: 'auto',
    zIndex: 5000,
    ...(typeof window !== 'undefined' && (() => {
      try {
        const isBaseMiniApp = window.self !== window.top;
        if (isBaseMiniApp) {
          return {
            position: 'fixed',
            left: '16px',
            top: '16px',
            right: '16px',
            bottom: '60px',
            width: 'auto',
            height: 'auto',
            minWidth: '0',
            minHeight: '0',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 60px)',
          };
        }
      } catch (e) {
        return {};
      }
      return {};
    })()),
    '@media (max-width: 768px)': {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      minWidth: '100vw',
      minHeight: '100vh',
      border: 'none',
      borderRadius: '0',
      resize: 'none'
    }
  },
  header: {
    background: 'navy',
    color: '#fff',
    padding: '2px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? 'default' : 'move') as any,
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none',
    minHeight: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '24px' : 'auto') as any,
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
    overflow: 'auto',
    '@media (max-width: 768px)': {
      padding: '12px',
      height: 'calc(100% - 40px)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
  },
  statsContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
    fontSize: '11px',
    '@media (max-width: 768px)': {
      gap: '8px',
      marginBottom: '12px',
      fontSize: '12px'
    }
  },
  statBox: {
    border: '1px solid #808080',
    padding: '8px',
    backgroundColor: '#ffffff',
    minWidth: '100px',
    '@media (max-width: 768px)': {
      padding: '10px',
      minWidth: '80px',
      flex: '1 1 calc(50% - 4px)'
    }
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
    marginTop: '10px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
      gap: '8px'
    }
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
    gap: '20px',
    '@media (max-width: 768px)': {
      padding: '20px',
      gap: '16px',
      paddingTop: 'max(20px, env(safe-area-inset-top, 0px))',
      paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))'
    }
  },
  revealVideo: {
    maxWidth: '600px',
    maxHeight: '600px',
    width: 'auto',
    height: 'auto',
    border: '4px solid #fff',
    borderRadius: '8px',
    '@media (max-width: 768px)': {
      maxWidth: '90vw',
      maxHeight: '50vh',
      width: '100%',
      height: 'auto'
    }
  },
  revealImage: {
    maxWidth: '400px',
    maxHeight: '400px',
    border: '4px solid #fff',
    borderRadius: '8px',
    animation: '$fadeIn 0.5s ease-in',
    '@media (max-width: 768px)': {
      maxWidth: '90vw',
      maxHeight: '60vh',
      width: '100%',
      height: 'auto'
    }
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
  },
  selectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '40px 20px',
    minHeight: '300px',
    '@media (max-width: 768px)': {
      padding: '60px 20px',
      gap: '24px'
    }
  },
  selectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center',
    '@media (max-width: 768px)': {
      fontSize: '20px',
      marginBottom: '12px'
    }
  },
  selectionButton: {
    background: '#c0c0c0',
    border: '2px outset #c0c0c0',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '200px',
    width: '100%',
    maxWidth: '300px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    '&:active': {
      border: '2px inset #c0c0c0'
    },
    '@media (max-width: 768px)': {
      minWidth: '250px',
      padding: '16px 32px',
      fontSize: '16px',
      minHeight: '48px'
    }
  },
  backButton: {
    background: '#c0c0c0',
    border: '2px outset #c0c0c0',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '10px',
    touchAction: 'manipulation',
    '&:active': {
      border: '2px inset #c0c0c0'
    },
    '@media (max-width: 768px)': {
      padding: '10px 20px',
      fontSize: '14px',
      minHeight: '44px',
      marginBottom: '12px'
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
  // Scatter API may return these fields with different names
  minted?: number;
  minted_count?: number;
  mintedCount?: number;
  remaining?: number;
  remaining_count?: number;
  [key: string]: any; // Allow any additional fields from API
}

interface MintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  walletAddress: string;
  initialMintType?: 'selection' | 'pixelawbs' | 'asciilawbs';
}

const MintPopup: React.FC<MintPopupProps> = ({ isOpen, onClose, onMinimize, walletAddress, initialMintType = 'selection' }) => {
  // Detect Base Mini App
  const isBaseMiniAppDetected = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();
  
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
  
  const classes = useStyles({ isOpen, isBaseMiniApp: isBaseMiniAppDetected });
  const nodeRef = useRef(null);
  const [mintType, setMintType] = useState<'selection' | 'pixelawbs' | 'asciilawbs'>('selection');
  const [position, setPosition] = useState({ x: 100, y: 100 });
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
  const publicClient = usePublicClient();

  // Set initial mint type when popup opens
  useEffect(() => {
    if (isOpen) {
      setMintType(initialMintType);
      // Reset position when opening
      setPosition({ x: 100, y: 100 });
    }
  }, [isOpen, initialMintType]);

  const handleDrag = (e: any, data: any) => {
    setPosition({ x: data.x, y: data.y });
  };

  useEffect(() => {
    if (isOpen && walletAddress && mintType === 'pixelawbs') {
      void loadEligibleLists();
      void loadCollectionData();
    }
  }, [isOpen, walletAddress, mintType]);

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
          console.log('Transaction details:', {
            to: result.mintTransaction.to,
            value: result.mintTransaction.value,
            dataLength: result.mintTransaction.data.length
          });
          
          
          const hash = await walletClient.sendTransaction({
            to: result.mintTransaction.to as `0x${string}`,
            value: BigInt(result.mintTransaction.value),
            data: result.mintTransaction.data as `0x${string}`,
          });
          console.log('Transaction sent successfully:', hash);
          
          // Show video immediately and start looping
          setShowVideo(true);
          setNftReady(false);
          setRevealedNFT({} as NFT); // Placeholder to show overlay
          
          // Verify transaction receipt and check for Transfer events
          if (publicClient) {
            publicClient.waitForTransactionReceipt({ hash }).then(async (receipt) => {
              console.log('Transaction confirmed:', receipt);
              
              // Check for Transfer events (ERC-721 mint)
              const COLLECTION_ADDRESS = '0x2d278e95b2fc67d4b27a276807e24e479d9707f6';
              const transferEvents = (receipt.logs || []).filter(log => {
                // Check if this is a Transfer event to the user's address
                return log.address.toLowerCase() === COLLECTION_ADDRESS.toLowerCase() &&
                       log.topics?.[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' && // Transfer event signature
                       (log.topics?.length || 0) >= 3 &&
                       log.topics?.[2]?.toLowerCase() === `0x${'0'.repeat(24)}${walletAddress.slice(2).toLowerCase()}`; // To address
              });
              
              if (transferEvents && transferEvents.length > 0) {
                console.log('✅ NFT Transfer events found:', transferEvents.length);
                // Continue with polling to get NFT details
              } else {
                console.warn('⚠️ No Transfer events found - NFT may not have been minted');
                // Still try polling as backup
              }
              
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
                    if (transferEvents && transferEvents.length > 0) {
                      alert(`NFT Minted Successfully: Transaction Hash - ${hash}\n\n${transferEvents.length} NFT(s) confirmed. Please check your wallet.`);
                    } else {
                      alert(`⚠️ Transaction Confirmed but No NFT Found\n\nTransaction Hash: ${hash}\n\nNo Transfer events detected. Please check your wallet and Etherscan.\n\nView: https://etherscan.io/tx/${hash}`);
                    }
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
                    if (transferEvents && transferEvents.length > 0) {
                      alert(`NFT Minted Successfully: Transaction Hash - ${hash}\n\n${transferEvents.length} NFT(s) confirmed. Please check your wallet.`);
                    } else {
                      alert(`⚠️ Transaction Confirmed but Verification Failed\n\nTransaction Hash: ${hash}\n\nPlease verify on Etherscan.\n\nView: https://etherscan.io/tx/${hash}`);
                    }
                    handleCloseReveal();
                  }
                }
              }, 3000); // Poll every 3 seconds
            }).catch((error) => {
              console.error('Error waiting for transaction:', error);
              // Fall back to polling only
            });
          } else {
            // Fallback: Poll without receipt verification
            let attempts = 0;
            const maxAttempts = 20;
            
            pollingIntervalRef.current = setInterval(async () => {
              attempts++;
              try {
                const recent = await getRecentlyMintedNFTsGlobal('pixelawbs', 1);
                if (recent.length > 0) {
                  const newNFT = recent[0];
                  const mintTime = new Date(newNFT.created_at || newNFT.updated_at || 0).getTime();
                  const now = Date.now();
                  const fiveMinutesAgo = now - 5 * 60 * 1000;
                  
                  if (mintTime > fiveMinutesAgo) {
                    if (pollingIntervalRef.current) {
                      clearInterval(pollingIntervalRef.current);
                      pollingIntervalRef.current = null;
                    }
                    if (videoRef.current) {
                      videoRef.current.pause();
                    }
                    setRevealedNFT(newNFT);
                    setNftReady(true);
                    setShowVideo(false);
                    setTimeout(() => {
                      handleCloseReveal();
                    }, 5000);
                    return;
                  }
                }
                
                if (attempts >= maxAttempts) {
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                  alert(`NFT Minted Successfully: Transaction Hash - ${hash}\n\nThe NFT may take a moment to appear. Please check your wallet.`);
                  handleCloseReveal();
                }
              } catch (err) {
                console.error('Error fetching revealed NFT:', err);
                if (attempts >= maxAttempts) {
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                  alert(`NFT Minted Successfully: Transaction Hash - ${hash}\n\nThere was an error fetching the NFT details. Please check your wallet.`);
                  handleCloseReveal();
                }
              }
            }, 3000);
          }
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

  // Component to display list info with contract-read minted count
  const ListMintInfo: React.FC<{
    list: InviteList;
    collectionData: CollectionData | null;
    chainId: number;
    isMobile: boolean;
    selectedQuantity: number;
    onQuantityChange: (qty: number) => void;
    walletLimit: number;
  }> = ({ list, collectionData, chainId, isMobile, selectedQuantity, onQuantityChange, walletLimit }) => {
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
        padding: isMobile ? '12px' : '10px',
        marginBottom: isMobile ? '12px' : '10px',
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '4px' : '0'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: isMobile ? '16px' : '14px' }}>
          {list.name}
        </div>
        <div style={{ fontSize: isMobile ? '14px' : '12px', marginBottom: '5px' }}>
          Price: {formatPrice(list.token_price, list.currency_symbol)}
        </div>
        <div style={{ fontSize: isMobile ? '14px' : '12px', marginBottom: '5px' }}>
          {minted.toLocaleString()} minted / {totalAvailable.toLocaleString()} total ({remaining.toLocaleString()} remaining)
        </div>
        <div style={{ fontSize: isMobile ? '14px' : '12px', marginBottom: '10px' }}>
          Limit: {walletLimit === 4294967295 ? 'Unlimited' : walletLimit} per wallet
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <label style={{ fontSize: isMobile ? '14px' : '12px' }}>Quantity:</label>
          <input
            type="number"
            min="0"
            max={walletLimit === 4294967295 ? 999 : walletLimit}
            value={selectedQuantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
            style={{
              width: isMobile ? '80px' : '60px',
              padding: isMobile ? '8px 5px' : '2px 5px',
              border: '1px solid #808080',
              fontSize: isMobile ? '16px' : '12px',
              minHeight: isMobile ? '44px' : 'auto',
              touchAction: 'manipulation'
            }}
          />
        </div>
      </div>
    );
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

  const getWindowTitle = () => {
    if (mintType === 'selection') return 'Select Mint Type';
    if (mintType === 'pixelawbs') return 'Mint Pixelawbster';
    if (mintType === 'asciilawbs') return 'Mint ASCII Lawbsters';
    return 'Mint';
  };

  const renderSelectionScreen = () => (
    <div className={classes.selectionContainer}>
      <div className={classes.selectionTitle}>Select Mint Type</div>
      <button
        className={classes.selectionButton}
        onClick={() => {
          setMintType('pixelawbs');
          if (chainId !== mainnet.id) {
            setError('Please switch to Ethereum mainnet to mint Pixelawbs');
          }
        }}
      >
        PIXELAWBS (ETH)
      </button>
      <button
        className={classes.selectionButton}
        onClick={() => setMintType('asciilawbs')}
      >
        ASCIILAWBS (BASE)
      </button>
    </div>
  );

  const renderPixelawbsContent = () => (
    <>
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
              top: isMobile ? 'max(20px, env(safe-area-inset-top, 0px))' : '20px',
              right: isMobile ? 'max(20px, env(safe-area-inset-right, 0px))' : '20px',
              background: '#c0c0c0',
              border: '2px outset #fff',
              padding: isMobile ? '12px 20px' : '8px 16px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '14px',
              fontWeight: 'bold',
              color: '#000',
              zIndex: 10001,
              minHeight: isMobile ? '44px' : 'auto',
              touchAction: 'manipulation'
            }}
            title="Close"
          >
            ✕ Close
          </button>
          
          {showVideo && !nftReady ? (
            <>
              <div style={{ 
                color: '#fff', 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: 'bold', 
                marginBottom: isMobile ? '16px' : '20px',
                textAlign: 'center',
                padding: isMobile ? '0 10px' : '0'
              }}>
                🎉 Revealing Your NFT! 🎉
              </div>
              {mintType === 'asciilawbs' ? (
                <img
                  src="/assets/asciilawb.GIF"
                  alt="ASCII Lawbster Preview"
                  className={classes.revealImage}
                  style={{
                    maxWidth: '400px',
                    maxHeight: '400px',
                    border: '4px solid #fff',
                    borderRadius: '8px',
                  }}
                />
              ) : (
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
              )}
              <div style={{ 
                color: '#fff', 
                fontSize: isMobile ? '12px' : '14px', 
                marginTop: isMobile ? '16px' : '20px', 
                opacity: 0.8,
                textAlign: 'center',
                padding: isMobile ? '0 10px' : '0'
              }}>
                Waiting for your NFT to be revealed...
              </div>
            </>
          ) : nftReady && revealedNFT.token_id ? (
            <>
              <div style={{ 
                color: '#fff', 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: 'bold',
                textAlign: 'center',
                padding: isMobile ? '0 10px' : '0',
                marginBottom: isMobile ? '12px' : '0'
              }}>
                🎉 Your NFT Has Been Revealed! 🎉
              </div>
              {imageUrl ? (
                <div style={{ 
                  position: 'relative', 
                  minHeight: isMobile ? '200px' : '300px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '100%',
                  padding: isMobile ? '0 10px' : '0'
                }}>
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
                      <div style={{ fontSize: isMobile ? '16px' : '18px', marginBottom: '10px' }}>Loading your NFT image...</div>
                      <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.8 }}>Please wait...</div>
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
                      <div style={{ fontSize: isMobile ? '16px' : '18px', marginBottom: '10px' }}>⚠️ Image loading...</div>
                      <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.8 }}>
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
                      maxHeight: isMobile ? '60vh' : '400px',
                      width: isMobile ? '100%' : 'auto',
                      height: 'auto'
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
                  <div style={{ fontSize: isMobile ? '16px' : '18px' }}>Preparing your NFT...</div>
                </div>
              )}
              <div style={{ 
                color: '#fff', 
                fontSize: isMobile ? '16px' : '18px', 
                marginTop: isMobile ? '12px' : '10px',
                textAlign: 'center',
                padding: isMobile ? '0 10px' : '0'
              }}>
                {revealedNFT.name || `${mintType === 'asciilawbs' ? 'ASCII Lawbster' : 'Pixelawb'} #${revealedNFT.token_id}`}
              </div>
            </>
          ) : null}
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: '#ffcccc', 
          border: '1px solid #ff0000', 
          padding: isMobile ? '12px' : '10px', 
          marginBottom: isMobile ? '12px' : '10px',
          color: '#cc0000',
          fontSize: isMobile ? '14px' : '12px',
          borderRadius: isMobile ? '4px' : '0'
        }}>
          {error}
          {chainId !== mainnet.id && (
            <div style={{ marginTop: isMobile ? '12px' : '10px' }}>
              <button 
                onClick={() => switchChain({ chainId: mainnet.id })}
                style={{
                  backgroundColor: '#008000',
                  color: 'white',
                  border: 'none',
                  padding: isMobile ? '12px 20px' : '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '12px',
                  minHeight: isMobile ? '44px' : 'auto',
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
        <div style={{ fontSize: isMobile ? '16px' : '14px', textAlign: 'center', padding: isMobile ? '20px' : '10px' }}>
          Loading eligible invite lists...
        </div>
      ) : inviteLists.length === 0 ? (
        <div style={{ fontSize: isMobile ? '16px' : '14px', textAlign: 'center', padding: isMobile ? '20px' : '10px' }}>
          No eligible invite lists found for your wallet.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <h3 style={{ fontSize: isMobile ? '18px' : '16px', marginBottom: isMobile ? '12px' : '10px' }}>Pixelawb Mint Tiers:</h3>
            {inviteLists.map(list => (
              <ListMintInfo
                key={list.id}
                list={list}
                collectionData={collectionData}
                chainId={chainId}
                isMobile={isMobile}
                selectedQuantity={selectedQuantities[list.id] || 0}
                onQuantityChange={(qty) => handleQuantityChange(list.id, qty)}
                walletLimit={list.wallet_limit}
              />
            ))}
          </div>
          <button
            onClick={() => void handleMint()}
            disabled={minting}
            style={{
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              padding: isMobile ? '14px 24px' : '10px 20px',
              cursor: minting ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '16px' : '14px',
              fontWeight: 'bold',
              minHeight: isMobile ? '48px' : 'auto',
              width: isMobile ? '100%' : 'auto',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {minting ? 'Minting...' : 'Mint Selected NFTs'}
          </button>
        </>
      )}

      {/* Recently Minted NFTs */}
      {recentlyMinted.length > 0 && (
        <div className={classes.recentlyMinted}>
          <h3 style={{ marginBottom: isMobile ? '12px' : '10px', fontSize: isMobile ? '16px' : '14px' }}>Recently Minted</h3>
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
    </>
  );

  const popupContent = (
    <div ref={nodeRef} className={classes.popup}>
      <div className={classes.header}>
        <span>{getWindowTitle()}</span>
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
        {mintType !== 'selection' && (
          <button
            className={classes.backButton}
            onClick={() => setMintType('selection')}
          >
            ← Back
          </button>
        )}
        {mintType === 'selection' && renderSelectionScreen()}
        {mintType === 'pixelawbs' && renderPixelawbsContent()}
          {mintType === 'asciilawbs' && (
            <AsciiLawbsterMint 
              walletAddress={walletAddress}
              onMintSuccess={(hash: string) => {
                // Show reveal overlay for ASCII Lawbsters
                setShowVideo(true);
                setRevealedNFT({} as NFT); // Placeholder
                
                // Poll for newly minted NFTs
                if (publicClient) {
                  publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` }).then(async (receipt) => {
                    // Poll for the newly minted NFTs
                    let attempts = 0;
                    const maxAttempts = 20;
                    
                    pollingIntervalRef.current = setInterval(async () => {
                      attempts++;
                      try {
                        const recent = await getRecentlyMintedNFTsGlobal('asciilawbs', 5);
                        if (recent.length > 0) {
                          const newNFT = recent[0];
                          const mintTime = new Date(newNFT.created_at || newNFT.updated_at || 0).getTime();
                          const now = Date.now();
                          const fiveMinutesAgo = now - 5 * 60 * 1000;
                          
                          if (mintTime > fiveMinutesAgo) {
                            if (pollingIntervalRef.current) {
                              clearInterval(pollingIntervalRef.current);
                              pollingIntervalRef.current = null;
                            }
                            setRevealedNFT(newNFT);
                            setNftReady(true);
                            setShowVideo(false);
                            setTimeout(() => {
                              handleCloseReveal();
                            }, 5000);
                            return;
                          }
                        }
                        
                        if (attempts >= maxAttempts) {
                          if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                          }
                          alert(`NFT Minted Successfully: Transaction Hash - ${hash}\n\nThe NFT may take a moment to appear. Please check your wallet.`);
                          handleCloseReveal();
                        }
                      } catch (err) {
                        console.error('Error fetching revealed NFT:', err);
                      }
                    }, 3000);
                  }).catch((error) => {
                    console.error('Error waiting for transaction:', error);
                  });
                }
              }}
            />
          )}
      </div>
    </div>
  );

  // In Base Mini App, render without Draggable wrapper
  if (isBaseMiniAppDetected || isMobile) {
    return popupContent;
  }

  return (
    <Draggable 
      nodeRef={nodeRef} 
      handle={`.${classes.header}`}
      defaultPosition={{ x: 100, y: 100 }}
      position={isOpen ? position : undefined}
      onDrag={handleDrag}
      disabled={!isOpen || isMobile}
    >
      {popupContent}
    </Draggable>
  );
};

export default MintPopup; 