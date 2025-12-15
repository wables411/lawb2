import React, { useState } from 'react';
import { useDisconnect } from 'wagmi';
import { useAppKitSafe as useAppKit } from '../hooks/useAppKitSafe';

interface MobileWalletConnectorProps {
  onConnect?: () => void;
  onError?: (error: string) => void;
}

const MobileWalletConnector: React.FC<MobileWalletConnectorProps> = ({ onConnect, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();

  const handleMobileWalletConnection = async (walletType: 'rainbow' | 'metamask' | 'coinbase' | 'trust') => {
    setIsConnecting(true);
    
    try {
      // Check if we're on mobile
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        onError?.('This component is designed for mobile devices only.');
        return;
      }

      // Try to open the wallet app directly
      let walletUrl = '';
      switch (walletType) {
        case 'rainbow':
          walletUrl = 'rainbow://';
          break;
        case 'metamask':
          walletUrl = 'metamask://';
          break;
        case 'coinbase':
          walletUrl = 'cbwallet://';
          break;
        case 'trust':
          walletUrl = 'trust://';
          break;
      }

      // Use AppKit modal to handle connection instead of direct wagmi connector
      await open({ view: 'Connect' });
      onConnect?.();
      
    } catch (error) {
      onError?.('Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px', 
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      border: '2px solid #000080'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#000080', textAlign: 'center' }}>
        Connect Mobile Wallet
      </h3>
      
      <button
        onClick={() => handleMobileWalletConnection('rainbow')}
        disabled={isConnecting}
        style={{
          padding: '12px 20px',
          backgroundColor: isConnecting ? '#ccc' : '#000080',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Rainbow'}
      </button>
      
      <button
        onClick={() => handleMobileWalletConnection('metamask')}
        disabled={isConnecting}
        style={{
          padding: '12px 20px',
          backgroundColor: isConnecting ? '#ccc' : '#000080',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      
      <button
        onClick={() => handleMobileWalletConnection('coinbase')}
        disabled={isConnecting}
        style={{
          padding: '12px 20px',
          backgroundColor: isConnecting ? '#ccc' : '#000080',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Coinbase'}
      </button>
      
      <button
        onClick={() => handleMobileWalletConnection('trust')}
        disabled={isConnecting}
        style={{
          padding: '12px 20px',
          backgroundColor: isConnecting ? '#ccc' : '#000080',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Trust Wallet'}
      </button>
      
      <p style={{ 
        fontSize: '12px', 
        color: '#666', 
        textAlign: 'center', 
        margin: '10px 0 0 0' 
      }}>
        Make sure you have the wallet app installed on your mobile device.
      </p>
    </div>
  );
};

export default MobileWalletConnector;
