import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { SUPPORTED_TOKENS, type TokenSymbol, NETWORKS } from '../config/tokens';
import { ERC20_ABI } from '../config/abis';

export function useTokenBalance(tokenSymbol: TokenSymbol, address?: string) {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  const chainId = useChainId();
  
  // Check if we're on a supported Sanko network
  const isOnSankoNetwork = chainId === NETWORKS.testnet.chainId || chainId === NETWORKS.mainnet.chainId;
  
  const { data: balance, isLoading, error } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && isOnSankoNetwork,
    },
  });

  return {
    balance: balance ? Number(balance) / Math.pow(10, token.decimals) : 0,
    balanceWei: balance || BigInt(0),
    isLoading,
    error,
    isOnSankoNetwork
  };
}

export function useTokenAllowance(tokenSymbol: TokenSymbol, spenderAddress?: string, ownerAddress?: string) {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  const chainId = useChainId();
  
  // Check if we're on a supported Sanko network
  const isOnSankoNetwork = chainId === NETWORKS.testnet.chainId || chainId === NETWORKS.mainnet.chainId;
  
  const { data: allowance, isLoading, error } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress && !!spenderAddress && isOnSankoNetwork,
    },
  });

  return {
    allowance: allowance || BigInt(0),
    allowanceFormatted: allowance ? Number(allowance) / Math.pow(10, token.decimals) : 0,
    isLoading,
    error,
    isOnSankoNetwork
  };
}

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const approve = (tokenSymbol: TokenSymbol, spenderAddress: string, amount: bigint) => {
    const token = SUPPORTED_TOKENS[tokenSymbol];
    
    writeContract({
      address: token.address as `0x${string}`,
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