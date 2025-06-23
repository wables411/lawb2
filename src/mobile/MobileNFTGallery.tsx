import React, { useState, useEffect } from 'react';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSingleNFT } from '../mint';
import { createUseStyles } from 'react-jss';

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
  api: 'scatter' | 'opensea';
  chain?: string;
}

const COLLECTIONS: Collection[] = [
  { slug: 'pixelawbs', name: 'Pixelawbs', api: 'scatter' },
  { slug: 'lawbsters', name: 'Lawbsters', api: 'opensea', chain: 'ethereum' },
  { slug: 'lawbstarz', name: 'Lawbstarz', api: 'scatter' },
  { slug: 'a-lawbster-halloween', name: 'Halloween', api: 'opensea', chain: 'base' },
];

const MobileNFTGallery: React.FC<MobileNFTGalleryProps> = ({ onBack, walletAddress }) => {
  const classes = useStyles();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [currentCollection, setCurrentCollection] = useState<Collection>(COLLECTIONS[0]);
  
  useEffect(() => {
    const fetchNfts = async () => {
      setLoading(true);
      try {
        let response;
        if (currentCollection.api === 'opensea') {
          response = await getOpenSeaNFTs(currentCollection.slug, 100, walletAddress);
        } else {
          response = await getCollectionNFTs(currentCollection.slug, 1, 100, walletAddress);
        }
        setNfts(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchNfts();
  }, [walletAddress, currentCollection]);

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
    </>
  );

  return (
    <div className={classes.galleryContainer}>
      <header className={classes.header}>
        <button className={classes.backButton} onClick={selectedNft ? () => setSelectedNft(null) : onBack}>
          Back
        </button>
        <h2 className={classes.headerTitle}>
            {selectedNft ? selectedNft.name : "EVM LAWB GALLERY"}
        </h2>
      </header>
      <div className={classes.content}>
        {loading ? <p className={classes.loading}>Loading...</p> : (selectedNft ? renderDetailView() : renderGridView())}
      </div>
    </div>
  );
};

export default MobileNFTGallery; 