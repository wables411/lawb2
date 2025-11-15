# Player Profiles Implementation Guide

This guide explains how to implement player profiles for lawb.xyz/chess using either Firebase or Netlify Functions + Firebase.

## Overview

Player profiles will track:
- NFT inventory (Lawbsters, Lawbstarz, Halloween Lawbsters, Pixelawbs)
- Game statistics (played games, win/loss ratio, total points, last match timestamp)
- Profile pictures (selected from EVM NFTs in wallet)

## Option 1: Firebase-Only Implementation (Recommended)

### Architecture

Use Firebase Realtime Database with the following structure:

```
profiles/
  {walletAddress}/
    wallet_address: "0x..."
    username: "PlayerName" (optional, can use ENS or address)
    profile_picture: {
      collection: "pixelawbs" | "lawbsters" | "lawbstarz" | "halloween_lawbsters"
      token_id: "123"
      image_url: "https://..."
    }
    nft_inventory: {
      lawbsters: ["token_id1", "token_id2", ...]
      lawbstarz: ["token_id1", "token_id2", ...]
      halloween_lawbsters: ["token_id1", "token_id2", ...]
      pixelawbs: ["token_id1", "token_id2", ...]
    }
    game_stats: {
      total_games: 42
      wins: 25
      losses: 15
      draws: 2
      total_points: 77
      win_rate: 0.595
      last_match_timestamp: "2025-11-14T20:33:00.095Z"
      last_match_invite_code: "0x5c50b92c92a9"
    }
    created_at: "2025-01-01T00:00:00.000Z"
    updated_at: "2025-11-14T20:33:00.095Z"

usernames/
  {username_lowercase}/
    wallet_address: "0x..." (index for reverse lookup)
```

### Step 1: Update Firebase Rules

Add profile rules to `firebase.rules`:

```json
{
  "rules": {
    "profiles": {
      ".read": true,
      ".write": true,
      "$walletAddress": {
        ".validate": "newData.hasChildren(['wallet_address', 'game_stats']) && 
                     newData.child('wallet_address').isString() &&
                     newData.child('wallet_address').val() === $walletAddress &&
                     (!newData.hasChild('username') || 
                      (newData.child('username').isString() && 
                       newData.child('username').val().length >= 3 && 
                       newData.child('username').val().length <= 20 &&
                       newData.child('username').val().matches(/^[a-zA-Z0-9_]+$/))) &&
                     newData.child('game_stats').hasChildren(['total_games', 'wins', 'losses', 'draws', 'total_points']) &&
                     newData.child('game_stats').child('total_games').isNumber() &&
                     newData.child('game_stats').child('wins').isNumber() &&
                     newData.child('game_stats').child('losses').isNumber() &&
                     newData.child('game_stats').child('draws').isNumber() &&
                     newData.child('game_stats').child('total_points').isNumber()"
      }
    },
    "usernames": {
      ".read": true,
      ".write": true,
      "$username": {
        ".validate": "newData.hasChildren(['wallet_address']) && 
                     newData.child('wallet_address').isString() &&
                     $username.matches(/^[a-z0-9_]+$/) &&
                     $username.length >= 3 && 
                     $username.length <= 20"
      }
    },
    // ... existing rules
  }
}
```

### Step 2: Create Profile Service

Create `src/firebaseProfiles.ts`:

```typescript
import { database } from './firebaseApp';
import { ref, set, get, update, onValue, off } from 'firebase/database';

const getDatabaseOrThrow = () => {
  if (!database) {
    throw new Error('[FIREBASE] Database not initialized');
  }
  return database;
};

export interface NFTInventory {
  lawbsters: string[];
  lawbstarz: string[];
  halloween_lawbsters: string[];
  pixelawbs: string[];
}

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
  collection: 'pixelawbs' | 'lawbsters' | 'lawbstarz' | 'halloween_lawbsters';
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
      
      const now = new Date().toISOString();
      const profile: PlayerProfile = {
        wallet_address: walletAddress.toLowerCase(),
        username: profileData.username,
        profile_picture: profileData.profile_picture,
        nft_inventory: profileData.nft_inventory || {
          lawbsters: [],
          lawbstarz: [],
          halloween_lawbsters: [],
          pixelawbs: []
        },
        game_stats: profileData.game_stats || {
          total_games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          total_points: 0,
          win_rate: 0,
          last_match_timestamp: null,
          last_match_invite_code: null
        },
        created_at: existing.exists() ? existing.val().created_at : now,
        updated_at: now
      };
      
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

  // Update profile picture
  async updateProfilePicture(walletAddress: string, picture: ProfilePicture): Promise<void> {
    try {
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
      
      await update(profileRef, {
        'profile_picture': picture,
        'updated_at': new Date().toISOString()
      });
      
      console.log('[FIREBASE] Profile picture updated:', walletAddress);
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
  },

  // Subscribe to profile updates
  subscribeToProfile(walletAddress: string, callback: (profile: PlayerProfile | null) => void) {
    try {
      const db = getDatabaseOrThrow();
      const profileRef = ref(db, `profiles/${walletAddress.toLowerCase()}`);
      
      const unsubscribe = onValue(profileRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('[FIREBASE] Error subscribing to profile:', error);
      return () => {};
    }
  }
};
```

