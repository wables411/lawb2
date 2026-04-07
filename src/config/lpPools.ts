/** Meteora DLMM pool: CLAWB / LAWB (Solana). */
export const METEORA_CLAWB_LAWB_POOL = 'AVoLSxAV41A2estUDUkV4yCM9GJ7dM7V2A57jNtoaoWD';

/** Uniswap V3 NonfungiblePositionManager on Base (ERC-721 LP positions). */
export const BASE_UNISWAP_V3_POSITION_MANAGER = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as const;

/** Uniswap v4 PositionManager on Base (ERC-721; CLAWB pools often use native ETH + CLAWB). */
export const BASE_UNISWAP_V4_POSITION_MANAGER = '0x7C5f5A4bBd8fD63184577525326123B519429bDc' as const;

/** Approx. first block where v4 PositionManager bytecode exists on Base (binary-searched). */
export const BASE_UNISWAP_V4_FIRST_BLOCK = 25_350_993n;

/** $CLAWB on Base mainnet. */
export const BASE_CLAWB_TOKEN = '0x26a43bd8a28a0423afb5725b8242ec0a40947b07' as const;

/** WETH on Base. */
export const BASE_WETH = '0x4200000000000000000000000000000000000006' as const;
