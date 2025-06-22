import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSingleNFT } from '../mint';
import { createUseStyles } from 'react-jss';
import NFTDetailPopup from './NFTDetailPopup';

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
    display: ({ isOpen }: { isOpen: boolean }) => (isOpen ? 'block' : 'none'),
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  gridItem: {
    border: '1px solid #808080',
    padding: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  detailContent: {
    padding: '20px',
    color: '#000',
  },
  detailImage: {
    width: '100%',
    height: 'auto',
    marginBottom: '20px',
    border: '1px solid #ccc'
  },
  detailTraits: {
    listStyleType: 'none',
    paddingLeft: '0',
    '& li': {
      marginBottom: '5px'
    }
  },
  collectionSelector: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    borderBottom: '2px inset #fff',
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
}

type ViewMode = 'all' | 'recent' | 'owned';

type Collection = {
  slug: string;
  name: string;
  api: 'scatter' | 'opensea';
  chain?: string;
}

const COLLECTIONS: Collection[] = [
  { slug: 'pixelawbs', name: 'Pixelawbs', api: 'scatter' },
  { slug: 'lawbsters', name: 'Lawbsters', api: 'opensea', chain: 'ethereum' },
  { slug: 'lawbstarz', name: 'Lawbstarz', api: 'scatter' },
  { slug: 'a-lawbster-halloween', name: 'Halloween', api: 'opensea', chain: 'base' },
];

const NFTGallery: React.FC<NFTGalleryProps> = ({ isOpen, onClose, onMinimize, walletAddress }) => {
  const classes = useStyles({ isOpen });
  const nodeRef = useRef(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [currentCollection, setCurrentCollection] = useState<Collection>(COLLECTIONS[0]);

  useEffect(() => {
    const fetchNfts = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        const walletAddressToFetch = viewMode === 'owned' ? walletAddress : undefined;

        if (currentCollection.api === 'opensea') {
          response = await getOpenSeaNFTs(currentCollection.slug, 50, walletAddressToFetch);
        } else {
          response = await getCollectionNFTs(currentCollection.slug, currentPage, 50, walletAddressToFetch);
        }
        
        setNfts(response.data);
        setTotalPages(response.totalPages);
        setTotalCount(response.totalCount);
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
  }, [isOpen, currentPage, viewMode, walletAddress, currentCollection]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const getOwnerInfo = (nft: NFT) => nft.owners.length > 0 ? `${nft.owners[0].owner_of.substring(0, 6)}...` : 'N/A';
  
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
  };

  if (!isOpen) return null;

  return (
    <>
      <Draggable nodeRef={nodeRef} handle={`.${classes.header}`}>
        <div ref={nodeRef} className={classes.popup}>
          <div className={classes.header}>
            <span>EVM LAWB GALLERY</span>
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
          <div className={classes.content}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
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
                disabled={!walletAddress}
                style={{
                  background: viewMode === 'owned' ? '#808080' : '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '8px 16px',
                  cursor: walletAddress ? 'pointer' : 'not-allowed',
                  color: viewMode === 'owned' ? 'white' : 'black',
                  opacity: walletAddress ? 1 : 0.6
                }}
              >
                My NFTs
              </button>
            </div>

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
                  {viewMode === 'all' && `Showing all NFTs (${totalCount} total)`}
                  {viewMode === 'recent' && `Recently minted NFTs by ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
                  {viewMode === 'owned' && `NFTs owned by ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
                </div>

                {nfts.length === 0 ? (
                  <div>No NFTs found.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {nfts.map(nft => (
                      <div key={nft.id} style={{ border: '1px solid #808080', padding: '10px', backgroundColor: '#ffffff', borderRadius: '4px', cursor: 'pointer' }} onClick={() => { void handleNftClick(nft); }}>
                        <div style={{ width: '100%', height: '150px', backgroundImage: `url(${nft.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '10px', border: '1px solid #ccc' }} />
                        <div style={{ fontSize: '12px', marginBottom: '5px', color: '#000' }}><strong>#{nft.token_id}</strong></div>
                        <div style={{ fontSize: '11px', marginBottom: '5px', color: '#000' }}>Owner: {getOwnerInfo(nft)}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Minted: {formatDate(nft.created_at)}</div>
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
          </div>
        </div>
      </Draggable>

      {selectedNft && (
        <NFTDetailPopup
          nft={selectedNft}
          onClose={() => setSelectedNft(null)}
        />
      )}
    </>
  );
};

export default NFTGallery; 