import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { getEligibleInviteLists, mintNFT } from '../mint';
import { useWalletClient } from 'wagmi';
import { createUseStyles } from 'react-jss';

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
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadEligibleLists();
    }
  }, [isOpen, walletAddress]);

  const loadEligibleLists = async () => {
    setLoading(true);
    setError(null);
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
          alert(`NFT Minted Successfully: Transaction Hash - ${txHash}`);
          onClose();
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
                onClick={handleMint}
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
        </div>
      </div>
    </Draggable>
  );
};

export default MintPopup; 