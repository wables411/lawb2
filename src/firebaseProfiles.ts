import { database, getFirebaseDatabaseForKey } from './firebaseApp';
import { ref, set, get, update, remove, runTransaction } from 'firebase/database';
import type { NFTInventory } from './utils/nftInventory';
import { setHoldingsPoints } from './firebaseLeaderboard';
import { computeHoldingsLeaderboardScore } from './utils/leaderboardHoldingsScore';

// Pass the normalized wallet key for WRITES: rules require auth.uid === key,
// and Solana keys authenticate on a separate app instance (see firebaseApp).
const getDatabaseOrThrow = (pathKey?: string) => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return pathKey ? getFirebaseDatabaseForKey(pathKey) : database;
};

const normalizeWalletAddress = (walletAddress: string): string => {
  return walletAddress.startsWith('0x') ? walletAddress.toLowerCase() : walletAddress;
};

export interface GameStats {
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  total_points: number;
  win_rate: number;
  last_match_timestamp: string | null;
  last_match_invite_code: string | null;
}

export interface ChessProfileStats {
  wins: number;
  losses: number;
  fastest_win_seconds: number | null;
}

export interface ReefRunProfileStats {
  cheese_collected: number;
  peptides_collected: number;
  coins_collected: number;
  /** Lifetime trash hauled — the mission stat. Optional: pre-trash profiles lack it. */
  trash_collected?: number;
  /** Most trash hauled in a single run. */
  best_trash_run?: number;
  /** Lifetime trash by canonical variant id (dive log) — see arcadeTrashVariants.ts. */
  trash_by_kind?: Record<string, number>;
  longest_run_seconds: number;
  character_runs: Record<string, number>;
  favored_character: string | null;
}

export interface ProfilePicture {
  collection:
    | 'pixelawbs'
    | 'lawbsters'
    | 'lawbstarz'
    | 'halloween_lawbsters'
    | 'asciilawbs'
    | 'lawbstation'
    | 'lawbnexus';
  token_id: string;
  image_url: string;
}

export interface ClaimableBalance {
  clawb: number;  // $CLAWB tokens pending claim
  lawb: number;   // $LAWB tokens pending claim
  updated_at?: number;
}

export interface LinkedWallet {
  address: string;
  chain: 'evm' | 'solana';
  linked_at: number;
}

export interface PlayerProfile {
  wallet_address: string;
  username?: string;
  profile_picture?: ProfilePicture;
  nft_inventory: NFTInventory;
  game_stats: GameStats;
  chess_stats?: ChessProfileStats;
  reef_run_stats?: ReefRunProfileStats;
  claimable?: ClaimableBalance;
  linked_wallets?: LinkedWallet[];
  created_at: string;
  updated_at: string;
}

