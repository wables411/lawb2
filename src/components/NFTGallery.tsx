import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSingleNFT, getOpenSeaSolanaNFTs, getAlchemyNFTsForOwner, getAlchemyNFTsForCollection } from '../mint';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { createUseStyles } from 'react-jss';
import { useAppKitSafe as useAppKit } from '../hooks/useAppKitSafe';
import { CORSImage, getImageUrl } from './CORSImage';

const useStyles = createUseStyles({
  popup: {
    position: 'absolute',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '720px',
    height: '600px',
    minWidth: '480px',
    minHeight: '360px',
    top: 'calc(50vh - 300px)',
    left: 'calc(50vw - 360px)',
    display: ({ isOpen }: { isOpen: boolean; isBaseMiniApp?: boolean }) => (isOpen ? 'block' : 'none'),
    resize: 'both',
    overflow: 'auto',
    zIndex: 100
  },
  header: {
    background: 'navy',
    color: '#fff',
    padding: '2px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? 'default' : 'move',
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none',
    minHeight: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '24px' : 'auto',
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1px'
  },
  titleBarButton: {
    width: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '14px' : '16px',
    height: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '12px' : '14px',
    border: '1px outset #c0c0c0',
    backgroundColor: '#c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '7px' : '8px',
    color: 'black',
    padding: '0',
    '&:active': {
      border: '1px inset #c0c0c0'
    }
  },
  content: {
    padding: '10px',
    height: 'calc(100% - 30px)',
    overflow: 'auto'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '0',
    marginBottom: '20px',
    // Base Mini App optimization
    ...(typeof window !== 'undefined' && (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })() ? {
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: '8px',
      padding: '8px',
    } : {}),
  },
  gridItem: {
    cursor: 'pointer',
    display: 'block',
    width: '100%',
    aspectRatio: '1',
    overflow: 'hidden'
  },
  detailContent: {
    padding: '20px',
    color: '#000',
  },
  detailView: {
    padding: '20px',
    color: '#000',
    '& img': {
      width: '100%',
      maxWidth: '500px',
      height: 'auto',
      marginBottom: '20px',
      border: '1px solid #ccc'
    },
    '& h2': {
      marginBottom: '10px',
      fontSize: '18px'
    },
    '& h3': {
      marginTop: '20px',
      marginBottom: '10px',
      fontSize: '14px'
    }
  },
  detailTraits: {
    listStyleType: 'none',
    paddingLeft: '0',
    '& li': {
      marginBottom: '5px'
    }
  },
  backButton: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '2px 8px',
    cursor: 'pointer',
    marginRight: '8px',
    fontSize: '11px',
    '&:active': {
      borderStyle: 'inset',
    },
  },
  collectionSelector: {
    display: 'flex',
    gap: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '6px' : '10px',
    padding: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '8px' : '10px',
    borderBottom: '2px inset #fff',
    flexWrap: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? 'wrap' : 'nowrap',
    fontSize: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '11px' : '12px',
  },
  collectionButton: {
    padding: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '4px 8px' : '5px 10px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    fontSize: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? '11px' : '12px',
    minWidth: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => isBaseMiniApp ? 'auto' : '60px',
    '&.active': {
      borderStyle: 'inset',
      backgroundColor: '#e0e0e0',
    }
  },
});

interface NFT {
  id: string;
  address: string;
  token_id: number;
  attributes: string;
  block_minted: number;
  contract_type: string;
  description: string;
  image: string;
  image_url: string;
  image_url_shrunk: string;
  animation_url?: string;
  metadata: string;
  name: string;
  chain_id: number;
  old_image_url: string;
  old_token_uri: string;
  owner_of: string;
  token_uri: string;
  log_index: number;
  transaction_index: number;
  collection_id: string;
  num_items: number;
  created_at: string;
  updated_at: string;
  owners: Array<{
    owner_of: string;
    quantity: number;
  }>;
}

