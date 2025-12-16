// Token configuration - chain-specific
// Base chain IDs: 8453 (Base Mainnet)
// Arbitrum chain IDs: 42161 (Arbitrum One)
// Sanko chain IDs: 1996 (Mainnet), 1992 (Testnet)

// Token addresses by chain
export const TOKEN_ADDRESSES_BY_CHAIN: Record<number, Record<string, string>> = {
  // Sanko Mainnet (1996)
  1996: {
    NATIVE_DMT: '0x0000000000000000000000000000000000000000',
    DMT: '0x754cDAd6f5821077d6915004Be2cE05f93d176f8',
    GOLD: '0x6F5e2d3b8c5C5c5F9bcB4adCF40b13308e688D4D',
    LAWB: '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F',
    MOSS: '0xeA240b96A9621e67159c59941B9d588eb290ef09',
  },
  // Base Mainnet (8453)
  8453: {
    ETH: '0x0000000000000000000000000000000000000000', // Native ETH
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    GG: '0x000000000000a59351f61B598E8DA953b9e041Ec', // GunGame
    LAWB: '0x7e18298b46A1F2399617cde083Fe11415A2ad15B', // LAWB on Base
    WABLES411: '0xb2ca7ab88b87bd20b81e95aa0135e2b72720f33d', // wables411 token
  },
  // Arbitrum One (42161)
  42161: {
    ETH: '0x0000000000000000000000000000000000000000', // Native ETH
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
  },
};

// Token metadata
export const SUPPORTED_TOKENS = {
  // Sanko tokens
  NATIVE_DMT: {
    symbol: 'DMT',
    name: 'Native DMT',
    decimals: 18,
    logo: '/images/dmt-logo.png',
    isNative: true,
    color: '#FF6B35',
    chains: [1996] // Only on Sanko
  },
  DMT: {
    symbol: 'WDMT',
    name: 'DMT Token',
    decimals: 18,
    logo: '/images/dmt-logo.png',
    isNative: false,
    color: '#FF6B35',
    chains: [1996] // Only on Sanko
  },
  GOLD: {
    symbol: 'GOLD',
    name: 'GOLD',
    decimals: 18,
    logo: '/images/gold-logo.png',
    isNative: false,
    color: '#FFD700',
    chains: [1996] // Only on Sanko
  },
  LAWB: {
    symbol: 'LAWB',
    name: 'LAWB',
    decimals: 6,
    logo: '/images/lawb-logo.png',
    isNative: false,
    color: '#8B4513',
    chains: [1996] // Only on Sanko
  },
  MOSS: {
    symbol: 'MOSS',
    name: 'MOSS',
    decimals: 18,
    logo: '/images/moss-logo.png',
    isNative: false,
    color: '#00FF00',
    chains: [1996] // Only on Sanko
  },
  // Base/Arbitrum tokens
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logo: '/images/eth-logo.png', // You may want to add this
    isNative: true,
    color: '#627EEA',
    chains: [8453, 42161] // Base and Arbitrum
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: '/images/usdc-logo.png', // You may want to add this
    isNative: false,
    color: '#2775CA',
    chains: [8453, 42161] // Base and Arbitrum
  },
  // Base-specific tokens
  GG: {
    symbol: 'GG',
    name: 'GunGame',
    decimals: 18, // TODO: Verify decimals
    logo: '/images/gg-logo.png', // You may want to add this
    isNative: false,
    color: '#FF6B35',
    chains: [8453] // Only on Base
  },
  LAWB_BASE: {
    symbol: 'LAWB',
    name: 'LAWB',
    decimals: 6, // TODO: Verify decimals (Sanko LAWB is 6)
    logo: '/images/lawb-logo.png',
    isNative: false,
    color: '#8B4513',
    chains: [8453] // Only on Base
  },
  WABLES411: {
    symbol: 'wables411',
    name: 'wables411',
    decimals: 18,
    logo: '/images/dmt-logo.png', // TODO: Add wables411 logo if available
    isNative: false,
    color: '#FF6B35',
    chains: [8453] // Only on Base
  },
} as const;

export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

// Helper to get default token for a chain
export function getDefaultTokenForChain(chainId: number): TokenSymbol {
  if (chainId === NETWORKS.mainnet.chainId || chainId === NETWORKS.testnet.chainId) {
    return 'NATIVE_DMT';
  } else if (chainId === NETWORKS.base.chainId) {
    return 'ETH';
  } else if (chainId === NETWORKS.arbitrum.chainId) {
    return 'ETH';
  }
  // Default to NATIVE_DMT for unknown chains (will error if not Sanko, but better than nothing)
  return 'NATIVE_DMT';
}

// Helper to get token address for a specific chain
export function getTokenAddressForChain(tokenSymbol: TokenSymbol, chainId: number): string {
  const addresses = TOKEN_ADDRESSES_BY_CHAIN[chainId];
  if (!addresses) {
    throw new Error(`Chain ${chainId} not supported`);
  }
  const address = addresses[tokenSymbol];
  if (!address) {
    throw new Error(`Token ${tokenSymbol} not available on chain ${chainId}`);
  }
  return address;
}

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  testnet: {
    chess: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47' // Sanko Testnet
  },
  mainnet: {
    chess: '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56' // Sanko Mainnet
  },
  base: {
    chess: '0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11' // ✅ Base Mainnet (Proxy - Implementation: 0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29)
  },
  arbitrum: {
    chess: '0x0000000000000000000000000000000000000000' // TODO: Deploy and update
  }
} as const;

// Network configuration
export const NETWORKS = {
  testnet: {
    chainId: 1992,
    name: 'Sanko Testnet',
    rpcUrl: 'https://sanko-arb-sepolia.rpc.caldera.xyz/http',
    explorer: 'https://testnet.sankoscan.io',
    nativeToken: 'tDMT'
  },
  mainnet: {
    chainId: 1996,
    name: 'Sanko Mainnet',
    rpcUrl: 'https://mainnet.sanko.xyz',
    explorer: 'https://explorer.sanko.xyz',
    nativeToken: 'DMT'
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeToken: 'ETH'
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeToken: 'ETH'
  }
} as const; 