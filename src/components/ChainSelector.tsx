import React from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { NETWORKS } from '../config/tokens';

interface ChainSelectorProps {
  selectedChain: 'sanko' | 'base' | 'arbitrum' | null;
  onSelect: (chain: 'sanko' | 'base' | 'arbitrum') => void;
  mode?: 'desktop' | 'base-app';
  disabled?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChain,
  onSelect,
  mode = 'desktop',
  disabled = false
}) => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Base app: no selector, always Base
  if (mode === 'base-app') {
    return null;
  }

  const chains = [
    { id: 'sanko' as const, name: 'Sanko', icon: '🎮', chainId: NETWORKS.mainnet.chainId },
    { id: 'base' as const, name: 'Base', icon: '🔵', chainId: NETWORKS.base.chainId },
    { id: 'arbitrum' as const, name: 'Arbitrum', icon: '🔷', chainId: NETWORKS.arbitrum.chainId, comingSoon: true },
  ];

  const handleChainSelect = async (chain: 'sanko' | 'base' | 'arbitrum') => {
    if (disabled) return;
    
    const chainConfig = chains.find(c => c.id === chain);
    if (!chainConfig || chainConfig.comingSoon) return;
    
    onSelect(chain);
    
    // If user is on wrong chain, prompt to switch
    if (chainId !== chainConfig.chainId) {
      try {
        await switchChain({ chainId: chainConfig.chainId });
      } catch (error) {
        console.error('Failed to switch chain:', error);
        // User rejected or error - don't update selectedChain
      }
    }
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontWeight: 'bold', minWidth: '80px', color: '#ff0000', marginRight: '10px' }}>
        Chain:
      </label>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {chains.map(chain => (
          <button
            key={chain.id}
            type="button"
            onClick={() => handleChainSelect(chain.id)}
            disabled={disabled || chain.comingSoon}
            style={{
              padding: '5px 10px',
              border: selectedChain === chain.id ? '2px solid #ff0000' : '2px outset #fff',
              background: selectedChain === chain.id ? '#333' : '#000000',
              color: chain.comingSoon ? '#666' : '#ff0000',
              cursor: disabled || chain.comingSoon ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              opacity: chain.comingSoon ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!disabled && !chain.comingSoon) {
                e.currentTarget.style.background = '#333';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !chain.comingSoon) {
                e.currentTarget.style.background = selectedChain === chain.id ? '#333' : '#000000';
              }
            }}
          >
            <span>{chain.icon}</span>
            <span>{chain.name}</span>
            {chain.comingSoon && <span style={{ fontSize: '10px' }}>(Soon)</span>}
            {selectedChain === chain.id && chainId === chain.chainId && (
              <span style={{ fontSize: '10px', color: '#32CD32' }}>✓</span>
            )}
          </button>
        ))}
      </div>
      {selectedChain && chainId !== chains.find(c => c.id === selectedChain)?.chainId && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ Please switch to {chains.find(c => c.id === selectedChain)?.name} network
        </div>
      )}
    </div>
  );
};