### Step 3: NFT Collection Contract Addresses

Add to `src/config/tokens.ts` or create `src/config/nftCollections.ts`:

```typescript
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
  }
} as const;
```

### Step 4: Fetch NFT Inventory

Create `src/utils/nftInventory.ts`:

```typescript
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getCollectionNFTs } from '../mint';
import { getOpenSeaNFTs } from '../mint';

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

export async function fetchNFTInventory(walletAddress: string): Promise<{
  lawbsters: string[];
  lawbstarz: string[];
  halloween_lawbsters: string[];
  pixelawbs: string[];
}> {
  const inventory = {
    lawbsters: [] as string[],
    lawbstarz: [] as string[],
    halloween_lawbsters: [] as string[],
    pixelawbs: [] as string[]
  };

  // Fetch Pixelawbs (Ethereum, direct contract call)
  try {
    const pixelawbs = NFT_COLLECTIONS.pixelawbs;
    // Use Ethereum RPC (cross-chain like nftVerification.ts does)
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
    const contract = new Contract(pixelawbs.address, ERC721_ABI, ethereumProvider);
    const balance = await contract.balanceOf(walletAddress);
    
      const tokenIds: string[] = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
        tokenIds.push(tokenId.toString());
      }
      inventory.pixelawbs = tokenIds;
  } catch (error) {
    console.error('Error fetching Pixelawbs:', error);
    // Fallback: Use Scatter API
    try {
      const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
      inventory.pixelawbs = response.data.map(nft => nft.token_id.toString());
    } catch (apiError) {
      console.error('Error fetching Pixelawbs from API:', apiError);
    }
  }

  // Fetch Lawbsters (Ethereum, direct contract call)
  try {
    const lawbsters = NFT_COLLECTIONS.lawbsters;
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
    const contract = new Contract(lawbsters.address, ERC721_ABI, ethereumProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.lawbsters = tokenIds;
  } catch (error) {
    console.error('Error fetching Lawbsters via contract:', error);
    // Fallback: Use OpenSea API (note: OpenSea API doesn't filter by owner in current implementation)
    // You may need to fetch all and filter client-side, or use OpenSea's account API endpoint
    try {
      const response = await getOpenSeaNFTs('lawbsters', 100);
      inventory.lawbsters = response.data
        .filter(nft => {
          // Check if wallet owns this NFT
          return nft.owners?.some(owner => 
            owner.owner_of.toLowerCase() === walletAddress.toLowerCase()
          ) || nft.owner_of.toLowerCase() === walletAddress.toLowerCase();
        })
        .map(nft => nft.token_id.toString());
    } catch (apiError) {
      console.error('Error fetching Lawbsters from API:', apiError);
    }
  }

  // Fetch Lawbstarz (Ethereum, direct contract call)
  try {
    const lawbstarz = NFT_COLLECTIONS.lawbstarz;
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
    const contract = new Contract(lawbstarz.address, ERC721_ABI, ethereumProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.lawbstarz = tokenIds;
  } catch (error) {
    console.error('Error fetching Lawbstarz via contract:', error);
    // Fallback: Use Scatter API
    try {
      const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
      inventory.lawbstarz = response.data.map(nft => nft.token_id.toString());
    } catch (apiError) {
      console.error('Error fetching Lawbstarz from API:', apiError);
    }
  }

  // Fetch Halloween Lawbsters (Base chain, direct contract call)
  try {
    const halloween = NFT_COLLECTIONS.halloween_lawbsters;
    // Use Base RPC endpoint
    const baseProvider = new JsonRpcProvider('https://mainnet.base.org');
    const contract = new Contract(halloween.address, ERC721_ABI, baseProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.halloween_lawbsters = tokenIds;
  } catch (error) {
    console.error('Error fetching Halloween Lawbsters via contract:', error);
    // Fallback: Use OpenSea account API for Base chain
    try {
      const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
      const response = await fetch(
        `https://api.opensea.io/api/v2/chain/base/account/${walletAddress}/nfts?collection=a-lawbster-halloween&limit=100`,
        { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
      );
      if (response.ok) {
        const data = await response.json();
        inventory.halloween_lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
      }
    } catch (accountError) {
      console.error('Error fetching Halloween Lawbsters from account API:', accountError);
    }
  }

  return inventory;
}

