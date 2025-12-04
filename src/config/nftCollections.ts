export const NFT_COLLECTIONS = {
  pixelawbs: {
    address: '0x2d278e95b2fC67D4b27a276807e24E479D9707F6',
    name: 'Pixelawbs',
    chainId: 1, // Ethereum mainnet
    api: 'scatter' as const,
    slug: 'pixelawbs'
  },
  lawbsters: {
    address: '0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42',
    name: 'Lawbsters',
    chainId: 1, // Ethereum mainnet
    api: 'opensea' as const,
    slug: 'lawbsters'
  },
  lawbstarz: {
    address: '0xd7922cd333da5ab3758c95f774b092a7b13a5449',
    name: 'Lawbstarz',
    chainId: 1, // Ethereum mainnet
    api: 'scatter' as const,
    slug: 'lawbstarz'
  },
  halloween_lawbsters: {
    address: '0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97',
    name: 'Halloween Lawbsters',
    chainId: 8453, // Base chain
    api: 'opensea' as const,
    slug: 'a-lawbster-halloween'
  },
  asciilawbs: {
    address: '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2',
    name: 'ASCII Lawbsters',
    chainId: 8453, // Base chain
    api: 'opensea' as const,
    slug: 'asciilawbs'
  }
} as const;

