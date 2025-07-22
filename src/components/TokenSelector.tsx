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
  const { balance, isOnSankoNetwork } = useTokenBalance(selectedToken, address);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleTokenSelect = (token: TokenSymbol) => {
    onTokenSelect(token);
    setShowDropdown(false);
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
              minWidth: '100px',
              textAlign: 'left'
            }}
          >
            {SUPPORTED_TOKENS[selectedToken].symbol}
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
              minWidth: '100px'
            }}>
              {Object.entries(SUPPORTED_TOKENS).map(([symbol, token]) => (
                <div
                  key={symbol}
                  onClick={() => handleTokenSelect(symbol as TokenSymbol)}
                  style={{
                    padding: '5px 10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  {token.symbol}
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
          Balance: {isOnSankoNetwork ? `${balance.toFixed(2)} ${SUPPORTED_TOKENS[selectedToken].symbol}` : 'Connect to Sanko'}
        </span>
      </div>

      {!isOnSankoNetwork && (
        <div style={{ color: '#ff6b35', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ Switch to Sanko network to see token balances
        </div>
      )}
      {wagerAmount > balance && isOnSankoNetwork && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          Insufficient balance. You have {balance.toFixed(2)} {SUPPORTED_TOKENS[selectedToken].symbol}
        </div>
      )}
    </div>
  );
}; 