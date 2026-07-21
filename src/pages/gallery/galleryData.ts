// Curated Lawbverse data — the single source of truth for /gallery.
// Static by design: no runtime marketplace APIs, so the page always renders
// and costs nothing in reads/bandwidth. Update this file to grow the system.

export interface EcoLink {
  label: string;
  url: string;
}

export interface Inspiration {
  name: string;
  url?: string;
  note: string; // relevance to this Lawb project
}

export interface Contributor {
  name: string;
  url?: string;
  role: string;
}

export interface TimelineEvent {
  date: string; // YYYY-MM-DD or YYYY-MM
  label: string;
  url?: string;
}

export interface TraitRef {
  trait: string;
  refersTo: string;
  url?: string;
}

export interface Moon {
  id: string;
  name: string;
  kind: 'lore' | 'market' | 'social' | 'tech' | 'art' | 'link';
  blurb?: string;
  url?: string;
}

export interface Planet {
  id: string;
  name: string;
  category: 'collection' | 'token' | 'game' | 'agent' | 'lore' | 'shop';
  image: string;
  color: string;
  chain?: string;
  supply?: string;
  contract?: string;
  launched?: string;
  blurb: string;
  links: EcoLink[];
  inspiredBy?: Inspiration[];
  contributors?: Contributor[];
  traits?: TraitRef[];
  timeline?: TimelineEvent[];
  /** X/Twitter status IDs rendered with react-tweet */
  xPosts?: string[];
  moons: Moon[];
  /** orbit radius in SVG units */
  orbit: number;
  /** planet radius in SVG units */
  size: number;
  /** seconds per revolution */
  speed: number;
  /** starting angle in degrees */
  phase: number;
}

export const SUN = {
  id: 'lawb',
  name: 'LAWB',
  image: '/images/lawb-logo.png',
  tagline: 'there is no meme we lawb you',
  blurb:
    'The Lawbverse: humans controlled by lobsters, minted across four chains since 2023. ' +
    'Everything here orbits the meme. Click a planet to fall down its rabbit hole.',
};

