// Token configuration for Sanko networks
export const SUPPORTED_TOKENS = {
  NATIVE_DMT: {
    symbol: 'DMT',
    name: 'Native DMT',
    address: '0x0000000000000000000000000000000000000000', // Zero address for native DMT
    decimals: 18,
    logo: '/images/dmt-logo.png', // Same logo as ERC-20 DMT
    isNative: true, // Native DMT (like ETH)
    color: '#FF6B35' // DMT brand color
  },
  DMT: {
    symbol: 'DMT',
    name: 'DMT Token',
    address: '0x754cDAd6f5821077d6915004Be2cE05f93d176f8', // Wrapped DMT
    decimals: 18,
    logo: '/images/dmt-logo.png',
    isNative: false, // Wrapped DMT (ERC-20)
    color: '#FF6B35'
  },
  GOLD: {
    symbol: 'GOLD',
    name: 'GOLD',
    address: '0x6F5e2d3b8c5C5c5F9bcB4adCF40b13308e688D4D',
    decimals: 18,
    logo: '/images/gold-logo.png',
    isNative: false,
    color: '#FFD700'
  },
  LAWB: {
    symbol: 'LAWB',
    name: 'LAWB',
    address: '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F',
    decimals: 6,
    logo: '/images/lawb-logo.png',
    isNative: false,
    color: '#8B4513'
  },
  MOSS: {
    symbol: 'MOSS',
    name: 'MOSS',
    address: '0xeA240b96A9621e67159c59941B9d588eb290ef09',
    decimals: 18,
    logo: '/images/moss-logo.png',
    isNative: false,
    color: '#00FF00'
  }
} as const;

export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  testnet: {
    chess: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47'
  },
  mainnet: {
    chess: '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56'
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
  }
} as const; 