// Fetch token metadata (image URL)
export async function fetchTokenMetadata(
  collection: keyof typeof NFT_COLLECTIONS,
  tokenId: string
): Promise<{ image_url: string; name?: string }> {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found');
  }

  const provider = new BrowserProvider(window.ethereum);
  const collectionConfig = NFT_COLLECTIONS[collection];
  const contract = new Contract(collectionConfig.address, ERC721_ABI, provider);
  
  const tokenURI = await contract.tokenURI(tokenId);
  
  // If tokenURI is a URL, fetch it
  if (tokenURI.startsWith('http')) {
    const response = await fetch(tokenURI);
    const metadata = await response.json();
    return {
      image_url: metadata.image || metadata.image_url || '',
      name: metadata.name
    };
  }
  
  // If it's IPFS, convert to HTTP gateway
  if (tokenURI.startsWith('ipfs://')) {
    const ipfsHash = tokenURI.replace('ipfs://', '');
    const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    const response = await fetch(gatewayUrl);
    const metadata = await response.json();
    return {
      image_url: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
      name: metadata.name
    };
  }
  
  return { image_url: '', name: undefined };
}
```

### Step 5: Integrate with Existing Game Flow

Update `src/firebaseLeaderboard.ts` to also update profiles:

```typescript
// After updating leaderboard, also update profile
import { firebaseProfiles } from './firebaseProfiles';

export async function updateLeaderboardEntry(
  walletAddress: string,
  result: 'win' | 'loss' | 'draw'
) {
  // ... existing leaderboard update code ...
  
  // Also update profile game stats
  const gameData = await firebaseChess.getGame(inviteCode); // Get current game
  if (gameData?.invite_code) {
    await firebaseProfiles.updateGameStats(walletAddress, result, gameData.invite_code);
  }
}
```

### Step 6: Create Profile Component

Create `src/components/PlayerProfile.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { firebaseProfiles, type PlayerProfile } from '../firebaseProfiles';
import { fetchNFTInventory, fetchTokenMetadata } from '../utils/nftInventory';

