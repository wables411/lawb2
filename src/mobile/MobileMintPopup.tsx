import React, { useState, useEffect } from 'react';
import { getEligibleInviteLists, mintNFT } from '../mint';
import { useWalletClient } from 'wagmi';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.7)',
    zIndex: 4000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    background: '#fff',
    borderRadius: '16px',
    width: '92vw',
    maxWidth: '420px',
    minHeight: '320px',
    maxHeight: '90vh',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '1.5rem 1rem 1rem 1rem',
    position: 'relative',
    overflowY: 'auto',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: '#00ffff',
    color: '#000',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '1px 1px 0 #000',
  },
  title: {
    color: '#008080',
    fontFamily: "'Press Start 2P', 'MS Sans Serif', Arial, sans-serif",
    fontSize: '1.2rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    color: '#000',
    fontSize: '1rem',
    textAlign: 'center',
  },
  mintButton: {
    background: '#00ffff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    marginTop: '1.5rem',
    cursor: 'pointer',
    boxShadow: '1px 1px 0 #aaa',
  },
  listBox: {
    border: '1px solid #808080',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    textAlign: 'left',
  },
  error: {
    backgroundColor: '#ffcccc',
    border: '1px solid #ff0000',
    padding: '10px',
    marginBottom: '10px',
    color: '#cc0000',
    borderRadius: '8px',
  },
});

interface InviteList {
  id: string;
  name: string;
  currency_symbol: string;
  token_price: string;
  wallet_limit: number;
}

interface MobileMintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

const MobileMintPopup: React.FC<MobileMintPopupProps> = ({ isOpen, onClose, walletAddress }) => {
  const classes = useStyles();
  const [inviteLists, setInviteLists] = useState<InviteList[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (isOpen && walletAddress) {
      void loadEligibleLists();
    }
    // eslint-disable-next-line
  }, [isOpen, walletAddress]);

  const loadEligibleLists = async () => {
    setLoading(true);
    setError(null);
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

    setMinting(true);
    setError(null);

    try {
      const result = await mintNFT(walletAddress, selectedLists);
      if (result.success && result.mintTransaction) {
        alert('Please confirm the transaction in your wallet.');
        try {
          const txHash = await walletClient.sendTransaction({
            to: result.mintTransaction.to as `0x${string}`,
            value: BigInt(result.mintTransaction.value),
            data: result.mintTransaction.data as `0x${string}`,
          });
          alert(`NFT Minted Successfully: Transaction Hash - ${txHash}`);
          onClose();
        } catch (txError) {
          setError('Transaction failed: ' + (txError as Error).message);
        }
      } else {
        throw new Error(result.message || 'Could not retrieve minting transaction.');
      }
    } catch (err) {
      setError('Minting failed: ' + (err as Error).message);
    } finally {
      setMinting(false);
    }
  };

  const formatPrice = (price: string, symbol: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice} ${symbol}`;
  };

  if (!isOpen) return null;

  return (
    <div className={classes.overlay}>
      <div className={classes.popup}>
        <button className={classes.closeButton} onClick={onClose}>&times;</button>
        <div className={classes.title}>Mint Pixelawbs</div>
        <div className={classes.content}>
          {error && <div className={classes.error}>{error}</div>}
          {loading ? (
            <div>Loading eligible invite lists...</div>
          ) : inviteLists.length === 0 ? (
            <div>No eligible invite lists found for your wallet.</div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#008080', fontSize: '1rem', margin: 0 }}>Available Lists:</h3>
                {inviteLists.map(list => (
                  <div key={list.id} className={classes.listBox}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{list.name}</div>
                    <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                      Price: {formatPrice(list.token_price, list.currency_symbol)}
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                      Limit: {list.wallet_limit === 4294967295 ? 'Unlimited' : list.wallet_limit} per wallet
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={list.wallet_limit === 4294967295 ? undefined : list.wallet_limit}
                      value={selectedQuantities[list.id] || ''}
                      onChange={e => handleQuantityChange(list.id, parseInt(e.target.value) || 0)}
                      style={{ width: '60px', fontSize: '1rem', marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '0.95rem' }}>Qty</span>
                  </div>
                ))}
              </div>
              <button className={classes.mintButton} onClick={handleMint} disabled={minting}>
                {minting ? 'Minting...' : 'Mint'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMintPopup; 