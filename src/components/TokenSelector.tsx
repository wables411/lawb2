import React, { useState } from 'react';
import { SUPPORTED_TOKENS, type TokenSymbol } from '../config/tokens';
import { useTokenBalance } from '../hooks/useTokens';
import { useAccount } from 'wagmi';

interface TokenSelectorProps {
  selectedToken: TokenSymbol;
  onTokenSelect: (token: TokenSymbol) => void;
  wagerAmount: number;
  onWagerChange: (amount: number) => void;
  disabled?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  wagerAmount,
  onWagerChange,
  disabled = false
}) => {
  const { address } = useAccount();
  const { balance, isOnSankoMainnet, isOnSankoTestnet } = useTokenBalance(selectedToken, address);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleTokenSelect = (token: TokenSymbol) => {
    onTokenSelect(token);
    setShowDropdown(false);
  };

  // Get display name for token with native indicator
  const getTokenDisplayName = (tokenSymbol: TokenSymbol) => {
    const token = SUPPORTED_TOKENS[tokenSymbol];
    if (token.isNative) {
      return `${token.symbol} (Native)`;
    }
    return token.symbol;
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ fontWeight: 'bold', minWidth: '80px' }}>Token:</label>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={disabled}
            style={{
              padding: '5px 10px',
              border: '2px outset #fff',
              background: '#c0c0c0',
              cursor: disabled ? 'not-allowed' : 'pointer',
              minWidth: '120px', // Increased width to accommodate longer names
              textAlign: 'left'
            }}
          >
            {getTokenDisplayName(selectedToken)}
            <span style={{ float: 'right' }}>▼</span>
          </button>
          
          {showDropdown && !disabled && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: '#fff',
              border: '2px outset #fff',
              zIndex: 10,
              minWidth: '120px'
            }}>
              {Object.entries(SUPPORTED_TOKENS).map(([symbol, token]) => (
                <div
                  key={symbol}
                  onClick={() => handleTokenSelect(symbol as TokenSymbol)}
                  style={{
                    padding: '5px 10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    fontSize: '12px' // Smaller font to fit longer names
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  {getTokenDisplayName(symbol as TokenSymbol)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ fontWeight: 'bold', minWidth: '80px' }}>Amount:</label>
        <input
          type="number"
          value={wagerAmount}
          onChange={(e) => onWagerChange(Number(e.target.value))}
          disabled={disabled}
          min="0.1"
          max="1000"
          step="0.1"
          style={{
            padding: '5px',
            border: '2px inset #fff',
            background: '#fff',
            width: '100px'
          }}
        />
        <span style={{ color: '#666', fontSize: '12px' }}>
          Balance: {isOnSankoMainnet ? `${balance.toFixed(2)} ${SUPPORTED_TOKENS[selectedToken].symbol}` : 'Connect to Sanko Mainnet'}
          {SUPPORTED_TOKENS[selectedToken].isNative && <span style={{ color: '#FF6B35', fontWeight: 'bold' }}> (Native)</span>}
        </span>
      </div>

      {isOnSankoTestnet && (
        <div style={{ color: '#ff6b35', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ Switch to Sanko Mainnet - tokens are not available on testnet
        </div>
      )}
      {!isOnSankoMainnet && !isOnSankoTestnet && (
        <div style={{ color: '#ff6b35', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ Switch to Sanko Mainnet to see token balances
        </div>
      )}
      {wagerAmount > balance && isOnSankoMainnet && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          Insufficient balance. You have {balance.toFixed(2)} {SUPPORTED_TOKENS[selectedToken].symbol}
          {SUPPORTED_TOKENS[selectedToken].isNative && <span> (Native)</span>}
        </div>
      )}
      {balance === 0 && isOnSankoMainnet && (
        <div style={{ color: '#ffa500', fontSize: '12px', marginTop: '5px' }}>
          💡 You have 0 {SUPPORTED_TOKENS[selectedToken].symbol}
          {SUPPORTED_TOKENS[selectedToken].isNative && <span> (Native)</span>}
          . Get tokens from <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer" style={{color: '#ffa500'}}>Sanko Bridge</a>
        </div>
      )}
    </div>
  );
}; 