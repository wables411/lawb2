import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from 'wagmi';
import { SUPPORTED_TOKENS, type TokenSymbol, NETWORKS, getTokenAddressForChain } from '../config/tokens';
import { ERC20_ABI } from '../config/abis';

// Helper function to get token address based on network
function getTokenAddress(tokenSymbol: TokenSymbol, chainId: number): string {
  try {
    return getTokenAddressForChain(tokenSymbol, chainId);
  } catch (error) {
    // Only log if it's not a "token not available on chain" error (expected behavior)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('not available on chain')) {
    console.error(`[TOKEN] Error getting address for ${tokenSymbol} on chain ${chainId}:`, error);
    }
    // Fallback to zero address if token not available on chain
    return '0x0000000000000000000000000000000000000000';
  }
}

// Helper function to check if tokens are available on current network
function areTokensAvailableOnNetwork(chainId: number): boolean {
  return chainId === NETWORKS.mainnet.chainId || 
         chainId === NETWORKS.base.chainId || 
         chainId === NETWORKS.arbitrum.chainId;
}

// Helper function to check if a specific token is available on current network
function isTokenAvailableOnChain(tokenSymbol: TokenSymbol, chainId: number): boolean {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  return (token.chains as readonly number[]).includes(chainId);
}

export function useTokenBalance(tokenSymbol: TokenSymbol, address?: string) {
  const chainId = useChainId();
  const token = SUPPORTED_TOKENS[tokenSymbol];
  const isNative = token.isNative || false;
  
  // Check if we're on a supported network
  const isOnSankoMainnet = chainId === NETWORKS.mainnet.chainId;
  const isOnSankoTestnet = chainId === NETWORKS.testnet.chainId;
  const isOnBase = chainId === NETWORKS.base.chainId;
  const isOnArbitrum = chainId === NETWORKS.arbitrum.chainId;
  const isOnSupportedNetwork = isOnSankoMainnet || isOnBase || isOnArbitrum;
  
  // Check if this specific token is available on current chain
  const tokenAvailable = isTokenAvailableOnChain(tokenSymbol, chainId);
  
  // Debug chain detection (only log once per component mount)
  const hasLoggedRef = useRef(false);
  if ((tokenSymbol === 'DMT' || tokenSymbol === 'NATIVE_DMT') && !hasLoggedRef.current) {
    console.log(`[CHAIN DEBUG] useTokenBalance for ${tokenSymbol}:`, {
      chainId,
      expectedMainnet: NETWORKS.mainnet.chainId,
      expectedTestnet: NETWORKS.testnet.chainId,
      isOnSankoMainnet,
      isOnSankoTestnet,
      isOnBase,
      isOnArbitrum,
      isOnSupportedNetwork,
      tokenAvailable,
      address: !!address,
      isNative
    });
    hasLoggedRef.current = true;
  }
  
  const queryEnabled = !!address && isOnSupportedNetwork && tokenAvailable;
  
  // For native tokens (like native DMT), use useBalance hook
  const { data: nativeBalance, isLoading: nativeLoading, error: nativeError } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: queryEnabled && isNative,
    },
  });
  
  // Get token address for current chain (only if token is available, to avoid errors)
  // If token not available, use zero address to prevent contract calls
  const tokenAddress = tokenAvailable ? getTokenAddress(tokenSymbol, chainId) : '0x0000000000000000000000000000000000000000';
  
  // For ERC20 tokens, use useReadContract
  const { data: erc20Balance, isLoading: erc20Loading, error: erc20Error } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: queryEnabled && !isNative && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Use appropriate balance based on token type
  const balance = isNative ? nativeBalance?.value : erc20Balance;
  const isLoading = isNative ? nativeLoading : erc20Loading;
  const error = isNative ? nativeError : erc20Error;

  // Log when query is enabled/disabled (only when there's an error or significant change)
  const lastLogRef = useRef<{error: any, address: string | undefined, queryEnabled: boolean} | null>(null);
  const currentLogState = { error, address, queryEnabled };
  
  if (error || (address && queryEnabled)) {
    // Only log if the state has actually changed
    if (!lastLogRef.current || 
        lastLogRef.current.error !== error ||
        lastLogRef.current.address !== address ||
        lastLogRef.current.queryEnabled !== queryEnabled) {
      
      console.log(`[TOKEN BALANCE QUERY] ${tokenSymbol}:`, {
        queryEnabled,
        address: !!address,
        isOnSankoMainnet,
        isNative,
        contractCall: queryEnabled ? (isNative ? 'native balance' : `balanceOf(${address})`) : 'DISABLED'
      });

      // Debug logging
      console.log(`[TOKEN BALANCE] ${tokenSymbol}:`, {
        tokenAddress: tokenAddress,
        userAddress: address,
        chainId,
        isOnSankoMainnet,
        isOnSankoTestnet,
        isOnBase,
        isOnArbitrum,
        isOnSupportedNetwork,
        tokenAvailable,
        isNative,
        balance: balance?.toString(),
        balanceFormatted: balance ? Number(balance) / Math.pow(10, token.decimals) : 0,
        isLoading,
        error: error?.message,
        errorDetails: error,
        queryEnabled
      });
      
      lastLogRef.current = currentLogState;
    }
  }

  return {
    balance: balance ? Number(balance) / Math.pow(10, token.decimals) : 0,
    balanceWei: balance || BigInt(0),
    isLoading,
    error,
    isOnSankoMainnet,
    isOnSankoTestnet,
    isOnBase,
    isOnArbitrum,
    isOnSupportedNetwork,
    tokenAvailable
  };
}

