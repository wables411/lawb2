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

export interface StoryBeat {
  date: string;
  text: string;
  /** local image under public/ (downloaded, small) */
  image?: string;
  /** hotlinked mp4 on X's CDN — costs us no bandwidth */
  video?: string;
  /** the original post */
  postUrl: string;
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
  /** scraped lore threads rendered as a news broadcast */
  story?: StoryBeat[];
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
    'The Lawbverse: lawbsters seem nice, but a human run by a lobster will never achieve ' +
    'anything without a roadmap. Everything here orbits the meme. Click a planet to fall ' +
    'down its rabbit hole.',
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
    launched: '2023-02-01',
    blurb:
      'The first lawbster PFP collection: 420 Neochibi lobsters. "Lawbsters seem nice but a human run by a lobster will never achieve anything without a roadmap" — first said in a Cigawrette Packs group chat on X, then canonized as the origin quote. An art project by wables, originally modeled off of the lobster emoji and compiled using HashLips. A Cigawrette Packs derivative.',
    links: [
      { label: 'OpenSea', url: 'https://opensea.io/collection/lawbsters' },
      { label: 'Traits on OpenSea', url: 'https://opensea.io/collection/lawbsters/traits' },
      {
        label: 'Etherscan',
        url: 'https://etherscan.io/address/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42',
      },
    ],
    inspiredBy: [
      {
        name: 'Cigawrette Packs',
        url: 'https://cigawrettepacks.shop',
        note: 'the derivative parent — the origin quote was first sent in a Cigawrette Packs group chat, and the Cigawrette eyes trait pack is leased into the collection.',
      },
      { name: 'Remilia Corporation', url: 'https://remilia.org', note: 'Neochibi PFP lineage.' },
      { name: 'Allstarz', url: 'https://allstarz.world', note: 'inspiration; Allstarz outfits appear in the traits.' },
      { name: 'Rusty Rollers', note: 'inspiration; their automobiles appear in the traits.' },
      { name: 'The lobster emoji', note: 'the original model for the lawbster.' },
    ],
    contributors: [
      { name: 'wables', url: 'https://x.com/wables411', role: 'artist — Lawbsters is an art project by wables' },
      { name: 'Portion Club DAO', url: 'https://x.com/portionclub69', role: 'deployed the collection on Ethereum via Zora' },
      { name: 'Pappachaga', role: 'leased the Cigawrette eyes trait pack' },
      { name: 'HashLips', role: 'generative art engine used to compile the collection' },
    ],
    traits: [
      { trait: 'Origin story quote', refersTo: 'the group-chat message itself, preserved as a trait.' },
      { trait: 'Bay Bridge, Sutro Baths, Pluto, corners of the ocean', refersTo: 'places — San Francisco landmarks, space, and the sea.' },
      { trait: 'Butter, mayonnaise, New England lobster rolls, Rhea\'s Deli, barbeque', refersTo: 'food.' },
      { trait: 'Burberry, Rolex watches, roses, an eye patch, Sunday church hats, Allstarz outfits', refersTo: 'fashion.' },
      { trait: 'Final Fantasy 7, Nouns DAO, Pixelady Maker, Rusty Rollers automobiles, bootleg SpongeBob coffee mugs', refersTo: 'culture.' },
      { trait: 'The Glock, bail bonds, cigarettes as a pastime', refersTo: 'vice.' },
      { trait: 'Photography', refersTo: 'photos taken by wables 2015–2022 of subjects and nightlife scenery.' },
    ],
    timeline: [
      {
        date: '2023-02-01',
        label: 'Portion Club DAO deploys Lawbsters on Ethereum via Zora — 420 mint at 0.015 ETH',
      },
    ],
    story: [
      {
        date: '2023-02-01',
        text: 'The following 🧵 has been transcripted from a live news broadcast: "Just in, breaking news coming out of the high seas. A cargo ship has been hijacked by a group of degenerate lobsters, taking hostages & demanding a ransom. The situation is ongoing and authorities are scrambling"',
        image: '/images/lore/lawbsters-news-1.jpg',
        postUrl: 'https://x.com/wables411/status/1620879129850834944',
      },
      {
        date: '2023-02-02',
        text: 'Broadcast footage from the scene.',
        image: '/images/lore/lawbsters-news-2.jpg',
        video:
          'https://video.twimg.com/ext_tw_video/1621249835465834496/pu/vid/1280x720/b64L7f6LcmYRWBRX.mp4?tag=12',
        postUrl: 'https://x.com/wables411/status/1621250054362398721',
      },
      {
        date: '2023-02-03',
        text: '"Breaking news: In a shocking development, a group of four hundred and twenty Lawbsters, scientist explain to be humans run by lobsters, have hijacked an imported Cigawrette Packs cargo ship, taking hostages and making demands."',
        image: '/images/lore/lawbsters-news-3.jpg',
        postUrl: 'https://x.com/wables411/status/1621540115234562049',
      },
      {
        date: '2023-02-07',
        text: '"Breaking News: 🦞 In a surprising turn of events, all 420 lawbsters have released the hostages and evacuated the @cigawrettepacks cargo ship."',
        image: '/images/lore/lawbsters-news-4.jpg',
        postUrl: 'https://x.com/wables411/status/1622955895436222464',
      },
    ],
    moons: [
      {
        id: 'lawbsters-origin',
        name: 'Origin',
        kind: 'lore',
        blurb:
          'The founding quote left a Cigawrette Packs group chat and became a fictional news story, told across a four-part thread — see the posts below.',
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
    supply: '420',
    launched: '2023-12-23',
    blurb:
      'Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on MiladyStation technology. LawbStations seem nice but a Lawbster controlled by MiladyStation will never achieve anything without a roadmap.',
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
      { date: '2023', label: 'Early LawbStation art made with Stationthisbot img2img' },
      {
        date: '2023-12-23',
        label: 'Launch: free mint for collected SOL addresses until 7AM PST, then public at 0.5 SOL (420 supply)',
      },
      { date: '2023-12-29', label: 'Mints out on Solana' },
    ],
    story: [
      {
        date: '2023-12-23',
        text: '"LawbStations seem nice but a Lawbster controlled by @MiladyStation will never achieve anything without a roadmap. if you sent me a sol address in the last week you have until 7am pst to take advantage of free mint, now live on @solana"',
        image: '/images/lore/lawbstation-launch-1.jpg',
        video:
          'https://video.twimg.com/ext_tw_video/1738381723355021312/pu/vid/avc1/720x720/vRcSOgjws5d9HrBf.mp4?tag=12',
        postUrl: 'https://x.com/wables411/status/1738383628768559477',
      },
      {
        date: '2023-12-23',
        text: '"collection now available — PUBLIC MINT: 7AM PST 12.23.23, 0.5 SOL, SUPPLY: 420. low poly Lawbsters viewed through various cathode-ray tubes built on MiladyStation technology. Brought to you in part by PortionClub and MonyCorpGroup."',
        image: '/images/lore/lawbstation-launch-2.jpg',
        postUrl: 'https://x.com/wables411/status/1738383630689575406',
      },
      {
        date: '2023-12-28',
        text: '"Reject Modernity. Embrace Lawbstation." — petr0vich\'s meme, quote-posted into canon.',
        image: '/images/lore/lawbstation-taifa.jpg',
        postUrl: 'https://x.com/Phucking_Taifa/status/1740607036721918385',
      },
      {
        date: '2023-12-29',
        text: '"it\'s recently been brought to my attention that LawbStation has minted tf out on Solana 🥹 🫡 thank you everyone for the support ⚙️ built on @MiladyStation technology — seeya on Magic Eden 🦞"',
        image: '/images/lore/lawbstation-mintout.jpg',
        video:
          'https://video.twimg.com/ext_tw_video/1740853528279781376/pu/vid/avc1/960x536/jEL4TzuJFgifMJnF.mp4?tag=12',
        postUrl: 'https://x.com/wables411/status/1740853549335273597',
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
    orbit: 330,
    size: 24,
    speed: 105,
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
    launched: '2023-05-31',
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
      { date: '2023-05-31', label: 'LAWBSTARZ contract deploys via Scatter' },
      { date: '2023-06-14', label: 'The lore broadcast thread drops; lobster-list presale opens at midnight' },
      {
        date: '2023-06-15',
        label: 'Presale: free, 1 per wallet, for holders of Allstarz, Milady, Cigawrette Packs, PortionClub69, Lawbsters, Milady Aura Petz',
      },
      { date: '2023-06-19', label: 'Public mint at 0.02 ETH — sells out' },
    ],
    story: [
      {
        date: '2023-06-14',
        text: 'The following 🧵 has been transcripted from a live news broadcast: Anchor: "Good evening, viewers. Tonight, we embark on an extraordinary journey that defies rational explanation. It all began with February\'s Cigawrette Packs cargo ship hijacking, little did we know that the.."',
        image: '/images/lore/lawbstarz-news-1.jpg',
        video:
          'https://video.twimg.com/ext_tw_video/1669009292094226441/pu/vid/1280x720/6qwNQfuafX1JVTl6.mp4?tag=12',
        postUrl: 'https://x.com/wables411/status/1669009492007354369',
      },
      {
        date: '2023-06-14',
        text: '"..ripple effects would extend far beyond. During this years \'Eth Denver\' event, a group of young adults known as the Allstarz found themselves at a pivotal crossroads. They were en route to provide speakers for Milady Rave Denver when an enigmatic sign caught their attention.."',
        image: '/images/lore/lawbstarz-news-2.jpg',
        postUrl: 'https://x.com/wables411/status/1669009500861530114',
      },
      {
        date: '2023-06-14',
        text: '"On the darkened highway, a radiant Red Lobster billboard beckoned them with promises of a rare culinary delight - the Lobster Burrito. Intrigued, they followed the call of this luminescent beacon, venturing into the depths of an ordinary Red Lobster restaurant.."',
        image: '/images/lore/lawbstarz-news-3.jpg',
        postUrl: 'https://x.com/wables411/status/1669009506905509890',
      },
      {
        date: '2023-06-14',
        text: '"Inside, they savored the tantalizing flavors of the Lobster Burrito, unaware of the mystifying journey that awaited them. After consuming this seemingly innocent dish, the Allstarz were struck by what seemed to be severe food poisoning. Besides not ever making it to Milady Rave Denver, what transpired overnight surpassed the boundaries of reason. With the dawn\'s first light, the Allstarz awakened to a bewildering transformation. They had become the Lawbstarz, what scientists are describing as an Allstar controlled by a lobster.."',
        image: '/images/lore/lawbstarz-news-5.jpg',
        video:
          'https://video.twimg.com/ext_tw_video/1669009510026088448/pu/vid/720x720/fsa1nhxvjC5b8cJr.mp4?tag=12',
        postUrl: 'https://x.com/wables411/status/1669009608906792960',
      },
      {
        date: '2023-06-14',
        text: '"A convergence of musical talent and lobster-like instincts. A haze of confusion shrouded their memories, leaving them uncertain of how they arrived at their hotel after that fateful meal.."',
        image: '/images/lore/lawbstarz-news-6.jpg',
        postUrl: 'https://x.com/wables411/status/1669009622978682881',
      },
      {
        date: '2023-06-14',
        text: '"As investigations unfold, suspicion turns towards the cook (lobster #57), an enigmatic figure with an attitude. Rumors abound that his past involvement in the cigarette cargo ship hijacking was not a mere coincidence. Allegedly, since being hired on at the restaurant chain he concocted the transformative Lobster Burrito 🌯 with a motive that remains shrouded in secrecy."',
        image: '/images/lore/lawbstarz-news-7.jpg',
        postUrl: 'https://x.com/wables411/status/1669009637704867842',
      },
      {
        date: '2023-06-14',
        text: 'Cook (lobster #57): "Yes, I created the infamous Lobster 🌯. And yes, I may have some skeletons in my closet. But I can assure you, I had no idea of the consequences it would unleash upon those Allstarz 🌟 Simply collateral damage in our grand plan." Anchor: "But, why?!" Cook: "Lol strength in #\'s.."',
        image: '/images/lore/lawbstarz-news-9.jpg',
        postUrl: 'https://x.com/wables411/status/1669009649562161152',
      },
      {
        date: '2023-06-14',
        text: '"From the captivating allure of the Red Lobster sign to the emergence of the Lawbstarz, this story continues to confound us all. Stay tuned as we dig deeper into this enigmatic saga, where music and the mysteries of the sea collide."',
        image: '/images/lore/lawbstarz-news-10.jpg',
        postUrl: 'https://x.com/wables411/status/1669009662065414144',
      },
      {
        date: '2023-06-14',
        text: 'The mint announcement: pc69.xyz/lawbstarz, minting on @scatter_art. Presale 12AM 06.15.23, free, limit 1 per wallet to holders of Allstarz, Milady Maker, Cigawrette Packs, PortionClub69, Lawbsters, and Milady Aura Petz. Public 12AM 06.19.23 at 0.02 ETH.',
        image: '/images/lore/lawbstarz-news-11.jpg',
        postUrl: 'https://x.com/wables411/status/1669009675474571265',
      },
      {
        date: '2023-06-26',
        text: 'Postscript: "for only .0756 eth you or a loved one could single handedly raise lawbstarz floor to .02 🦞🌟" — "666x LAWBSTARZ 🦞🌟 DRIPPED IN BUTTER 🧈 WHAT SCIENTISTS ARE DESCRIBING AS AN ⭐️ @allstarz_nft BEING CONTROLLED BY A LOBSTER 🦞 LAST SEEN LEAVING 🗻 DENVER AFTER NEVER ACTUALLY MAKING IT TO MILADY RAVE ✨ WITH REQUESTED SOUND EQUIPMENT DUE STOPPING TO EAT A BURRITO FROM THE LOCAL"',
        image: '/images/lore/lawbstarz-denver-2.jpg',
        postUrl: 'https://x.com/wables411/status/1673455222063243265',
      },
    ],
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
    orbit: 210,
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
    launched: '2023-10-23',
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
      { date: '2023-10-23', label: 'A Lawbster Halloween mints on Zora (Base)' },
      {
        date: '2023-10-30',
        label: 'Mint contest: top minter wins matching tokens + a $25 bar tab at Casements on Mission St',
      },
      { date: '2023-11-01', label: 'Mint closes — "before they go away fr"' },
    ],
    story: [
      {
        date: '2023-10-30',
        text: '"420 lawbster hijacked a spirit halloween superstore minting rn on @ourZORA on @BuildOnBase"',
        image: '/images/lore/halloween-news-2.jpg',
        postUrl: 'https://x.com/wables411/status/1718829917339898140',
      },
      {
        date: '2023-10-30',
        text: '"nfa but uh um well whatever address mints the most 🦞 Lawbster Halloween 🎃 NFTs between today & 6pm on Halloween (6pm PT) will win an equal amount of 🦞 Lawbster Halloween 🎃 tokens dropped to their wallet and a 25$ Bar tab valid @ Casements on Mission st."',
        image: '/images/lore/halloween-news-1.jpg',
        postUrl: 'https://x.com/wables411/status/1718829833726407037',
      },
      {
        date: '2023-10-31',
        text: '"idk who needs to hear this but there\'s like 25hrs left to mint A Lawbster Halloween before they go away fr🦞🎃"',
        image: '/images/lore/halloween-news-3.jpg',
        postUrl: 'https://x.com/wables411/status/1719233932007534743',
      },
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
    orbit: 270,
    size: 22,
    speed: 75,
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
    timeline: [
      {
        date: '2024-04-22',
        label: 'Mint opens: free claims for LawbStation holders (1 nexus per lawb held), then priced in $LAWB',
      },
      { date: '2024-04-24', label: '"20min left to mint nexus in $LAWB" — mint closes' },
    ],
    story: [
      {
        date: '2024-04-22',
        text: '"There is no meme. I $LAWB YOU" — the LawbNexus account announces itself.',
        image: '/images/lore/nexus-nomeme.jpg',
        postUrl: 'https://x.com/LawbNexus/status/1782467992934367674',
      },
      {
        date: '2024-04-22',
        text: '"50/420 free claims have been minted. @LawbStation holders mint 1 nexus for each lawb in your wallet before @miladydart forces our hand to close early"',
        postUrl: 'https://x.com/LawbStation/status/1782469503538036737',
      },
      {
        date: '2024-04-24',
        text: '"20min left to mint nexus in $LAWB"',
        postUrl: 'https://x.com/LawbStation/status/1783023078429352330',
      },
    ],
    moons: [
      {
        id: 'nexus-uhd',
        name: 'XUHD',
        kind: 'art',
        blurb: 'Xtra Ultra High Definition: the anti-lowpoly counterpoint to LawbStation.',
      },
      {
        id: 'nexus-lawb-mint',
        name: 'Minted in $LAWB',
        kind: 'market',
        blurb:
          'LawbNexus was priced in the $LAWB token itself — free claims for LawbStation holders, then $LAWB for everyone else.',
      },
    ],
    orbit: 450,
    size: 22,
    speed: 120,
    phase: 60,
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
    launched: '2025-06-11',
    blurb: '2222 Pixelated Lawbsters inspired by PixeladyMaker. Still minting.',
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
    timeline: [
      { date: '2025-06-11', label: 'Pixelawbs contract deploys via Scatter — mint opens on lawb.xyz' },
      { date: '2025-07-01', label: 'Pixelady raffle: every public mint is an entry to win Pixelady Maker NFTs' },
      { date: '2025-12-21', label: 'First 3 raffle winners airdropped live on retake.tv' },
    ],
    story: [
      {
        date: '2025-07-01',
        text: 'PIXELAWBS RAFFLE ANNOUNCEMENT: 1 public priced mint = 1 raffle entry, raffle ends when pixelawbs mint out. Prizes: Pixelady Maker, Pixelady Maker: BC, Pixelady Maker: Radbro, Pixelady Maker: Cata, Pixelady Figmata.',
        image: '/images/lore/pixelawbs-raffle.jpg',
        video:
          'https://video.twimg.com/amplify_video/1940274187106394112/vid/avc1/720x720/RuuM01Q_R9tqibAA.mp4?tag=14',
        postUrl: 'https://x.com/LawbStation/status/1940274383442125272',
      },
      {
        date: '2025-07-07',
        text: '"8 pixelawbs away from 600 mints and only 1630 pixelawbs away from the next chapter on our road to Sanko©️"',
        image: '/images/lore/pixelawbs-sanko.jpg',
        postUrl: 'https://x.com/LawbStation/status/1942243898274779515',
      },
      {
        date: '2025-08-23',
        text: 'The lawb census: "420 lawbsters 666 lawbstarz 666 lawbsters having a halloween party 1000 lawbnexus and give or take 699 pixelawbs currently molting that\'s roughly 3400 accounts lawbing u on the blocked chains"',
        postUrl: 'https://x.com/LawbStation/status/1959449827626160159',
      },
      {
        date: '2025-12-21',
        text: '"3 winners picked and airdropped live on retake.tv — the pixelady raffle will continue after pixelawbs mint out, thank you everyone whos minted so far i lawb u"',
        postUrl: 'https://x.com/LawbStation/status/2002937199076253732',
      },
    ],
    moons: [
      {
        id: 'pixelawbs-mint',
        name: 'Mint on lawb.xyz',
        kind: 'market',
        blurb: 'Minted straight from the Win98 desktop via the Scatter API — MS2-priced allowlist included.',
        url: 'https://lawb.xyz',
      },
      {
        id: 'pixelawbs-sanko',
        name: 'Road to Sanko©',
        kind: 'lore',
        blurb: 'The mint-out unlocks "the next chapter on our road to Sanko©️".',
      },
    ],
    orbit: 510,
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
    launched: '2024-02',
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
    timeline: [
      { date: '2024-02-06', label: 'ASCII Lawbsters contract goes live on Base' },
      { date: '2024-03-28', label: '"Lawbsters on @base 🦞" — minting from lawb.xyz' },
    ],
    story: [
      {
        date: '2024-03-28',
        text: '"Lawbsters on @base 🦞" — ascii minting at lawb.xyz/ascii_lawbster alongside the Halloween Zora collection.',
        image: '/images/lore/ascii-base-1.jpg',
        postUrl: 'https://x.com/LawbStation/status/1773229188704584092',
      },
      {
        date: '2024-04-17',
        text: '"Our ASCII has become Shiva" — with KOOLSKULL.',
        image: '/images/lore/ascii-shiva.jpg',
        postUrl: 'https://x.com/LawbStation/status/1780452877842129285',
      },
      {
        date: '2024-05-04',
        text: 'LawbNexus: "First it was Lawbsters, then Lawbstarz, then Lawbstation. And lastly LawbNexus" — LawbStation replies with the full roll call: "lawbsters, lawbstarz, a lawbster halloween, lawbstation, ascii lawbsters, nexus".',
        postUrl: 'https://x.com/LawbStation/status/1786809812682211371',
      },
    ],
    moons: [
      {
        id: 'ascii-terminal',
        name: 'Text art',
        kind: 'art',
        blurb: 'The lawbster reduced to characters — green-on-black terminal aesthetics on Base.',
      },
    ],
    orbit: 390,
    size: 22,
    speed: 160,
    phase: 300,
  },
  {
    id: 'chess',
    name: 'Lawb Chess',
    category: 'game',
    image: '/assets/chessicon.png',
    color: '#c0c0c0',
    chain: 'Arbitrum',
    blurb:
      'Lawb Chess Beta 3000 — Win98-styled chess, fully on-chain PvP: the contract validates every move, escrows both $DMT stakes on Arbitrum, and pays the winner automatically. Plus a Stockfish AI to practice against. Blue moves first.',
    links: [
      { label: 'Play', url: 'https://lawb.xyz/chess' },
      {
        label: 'LawbChess contract (Arbitrum)',
        url: 'https://arbiscan.io/address/0x3112AF5728520F52FD1C6710dD7bD52285a68e47',
      },
    ],
    contributors: [
      { name: 'wables411', url: 'https://x.com/wables411', role: 'dev' },
    ],
    timeline: [
      { date: '2024', label: 'Lawb Chess launches with Sanko wagers' },
      { date: '2025', label: 'Base becomes the primary wager chain' },
      { date: '2026-07', label: 'Fully on-chain rebuild ships on Arbitrum — $DMT wagers, the contract is referee and bank' },
    ],
    moons: [
      {
        id: 'chess-pieces',
        name: 'Piece sets',
        kind: 'art',
        blurb: 'Boards and pieces skinned with LawbStation and Pixelawbs art.',
      },
    ],
    orbit: 570,
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
    orbit: 630,
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
        id: 'no-meme',
        name: 'there is no meme',
        kind: 'lore',
        blurb:
          '"there is no meme i lawb you" derives from "There is No Meme I Love You", the Milady meme — archived at archive.org and canonized on the Remilia Wiki.',
        url: 'https://archive.org/details/thereisnomemeiloveyou',
      },
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
    orbit: 690,
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