export const PlayerProfile: React.FC = () => {
  const { address } = useAccount();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  useEffect(() => {
    if (!address) return;
    
    const loadProfile = async () => {
      setLoading(true);
      const profileData = await firebaseProfiles.getProfile(address);
      
      if (!profileData) {
        // Create profile if it doesn't exist
        await firebaseProfiles.upsertProfile(address, {});
        const newProfile = await firebaseProfiles.getProfile(address);
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }
      
      // Fetch and update NFT inventory
      try {
        const inventory = await fetchNFTInventory(address);
        await firebaseProfiles.updateNFTInventory(address, inventory);
        const updatedProfile = await firebaseProfiles.getProfile(address);
        setProfile(updatedProfile);
      } catch (error) {
        console.error('Error fetching NFT inventory:', error);
      }
      
      setLoading(false);
    };
    
    loadProfile();
  }, [address]);

  // Check username availability as user types
  useEffect(() => {
    if (!usernameInput || usernameInput.length < 3) {
      setUsernameError(null);
      return;
    }

    const checkUsername = async () => {
      if (!/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
        return;
      }
      if (usernameInput.length > 20) {
        setUsernameError('Username must be 20 characters or less');
        return;
      }

      setIsCheckingUsername(true);
      const available = await firebaseProfiles.isUsernameAvailable(usernameInput);
      setIsCheckingUsername(false);
      
      if (!available) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError(null);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [usernameInput]);

  const handleSetUsername = async () => {
    if (!address || !usernameInput) return;
    
    setUsernameError(null);
    setUsernameSuccess(false);
    
    const result = await firebaseProfiles.setUsername(address, usernameInput);
    
    if (result.success) {
      setUsernameSuccess(true);
      setUsernameInput('');
      // Reload profile to get updated username
      const updatedProfile = await firebaseProfiles.getProfile(address);
      setProfile(updatedProfile);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUsernameSuccess(false), 3000);
    } else {
      setUsernameError(result.error || 'Failed to set username');
    }
  };

  const displayName = profile?.username 
    ? profile.username 
    : address 
      ? `${address.slice(0, 6)}...${address.slice(-4)}` 
      : 'Unknown';

  // Profile picture selection UI
  // NFT inventory display
  // Game stats display
  
  return (
    <div className="player-profile">
      <h2>Player Profile</h2>
      
      {/* Display Name */}
      <div className="profile-header">
        <h3>{displayName}</h3>
        {profile?.username && (
          <span className="username-badge">@{profile.username}</span>
        )}
      </div>

      {/* Username Creation/Update */}
      {!profile?.username && (
        <div className="username-section">
          <h4>Create a Username</h4>
          <p>Choose a username to display instead of your wallet address</p>
          <div className="username-input-group">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter username (3-20 characters)"
              maxLength={20}
              className={usernameError ? 'error' : ''}
            />
            <button 
              onClick={handleSetUsername}
              disabled={!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername}
            >
              {isCheckingUsername ? 'Checking...' : 'Set Username'}
            </button>
          </div>
          {isCheckingUsername && <p className="checking">Checking availability...</p>}
          {usernameError && <p className="error-message">{usernameError}</p>}
          {usernameSuccess && <p className="success-message">Username set successfully!</p>}
          <p className="username-hint">
            Username must be 3-20 characters and can only contain letters, numbers, and underscores.
          </p>
        </div>
      )}

      {profile?.username && (
        <div className="username-section">
          <h4>Current Username: @{profile.username}</h4>
          <p>You can change your username by setting a new one below</p>
          <div className="username-input-group">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter new username"
              maxLength={20}
              className={usernameError ? 'error' : ''}
            />
            <button 
              onClick={handleSetUsername}
              disabled={!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername}
            >
              {isCheckingUsername ? 'Checking...' : 'Change Username'}
            </button>
          </div>
          {isCheckingUsername && <p className="checking">Checking availability...</p>}
          {usernameError && <p className="error-message">{usernameError}</p>}
          {usernameSuccess && <p className="success-message">Username updated successfully!</p>}
        </div>
      )}

      {/* Profile picture selection UI */}
      {/* NFT inventory display */}
      {/* Game stats display */}
    </div>
  );
};
```

### Step 7: Display Usernames Throughout the App

Create a utility function to get display names (username, ENS, or truncated address):

Create `src/utils/displayName.ts`:

```typescript
import { firebaseProfiles } from '../firebaseProfiles';

/**
 * Get display name for a wallet address
 * Priority: Username > ENS > Truncated Address
 */
export async function getDisplayName(
  walletAddress: string,
  ensName?: string | null
): Promise<string> {
  if (!walletAddress) return 'Unknown';
  
  // Try to get username from profile
  try {
    const profile = await firebaseProfiles.getProfile(walletAddress);
    if (profile?.username) {
      return profile.username;
    }
  } catch (error) {
    console.error('Error fetching profile for display name:', error);
  }
  
  // Fallback to ENS if provided
  if (ensName) {
    return ensName;
  }
  
  // Fallback to truncated address
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

/**
 * Get display name synchronously (for components that already have profile data)
 */
export function getDisplayNameSync(
  walletAddress: string,
  profile?: { username?: string } | null,
  ensName?: string | null
): string {
  if (!walletAddress) return 'Unknown';
  
  if (profile?.username) {
    return profile.username;
  }
  
  if (ensName) {
    return ensName;
  }
  
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}
```

**Update Leaderboard Component** (`src/components/Leaderboard.tsx` or similar):

```typescript
import { getDisplayName } from '../utils/displayName';

// In your leaderboard component:
const displayName = await getDisplayName(entry.wallet_address, entry.ens_name);
// Or if you have profile data:
const displayName = getDisplayNameSync(entry.wallet_address, profile, entry.ens_name);
```

**Update Game Display** (in `ChessMultiplayer.tsx`):

```typescript
import { getDisplayNameSync } from '../utils/displayName';

// When displaying player names:
const bluePlayerName = getDisplayNameSync(
  gameData.blue_player,
  bluePlayerProfile,
  bluePlayerENS
);
const redPlayerName = getDisplayNameSync(
  gameData.red_player,
  redPlayerProfile,
  redPlayerENS
);
```

**Update Chat Component** (if applicable):

```typescript
// In chat message display:
const senderName = getDisplayNameSync(
  message.walletAddress,
  senderProfile,
  senderENS
);
```

### Step 8: Add Profile Tab to Menu

The profile should be accessible from the menu alongside Leaderboard, Chat, Gallery, etc.

**Update `src/components/ChessMultiplayer.tsx`:**

1. **Update the sidebarView type** to include 'profile':

```typescript
const [sidebarView, setSidebarView] = useState<'moves' | 'leaderboard' | 'gallery' | 'chat' | 'profile' | null>(isMobile ? null : null);
```

2. **Add Profile button to mobile menu** (around line 5479):

```typescript
<button 
  className="mobile-menu-btn"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setSidebarView('profile');
    setIsSidebarOpen(false);
  }}
