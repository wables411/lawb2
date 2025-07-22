import React, { useState, useEffect } from 'react';
import { getEligibleInviteLists, mintNFT } from '../mint';
import { useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import MobilePopup98 from './MobilePopup98';

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
  const [inviteLists, setInviteLists] = useState<InviteList[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isOpen && walletAddress) {
      void loadEligibleLists();
    }
    // eslint-disable-next-line
  }, [isOpen, walletAddress]);

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
    <MobilePopup98 isOpen={isOpen} onClose={onClose} title="Mint Pixelawbs">
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
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Switch to Ethereum
              </button>
            </div>
          )}
        </div>
      )}
      {loading ? (
        <div>Loading eligible invite lists...</div>
      ) : inviteLists.length === 0 ? (
        <div>No eligible invite lists found for your wallet.</div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#008080', fontSize: '1rem', margin: 0 }}>Available Lists:</h3>
            {inviteLists.map(list => (
              <div key={list.id} style={listBoxStyle}>
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
          <button style={{
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
          }} onClick={handleMint} disabled={minting}>
            {minting ? 'Minting...' : 'Mint'}
          </button>
        </>
      )}
    </MobilePopup98>
  );
};

export default MobileMintPopup; 