import { database } from './firebaseApp';
import { ref, set, get, update } from 'firebase/database';
import type { NFTInventory } from './utils/nftInventory';

const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
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

export interface ProfilePicture {
  collection: 'pixelawbs' | 'lawbsters' | 'lawbstarz' | 'halloween_lawbsters' | 'asciilawbs';
  token_id: string;
  image_url: string;
}

export interface PlayerProfile {
  wallet_address: string;
  username?: string;
  profile_picture?: ProfilePicture;
  nft_inventory: NFTInventory;
  game_stats: GameStats;
  created_at: string;
  updated_at: string;
}

export const firebaseProfiles = {
  // Get profile by wallet address
  async getProfile(walletAddress: string): Promise<PlayerProfile | null> {
    try {
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
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
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
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
        
        await update(profileRef, updateData);
        console.log('[FIREBASE] Profile updated:', walletAddress);
        return;
      }
      
      // Full profile creation/update
      const profile: any = {
        wallet_address: walletAddress.toLowerCase(),
        nft_inventory: profileData.nft_inventory || existingProfile?.nft_inventory || {
          lawbsters: [],
          lawbstarz: [],
          halloween_lawbsters: [],
          pixelawbs: []
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
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
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

  // Update NFT inventory
  async updateNFTInventory(walletAddress: string, inventory: NFTInventory): Promise<void> {
    try {
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
      
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
      
      console.log('[FIREBASE] NFT inventory updated:', walletAddress);
    } catch (error) {
      console.error('[FIREBASE] Error updating NFT inventory:', error);
      throw error;
    }
  },

  // Update profile picture (pass null to clear)
  async updateProfilePicture(walletAddress: string, picture: ProfilePicture | null): Promise<void> {
    try {
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
      
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

      const db = getDatabaseOrThrow();
      const usernameLower = username.toLowerCase();
      const usernameRef = ref(db, `usernames/${usernameLower}`);
      
      // Check if username is already taken
      const existingUsername = await get(usernameRef);
      if (existingUsername.exists()) {
        const existingWallet = existingUsername.val().wallet_address;
        if (existingWallet.toLowerCase() !== walletAddress.toLowerCase()) {
          return { success: false, error: 'Username is already taken' };
        }
        // Username is already set for this wallet, no need to update
        return { success: true };
      }

      // Check if user already has a username and remove old index
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
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
        wallet_address: walletAddress.toLowerCase()
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
  }
};