>
  Profile
</button>
```

3. **Add Profile content view** (around line 5599, after the gallery view):

```typescript
{sidebarView === 'profile' && (
  <div className="profile-compact mobile-content-view">
    <PlayerProfile />
  </div>
)}
```

4. **Import PlayerProfile component** at the top of the file:

```typescript
import { PlayerProfile } from './PlayerProfile';
```

**For Desktop (if you have a sidebar with tabs):**

If your desktop version has a sidebar with tab buttons, add a Profile tab button similar to the Leaderboard and Gallery tabs:

```typescript
<button
  className={`tab-button ${sidebarView === 'profile' ? 'active' : ''}`}
  onClick={() => setSidebarView('profile')}
>
  Profile
</button>
```

And render the profile content:

```typescript
{sidebarView === 'profile' && (
  <div className="profile-sidebar-content">
    <PlayerProfile />
  </div>
)}
```

**Update CSS** (`src/components/ChessMultiplayer.css` or create `src/components/PlayerProfile.css`):

```css
.profile-compact,
.profile-sidebar-content {
  color: #00ff00;
  font-size: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  max-height: 100%;
  overflow-y: auto;
}

.profile-compact h2,
.profile-sidebar-content h2 {
  color: #00ff00;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 255, 0, 0.5);
  padding-bottom: 5px;
}

.username-section {
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-radius: 4px;
}

.username-input-group {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.username-input-group input {
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 0, 0.3);
  color: #00ff00;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.username-input-group input.error {
  border-color: rgba(255, 0, 0, 0.6);
}

.username-input-group button {
  background: rgba(0, 255, 0, 0.2);
  border: 1px solid rgba(0, 255, 0, 0.4);
  color: #00ff00;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.username-input-group button:hover:not(:disabled) {
  background: rgba(0, 255, 0, 0.3);
  border-color: rgba(0, 255, 0, 0.6);
}

.username-input-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #ff4444;
  font-size: 11px;
  margin-top: 5px;
}

.success-message {
  color: #44ff44;
  font-size: 11px;
  margin-top: 5px;
}

.username-hint {
  color: rgba(0, 255, 0, 0.6);
  font-size: 10px;
  margin-top: 5px;
}

.username-badge {
  display: inline-block;
  background: rgba(0, 255, 0, 0.2);
  border: 1px solid rgba(0, 255, 0, 0.4);
  color: #00ff00;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-left: 8px;
}
```

## Option 2: Netlify Functions + Firebase

If you want server-side NFT fetching (better for rate limits):

### Step 1: Create Netlify Function

Create `netlify/functions/fetch-nft-inventory.js`:

```javascript
const { ethers } = require('ethers');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { walletAddress, chainId } = JSON.parse(event.body);
  
  // Fetch NFTs from contracts
  // Return inventory
  
  return {
    statusCode: 200,
    body: JSON.stringify({ inventory })
  };
};
```

### Step 2: Call from Frontend

```typescript
const response = await fetch('/.netlify/functions/fetch-nft-inventory', {
  method: 'POST',
  body: JSON.stringify({ walletAddress, chainId: 1996 })
});
const { inventory } = await response.json();
```

## Implementation Steps Summary

1. ✅ Update Firebase rules for profiles
2. ✅ Create `firebaseProfiles.ts` service
3. ✅ Add NFT collection configs
4. ✅ Create NFT inventory fetcher
5. ✅ Integrate with existing game flow (update stats after matches)
6. ✅ Create profile UI component
7. ✅ Add profile picture selector
8. ✅ Display profile in leaderboard/game UI

## Next Steps

1. Get actual NFT contract addresses for all collections
2. Test NFT fetching with real wallets
3. Design profile UI/UX
4. Add profile link to leaderboard entries
5. Add "View Profile" button in game UI

