import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from 'wagmi';
import { SUPPORTED_TOKENS, type TokenSymbol, NETWORKS } from '../config/tokens';
import { ERC20_ABI } from '../config/abis';

// Helper function to get token address based on network
function getTokenAddress(tokenSymbol: TokenSymbol, chainId: number): string {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  
  // All tokens are only available on mainnet (chain ID 1996)
  // Testnet (chain ID 1992) doesn't have these tokens
  return token.address;
}

// Helper function to check if tokens are available on current network
function areTokensAvailableOnNetwork(chainId: number): boolean {
  return chainId === NETWORKS.mainnet.chainId;
}

export function useTokenBalance(tokenSymbol: TokenSymbol, address?: string) {
  const chainId = useChainId();
  const token = SUPPORTED_TOKENS[tokenSymbol];
  const isNative = token.isNative || false;
  
  // Check if we're on Sanko mainnet (tokens are only available on mainnet)
  const isOnSankoMainnet = chainId === NETWORKS.mainnet.chainId;
  const isOnSankoTestnet = chainId === NETWORKS.testnet.chainId;
  
  // Debug chain detection (only log once per component mount)
  if (tokenSymbol === 'DMT' || tokenSymbol === 'NATIVE_DMT') {
    console.log(`[CHAIN DEBUG] useTokenBalance for ${tokenSymbol}:`, {
      chainId,
      expectedMainnet: NETWORKS.mainnet.chainId,
      expectedTestnet: NETWORKS.testnet.chainId,
      isOnSankoMainnet,
      isOnSankoTestnet,
      address: !!address,
      isNative
    });
  }
  
  const queryEnabled = !!address && isOnSankoMainnet;
  
  // For native tokens (like native DMT), use useBalance hook
  const { data: nativeBalance, isLoading: nativeLoading, error: nativeError } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: queryEnabled && isNative,
    },
  });
  
  // For ERC20 tokens, use useReadContract
  const { data: erc20Balance, isLoading: erc20Loading, error: erc20Error } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: queryEnabled && !isNative,
    },
  });

  // Use appropriate balance based on token type
  const balance = isNative ? nativeBalance?.value : erc20Balance;
  const isLoading = isNative ? nativeLoading : erc20Loading;
  const error = isNative ? nativeError : erc20Error;

  // Log when query is enabled/disabled
  console.log(`[TOKEN BALANCE QUERY] ${tokenSymbol}:`, {
    queryEnabled,
    address: !!address,
    isOnSankoMainnet,
    isNative,
    contractCall: queryEnabled ? (isNative ? 'native balance' : `balanceOf(${address})`) : 'DISABLED'
  });

  // Debug logging
  console.log(`[TOKEN BALANCE] ${tokenSymbol}:`, {
    tokenAddress: token.address,
    userAddress: address,
    chainId,
    isOnSankoMainnet,
    isOnSankoTestnet,
    isNative,
    balance: balance?.toString(),
    balanceFormatted: balance ? Number(balance) / Math.pow(10, token.decimals) : 0,
    isLoading,
    error: error?.message,
    errorDetails: error,
    queryEnabled: !!address && isOnSankoMainnet
  });

  return {
    balance: balance ? Number(balance) / Math.pow(10, token.decimals) : 0,
    balanceWei: balance || BigInt(0),
    isLoading,
    error,
    isOnSankoMainnet,
    isOnSankoTestnet
  };
}

export function useTokenAllowance(tokenSymbol: TokenSymbol, spenderAddress?: string, ownerAddress?: string) {
  const chainId = useChainId();
  const tokenAddress = getTokenAddress(tokenSymbol, chainId);
  
  // Check if we're on Sanko mainnet (tokens are only available on mainnet)
  const isOnSankoMainnet = chainId === NETWORKS.mainnet.chainId;
  const isOnSankoTestnet = chainId === NETWORKS.testnet.chainId;
  
  const { data: allowance, isLoading, error } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress && !!spenderAddress && isOnSankoMainnet,
    },
  });

  return {
    allowance: allowance || BigInt(0),
    allowanceFormatted: allowance ? Number(allowance) / Math.pow(10, SUPPORTED_TOKENS[tokenSymbol].decimals) : 0,
    isLoading,
    error,
    isOnSankoMainnet,
    isOnSankoTestnet
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