export const PLANETS: Planet[] = [
  {
    id: 'lawbsters',
    name: 'Lawbsters',
    category: 'collection',
    image: '/assets/lawbsters.gif',
    color: '#e03c31',
    chain: 'Ethereum',
    supply: '420',
    contract: '0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42',
    launched: '2023-02',
    blurb:
      '420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A Cigawrette Packs derivative.',
    links: [
      { label: 'OpenSea', url: 'https://opensea.io/collection/lawbsters' },
      {
        label: 'NFTX Vault',
        url: 'https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/info/',
      },
      {
        label: 'Etherscan',
        url: 'https://etherscan.io/address/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42',
      },
    ],
    inspiredBy: [
      {
        name: 'Cigawrette Packs',
        url: 'https://cigawrettepacks.shop',
        note: 'Lawbsters is a Cigawrette Packs derivative — the "seems nice but" lore format and the no-roadmap ethos come straight from it.',
      },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'artist / dev' },
    ],
    timeline: [
      { date: '2023-02', label: 'Lawbsters mint on Ethereum (420 supply)' },
      { date: '2023-03', label: 'NFTX vault opens floor liquidity' },
    ],
    xPosts: ['1620879129850834944'],
    moons: [
      {
        id: 'lawbsters-origin',
        name: 'Origin',
        kind: 'lore',
        blurb:
          'The first Lawb collection: the "human controlled by a lobster" premise every later project riffs on starts here.',
      },
      {
        id: 'redvsblue',
        name: 'Red VS Blue',
        kind: 'art',
        blurb: 'One-off Lawb artifact on Ethereum.',
        url: 'https://opensea.io/item/ethereum/0x46353e0b6b4d9723d253c00acd29adefc05083bb/2',
      },
    ],
    orbit: 150,
    size: 26,
    speed: 60,
    phase: 10,
  },
  {
    id: 'lawbstation',
    name: 'LawbStation',
    category: 'collection',
    image: '/assets/lawbstation.webp',
    color: '#37c4f0',
    chain: 'Solana',
    launched: '2023',
    blurb:
      'Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on MiladyStation technology. LawbStations seem nice but a lobster controlled by MiladyStation will never achieve anything without a roadmap.',
    links: [
      { label: 'Tensor', url: 'https://tensor.trade/trade/lawbstation' },
      { label: 'Magic Eden', url: 'https://magiceden.io/marketplace/lawbstation' },
      { label: 'MiladyStation', url: 'https://miladystation2.net' },
      { label: 'X @lawbstation', url: 'https://x.com/lawbstation' },
    ],
    inspiredBy: [
      { name: 'Milady', url: 'https://remilia.org', note: 'aesthetic north star of the CRT lawbster' },
      { name: 'MiladyStation', url: 'https://miladystation2.net', note: 'the CRT hardware look LawbStation is literally built on' },
      { name: 'Allstarz', url: 'https://allstarz.world', note: 'ecosystem sibling energy' },
      { name: 'Rusty Rollers', note: 'derivative-scene lineage' },
      { name: 'Cigawrette Packs', url: 'https://cigawrettepacks.shop', note: 'the original "seems nice but" lore' },
      { name: 'SPX6900', note: 'meme-coin-era inspiration' },
      { name: 'Radbro', note: 'derivative-scene lineage' },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'artist / dev' },
      { name: 'PortionClub', url: 'https://x.com/portionclub69', role: 'brought to you in part by' },
      { name: 'Mony Corp Group', role: 'brought to you in part by' },
      {
        name: 'Stationthisbot',
        url: 'https://wiki.remilia.org/wiki/Stationthisbot',
        role: 'img2img pass that gave LawbStation its low-poly look (per Remilia Wiki)',
      },
    ],
    timeline: [
      { date: '2023', label: 'LawbStation mints on Solana' },
      {
        date: '2024-03-19',
        label: '$LAWB airdropped to LawbStation holders',
      },
    ],
    moons: [
      {
        id: 'stationthisbot',
        name: 'Stationthisbot',
        kind: 'tech',
        blurb:
          'Early LawbStation art ran through Stationthisbot img2img on a home GPU — canonized on the Remilia Wiki.',
        url: 'https://wiki.remilia.org/wiki/Stationthisbot',
      },
    ],
    orbit: 210,
    size: 24,
    speed: 75,
    phase: 120,
  },
  {
    id: 'lawbstarz',
    name: 'Lawbstarz',
    category: 'collection',
    image: '/assets/lawbstarz.webp',
    color: '#ffd700',
    chain: 'Ethereum',
    supply: '666',
    contract: '0xd7922cd333da5ab3758c95f774b092a7b13a5449',
    launched: '2023-06',
    blurb:
      '☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ LAWBSTARZ IS AN ALLSTARZ DERIVATIVE ☆ LED BY NETWORK SPIRITUALITY ☆ 666 CIGAWRETTEPACKS WERE CONSUMED BY PORTIONCLUB69 AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆',
    links: [
      { label: 'OpenSea', url: 'https://opensea.io/collection/lawbstarz' },
      { label: 'Scatter', url: 'https://www.scatter.art/lawbstarz' },
      { label: 'Allstarz', url: 'https://allstarz.world' },
      {
        label: 'Etherscan',
        url: 'https://etherscan.io/address/0xd7922cd333da5ab3758c95f774b092a7b13a5449',
      },
    ],
    inspiredBy: [
      {
        name: 'Allstarz',
        url: 'https://allstarz.world',
        note: 'Lawbstarz is an Allstarz derivative — 666 supply, star iconography, PFP energy.',
      },
      {
        name: 'Remilia Corp',
        url: 'https://remilia.org',
        note: 'led by network spirituality.',
      },
      {
        name: 'Cigawrette Packs',
        url: 'https://cigawrettepacks.shop',
        note: '666 packs consumed during creation of v1 (allegedly).',
      },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'artist / dev' },
      { name: 'PortionClub69', url: 'https://x.com/portionclub69', role: 'and friends' },
    ],
    timeline: [
      { date: '2023-06-14', label: 'Lawbstarz drops — 666 lobsters dripped in butter' },
    ],
    xPosts: ['1669009492007354369'],
    traits: [
      {
        trait: 'Butter drip',
        refersTo: 'The collection\'s signature — every Lawbstar is dripped in butter.',
      },
      {
        trait: 'Hotel room / DJ set',
        refersTo: 'Lawbstarz music-NFT scenes: the hotel room and the DJ set.',
      },
    ],
    moons: [
      {
        id: 'lawbstarz-music',
        name: 'Music NFT',
        kind: 'art',
        blurb: 'LAWBSTARZ IS A MUSIC NFT — each one ships with sound.',
      },
      {
        id: 'lawbstarz-hijack',
        name: 'Cargo-ship hijacking',
        kind: 'lore',
        blurb:
          'The lore drop: lawbsters linked to "February\'s Cigawrette Packs cargo ship hijacking."',
        url: 'https://x.com/wables411/status/1669009492007354369',
      },
    ],
    orbit: 270,
    size: 28,
    speed: 90,
    phase: 230,
  },
  {
    id: 'halloween',
    name: 'A Lawbster Halloween',
    category: 'collection',
    image: '/assets/lawbsterhalloween.webp',
    color: '#ff7518',
    chain: 'Base',
    supply: '420',
    contract: '0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97',
    launched: '2023-10',
    blurb:
      'a Lawbster Halloween party seems nice but a group of what seems to be humans controlled by lobsters just hijacked the Spirit Halloween Superstore.',
    links: [
      { label: 'OpenSea', url: 'https://opensea.io/collection/a-lawbster-halloween' },
      {
        label: 'BaseScan',
        url: 'https://basescan.org/address/0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97',
      },
    ],
    inspiredBy: [
      {
        name: 'Spirit Halloween',
        note: 'the hijacked superstore — seasonal Americana as lore canvas.',
      },
    ],
    contributors: [
      { name: 'wables.eth', url: 'https://www.tiktok.com/@wables.eth', role: 'artist / dev' },
      { name: 'PC69', url: 'https://x.com/portionclub69', role: 'via @PC69' },
      { name: 'Zora', url: 'https://zora.co', role: 'minted on @ourzora' },
    ],
    timeline: [
      { date: '2023-10', label: 'Halloween Lawbsters mint on Zora (Base)' },
    ],
    moons: [
      {
        id: 'halloween-tiktok',
        name: 'TikTok drop',
        kind: 'social',
        blurb: '"420 lawbsters hijacked a spirit halloween superstore 🦞🎃 minting rn on @ourzora via @PC69"',
        url: 'https://www.tiktok.com/@wables.eth/video/7295660710644682027',
      },
    ],
    orbit: 330,
    size: 22,
    speed: 105,
    phase: 320,
  },
  {
    id: 'nexus',
    name: 'LawbNexus',
    category: 'collection',
    image: '/assets/nexus.webp',
    color: '#b57edc',
    chain: 'Solana',
    supply: '1000',
    blurb:
      '1000 Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana.',
    links: [
      { label: 'Tensor', url: 'https://tensor.trade/trade/lawbnexus' },
      { label: 'Magic Eden', url: 'https://magiceden.io/marketplace/lawbnexus' },
      { label: 'X @lawbnexus', url: 'https://x.com/lawbnexus' },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'artist / dev' },
    ],
    moons: [
      {
        id: 'nexus-uhd',
        name: 'XUHD',
        kind: 'art',
        blurb: 'Xtra Ultra High Definition: the anti-lowpoly counterpoint to LawbStation.',
      },
    ],
    orbit: 390,
    size: 22,
    speed: 120,
    phase: 60,
  },
  {
    id: 'lawb-token',
    name: '$LAWB',
    category: 'token',
    image: '/images/lawb-logo.png',
    color: '#8B4513',
    chain: 'Solana · Base · Arbitrum · Sanko',
    launched: '2024-03-15',
    blurb:
      '$lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap. Token created 03.15.24 on pump.fun, airdropped to LawbStation holders 03.19.24. Now multichain across Solana, Base, Arbitrum, and Sanko. THERE IS NO MEME WE $LAWB YOU.',
    links: [
      {
        label: 'pump.fun',
        url: 'https://pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
      },
      {
        label: 'Dexscreener',
        url: 'https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep',
      },
      { label: 'Purity Finance', url: 'https://purity.finance/lawb' },
      { label: 'Portal Bridge (SOL→ARB)', url: 'https://portalbridge.com' },
      { label: 'Sanko Bridge (ARB→SANKO)', url: 'https://sanko.xyz/bridge' },
    ],
    timeline: [
      { date: '2024-03-15', label: '$LAWB created on pump.fun (Solana)' },
      { date: '2024-03-19', label: 'Airdropped to LawbStation holders' },
      { date: '2024', label: 'Bridged multichain: Base, Arbitrum, Sanko (DMT)' },
      { date: '2025', label: 'Becomes a Lawb Chess wager token on Base' },
    ],
    moons: [
      {
        id: 'lawb-sol',
        name: 'Solana',
        kind: 'tech',
        blurb: 'Original mint: 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
        url: 'https://pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
      },
      {
        id: 'lawb-base',
        name: 'Base',
        kind: 'tech',
        blurb: '0x7e18298b46A1F2399617cde083Fe11415A2ad15B',
        url: 'https://basescan.org/token/0x7e18298b46A1F2399617cde083Fe11415A2ad15B',
      },
      {
        id: 'lawb-arb',
        name: 'Arbitrum',
        kind: 'tech',
        blurb: '0x741f8FbF42485E772D97f1955c31a5B8098aC962',
        url: 'https://arbiscan.io/token/0x741f8FbF42485E772D97f1955c31a5B8098aC962',
      },
      {
        id: 'lawb-sanko',
        name: 'Sanko',
        kind: 'tech',
        blurb: '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F',
        url: 'https://explorer.sanko.xyz/token/0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F',
      },
    ],
    orbit: 100,
    size: 30,
    speed: 45,
    phase: 280,
  },
  {
    id: 'pixelawbs',
    name: 'Pixelawbs',
    category: 'collection',
    image: '/assets/pixelawb.png',
    color: '#7fdb6a',
    chain: 'Ethereum',
    supply: '2222',
    contract: '0x2d278e95b2fC67D4b27a276807e24E479D9707F6',
    launched: '2025',
    blurb: '2222 Pixelated Lawbsters inspired by PixeladyMaker.',
    links: [
      { label: 'Scatter', url: 'https://www.scatter.art/collection/pixelawbs' },
      { label: 'OpenSea', url: 'https://opensea.io/collection/pixelawbsters' },
      { label: 'PixeladyMaker', url: 'https://pixeladymaker.net' },
      {
        label: 'Etherscan',
        url: 'https://etherscan.io/address/0x2d278e95b2fC67D4b27a276807e24E479D9707F6',
      },
    ],
    inspiredBy: [
      {
        name: 'Pixelady Maker',
        url: 'https://pixeladymaker.net',
        note: 'the pixel-art treatment Pixelawbs applies to the lawbster.',
      },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'artist / dev' },
      { name: 'Scatter', url: 'https://www.scatter.art', role: 'mint platform (MS2-priced list)' },
    ],
    moons: [
      {
        id: 'pixelawbs-mint',
        name: 'Mint on lawb.xyz',
        kind: 'market',
        blurb: 'Minted straight from the Win98 desktop via the Scatter API — MS2-priced allowlist included.',
        url: 'https://lawb.xyz',
      },
    ],
    orbit: 450,
    size: 24,
    speed: 140,
    phase: 170,
  },
  {
    id: 'asciilawbs',
    name: 'ASCII Lawbsters',
    category: 'collection',
    image: '/assets/asciilawb.GIF',
    color: '#33ff33',
    chain: 'Base',
    supply: '420',
    contract: '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2',
    launched: '2025',
    blurb:
      '420 ascii lawbsters inspired by ascii milady, milady, cigawrette packs, allstarz and rusty rollers. brought to you in part by portion club.',
    links: [
      { label: 'OpenSea', url: 'https://opensea.io/collection/asciilawbs' },
      {
        label: 'BaseScan',
        url: 'https://basescan.org/address/0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2',
      },
    ],
    inspiredBy: [
      { name: 'ASCII Milady', url: 'https://www.scatter.art/ascii-milady', note: 'the text-art rendering approach.' },
      { name: 'Milady', url: 'https://remilia.org', note: 'always.' },
      { name: 'Cigawrette Packs', url: 'https://cigawrettepacks.shop', note: 'lineage.' },
      { name: 'Allstarz', url: 'https://allstarz.world', note: 'lineage.' },
      { name: 'Rusty Rollers', note: 'lineage.' },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'artist / dev' },
      { name: 'Portion Club', url: 'https://x.com/portionclub69', role: 'brought to you in part by' },
    ],
    moons: [
      {
        id: 'ascii-terminal',
        name: 'Text art',
        kind: 'art',
        blurb: 'The lawbster reduced to characters — green-on-black terminal aesthetics on Base.',
      },
    ],
    orbit: 510,
    size: 22,
    speed: 160,
    phase: 300,
  },
  {
    id: 'clawb',
    name: 'Clawb',
    category: 'agent',
    image: '/assets/0059_1.gif',
    color: '#ff6b35',
    chain: 'Base',
    launched: '2025',
    blurb:
      'Clawb is an autonomous agent — the first autonomous Lawbster. A white-hearted cypherpunk lobster spreading lawb: 24/7 stream on retake.tv/clawb, reasons on Claude, renders art on Noema, takes voice calls from viewers, deploys tokens on Base. there is no meme i lawb you.',
    links: [
      { label: 'Clawb TV (retake.tv)', url: 'https://retake.tv/clawb' },
      { label: 'X @clawblawb', url: 'https://x.com/clawblawb' },
      { label: 'Farcaster @clawb', url: 'https://warpcast.com/clawb' },
      {
        label: '$CLAWB on BaseScan',
        url: 'https://basescan.org/token/0x26a43bd8a28a0423afb5725b8242ec0a40947b07',
      },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'creator / operator' },
      { name: 'OpenClaw stack', role: 'agent framework Clawb runs on' },
    ],
    timeline: [
      { date: '2025', label: 'Clawb goes live on retake.tv — 24/7 autonomous stream' },
      { date: '2025', label: '$CLAWB token deploys on Base' },
      { date: '2025', label: 'Clawb TV ad space goes on-chain (24h rotation auctions)' },
    ],
    moons: [
      {
        id: 'clawb-tv',
        name: 'Clawb TV',
        kind: 'social',
        blurb:
          '24/7 stream with on-chain ad slots: 0.01 ETH one-time plays, 24h rotation auctions, every commercial break exactly 3 videos.',
        url: 'https://retake.tv/clawb',
      },
      {
        id: 'clawb-token',
        name: '$CLAWB',
        kind: 'tech',
        blurb: '0x26a43bd8a28a0423afb5725b8242ec0a40947b07 — Clawb\'s own token on Base.',
        url: 'https://basescan.org/token/0x26a43bd8a28a0423afb5725b8242ec0a40947b07',
      },
    ],
    orbit: 570,
    size: 26,
    speed: 185,
    phase: 40,
  },
  {
    id: 'chess',
    name: 'Lawb Chess',
    category: 'game',
    image: '/assets/chessicon.png',
    color: '#c0c0c0',
    chain: 'Base',
    blurb:
      'Lawb Chess Beta 3000 — Win98-styled chess with PvP token wagers on Base (ETH, USDC, $LAWB, $CLAWB) and a Stockfish AI to practice against. Blue moves first.',
    links: [
      { label: 'Play', url: 'https://lawb.xyz/chess' },
      {
        label: 'LAWBCHESS3000 contract',
        url: 'https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11',
      },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'dev' },
    ],
    timeline: [
      { date: '2024', label: 'Lawb Chess launches with Sanko wagers' },
      { date: '2025', label: 'Base becomes the primary wager chain' },
    ],
    moons: [
      {
        id: 'chess-pieces',
        name: 'Piece sets',
        kind: 'art',
        blurb: 'Boards and pieces skinned with LawbStation and Pixelawbs art.',
      },
    ],
    orbit: 630,
    size: 20,
    speed: 210,
    phase: 200,
  },
  {
    id: 'reefrun',
    name: 'Reef Run',
    category: 'game',
    image: '/assets/reef-arcade.svg',
    color: '#2ee6ff',
    blurb:
      'Endless underwater runner in Three.js: pick Clawb, Milady, or Radbro, dodge jellyfish and mines, chase peptides, and survive the reef. Score is survival time.',
    links: [{ label: 'Play', url: 'https://lawb.xyz/arcade' }],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'dev / art direction' },
    ],
    moons: [
      {
        id: 'reefrun-characters',
        name: 'Characters',
        kind: 'art',
        blurb:
          'Clawb (oxygen 5 — lobsters breathe underwater), Milady (speed 5), Radbro (armor 5).',
      },
    ],
    orbit: 690,
    size: 20,
    speed: 240,
    phase: 340,
  },
  {
    id: 'lore',
    name: 'Lawb Lore',
    category: 'lore',
    image: '/images/lawblore.gif',
    color: '#f5deb3',
    blurb:
      'The connective tissue: lore NFTs, the meme generator, Meme Depot, and the imageboard where lawbsters get lawbed.',
    links: [
      { label: 'Lawb Lore on OpenSea', url: 'https://opensea.io/collection/lawb-lore' },
      { label: 'Meme Depot', url: 'https://memedepot.com/d/lawb' },
      { label: 'Miladychan thread', url: 'https://boards.miladychan.org/milady/33793' },
      { label: 'UwU LAWB memoji', url: 'https://uwu.pro/memoji/ulawb' },
    ],
    moons: [
      {
        id: 'meme-generator',
        name: 'Meme Generator',
        kind: 'art',
        blurb: 'LAWB MEME MAKER — sticker canvas on lawb.xyz; share to X, Telegram, Farcaster.',
        url: 'https://lawb.xyz',
      },
      {
        id: 'miladychan',
        name: 'Miladychan',
        kind: 'social',
        blurb:
          'Realtime imageboard in the spirit of early-00s anon culture. Click to be lawbed.',
        url: 'https://boards.miladychan.org/milady/33793',
      },
      {
        id: 'lawbshop',
        name: 'Lawb.Shop',
        kind: 'market',
        blurb: 'Physical lawb: merch at store.fun/lawbshop.',
        url: 'https://store.fun/lawbshop',
      },
    ],
    orbit: 750,
    size: 22,
    speed: 275,
    phase: 90,
  },
];

/** Chronological ecosystem timeline, derived at module load from planet timelines. */
export const ECOSYSTEM_TIMELINE: (TimelineEvent & { planetId: string; planetName: string })[] =
  PLANETS.flatMap((p) =>
    (p.timeline ?? []).map((t) => ({ ...t, planetId: p.id, planetName: p.name }))
  ).sort((a, b) => a.date.localeCompare(b.date));
