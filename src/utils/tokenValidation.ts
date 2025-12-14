import { ethers } from 'ethers';
import { ERC20_ABI } from '../config/abis';
import { NETWORKS } from '../config/tokens';

export interface TokenValidationResult {
  valid: boolean;
  symbol?: string;
  name?: string;
  decimals?: number;
  error?: string;
}

/**
 * Validates an ERC20 token contract address and fetches metadata
 * Only works on Base/Arbitrum (not Sanko)
 */
export async function validateERC20Token(
  address: string,
  chainId: number,
  provider: ethers.Provider
): Promise<TokenValidationResult> {
  // Only validate on Base/Arbitrum
  if (chainId !== NETWORKS.base.chainId && chainId !== NETWORKS.arbitrum.chainId) {
    return { 
      valid: false, 
      error: 'Custom tokens only supported on Base/Arbitrum' 
    };
  }

  try {
    // Validate address format
    if (!ethers.isAddress(address)) {
      return { valid: false, error: 'Invalid address format' };
    }

    // Check if contract exists
    const code = await provider.getCode(address);
    if (code === '0x') {
      return { valid: false, error: 'Contract does not exist at this address' };
    }

    // Try to read ERC20 functions
    const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
    
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol().catch(() => null),
      tokenContract.name().catch(() => null),
      tokenContract.decimals().catch(() => null)
    ]);

    if (!symbol || decimals === null) {
      return { valid: false, error: 'Not a valid ERC20 token (missing symbol or decimals)' };
    }

    return {
      valid: true,
      symbol: symbol as string,
      name: name as string || undefined,
      decimals: Number(decimals)
    };
  } catch (error: any) {
    console.error('[TOKEN_VALIDATION] Error:', error);
    return { 
      valid: false, 
      error: error?.message || 'Failed to validate token' 
    };
  }
}