interface NFTGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  walletAddress?: string;
  renderAsContent?: boolean; // If true, don't render popup wrapper, just content
}

type ViewMode = 'all' | 'recent' | 'owned';

type Collection = {
  slug: string;
  name: string;
  api: 'scatter' | 'opensea' | 'opensea-solana';
  chain?: string;
}

const COLLECTIONS: Collection[] = [
  { slug: 'pixelawbs', name: 'Pixelawbs', api: 'scatter' },
  { slug: 'lawbsters', name: 'Lawbsters', api: 'opensea', chain: 'ethereum' },
  { slug: 'lawbstarz', name: 'Lawbstarz', api: 'scatter' },
  { slug: 'a-lawbster-halloween', name: 'Halloween', api: 'opensea', chain: 'base' },
  { slug: 'asciilawbs', name: 'ASCII Lawbs', api: 'opensea', chain: 'base' },
  { slug: 'lawbstation', name: 'Lawbstation', api: 'opensea-solana', chain: 'solana' },
  { slug: 'lawbnexus', name: 'Nexus', api: 'opensea-solana', chain: 'solana' },
];

// Map collection slugs to contract addresses and chain IDs for Alchemy API
const COLLECTION_CONTRACT_MAP: Record<string, { address: string; chainId: number }> = {
  'lawbsters': { address: NFT_COLLECTIONS.lawbsters.address, chainId: NFT_COLLECTIONS.lawbsters.chainId },
  'lawbstarz': { address: NFT_COLLECTIONS.lawbstarz.address, chainId: NFT_COLLECTIONS.lawbstarz.chainId },
  'pixelawbs': { address: NFT_COLLECTIONS.pixelawbs.address, chainId: NFT_COLLECTIONS.pixelawbs.chainId },
  'a-lawbster-halloween': { address: NFT_COLLECTIONS.halloween_lawbsters.address, chainId: NFT_COLLECTIONS.halloween_lawbsters.chainId },
  'asciilawbs': { address: NFT_COLLECTIONS.asciilawbs.address, chainId: NFT_COLLECTIONS.asciilawbs.chainId },
};

