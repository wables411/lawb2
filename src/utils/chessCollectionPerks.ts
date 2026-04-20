import { computeWeightedNftHoldingsPoints } from './leaderboardHoldingsScore';
import type { NFTInventory } from './nftInventory';

export const EMPTY_NFT_INVENTORY: NFTInventory = {
  lawbsters: [],
  lawbstarz: [],
  halloween_lawbsters: [],
  pixelawbs: [],
  asciilawbs: [],
  lawbstation: [],
  lawbnexus: [],
  lawb_lore: [],
};

export interface ChessCollectionPerks {
  inventory: NFTInventory;
  playerTitle: string;
  totalNfts: number;
  weightedHoldingsScore: number;
  unlockedPieceSetIds: string[];
  preferredAiCollectionIds: string[];
}

type InventoryKey = keyof NFTInventory;

const TITLE_PRIORITY: Array<{ key: InventoryKey; title: string }> = [
  { key: 'lawbsters', title: 'Genesis Lawbster' },
  { key: 'lawbstarz', title: 'Lawbstar Tactician' },
  { key: 'lawbstation', title: 'Station Commander' },
  { key: 'lawbnexus', title: 'Nexus Navigator' },
  { key: 'halloween_lawbsters', title: 'Haunted Gambiteer' },
  { key: 'asciilawbs', title: 'ASCII Operator' },
  { key: 'pixelawbs', title: 'Pixel Gambler' },
  { key: 'lawb_lore', title: 'Lore Keeper' },
];

const AI_COLLECTION_KEY_MAP: Record<string, InventoryKey> = {
  lawbsters: 'lawbsters',
  lawbstarz: 'lawbstarz',
  pixelawbs: 'pixelawbs',
  halloween: 'halloween_lawbsters',
  asciilawbs: 'asciilawbs',
};

export function normalizeChessCollectionInventory(
  raw: Partial<NFTInventory> | null | undefined,
): NFTInventory {
  if (!raw) return { ...EMPTY_NFT_INVENTORY };
  return {
    lawbsters: Array.isArray(raw.lawbsters) ? raw.lawbsters : [],
    lawbstarz: Array.isArray(raw.lawbstarz) ? raw.lawbstarz : [],
    halloween_lawbsters: Array.isArray(raw.halloween_lawbsters) ? raw.halloween_lawbsters : [],
    pixelawbs: Array.isArray(raw.pixelawbs) ? raw.pixelawbs : [],
    asciilawbs: Array.isArray(raw.asciilawbs) ? raw.asciilawbs : [],
    lawbstation: Array.isArray(raw.lawbstation) ? raw.lawbstation : [],
    lawbnexus: Array.isArray(raw.lawbnexus) ? raw.lawbnexus : [],
    lawb_lore: Array.isArray(raw.lawb_lore) ? raw.lawb_lore : [],
  };
}

export function buildChessCollectionPerks(inventory: NFTInventory): ChessCollectionPerks {
  const playerTitle =
    TITLE_PRIORITY.find(({ key }) => (inventory[key]?.length ?? 0) > 0)?.title ?? 'Reef Recruit';

  const totalNfts = (Object.keys(inventory) as InventoryKey[]).reduce(
    (sum, key) => sum + (inventory[key]?.length ?? 0),
    0,
  );

  const preferredAiCollectionIds = Object.entries(AI_COLLECTION_KEY_MAP)
    .filter(([, key]) => (inventory[key]?.length ?? 0) > 0)
    .map(([aiId]) => aiId);

  // Current on-site chess cosmetic unlocks can be expanded in one place here.
  const unlockedPieceSetIds = ['lawbstation'];
  if ((inventory.pixelawbs?.length ?? 0) > 0) {
    unlockedPieceSetIds.push('pixelawbs');
  }

  return {
    inventory,
    playerTitle,
    totalNfts,
    weightedHoldingsScore: computeWeightedNftHoldingsPoints(inventory),
    unlockedPieceSetIds,
    preferredAiCollectionIds,
  };
}