export const firebaseProfiles = {
  // Get profile by wallet address
  async getProfile(walletAddress: string): Promise<PlayerProfile | null> {
    try {
      const db = getDatabaseOrThrow(normalizeWalletAddress(walletAddress));
      const profileRef = ref(db, `profiles/${normalizeWalletAddress(walletAddress)}`);
      const snapshot = await get(profileRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('[FIREBASE] Error getting profile:', error);
      return null;
    }
  },

  // Create or update profile
  async upsertProfile(walletAddress: string, profileData: Partial<PlayerProfile>): Promise<void> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const db = getDatabaseOrThrow(normalizedWallet);
      const profileRef = ref(db, `profiles/${normalizedWallet}`);
      const existing = await get(profileRef);
      const existingProfile = existing.exists() ? existing.val() as PlayerProfile : null;
      
      const now = new Date().toISOString();
      
      // If updating specific fields, use update() to preserve existing data
      if (existingProfile && Object.keys(profileData).length < Object.keys(existingProfile).length) {
        const updateData: any = {
          updated_at: now
        };
        
        if (profileData.game_stats !== undefined) {
          updateData.game_stats = profileData.game_stats;
        }
        if (profileData.nft_inventory !== undefined) {
          updateData.nft_inventory = profileData.nft_inventory;
        }
        if (profileData.username !== undefined) {
          updateData.username = profileData.username;
        }
        if (profileData.profile_picture !== undefined) {
          updateData.profile_picture = profileData.profile_picture;
        }
        if (profileData.chess_stats !== undefined) {
          updateData.chess_stats = profileData.chess_stats;
        }
        if (profileData.reef_run_stats !== undefined) {
          updateData.reef_run_stats = profileData.reef_run_stats;
        }
        
        await update(profileRef, updateData);
        console.log('[FIREBASE] Profile updated:', walletAddress);
        return;
      }
      
      // Full profile creation/update
      const profile: any = {
        wallet_address: normalizedWallet,
        nft_inventory: profileData.nft_inventory || existingProfile?.nft_inventory || {
          lawbsters: [],
          lawbstarz: [],
          halloween_lawbsters: [],
          pixelawbs: [],
          asciilawbs: [],
          lawbstation: [],
          lawbnexus: [],
          lawb_lore: [],
        },
        game_stats: profileData.game_stats || existingProfile?.game_stats || {
          total_games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          total_points: 0,
          win_rate: 0,
          last_match_timestamp: null,
          last_match_invite_code: null
        },
        chess_stats: profileData.chess_stats || existingProfile?.chess_stats || {
          wins: 0,
          losses: 0,
          fastest_win_seconds: null,
        },
        reef_run_stats: profileData.reef_run_stats || existingProfile?.reef_run_stats || {
          cheese_collected: 0,
          peptides_collected: 0,
          coins_collected: 0,
          longest_run_seconds: 0,
          character_runs: {},
          favored_character: null,
        },
        created_at: existingProfile?.created_at || now,
        updated_at: now
      };
      
      // Only include username if it exists (not undefined)
      const username = profileData.username !== undefined ? profileData.username : existingProfile?.username;
      if (username !== undefined) {
        profile.username = username;
      }
      
      // Only include profile_picture if it exists (not undefined)
      const profilePicture = profileData.profile_picture !== undefined ? profileData.profile_picture : existingProfile?.profile_picture;
      if (profilePicture !== undefined) {
        profile.profile_picture = profilePicture;
      }
      
      await set(profileRef, profile);
      console.log('[FIREBASE] Profile upserted:', walletAddress);
    } catch (error) {
      console.error('[FIREBASE] Error upserting profile:', error);
      throw error;
    }
  },

  // Update game stats after a match
  async updateGameStats(walletAddress: string, result: 'win' | 'loss' | 'draw', inviteCode: string): Promise<void> {
    try {
      const db = getDatabaseOrThrow(normalizeWalletAddress(walletAddress));
      const profileRef = ref(db, `profiles/${normalizeWalletAddress(walletAddress)}`);
      const snapshot = await get(profileRef);
      
      if (!snapshot.exists()) {
        // Create profile if it doesn't exist
        await this.upsertProfile(walletAddress, {});
        return this.updateGameStats(walletAddress, result, inviteCode);
      }
      
      const profile = snapshot.val() as PlayerProfile;
      const stats = profile.game_stats;
      
      const updatedStats: GameStats = {
        total_games: stats.total_games + 1,
        wins: stats.wins + (result === 'win' ? 1 : 0),
        losses: stats.losses + (result === 'loss' ? 1 : 0),
        draws: stats.draws + (result === 'draw' ? 1 : 0),
        total_points: stats.total_points + (result === 'win' ? 3 : result === 'draw' ? 1 : 0),
        win_rate: (stats.wins + (result === 'win' ? 1 : 0)) / (stats.total_games + 1),
        last_match_timestamp: new Date().toISOString(),
        last_match_invite_code: inviteCode
      };
      
      await update(profileRef, {
        'game_stats': updatedStats,
        'updated_at': new Date().toISOString()
      });
      
      console.log('[FIREBASE] Game stats updated:', walletAddress);
    } catch (error) {
      console.error('[FIREBASE] Error updating game stats:', error);
      throw error;
    }
  },

  async updateChessProfileStats(
    walletAddress: string,
    result: 'win' | 'loss' | 'draw',
    matchDurationSec?: number,
  ): Promise<void> {
    try {
      const normalized = normalizeWalletAddress(walletAddress);
      const db = getDatabaseOrThrow(normalized);
      const profileRef = ref(db, `profiles/${normalized}`);
      const snapshot = await get(profileRef);
      if (!snapshot.exists()) {
        await this.upsertProfile(normalized, {});
        return this.updateChessProfileStats(normalized, result, matchDurationSec);
      }
      const profile = snapshot.val() as PlayerProfile;
      const current: ChessProfileStats = profile.chess_stats || {
        wins: profile.game_stats?.wins || 0,
        losses: profile.game_stats?.losses || 0,
        fastest_win_seconds: null,
      };
      const nextWins = current.wins + (result === 'win' ? 1 : 0);
      const nextLosses = current.losses + (result === 'loss' ? 1 : 0);
      let fastest = current.fastest_win_seconds;
      if (result === 'win' && typeof matchDurationSec === 'number' && matchDurationSec > 0) {
        const d = Math.floor(matchDurationSec);
        fastest = fastest == null ? d : Math.min(fastest, d);
      }
      const updated: ChessProfileStats = {
        wins: nextWins,
        losses: nextLosses,
        fastest_win_seconds: fastest ?? null,
      };
      await update(profileRef, {
        chess_stats: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FIREBASE] Error updating chess profile stats:', error);
    }
  },

  async updateReefRunStats(
    walletAddress: string,
    payload: {
      characterId: string;
      survivalSec: number;
      cheeseCollected: number;
      peptidesCollected: number;
      coinsCollected: number;
      trashCollected: number;
      /** This run's trash by canonical variant id (summed into lifetime trash_by_kind). */
      trashByKind?: Record<string, number>;
    },
  ): Promise<boolean> {
    // Returns true only when the write actually landed. Rules-rejected writes
    // (unauthed wallet, linked-wallet mismatch) MUST surface as false — the
    // game-over note and its retry path depend on it.
    try {
      const normalized = normalizeWalletAddress(walletAddress);
      const db = getDatabaseOrThrow(normalized);
      const profileRef = ref(db, `profiles/${normalized}`);
      const snapshot = await get(profileRef);
      if (!snapshot.exists()) {
        await this.upsertProfile(normalized, {});
      }
      // Transaction, not read-modify-write: two runs finishing near-simultaneously
      // (second tab / second device) must both land their haul.
      const statsRef = ref(db, `profiles/${normalized}/reef_run_stats`);
      const result = await runTransaction(statsRef, (value: ReefRunProfileStats | null) => {
        const current: ReefRunProfileStats = value || {
          cheese_collected: 0,
          peptides_collected: 0,
          coins_collected: 0,
          longest_run_seconds: 0,
          character_runs: {},
          favored_character: null,
        };
        const characterRuns = { ...(current.character_runs || {}) };
        characterRuns[payload.characterId] = (characterRuns[payload.characterId] || 0) + 1;
        let favored: string | null = current.favored_character || null;
        let favoredCount = favored ? characterRuns[favored] || 0 : -1;
        for (const [cid, count] of Object.entries(characterRuns)) {
          if (count > favoredCount) {
            favored = cid;
            favoredCount = count;
          }
        }
        const trashThisRun = Math.max(0, Math.floor(payload.trashCollected || 0));
        const trashByKind = { ...(current.trash_by_kind ?? {}) };
        for (const [variant, n] of Object.entries(payload.trashByKind ?? {})) {
          const add = Math.max(0, Math.floor((n as number) || 0));
          if (add > 0) trashByKind[variant] = (trashByKind[variant] ?? 0) + add;
        }
        const updated: ReefRunProfileStats = {
          cheese_collected: current.cheese_collected + Math.max(0, Math.floor(payload.cheeseCollected || 0)),
          peptides_collected: current.peptides_collected + Math.max(0, Math.floor(payload.peptidesCollected || 0)),
          coins_collected: current.coins_collected + Math.max(0, Math.floor(payload.coinsCollected || 0)),
          trash_collected: (current.trash_collected ?? 0) + trashThisRun,
          best_trash_run: Math.max(current.best_trash_run ?? 0, trashThisRun),
          ...(Object.keys(trashByKind).length ? { trash_by_kind: trashByKind } : {}),
          longest_run_seconds: Math.max(current.longest_run_seconds, Math.floor(Math.max(0, payload.survivalSec))),
          character_runs: characterRuns,
          favored_character: favored,
        };
        return updated;
      });
      if (!result.committed) return false;
      // Best-effort timestamp — stats already landed, so a failure here is not a lost run.
      try {
        await update(profileRef, { updated_at: new Date().toISOString() });
      } catch { /* noop */ }
      return true;
    } catch (error) {
      console.error('[FIREBASE] Error updating Reef Run stats:', error);
      return false;
    }
  },

  // Update NFT inventory
  async updateNFTInventory(
    walletAddress: string,
    inventory: NFTInventory,
    opts?: { tokenBonusPoints?: number },
  ): Promise<void> {
    try {
      const db = getDatabaseOrThrow(normalizeWalletAddress(walletAddress));
      const profileRef = ref(db, `profiles/${normalizeWalletAddress(walletAddress)}`);
      
      // Ensure profile exists first
      const existing = await get(profileRef);
      if (!existing.exists()) {
        // Create profile with inventory
        await this.upsertProfile(walletAddress, { nft_inventory: inventory });
        console.log('[FIREBASE] Profile created with NFT inventory:', walletAddress);
        return;
      }
      
      // Use update() on the profile path with only nft_inventory to avoid validation issues
      // Firebase rules allow partial updates to nft_inventory
      await update(profileRef, {
        'nft_inventory': inventory,
        'updated_at': new Date().toISOString()
      });

      const tokenBonus = opts?.tokenBonusPoints ?? 0;
      const holdingsScore = computeHoldingsLeaderboardScore(inventory, tokenBonus);
      await setHoldingsPoints(walletAddress, holdingsScore);
      
      console.log('[FIREBASE] NFT inventory updated:', walletAddress);
    } catch (error) {
      console.error('[FIREBASE] Error updating NFT inventory:', error);
      throw error;
    }
  },

  // Update profile picture (pass null to clear)
  async updateProfilePicture(walletAddress: string, picture: ProfilePicture | null): Promise<void> {
    try {
      const normalized = normalizeWalletAddress(walletAddress);
      const db = getDatabaseOrThrow(normalized);
      const profileRef = ref(db, `profiles/${normalized}`);
      const existing = await get(profileRef);
      if (!existing.exists()) {
        await this.upsertProfile(walletAddress, {});
      }

      if (picture === null) {
        // Clear profile picture
        await update(profileRef, {
          'profile_picture': null,
          'updated_at': new Date().toISOString()
        });
        console.log('[FIREBASE] Profile picture cleared:', walletAddress);
      } else {
        await update(profileRef, {
          'profile_picture': picture,
          'updated_at': new Date().toISOString()
        });
        console.log('[FIREBASE] Profile picture updated:', walletAddress);
      }
    } catch (error) {
      console.error('[FIREBASE] Error updating profile picture:', error);
      throw error;
    }
  },

  // Check if username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const db = getDatabaseOrThrow();
      const usernameLower = username.toLowerCase();
      const usernameRef = ref(db, `usernames/${usernameLower}`);
      const snapshot = await get(usernameRef);
      return !snapshot.exists();
    } catch (error) {
      console.error('[FIREBASE] Error checking username availability:', error);
      return false;
    }
  },

  // Set username (creates username index and updates profile)
  async setUsername(walletAddress: string, username: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
      }
      if (username.length < 3 || username.length > 20) {
        return { success: false, error: 'Username must be between 3 and 20 characters' };
      }

      const db = getDatabaseOrThrow(normalizeWalletAddress(walletAddress));
      const usernameLower = username.toLowerCase();
      const usernameRef = ref(db, `usernames/${usernameLower}`);
      
      // Check if username is already taken
      const existingUsername = await get(usernameRef);
      if (existingUsername.exists()) {
        const existingWallet = existingUsername.val().wallet_address;
        if (normalizeWalletAddress(existingWallet) !== normalizeWalletAddress(walletAddress)) {
          return { success: false, error: 'Username is already taken' };
        }
        // Username is already set for this wallet, no need to update
        return { success: true };
      }

      // Check if user already has a username and remove old index
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const profileRef = ref(db, `profiles/${normalizedWallet}`);
      const profileSnapshot = await get(profileRef);
      if (profileSnapshot.exists()) {
        const profile = profileSnapshot.val() as PlayerProfile;
        if (profile.username) {
          const oldUsernameRef = ref(db, `usernames/${profile.username.toLowerCase()}`);
          await set(oldUsernameRef, null); // Remove old username index
        }
      }

      // Create username index
      await set(usernameRef, {
        wallet_address: normalizedWallet
      });

      // Update profile with new username
      await update(profileRef, {
        username: username,
        updated_at: new Date().toISOString()
      });

      console.log('[FIREBASE] Username set:', username, 'for', walletAddress);
      return { success: true };
    } catch (error) {
      console.error('[FIREBASE] Error setting username:', error);
      return { success: false, error: 'Failed to set username' };
    }
  },

  // Get claimable token balance
  async getClaimableBalance(walletAddress: string): Promise<ClaimableBalance> {
    try {
      const db = getDatabaseOrThrow();
      const claimableRef = ref(db, `profiles/${normalizeWalletAddress(walletAddress)}/claimable`);
      const snapshot = await get(claimableRef);
      if (!snapshot.exists()) return { clawb: 0, lawb: 0 };
      const data = snapshot.val();
      return { clawb: data.clawb || 0, lawb: data.lawb || 0 };
    } catch (error) {
      console.error('[FIREBASE] Error getting claimable balance:', error);
      return { clawb: 0, lawb: 0 };
    }
  },

  // Submit a claim request (backend will process the actual token transfer)
  // NOTE: submitClaimRequest was removed with the CLAWB claim system — the
  // `claims` database node and its rules no longer exist.

  // Get profile by username
  async getProfileByUsername(username: string): Promise<PlayerProfile | null> {
    try {
      const db = getDatabaseOrThrow();
      const usernameLower = username.toLowerCase();
      const usernameRef = ref(db, `usernames/${usernameLower}`);
      const snapshot = await get(usernameRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const walletAddress = snapshot.val().wallet_address;
      return this.getProfile(walletAddress);
    } catch (error) {
      console.error('[FIREBASE] Error getting profile by username:', error);
      return null;
    }
  },

  async getPrimaryWallet(address: string): Promise<string> {
    try {
      const normalized = normalizeWalletAddress(address);
      const db = getDatabaseOrThrow(normalized);
      const linkRef = ref(db, `wallet_links/${encodeWalletKey(normalized)}`);
      const snap = await get(linkRef);
      if (snap.exists()) {
        const data = snap.val();
        if (data?.primary_wallet) return data.primary_wallet;
      }
      return normalized;
    } catch (error) {
      console.error('[FIREBASE] Error resolving primary wallet:', error);
      return normalizeWalletAddress(address);
    }
  },

  async getLinkedWallets(primaryWallet: string): Promise<LinkedWallet[]> {
    try {
      const normalized = normalizeWalletAddress(primaryWallet);
      const db = getDatabaseOrThrow(normalized);
      const lwRef = ref(db, `profiles/${normalized}/linked_wallets`);
      const snap = await get(lwRef);
      if (!snap.exists()) return [];
      const val = snap.val();
      if (Array.isArray(val)) return val.filter(Boolean);
      return Object.values(val).filter(Boolean) as LinkedWallet[];
    } catch (error) {
      console.error('[FIREBASE] Error getting linked wallets:', error);
      return [];
    }
  },

  async linkWallet(
    primaryWallet: string,
    secondaryAddress: string,
    chain: 'evm' | 'solana',
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedPrimary = normalizeWalletAddress(primaryWallet);
      const db = getDatabaseOrThrow(normalizedPrimary);
      const normalizedSecondary = normalizeWalletAddress(secondaryAddress);

      if (normalizedPrimary === normalizedSecondary) {
        return { success: false, error: 'Cannot link a wallet to itself' };
      }

      const existingPrimary = await this.getPrimaryWallet(normalizedSecondary);
      if (existingPrimary !== normalizedSecondary) {
        return { success: false, error: 'Wallet is already linked to another profile' };
      }

      const existing = await this.getLinkedWallets(normalizedPrimary);
      if (existing.some((w) => normalizeWalletAddress(w.address) === normalizedSecondary)) {
        return { success: true };
      }

      const entry: LinkedWallet = {
        address: normalizedSecondary,
        chain,
        linked_at: Date.now(),
      };
      const updated = [...existing, entry];

      const profileRef = ref(db, `profiles/${normalizedPrimary}`);
      const profileSnap = await get(profileRef);
      if (!profileSnap.exists()) {
        await this.upsertProfile(normalizedPrimary, {});
      }

      await update(profileRef, {
        linked_wallets: updated,
        updated_at: new Date().toISOString(),
      });

      const linkRef = ref(db, `wallet_links/${encodeWalletKey(normalizedSecondary)}`);
      await set(linkRef, { primary_wallet: normalizedPrimary });

      console.log('[FIREBASE] Wallet linked:', normalizedSecondary, '->', normalizedPrimary);
      return { success: true };
    } catch (error) {
      console.error('[FIREBASE] Error linking wallet:', error);
      return { success: false, error: 'Failed to link wallet' };
    }
  },

  async unlinkWallet(
    primaryWallet: string,
    secondaryAddress: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedPrimary = normalizeWalletAddress(primaryWallet);
      const db = getDatabaseOrThrow(normalizedPrimary);
      const normalizedSecondary = normalizeWalletAddress(secondaryAddress);

      const existing = await this.getLinkedWallets(normalizedPrimary);
      const filtered = existing.filter(
        (w) => normalizeWalletAddress(w.address) !== normalizedSecondary,
      );

      const profileRef = ref(db, `profiles/${normalizedPrimary}`);
      await update(profileRef, {
        linked_wallets: filtered.length > 0 ? filtered : null,
        updated_at: new Date().toISOString(),
      });

      const linkRef = ref(db, `wallet_links/${encodeWalletKey(normalizedSecondary)}`);
      await remove(linkRef);

      console.log('[FIREBASE] Wallet unlinked:', normalizedSecondary, 'from', normalizedPrimary);
      return { success: true };
    } catch (error) {
      console.error('[FIREBASE] Error unlinking wallet:', error);
      return { success: false, error: 'Failed to unlink wallet' };
    }
  },
};

function encodeWalletKey(address: string): string {
  return address.replace(/\./g, '_');
}

