import React, { useState, useEffect } from 'react';
import { SUPPORTED_TOKENS, type TokenSymbol, TOKEN_ADDRESSES_BY_CHAIN, NETWORKS } from '../config/tokens';
import { useTokenBalance } from '../hooks/useTokens';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { validateERC20Token } from '../utils/tokenValidation';
import { ethers } from 'ethers';

interface TokenSelectorProps {
  selectedToken: TokenSymbol | string; // Can be TokenSymbol or custom address
  onTokenSelect: (token: TokenSymbol | string) => void; // Can return TokenSymbol or address
  wagerAmount: number;
  onWagerChange: (amount: number) => void;
  disabled?: boolean;
}

// Quick-select tokens for Base
const BASE_QUICK_SELECT_TOKENS = {
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC' },
  ETH: { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', isNative: true },
  GG: { address: '0x000000000000a59351f61B598E8DA953b9e041Ec', symbol: 'GG' },
  LAWB: { address: '0x7e18298b46A1F2399617cde083Fe11415A2ad15B', symbol: 'LAWB' },
} as const;

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  wagerAmount,
  onWagerChange,
  disabled = false
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  // Check if we're on Base/Arbitrum (supports custom tokens)
  const isBase = chainId === NETWORKS.base.chainId;
  const isArbitrum = chainId === NETWORKS.arbitrum.chainId;
  const supportsCustomTokens = isBase || isArbitrum;
  const isSanko = chainId === NETWORKS.mainnet.chainId || chainId === NETWORKS.testnet.chainId;
  
  // For Sanko: use existing token balance hook
  // For Base: handle custom token addresses
  const isCustomToken = supportsCustomTokens && !Object.keys(SUPPORTED_TOKENS).includes(selectedToken as string);
  
  const { balance: sankoBalance, isOnSankoMainnet, isOnSankoTestnet, isOnBase, isOnArbitrum, isOnSupportedNetwork, tokenAvailable } = useTokenBalance(
    isCustomToken ? 'USDC' : (selectedToken as TokenSymbol), // Fallback for custom tokens
    address
  );
  
  // Custom token state
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [customTokenValidation, setCustomTokenValidation] = useState<{ valid: boolean; symbol?: string; name?: string; decimals?: number; error?: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [customTokenBalance, setCustomTokenBalance] = useState<number>(0);
  
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter tokens available on current chain (for Sanko)
  const availableTokens = Object.entries(SUPPORTED_TOKENS).filter(([symbol, token]) => 
    (token.chains as readonly number[]).includes(chainId)
  ) as [string, typeof SUPPORTED_TOKENS[TokenSymbol]][];
  
  // Validate custom token address
  useEffect(() => {
    if (isCustomToken && selectedToken && publicClient && ethers.isAddress(selectedToken)) {
      validateCustomToken(selectedToken as string);
    } else if (!isCustomToken) {
      // Reset validation when switching back to fixed tokens
      setCustomTokenValidation(null);
      setCustomTokenBalance(0);
    }
  }, [selectedToken, isCustomToken, publicClient, chainId]);
  
  // Fetch balance for custom token
  useEffect(() => {
    if (isCustomToken && customTokenValidation?.valid && address && publicClient && selectedToken) {
      fetchCustomTokenBalance(selectedToken as string);
    }
  }, [isCustomToken, customTokenValidation?.valid, address, selectedToken, publicClient]);
  
  const validateCustomToken = async (tokenAddress: string) => {
    if (!publicClient || !ethers.isAddress(tokenAddress)) {
      setCustomTokenValidation({ valid: false, error: 'Invalid address format' });
      return;
    }
    
    setIsValidating(true);
    try {
      // Create provider from publicClient
      const provider = new ethers.BrowserProvider(publicClient.transport as any);
      const result = await validateERC20Token(tokenAddress, chainId, provider);
      setCustomTokenValidation(result);
      
      if (result.valid) {
        console.log('[TOKEN_VALIDATION] Valid token:', result.symbol);
      }
    } catch (error: any) {
      console.error('[TOKEN_VALIDATION] Error:', error);
      setCustomTokenValidation({ 
        valid: false, 
        error: error?.message || 'Validation failed' 
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const fetchCustomTokenBalance = async (tokenAddress: string) => {
    if (!publicClient || !address || !customTokenValidation?.valid || !customTokenValidation.decimals) {
      setCustomTokenBalance(0);
      return;
    }
    
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function'
          }
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }) as bigint;
      
      const decimals = customTokenValidation.decimals || 18;
      setCustomTokenBalance(Number(balance) / Math.pow(10, decimals));
    } catch (error) {
      console.error('[CUSTOM_TOKEN] Error fetching balance:', error);
      setCustomTokenBalance(0);
    }
  };
  
  const handleQuickSelect = (tokenKey: keyof typeof BASE_QUICK_SELECT_TOKENS) => {
    const token = BASE_QUICK_SELECT_TOKENS[tokenKey];
    onTokenSelect(token.address);
  };
  
  const handleCustomTokenInput = async (address: string) => {
    setCustomTokenAddress(address);
    
    // Clear previous validation
    if (!address) {
      setCustomTokenValidation(null);
      return;
    }
    
    // Basic format check
    if (!ethers.isAddress(address)) {
      setCustomTokenValidation({ 
        valid: false, 
        error: 'Invalid address format' 
      });
      return;
    }
    
    // If valid format, select it and validate
    onTokenSelect(address);
    // Validation will happen in useEffect when selectedToken changes
  };

  const handleTokenSelect = (token: TokenSymbol | string) => {
    onTokenSelect(token);
    setShowDropdown(false);
  };

  // Get display name for token with native indicator
  const getTokenDisplayName = (tokenSymbol: TokenSymbol) => {
    const token = SUPPORTED_TOKENS[tokenSymbol];
    // NATIVE_DMT shows as "DMT", DMT shows as "WDMT"
    return token.symbol;
  };
  
  // Get current token display info
  const getCurrentTokenInfo = () => {
    if (isCustomToken && customTokenValidation?.valid) {
      return {
        symbol: customTokenValidation.symbol || 'Unknown',
        name: customTokenValidation.name,
        balance: customTokenBalance,
        decimals: customTokenValidation.decimals || 18,
        isNative: false
      };
    } else if (Object.keys(SUPPORTED_TOKENS).includes(selectedToken as string)) {
      const token = SUPPORTED_TOKENS[selectedToken as TokenSymbol];
      return {
        symbol: token.symbol,
        name: token.name,
        balance: sankoBalance,
        decimals: token.decimals,
        isNative: token.isNative
      };
    }
    return {
      symbol: 'Select Token',
      name: '',
      balance: 0,
      decimals: 18,
      isNative: false
    };
  };
  
  const currentTokenInfo = getCurrentTokenInfo();

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Sanko: Fixed token dropdown */}
      {isSanko && (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ fontWeight: 'bold', minWidth: '80px', color: '#ff0000' }}>Token:</label>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={disabled}
            style={{
              padding: '5px 10px',
              border: '2px outset #fff',
              background: '#000000',
              color: '#ff0000',
              cursor: disabled ? 'not-allowed' : 'pointer',
                minWidth: '120px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <img 
                src={SUPPORTED_TOKENS[selectedToken as TokenSymbol]?.logo || '/images/dmt-logo.png'} 
                alt={`${getTokenDisplayName(selectedToken as TokenSymbol)} logo`}
              style={{
                width: '16px',
                height: '16px',
                objectFit: 'contain'
              }}
            />
              {getTokenDisplayName(selectedToken as TokenSymbol)}
            <span style={{ marginLeft: 'auto' }}>▲</span>
          </button>
          
          {showDropdown && !disabled && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              background: '#000000',
              border: '2px outset #fff',
              zIndex: 10,
              minWidth: '120px'
            }}>
                {availableTokens.map(([symbol, token]) => (
                <div
                  key={symbol}
                  onClick={() => handleTokenSelect(symbol as TokenSymbol)}
                  style={{
                    padding: '5px 10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                      fontSize: '12px',
                    color: '#ff0000',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#000000'}
                >
                  <img 
                    src={token.logo} 
                    alt={`${getTokenDisplayName(symbol as TokenSymbol)} logo`}
                    style={{
                      width: '16px',
                      height: '16px',
                      objectFit: 'contain'
                    }}
                  />
                  {getTokenDisplayName(symbol as TokenSymbol)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
      
      {/* Base/Arbitrum: Quick-select buttons + custom input */}
      {supportsCustomTokens && (
        <>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
            <label style={{ fontWeight: 'bold', minWidth: '80px', color: '#ff0000' }}>Token:</label>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {Object.entries(BASE_QUICK_SELECT_TOKENS).map(([key, token]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleQuickSelect(key as keyof typeof BASE_QUICK_SELECT_TOKENS)}
                  disabled={disabled}
                  style={{
                    padding: '5px 10px',
                    border: selectedToken === token.address ? '2px solid #ff0000' : '2px outset #fff',
                    background: selectedToken === token.address ? '#333' : '#000000',
                    color: '#ff0000',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) e.currentTarget.style.background = '#333';
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) e.currentTarget.style.background = selectedToken === token.address ? '#333' : '#000000';
                  }}
                >
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 'bold', minWidth: '80px', color: '#ff0000', fontSize: '12px' }}>Or Custom:</label>
            <input
              type="text"
              value={isCustomToken ? selectedToken : customTokenAddress}
              onChange={(e) => handleCustomTokenInput(e.target.value)}
              placeholder="Enter ERC20 contract address (0x...)"
              disabled={disabled}
              style={{
                padding: '5px',
                border: customTokenValidation && !customTokenValidation.valid && customTokenAddress ? '2px solid #ff0000' : '2px inset #fff',
                background: '#000000',
                color: '#ff0000',
                width: '300px',
                fontSize: '12px'
              }}
            />
            {isValidating && (
              <span style={{ color: '#ff0000', fontSize: '12px' }}>⏳ Validating token...</span>
            )}
            {customTokenValidation && !isValidating && (
              <>
                {customTokenValidation.valid ? (
                  <span style={{ color: '#32CD32', fontSize: '12px', fontWeight: 'bold' }}>
                    ✓ ${customTokenValidation.symbol}
                  </span>
                ) : (
                  <span style={{ color: '#ff0000', fontSize: '12px' }}>
                    ✗ {customTokenValidation.error || 'Invalid token'}
                  </span>
                )}
              </>
            )}
          </div>
          {customTokenValidation && !customTokenValidation.valid && customTokenAddress && !isValidating && (
            <div style={{ color: '#ff0000', fontSize: '11px', marginLeft: '90px', marginTop: '-5px', marginBottom: '5px' }}>
              💡 Make sure you're entering a valid ERC20 token address on {isBase ? 'Base' : 'Arbitrum'}
            </div>
          )}
          
          {isCustomToken && customTokenValidation?.valid && (
            <div style={{ color: '#32CD32', fontSize: '12px', marginLeft: '90px', marginBottom: '5px' }}>
              ✓ {customTokenValidation.name || customTokenValidation.symbol} ({customTokenValidation.decimals} decimals)
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ fontWeight: 'bold', minWidth: '80px', color: '#ff0000' }}>Amount:</label>
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
            background: '#000000',
            color: '#ff0000',
            width: '100px'
          }}
        />
        <span style={{ color: '#ff0000', fontSize: '12px' }}>
          Balance: {isOnSupportedNetwork && (tokenAvailable || (isCustomToken && customTokenValidation?.valid)) 
            ? `${currentTokenInfo.balance.toFixed(2)} ${currentTokenInfo.symbol}` 
            : `Connect to ${NETWORKS.mainnet.name}, ${NETWORKS.base.name}, or ${NETWORKS.arbitrum.name}`}
          {currentTokenInfo.isNative && <span style={{ color: '#ff0000', fontWeight: 'bold' }}> (Native)</span>}
        </span>
      </div>

      {isOnSankoTestnet && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ Switch to Sanko Mainnet - tokens are not available on testnet
        </div>
      )}
      {!isOnSupportedNetwork && !isOnSankoTestnet && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ Switch to {NETWORKS.mainnet.name}, {NETWORKS.base.name}, or {NETWORKS.arbitrum.name} to see token balances
        </div>
      )}
      {!tokenAvailable && !isCustomToken && isOnSupportedNetwork && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          ⚠️ {Object.keys(SUPPORTED_TOKENS).includes(selectedToken as string) ? SUPPORTED_TOKENS[selectedToken as TokenSymbol].symbol : 'Token'} is not available on this network
        </div>
      )}
      {wagerAmount > currentTokenInfo.balance && isOnSupportedNetwork && (tokenAvailable || (isCustomToken && customTokenValidation?.valid)) && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          Insufficient balance. You have {currentTokenInfo.balance.toFixed(2)} {currentTokenInfo.symbol}
          {currentTokenInfo.isNative && <span> (Native)</span>}
        </div>
      )}
      {currentTokenInfo.balance === 0 && isOnSupportedNetwork && (tokenAvailable || (isCustomToken && customTokenValidation?.valid)) && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '5px' }}>
          💡 You have 0 {currentTokenInfo.symbol}
          {currentTokenInfo.isNative && <span> (Native)</span>}
          {isOnSankoMainnet && '. Get tokens from <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer" style={{color: \'#ff0000\'}}>Sanko Bridge</a>'}
        </div>
      )}
    </div>
  );
}; 