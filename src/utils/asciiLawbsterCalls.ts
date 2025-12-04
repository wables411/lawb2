import { parseEther, type Address } from 'viem';
import { ASCII_LAWBSTER_CONTRACT_ADDRESS, ASCII_LAWBSTER_CONTRACT_ABI } from './asciiLawbsterContract';
import type { ClaimCondition } from './asciiLawbsterClaimConditions';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

interface CreateMintCallsParams {
  userAddress: string;
  quantity: number;
  condition: ClaimCondition;
}

/**
 * Create mint transaction calls for wagmi
 * Free mint - no ETH sent, no Merkle proof needed
 */
export function createMintCalls({
  userAddress,
  quantity,
  condition,
}: CreateMintCallsParams): Array<{
  address: Address;
  abi: typeof ASCII_LAWBSTER_CONTRACT_ABI;
  functionName: 'claim';
  args: [
    Address, // _receiver
    bigint, // _quantity
    Address, // _currency
    bigint, // _pricePerToken
    {
      proof: `0x${string}`[];
      quantityLimitPerWallet: bigint;
      pricePerToken: bigint;
      currency: Address;
    }, // _allowlistProof
    `0x${string}` // _data
  ];
  value: bigint;
}> {
  if (!condition || quantity <= 0) {
    return [];
  }

  const receiver = userAddress.toLowerCase() as Address;
  const currency = ZERO_ADDRESS;
  const pricePerToken = parseEther(condition.price); // Will be 0 ETH
  const totalValue = 0n; // No ETH sent for free mint

  // Free mint with empty proof (no Merkle proof = lower gas!)
  const allowlistProof = {
    proof: [], // Empty proof = public mint
    quantityLimitPerWallet: BigInt(0), // No limit
    pricePerToken, // 0 ETH
    currency,
  };

  return [
    {
      address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
      abi: ASCII_LAWBSTER_CONTRACT_ABI,
      functionName: 'claim' as const,
      args: [
        receiver,
        BigInt(quantity),
        currency,
        pricePerToken,
        allowlistProof,
        '0x' as `0x${string}`,
      ],
      value: totalValue, // 0 ETH
    },
  ];
}

