import { formatEther, type PublicClient } from 'viem';
import { ASCII_LAWBSTER_CONTRACT_ADDRESS, ASCII_LAWBSTER_CONTRACT_ABI } from './asciiLawbsterContract';

export interface ClaimCondition {
  id: number;
  name: string;
  price: string;
  quantityLimit: number;
  merkleRoot: string;
  active: boolean;
  isDiscounted?: boolean;
}

/**
 * Determine which claim condition applies to a user
 * All mints are now free (0 ETH)
 */
export async function getClaimConditionForUser(
  publicClient: PublicClient,
  userAddress: string
): Promise<ClaimCondition | null> {
  try {
    const activeConditionId = await publicClient.readContract({
      address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
      abi: ASCII_LAWBSTER_CONTRACT_ABI,
      functionName: 'getActiveClaimConditionId',
    });
    
    const publicCondition = await publicClient.readContract({
      address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
      abi: ASCII_LAWBSTER_CONTRACT_ABI,
      functionName: 'getClaimConditionById',
      args: [activeConditionId],
    });
    const publicPrice = formatEther(publicCondition.pricePerToken as bigint);
    const quantityLimit = Number(publicCondition.quantityLimitPerWallet) || 0;
    
    return {
      id: Number(activeConditionId),
      name: 'Free Mint',
      price: publicPrice, // Will be "0" from contract
      quantityLimit,
      merkleRoot: publicCondition.merkleRoot,
      active: true,
      isDiscounted: false,
    };
    
  } catch (error) {
    console.error('Error getting claim condition:', error);
    return null;
  }
}

/**
 * Get remaining supply for a condition
 */
export async function getRemainingSupply(
  publicClient: PublicClient,
  conditionId: number
): Promise<number> {
  try {
    const condition = await publicClient.readContract({
      address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
      abi: ASCII_LAWBSTER_CONTRACT_ABI,
      functionName: 'getClaimConditionById',
      args: [BigInt(conditionId)],
    });
    const maxClaimable = Number(condition.maxClaimableSupply);
    const supplyClaimed = Number(condition.supplyClaimed);
    return Math.max(0, maxClaimable - supplyClaimed);
  } catch (error) {
    console.error('Error getting remaining supply:', error);
    return 0;
  }
}

/**
 * Get amount already claimed by user for a condition
 */
export async function getClaimedAmount(
  publicClient: PublicClient,
  userAddress: string,
  conditionId: number
): Promise<number> {
  try {
    const claimed = await publicClient.readContract({
      address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
      abi: ASCII_LAWBSTER_CONTRACT_ABI,
      functionName: 'getSupplyClaimedByWallet',
      args: [BigInt(conditionId), userAddress as `0x${string}`],
    });
    return Number(claimed);
  } catch (error) {
    console.error('Error getting claimed amount:', error);
    return 0;
  }
}

