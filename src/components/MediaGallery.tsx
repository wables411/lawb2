import { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  }
});

interface NFT {
  image: string;
  name: string;
}

interface MediaGalleryProps {
  address?: string;
}

function MediaGallery({ address }: MediaGalleryProps) {
  const classes = useStyles();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setError('Please connect your wallet first!');
      return;
    }

    const fetchNFTs = async () => {
      try {
        const response = await fetch(
          `https://api.scatter.art/v1/collections/pixelawbs/nfts?walletAddress=${address}`,
          { 
            headers: { 
              'Content-Type': 'application/json'
            } 
          }
        );
        const data = await response.json();
        if (response.ok) {
          setNfts(data);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load NFTs');
        }
      } catch (err) {
        console.error('Failed to load NFTs:', err);
        setError('Error loading NFTs');
      }
    };

    fetchNFTs();
  }, [address]);

  return (
    <div className={classes.content}>
      {error ? (
        <p>{error}</p>
      ) : nfts.length ? (
        nfts.map((nft, index) => (
          <div key={index}>
            <img src={nft.image} alt={nft.name} style={{ maxWidth: '100px' }} />
            <p>{nft.name}</p>
          </div>
        ))
      ) : (
        <p>No NFTs found.</p>
      )}
    </div>
  );
}

export default MediaGallery;