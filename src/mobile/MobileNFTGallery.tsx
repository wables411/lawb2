import React, { useState, useEffect, useCallback } from 'react';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSingleNFT, getOpenSeaSolanaNFTsByOwner } from '../mint';
import { createUseStyles } from 'react-jss';
import { useAppKit } from '@reown/appkit/react';

const useStyles = createUseStyles({
  galleryContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: '#c0c0c0',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
  },
  header: {
    background: 'navy',
    color: '#fff',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backButton: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    padding: '2px 8px',
    cursor: 'pointer',
    '&:active': {
      borderStyle: 'inset',
    },
  },
  headerTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem',
  },
  gridItem: {
    border: '1px solid #808080',
    padding: '10px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    textAlign: 'center',
    '& img': {
      width: '100%',
      height: 'auto',
      marginBottom: '8px',
    },
  },
  detailView: {
    padding: '1rem',
    '& img': {
      maxWidth: '100%',
      marginBottom: '1rem',
    },
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
  },
  collectionSelector: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    borderBottom: '2px inset #fff',
    flexWrap: 'wrap',
  },
  collectionButton: {
    padding: '5px 10px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    '&.active': {
      borderStyle: 'inset',
      backgroundColor: '#e0e0e0',
    }
  },
});

interface NFTTrait {
  trait_type: string;
  value: string | number;
}

interface NFT {
  id: string;
  address: string;
  token_id: number;
  attributes: string;
  image: string;
  name: string;
  chain_id?: number;
  image_url?: string;
  image_url_shrunk?: string;
}

interface MobileNFTGalleryProps {
  onBack: () => void;
  walletAddress?: string;
}

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
  { slug: 'lawbstation', name: 'Lawbstation', api: 'opensea-solana', chain: 'solana' },
  { slug: 'lawbnexus', name: 'Nexus', api: 'opensea-solana', chain: 'solana' },
];

declare global {
  interface Window {
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

const MobileNFTGallery: React.FC<MobileNFTGalleryProps> = ({ onBack, walletAddress }) => {
  const classes = useStyles();
  const { open } = useAppKit();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [currentCollection, setCurrentCollection] = useState<Collection>(COLLECTIONS[0]);
  const [showSolanaPrompt, setShowSolanaPrompt] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'owned'>('all');
  const [error, setError] = useState<string | null>(null);
  
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
      try {
        let response;
        let walletAddressToFetch: string | undefined = walletAddress || undefined;
        if (currentCollection.api === 'opensea-solana') {
          if (!solanaAddress) {
            setShowSolanaPrompt(true);
            setLoading(false);
            return;
          }
          walletAddressToFetch = solanaAddress;
          
          // Use owner-specific endpoint for Solana NFTs
          response = await getOpenSeaSolanaNFTsByOwner(solanaAddress, 100);
          console.log('Mobile: Fetched Solana NFTs by owner:', response.data.length);
        } else if (currentCollection.api === 'opensea') {
          response = await getOpenSeaNFTs(currentCollection.slug, 100, walletAddressToFetch);
        } else {
          response = await getCollectionNFTs(currentCollection.slug, 1, 100, walletAddressToFetch);
        }

        // Filter by owner if needed
        if (viewMode === 'owned' && solanaAddress) {
          console.log('Filtering for owner:', solanaAddress);
          
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
              return hasOwner;
            });
          }
        }

        setNfts(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchNfts();
  }, [walletAddress, currentCollection, solanaAddress, viewMode]);

  useEffect(() => {
    if (showSolanaPrompt) {
      void connectSolanaWallet();
    }
  }, [showSolanaPrompt, connectSolanaWallet]);

  const handleNftClick = async (nft: NFT) => {
    setLoading(true);
    if (currentCollection.api === 'opensea' && currentCollection.chain) {
        try {
            const fullNftData = await getOpenSeaSingleNFT(currentCollection.chain, nft.address, nft.token_id.toString());
            const updatedNft = { ...nft, attributes: JSON.stringify(fullNftData.traits || []) };
            setSelectedNft(updatedNft);
        } catch (error) {
            console.error("Failed to fetch full NFT details", error);
            setSelectedNft(nft);
        }
    } else {
        setSelectedNft(nft);
    }
    setLoading(false);
  };
  
  const renderDetailView = () => {
    if (!selectedNft) return null;

    let attributes: NFTTrait[] = [];
    try {
      attributes = JSON.parse(selectedNft.attributes || '[]') as NFTTrait[];
    } catch (e) {
      console.error("Failed to parse NFT attributes:", e);
    }

    return (
        <div className={classes.detailView}>
            <img src={selectedNft.image} alt={selectedNft.name} />
            <h2>{selectedNft.name}</h2>
            <h4>Traits:</h4>
            <ul>
                {attributes.map((attr, index) => (
                    <li key={index}><strong>{attr.trait_type}:</strong> {attr.value}</li>
                ))}
            </ul>
        </div>
    );
  };

  const renderGridView = () => (
    <>
      <div className={classes.collectionSelector}>
        {COLLECTIONS.map(collection => (
          <button
            key={collection.slug} 
            className={`${classes.collectionButton} ${currentCollection.slug === collection.slug ? 'active' : ''}`}
            onClick={() => setCurrentCollection(collection)}
          >
            {collection.name}
          </button>
        ))}
      </div>
      
      <div className={classes.content}>
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

        {/* Error Display */}
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

        {loading ? (
          <div className={classes.loading}>Loading NFTs...</div>
        ) : (
          <div className={classes.grid}>
            {nfts.map((nft) => {
              // Try to get the best image URL
              let imgSrc = nft.image || nft.image_url || nft.image_url_shrunk || '/assets/pixelawb.png';
              return (
                <div key={nft.id} className={classes.gridItem} onClick={() => void handleNftClick(nft)}>
                  <img 
                    src={imgSrc} 
                    alt={nft.name} 
                    onError={e => {
                      if (e.currentTarget.src !== nft.image_url && nft.image_url) {
                        e.currentTarget.src = nft.image_url;
                      } else if (e.currentTarget.src !== nft.image_url_shrunk && nft.image_url_shrunk) {
                        e.currentTarget.src = nft.image_url_shrunk;
                      } else {
                        e.currentTarget.src = '/assets/pixelawb.png';
                      }
                    }}
                  />
                  <span>{nft.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={classes.galleryContainer}>
      <header className={classes.header}>
        <button className={classes.backButton} onClick={selectedNft ? () => setSelectedNft(null) : onBack}>
          Back
        </button>
        <h2 className={classes.headerTitle}>
            {selectedNft ? selectedNft.name : "LAWB NFT GALLERY"}
        </h2>
      </header>
      <div className={classes.content}>
        {loading ? <p className={classes.loading}>Loading...</p> : (selectedNft ? renderDetailView() : renderGridView())}
      </div>
    </div>
  );
};

export default MobileNFTGallery; 