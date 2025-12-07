// Contract configuration for ASCII Lawbsters on Base
export const ASCII_LAWBSTER_CONTRACT_ADDRESS = '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2' as const;

// ABI in proper format for viem/wagmi
export const ASCII_LAWBSTER_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: '_receiver', type: 'address', internalType: 'address' },
      { name: '_quantity', type: 'uint256', internalType: 'uint256' },
      { name: '_currency', type: 'address', internalType: 'address' },
      { name: '_pricePerToken', type: 'uint256', internalType: 'uint256' },
      {
        name: '_allowlistProof',
        type: 'tuple',
        internalType: 'struct IDrop.AllowlistProof',
        components: [
          { name: 'proof', type: 'bytes32[]', internalType: 'bytes32[]' },
          { name: 'quantityLimitPerWallet', type: 'uint256', internalType: 'uint256' },
          { name: 'pricePerToken', type: 'uint256', internalType: 'uint256' },
          { name: 'currency', type: 'address', internalType: 'address' },
        ],
      },
      { name: '_data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getActiveClaimConditionId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getClaimConditionById',
    inputs: [{ name: '_conditionId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IClaimCondition.ClaimCondition',
        components: [
          { name: 'startTimestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'maxClaimableSupply', type: 'uint256', internalType: 'uint256' },
          { name: 'supplyClaimed', type: 'uint256', internalType: 'uint256' },
          { name: 'quantityLimitPerWallet', type: 'uint256', internalType: 'uint256' },
          { name: 'merkleRoot', type: 'bytes32', internalType: 'bytes32' },
          { name: 'pricePerToken', type: 'uint256', internalType: 'uint256' },
          { name: 'currency', type: 'address', internalType: 'address' },
          { name: 'metadata', type: 'string', internalType: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSupplyClaimedByWallet',
    inputs: [
      { name: '_conditionId', type: 'uint256', internalType: 'uint256' },
      { name: '_claimer', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: 'supplyClaimedByWallet', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalMinted',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'maxTotalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: '_tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
] as const;

// Claim condition IDs
export const ASCII_LAWBSTER_CLAIM_CONDITION_IDS = {
  PUBLIC: 0,
} as const;