export function useTokenAllowance(tokenSymbol: TokenSymbol, spenderAddress?: string, ownerAddress?: string) {
  const chainId = useChainId();
  
  // Check if we're on a supported network
  const isOnSankoMainnet = chainId === NETWORKS.mainnet.chainId;
  const isOnSankoTestnet = chainId === NETWORKS.testnet.chainId;
  const isOnBase = chainId === NETWORKS.base.chainId;
  const isOnArbitrum = chainId === NETWORKS.arbitrum.chainId;
  const isOnSupportedNetwork = isOnSankoMainnet || isOnBase || isOnArbitrum;
  const tokenAvailable = isTokenAvailableOnChain(tokenSymbol, chainId);
  
  // Get token address only if available (to avoid errors)
  const tokenAddress = tokenAvailable ? getTokenAddress(tokenSymbol, chainId) : '0x0000000000000000000000000000000000000000';
  
  const { data: allowance, isLoading, error } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress && !!spenderAddress && isOnSupportedNetwork && tokenAvailable && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return {
    allowance: allowance || BigInt(0),
    allowanceFormatted: allowance ? Number(allowance) / Math.pow(10, SUPPORTED_TOKENS[tokenSymbol].decimals) : 0,
    isLoading,
    error,
    isOnSankoMainnet,
    isOnSankoTestnet,
    isOnBase,
    isOnArbitrum,
    isOnSupportedNetwork,
    tokenAvailable
  };
}

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();

  const approve = (tokenSymbol: TokenSymbol, spenderAddress: string, amount: bigint) => {
    const tokenAddress = getTokenAddress(tokenSymbol, chainId);
    
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, amount],
    });
  };

  return {
    approve,
    isPending: isPending || isConfirming,
    error,
    hash
  };
}

export function useAllTokenBalances(address?: string) {
  const [balances, setBalances] = useState<Record<TokenSymbol, number>>({} as Record<TokenSymbol, number>);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setBalances({} as Record<TokenSymbol, number>);
      setIsLoading(false);
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      const newBalances: Record<TokenSymbol, number> = {} as Record<TokenSymbol, number>;
      
      for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
        try {
          // This would need to be implemented with a proper provider
          // For now, we'll set placeholder values
          newBalances[symbol as TokenSymbol] = 0;
        } catch (error) {
          console.error(`Error fetching balance for ${symbol}:`, error);
          newBalances[symbol as TokenSymbol] = 0;
        }
      }
      
      setBalances(newBalances);
      setIsLoading(false);
    };

    fetchBalances();
  }, [address]);

  return { balances, isLoading };
} 