import { database } from './firebaseApp';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';

const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
};

export interface BountyPrize {
  token: 'clawb' | 'lawb';
  amount: number;
  chain: string;
  nft_contract?: string;
  nft_token_id?: string;
}

export interface BountyCondition {
  points_threshold?: number;
  wins_required?: number;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  type: 'points_milestone' | 'chess_beat_clawb' | 'chess_wins' | 'custom';
  condition: BountyCondition;
  prize: BountyPrize;
  status: 'active' | 'claimed' | 'expired';
  claimed_by: string | null;
  claimed_at: string | null;
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

export const getActiveBounties = async (): Promise<Bounty[]> => {
  try {
    const db = getDatabaseOrThrow();
    const bountiesRef = ref(db, 'bounties');
    const snapshot = await get(bountiesRef);

    if (!snapshot.exists()) return [];

    const bounties: Bounty[] = [];
    snapshot.forEach((child) => {
      const bounty = child.val() as Bounty;
      if (bounty.status === 'active') {
        bounties.push(bounty);
      }
    });

    return bounties;
  } catch (error) {
    console.error('[BOUNTIES] Error fetching active bounties:', error);
    return [];
  }
};

export const getAllBounties = async (): Promise<Bounty[]> => {
  try {
    const db = getDatabaseOrThrow();
    const bountiesRef = ref(db, 'bounties');
    const snapshot = await get(bountiesRef);

    if (!snapshot.exists()) return [];

    const bounties: Bounty[] = [];
    snapshot.forEach((child) => {
      bounties.push(child.val() as Bounty);
    });

    bounties.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });

    return bounties;
  } catch (error) {
    console.error('[BOUNTIES] Error fetching all bounties:', error);
    return [];
  }
};

export const getBountyById = async (bountyId: string): Promise<Bounty | null> => {
  try {
    const db = getDatabaseOrThrow();
    const bountyRef = ref(db, `bounties/${bountyId}`);
    const snapshot = await get(bountyRef);
    return snapshot.exists() ? (snapshot.val() as Bounty) : null;
  } catch (error) {
    console.error('[BOUNTIES] Error fetching bounty:', error);
    return null;
  }
};

export const formatBountyPrize = (prize: BountyPrize): string => {
  if (!prize) return 'Unknown prize';
  const amount = prize.amount?.toLocaleString() || '?';
  const token = (prize.token || 'CLAWB').toUpperCase();
  return `${amount} $${token}`;
};