declare global {
  interface Window {
    reown?: {
      request: (args: { method: string; params: object }) => Promise<unknown>;
    };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      publicKey?: { toString: () => string };
    };
    solflare?: {
      isSolflare?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      publicKey?: { toString: () => string };
    };
  }
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ isOpen, onClose, onMinimize, walletAddress, renderAsContent = false }) => {
  // Detect Base Mini App
  const isBaseMiniAppDetected = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();
  
  const classes = useStyles({ isOpen, isBaseMiniApp: isBaseMiniAppDetected });
  const { open } = useAppKit();
  const nodeRef = useRef(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<Collection>(COLLECTIONS[0]);
  const [showSolanaPrompt, setShowSolanaPrompt] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  const connectSolanaWallet = useCallback(async () => {
    try {
      if (window.solana?.isPhantom) {
        const response = await window.solana.connect();
        setSolanaAddress(response.publicKey.toString());
        return;
      }
      if (window.solflare?.isSolflare) {
        const response = await window.solflare.connect();
        setSolanaAddress(response.publicKey.toString());
        return;
      }
      void open();
    } catch (err) {
      console.error('Failed to connect Solana wallet:', err);
      alert('Failed to connect Solana wallet. Please make sure Phantom or Solflare is installed.');
    }
    setShowSolanaPrompt(false);
  }, [open]);

  // Check for existing Solana connection on mount
  useEffect(() => {
    if (window.solana?.publicKey) {
      setSolanaAddress(window.solana.publicKey.toString());
    } else if (window.solflare?.publicKey) {
      setSolanaAddress(window.solflare.publicKey.toString());
    }
  }, []);

  useEffect(() => {
    const fetchNfts = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        let walletAddressToFetch: string | undefined = viewMode === 'owned' ? (walletAddress || undefined) : undefined;

        if (currentCollection.api === 'opensea-solana') {
          if (viewMode === 'owned' && !solanaAddress) {
            setShowSolanaPrompt(true);
            setLoading(false);
            return;
          }
          walletAddressToFetch = solanaAddress || undefined;
          
          // Fetch all NFTs from collection (should now include owner data)
          response = await getOpenSeaSolanaNFTs(currentCollection.slug, 100);
          console.log('Fetched Solana NFTs from collection:', response.data.length);
          
          // Filter by owner if needed
          if (viewMode === 'owned' && solanaAddress) {
            console.log('Filtering for owner:', solanaAddress);
            console.log('Sample NFT owner data:', response.data[0]?.owners);
            console.log('All NFTs owner data:', response.data.map(nft => ({
              name: nft.name,
              owners: nft.owners,
              owner_of: nft.owner_of
            })));
            
            // Check if we have owner data
            const hasOwnerData = response.data.some(nft => nft.owners && nft.owners.length > 0);
            
            if (!hasOwnerData) {
              console.log('No owner data available from OpenSea for Solana collection');
              // For Solana collections without owner data, show all NFTs with a note
              setError('Owner data not available for this Solana collection. Showing all NFTs.');
              // Don't filter - show all NFTs
            } else {
              response.data = response.data.filter(nft => {
                const hasOwner = nft.owners.some(o => 
                  o.owner_of && o.owner_of.toLowerCase() === solanaAddress.toLowerCase()
                );
                if (hasOwner) {
                  console.log('Found owned NFT:', nft.name);
                }
                return hasOwner;
              });
              console.log('NFTs after filtering:', response.data.length);
            }
          }
        } else if (currentCollection.api === 'opensea') {
          // Use Alchemy API for all EVM collections when available (more reliable than OpenSea)
          if (COLLECTION_CONTRACT_MAP[currentCollection.slug]) {
            const { address: contractAddress, chainId } = COLLECTION_CONTRACT_MAP[currentCollection.slug];
            if (viewMode === 'owned' && walletAddressToFetch) {
              // For owned view, filter by owner
              response = await getAlchemyNFTsForOwner(contractAddress, walletAddressToFetch, 100, chainId);
            } else {
              // For all/recent view, get all NFTs from collection
              response = await getAlchemyNFTsForCollection(contractAddress, 100, chainId);
            }
          } else {
            // Fallback to OpenSea if not in contract map
            response = await getOpenSeaNFTs(currentCollection.slug, 100, walletAddressToFetch);
          }
        } else {
          // For Scatter collections (Pixelawbs, Lawbstarz), use Alchemy when available
          if (COLLECTION_CONTRACT_MAP[currentCollection.slug]) {
            const { address: contractAddress, chainId } = COLLECTION_CONTRACT_MAP[currentCollection.slug];
            if (viewMode === 'owned' && walletAddressToFetch) {
              // For owned view, filter by owner
              response = await getAlchemyNFTsForOwner(contractAddress, walletAddressToFetch, 100, chainId);
            } else {
              // For all/recent view, get all NFTs from collection
              response = await getAlchemyNFTsForCollection(contractAddress, 100, chainId);
            }
          } else {
            // Fallback to Scatter API if not in contract map
            response = await getCollectionNFTs(currentCollection.slug, currentPage, 100, walletAddressToFetch);
          }
        }
        setNfts(response.data);
        setTotalPages(response.totalPages);
        setTotalCount(response.totalCount);
        setHasMoreResults(response.hasMore || false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      void fetchNfts();
    }
  }, [isOpen, currentPage, viewMode, walletAddress, currentCollection, solanaAddress]);

  useEffect(() => {
    if (showSolanaPrompt) {
      void connectSolanaWallet();
    }
  }, [showSolanaPrompt, connectSolanaWallet]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const getOwnerInfo = (nft: NFT) => {
    // For Solana NFTs, check both owners array and owner_of field
    if (currentCollection.api === 'opensea-solana') {
      if (nft.owner_of && nft.owner_of.length > 0) {
        return `${nft.owner_of.substring(0, 6)}...${nft.owner_of.substring(-4)}`;
      }
      if (nft.owners && nft.owners.length > 0) {
        return `${nft.owners[0].owner_of.substring(0, 6)}...${nft.owners[0].owner_of.substring(-4)}`;
      }
      return 'Owner data unavailable';
    }
    
    // For other collections
    if (nft.owner_of && nft.owner_of.length > 0) {
      return `${nft.owner_of.substring(0, 6)}...${nft.owner_of.substring(-4)}`;
    }
    if (nft.owners && nft.owners.length > 0) {
      return `${nft.owners[0].owner_of.substring(0, 6)}...${nft.owners[0].owner_of.substring(-4)}`;
    }
    return 'N/A';
  };


  
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
  };

  const handleNftClick = async (nft: NFT) => {
    if (currentCollection.api === 'opensea' && currentCollection.chain) {
      try {
        const fullNftData = await getOpenSeaSingleNFT(currentCollection.chain, nft.address, nft.token_id.toString());
        const updatedNft = { ...nft, attributes: JSON.stringify(fullNftData.traits || []) };
        setSelectedNft(updatedNft);
      } catch (error) {
        console.error("Failed to fetch full NFT details", error);
        setSelectedNft(nft); // Fallback to original data on error
      }
    } else {
      setSelectedNft(nft);
    }
  };

  const handleCollectionChange = (collection: Collection) => {
    setCurrentCollection(collection);
    setCurrentPage(1);
    setSelectedNft(null); // Clear selected NFT when changing collection
    setHasMoreResults(false); // Reset hasMore flag
  };

  const renderDetailView = () => {
    if (!selectedNft) return null;

    let attributes: Array<{ trait_type: string; value: string | number }> = [];
    try {
      attributes = JSON.parse(selectedNft.attributes || '[]') as Array<{ trait_type: string; value: string | number }>;
    } catch (e) {
      console.error("Failed to parse NFT attributes:", e);
    }

    return (
      <div className={classes.detailView}>
        <CORSImage 
          src={getImageUrl(selectedNft)} 
          alt={selectedNft.name}
          style={{ width: '100%', maxWidth: '500px', height: 'auto', marginBottom: '20px', border: '1px solid #ccc' }}
        />
        <h2>{selectedNft.name}</h2>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>
          <strong>Token ID:</strong> #{selectedNft.token_id}
        </div>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>
          <strong>Owner:</strong> {getOwnerInfo(selectedNft)}
        </div>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>
          <strong>Minted:</strong> {formatDate(selectedNft.created_at)}
        </div>
        {attributes.length > 0 && (
          <>
            <h3>Traits:</h3>
            <ul className={classes.detailTraits}>
              {attributes.map((attr, index) => (
                <li key={index}><strong>{attr.trait_type}:</strong> {attr.value}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  // If renderAsContent is true, just render content without any wrapper
  if (renderAsContent) {
    return (
      <>
        {!selectedNft && (
          <div className={classes.collectionSelector} style={{ 
            gap: '6px', 
            padding: '8px',
            flexWrap: 'wrap',
            fontSize: '11px'
          }}>
            {COLLECTIONS.map(col => (
              <button 
                key={col.slug} 
                className={`${classes.collectionButton} ${currentCollection.slug === col.slug ? 'active' : ''}`}
                onClick={() => handleCollectionChange(col)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  minWidth: 'auto',
                }}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}
        <div className={classes.content} style={{ height: '100%', overflow: 'auto', padding: '8px' }}>
          {selectedNft ? (
            renderDetailView()
          ) : (
            <>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
                <button
                  onClick={() => setViewMode('all')}
                  style={{
                    background: viewMode === 'all' ? '#808080' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    color: viewMode === 'all' ? 'white' : 'black',
                    fontSize: '11px',
                  }}
                >
                  All NFTs
                </button>
                <button
                  onClick={() => setViewMode('recent')}
                  disabled={!walletAddress}
                  style={{
                    background: viewMode === 'recent' ? '#808080' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '4px 8px',
                    cursor: walletAddress ? 'pointer' : 'not-allowed',
                    color: viewMode === 'recent' ? 'white' : 'black',
                    opacity: walletAddress ? 1 : 0.6,
                    fontSize: '11px',
                  }}
                >
                  Recently Minted
                </button>
                <button
                  onClick={() => setViewMode('owned')}
                  disabled={!walletAddress && !solanaAddress}
                  style={{
                    background: viewMode === 'owned' ? '#808080' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '4px 8px',
                    cursor: (walletAddress || solanaAddress) ? 'pointer' : 'not-allowed',
                    color: viewMode === 'owned' ? 'white' : 'black',
                    opacity: (walletAddress || solanaAddress) ? 1 : 0.6,
                    fontSize: '11px',
                  }}
                >
                  My NFTs
                </button>
                
                {currentCollection.api === 'opensea-solana' && (
                  <button
                    onClick={() => { void connectSolanaWallet(); }}
                    style={{
                      background: solanaAddress ? '#4CAF50' : '#c0c0c0',
                      border: '2px outset #c0c0c0',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: solanaAddress ? 'white' : 'black',
                      marginLeft: 'auto',
                      fontSize: '11px',
                    }}
                  >
                    {solanaAddress ? `Solana: ${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}` : 'Connect Solana'}
                  </button>
                )}
              </div>

              {loading && <div style={{ fontSize: '12px' }}>Loading...</div>}
              {error && <div style={{ color: 'red', fontSize: '12px' }}>{error}</div>}
              
              {!loading && !error && (
                <>
                  <div style={{ marginBottom: '8px', fontSize: '11px' }}>
                    {viewMode === 'all' && `Showing ${nfts.length} NFTs from ${currentCollection.name}`}
                    {viewMode === 'recent' && `Recently minted NFTs from ${currentCollection.name}`}
                    {viewMode === 'owned' && `NFTs owned by ${currentCollection.api === 'opensea-solana' ? (solanaAddress?.slice(0, 6) + '...' + solanaAddress?.slice(-4)) : (walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4))}`}
                  </div>

                  {nfts.length === 0 ? (
                    <div style={{ fontSize: '12px' }}>No NFTs found.</div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                      gap: '6px',
                      marginBottom: '12px',
                    }}>
                      {nfts.map(nft => (
                        <div 
                          key={nft.id} 
                          style={{ 
                            cursor: 'pointer',
                            display: 'block',
                            width: '100%',
                            aspectRatio: '1',
                            overflow: 'hidden'
                          }} 
                          onClick={() => { void handleNftClick(nft); }}
                        >
                          <CORSImage 
                            src={getImageUrl(nft)} 
                            alt={nft.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </>
    );
  }

  // In Base Mini App, render without Draggable wrapper
  if (isBaseMiniAppDetected) {
    return (
      <div 
        ref={nodeRef} 
        className={classes.popup}
        style={{
          position: 'fixed',
          left: '16px',
          top: '16px',
          right: '16px',
          bottom: '60px',
          width: 'auto',
          height: 'auto',
          zIndex: 10001
        }}
      >
        <div className={classes.header} style={{ cursor: 'default' }}>
          {selectedNft ? (
            <>
              <button className={classes.backButton} onClick={() => setSelectedNft(null)}>
                ← Back
              </button>
              <span>{selectedNft.name}</span>
            </>
          ) : (
            <span>LAWB GALLERY</span>
          )}
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
        {!selectedNft && (
          <div className={classes.collectionSelector}>
            {COLLECTIONS.map(col => (
              <button 
                key={col.slug} 
                className={`${classes.collectionButton} ${currentCollection.slug === col.slug ? 'active' : ''}`}
                onClick={() => handleCollectionChange(col)}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}
        <div className={classes.content} style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
          {selectedNft ? (
            renderDetailView()
          ) : (
            <>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setViewMode('all')}
                  style={{
                    background: viewMode === 'all' ? '#808080' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    color: viewMode === 'all' ? 'white' : 'black'
                  }}
                >
                  All NFTs
                </button>
                <button
                  onClick={() => setViewMode('recent')}
                  disabled={!walletAddress}
                  style={{
                    background: viewMode === 'recent' ? '#808080' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '8px 16px',
                    cursor: walletAddress ? 'pointer' : 'not-allowed',
                    color: viewMode === 'recent' ? 'white' : 'black',
                    opacity: walletAddress ? 1 : 0.6
                  }}
                >
                  Recently Minted
                </button>
                <button
                  onClick={() => setViewMode('owned')}
                  disabled={!walletAddress && !solanaAddress}
                  style={{
                    background: viewMode === 'owned' ? '#808080' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '8px 16px',
                    cursor: (walletAddress || solanaAddress) ? 'pointer' : 'not-allowed',
                    color: viewMode === 'owned' ? 'white' : 'black',
                    opacity: (walletAddress || solanaAddress) ? 1 : 0.6
                  }}
                >
                  My NFTs
                </button>
                
                {currentCollection.api === 'opensea-solana' && (
                  <button
                    onClick={() => { void connectSolanaWallet(); }}
                    style={{
                      background: solanaAddress ? '#4CAF50' : '#c0c0c0',
                      border: '2px outset #c0c0c0',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      color: solanaAddress ? 'white' : 'black',
                      marginLeft: 'auto'
                    }}
                  >
                    {solanaAddress ? `Solana: ${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}` : 'Connect Solana'}
                  </button>
                )}
              </div>

              {loading && <div>Loading...</div>}
              {error && <div style={{ color: 'red' }}>{error}</div>}
              
              {!loading && !error && (
                <>
                  <div style={{ marginBottom: '10px', fontSize: '12px' }}>
                    {viewMode === 'all' && `Showing ${nfts.length} NFTs from ${currentCollection.name}`}
                    {viewMode === 'recent' && `Recently minted NFTs from ${currentCollection.name}`}
                    {viewMode === 'owned' && `NFTs owned by ${currentCollection.api === 'opensea-solana' ? (solanaAddress?.slice(0, 6) + '...' + solanaAddress?.slice(-4)) : (walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4))}`}
                  </div>

                  {nfts.length === 0 ? (
                    <div>No NFTs found.</div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '8px',
                      marginBottom: '20px',
                      padding: '8px',
                    }}>
                      {nfts.map(nft => (
                        <div 
                          key={nft.id} 
                          style={{ 
                            cursor: 'pointer',
                            display: 'block',
                            width: '100%',
                            aspectRatio: '1',
                            overflow: 'hidden'
                          }} 
                          onClick={() => { void handleNftClick(nft); }}
                        >
                          <CORSImage 
                            src={getImageUrl(nft)} 
                            alt={nft.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Draggable nodeRef={nodeRef} handle={`.${classes.header}`}>
        <div ref={nodeRef} className={classes.popup}>
          <div className={classes.header}>
            {selectedNft ? (
              <>
                <button className={classes.backButton} onClick={() => setSelectedNft(null)}>
                  ← Back
                </button>
                <span>{selectedNft.name}</span>
              </>
            ) : (
              <span>LAWB GALLERY</span>
            )}
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
          {!selectedNft && (
            <div className={classes.collectionSelector}>
              {COLLECTIONS.map(col => (
                <button 
                  key={col.slug} 
                  className={`${classes.collectionButton} ${currentCollection.slug === col.slug ? 'active' : ''}`}
                  onClick={() => handleCollectionChange(col)}
                >
                  {col.name}
                </button>
              ))}
            </div>
          )}
          <div className={classes.content}>
            {selectedNft ? (
              renderDetailView()
            ) : (
              <>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('all')}
                style={{
                  background: viewMode === 'all' ? '#808080' : '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: viewMode === 'all' ? 'white' : 'black'
                }}
              >
                All NFTs
              </button>
              <button
                onClick={() => setViewMode('recent')}
                disabled={!walletAddress}
                style={{
                  background: viewMode === 'recent' ? '#808080' : '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '8px 16px',
                  cursor: walletAddress ? 'pointer' : 'not-allowed',
                  color: viewMode === 'recent' ? 'white' : 'black',
                  opacity: walletAddress ? 1 : 0.6
                }}
              >
                Recently Minted
              </button>
              <button
                onClick={() => setViewMode('owned')}
                disabled={!walletAddress && !solanaAddress}
                style={{
                  background: viewMode === 'owned' ? '#808080' : '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '8px 16px',
                  cursor: (walletAddress || solanaAddress) ? 'pointer' : 'not-allowed',
                  color: viewMode === 'owned' ? 'white' : 'black',
                  opacity: (walletAddress || solanaAddress) ? 1 : 0.6
                }}
              >
                My NFTs
              </button>
              
              {/* Solana Connection Button */}
              {currentCollection.api === 'opensea-solana' && (
                <button
                  onClick={() => { void connectSolanaWallet(); }}
                  style={{
                    background: solanaAddress ? '#4CAF50' : '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    color: solanaAddress ? 'white' : 'black',
                    marginLeft: 'auto'
                  }}
                >
                  {solanaAddress ? `Solana: ${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}` : 'Connect Solana'}
                </button>
              )}
            </div>

            {/* Solana Connection Status */}
            {currentCollection.api === 'opensea-solana' && !solanaAddress && (
              <div style={{ 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                padding: '10px', 
                marginBottom: '10px',
                color: '#856404'
              }}>
                Connect your Solana wallet (Phantom or Solflare) to view your NFTs from this collection.
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
              </div>
            )}

            {loading ? (
              <div>Loading NFTs...</div>
            ) : (
              <>
                <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                  {viewMode === 'all' && (() => {
                    const collectionName = currentCollection.name || currentCollection.slug;
                    if (hasMoreResults) {
                      return `Displaying ${nfts.length}+ ${collectionName}`;
                    } else if (totalCount > 0 && totalCount !== nfts.length) {
                      return `Displaying ${nfts.length}/${totalCount} ${collectionName}`;
                    } else {
                      return `Displaying ${nfts.length} ${collectionName}`;
                    }
                  })()}
                  {viewMode === 'recent' && `Recently minted NFTs by ${currentCollection.api === 'opensea-solana' ? (solanaAddress?.slice(0, 6) + '...' + solanaAddress?.slice(-4)) : (walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4))}`}
                  {viewMode === 'owned' && `NFTs owned by ${currentCollection.api === 'opensea-solana' ? (solanaAddress?.slice(0, 6) + '...' + solanaAddress?.slice(-4)) : (walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4))}`}
                </div>

                {nfts.length === 0 ? (
                  <div>No NFTs found.</div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isBaseMiniAppDetected ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: isBaseMiniAppDetected ? '8px' : '0',
                    marginBottom: '20px',
                    padding: isBaseMiniAppDetected ? '8px' : '0',
                  }}>
                    {nfts.map(nft => (
                      <div 
                        key={nft.id} 
                        style={{ 
                          cursor: 'pointer',
                          display: 'block',
                          width: '100%',
                          aspectRatio: '1',
                          overflow: 'hidden'
                        }} 
                        onClick={() => { void handleNftClick(nft); }}
                      >
                        <CORSImage 
                          src={getImageUrl(nft)} 
                          alt={`NFT #${nft.token_id}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {viewMode !== 'recent' && totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        background: '#c0c0c0',
                        border: '2px outset #c0c0c0',
                        padding: '5px 10px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ padding: '5px 10px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        background: '#c0c0c0',
                        border: '2px outset #c0c0c0',
                        padding: '5px 10px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
              </>
            )}
          </div>
        </div>
      </Draggable>
    </>
  );
};

export default NFTGallery; 