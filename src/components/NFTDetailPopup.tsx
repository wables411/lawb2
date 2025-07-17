import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { createUseStyles } from 'react-jss';
import { CORSImage, getImageUrl } from './CORSImage';

const useStyles = createUseStyles({
  popup: {
    position: 'absolute',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '400px',
    height: 'auto',
    top: '20vh',
    left: '30vw',
    zIndex: 102,
    display: 'flex',
    flexDirection: 'column'
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
    '&:active': { border: '1px inset #c0c0c0' }
  },
  content: {
    padding: '10px',
    background: 'white',
    color: 'black'
  },
  detailImage: {
    width: '100%',
    height: 'auto',
    marginBottom: '10px',
  },
  detailTraits: {
    listStyleType: 'none',
    paddingLeft: '0',
    '& li': { marginBottom: '5px' }
  }
});

interface NFT {
  name: string;
  image_url: string;
  attributes: string;
}

interface Trait {
  trait_type: string;
  value: string;
}

interface NFTDetailPopupProps {
  nft: NFT;
  onClose: () => void;
}

const parseAttributes = (attributes: string): Trait[] => {
  try {
    const parsed = JSON.parse(attributes) as { trait_type: string; value: string }[];
    if (Array.isArray(parsed) && parsed.every(item => 'trait_type' in item && 'value' in item)) {
      return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
};

const NFTDetailPopup: React.FC<NFTDetailPopupProps> = ({ nft, onClose }) => {
  const classes = useStyles();
  const nodeRef = useRef(null);
  const traits = parseAttributes(nft.attributes);

  return (
    <Draggable nodeRef={nodeRef} handle={`.${classes.header}`}>
      <div className={classes.popup} ref={nodeRef}>
        <div className={classes.header}>
          <span>{nft.name} - Details</span>
          <button className={classes.titleBarButton} onClick={onClose}>X</button>
        </div>
        <div className={classes.content}>
          <CORSImage src={getImageUrl(nft)} alt={nft.name} style={{ width: '100%', height: 'auto', marginBottom: '10px' }} />
          <h3>Traits</h3>
          <ul className={classes.detailTraits}>
            {traits.length > 0 ? (
              traits.map((attr, index) => (
                <li key={index}><strong>{attr.trait_type}:</strong> {attr.value}</li>
              ))
            ) : (
              <li>No traits found.</li>
            )}
          </ul>
        </div>
      </div>
    </Draggable>
  );
};

export default NFTDetailPopup; 