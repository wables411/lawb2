import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { firebaseProfiles, type PlayerProfile as PlayerProfileData } from '../firebaseProfiles';
import { fetchNFTInventory } from '../utils/nftInventory';
import { fetchTokenMetadata } from '../utils/nftMetadata';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getUserLeaderboardEntry } from '../firebaseLeaderboard';

interface PlayerProfileProps {
  isMobile?: boolean;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ isMobile = false }) => {
  const { address } = useAccount();
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [refreshingInventory, setRefreshingInventory] = useState(false);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    
    const loadProfile = async () => {
      setLoading(true);
      try {
        let profileData = await firebaseProfiles.getProfile(address);
        
        // Load game stats from leaderboard
        const leaderboardEntry = await getUserLeaderboardEntry(address);
        
        if (!profileData) {
          // Create profile if it doesn't exist
          await firebaseProfiles.upsertProfile(address, {});
          profileData = await firebaseProfiles.getProfile(address);
        }
        
        // Sync leaderboard stats to profile if leaderboard has data
        if (leaderboardEntry) {
          console.log('[PROFILE] Leaderboard entry found:', leaderboardEntry);
          const leaderboardStats = {
            total_games: leaderboardEntry.total_games || 0,
            wins: leaderboardEntry.wins || 0,
            losses: leaderboardEntry.losses || 0,
            draws: leaderboardEntry.draws || 0,
            total_points: leaderboardEntry.points || 0,
            win_rate: leaderboardEntry.total_games > 0 
              ? (leaderboardEntry.wins || 0) / leaderboardEntry.total_games 
              : 0,
            last_match_timestamp: leaderboardEntry.updated_at || null,
            last_match_invite_code: null
          };
          
          // Always use leaderboard data for display (it's the source of truth)
          if (profileData) {
            profileData.game_stats = leaderboardStats;
            // Also sync to Firebase profile
            await firebaseProfiles.upsertProfile(address, { game_stats: leaderboardStats });
            profileData = await firebaseProfiles.getProfile(address);
          }
        } else {
          console.log('[PROFILE] No leaderboard entry found for', address);
        }
        
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
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

  const handleRefreshInventory = async () => {
    if (!address) return;
    
    setRefreshingInventory(true);
    try {
      console.log('[PROFILE] Refreshing NFT inventory for', address);
      const inventory = await fetchNFTInventory(address);
      console.log('[PROFILE] NFT inventory fetched:', inventory);
      await firebaseProfiles.updateNFTInventory(address, inventory);
      const updatedProfile = await firebaseProfiles.getProfile(address);
      setProfile(updatedProfile);
      console.log('[PROFILE] Profile updated with inventory');
    } catch (error) {
      console.error('[PROFILE] Error refreshing NFT inventory:', error);
    } finally {
      setRefreshingInventory(false);
    }
  };

  const handleSelectProfilePicture = async (collection: keyof typeof NFT_COLLECTIONS, tokenId: string) => {
    if (!address) return;
    
    try {
      const metadata = await fetchTokenMetadata(collection, tokenId);
      await firebaseProfiles.updateProfilePicture(address, {
        collection,
        token_id: tokenId,
        image_url: metadata.image_url
      });
      const updatedProfile = await firebaseProfiles.getProfile(address);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error setting profile picture:', error);
    }
  };

  if (loading) {
    return (
      <div className="profile-compact" style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="profile-compact" style={{ padding: '20px', textAlign: 'center' }}>
        <div>Please connect your wallet to view your profile</div>
      </div>
    );
  }

  const displayName = profile?.username 
    ? profile.username 
    : `${address.slice(0, 6)}...${address.slice(-4)}`;

  const stats = profile?.game_stats || {
    total_games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    total_points: 0,
    win_rate: 0,
    last_match_timestamp: null,
    last_match_invite_code: null
  };

  const inventory = profile?.nft_inventory || {
    lawbsters: [],
    lawbstarz: [],
    halloween_lawbsters: [],
    pixelawbs: []
  };

  const totalNFTs = inventory.lawbsters.length + inventory.lawbstarz.length + 
                    inventory.halloween_lawbsters.length + inventory.pixelawbs.length;

  return (
    <div className="profile-compact" style={{ padding: isMobile ? '16px' : '20px', fontSize: isMobile ? '12px' : '14px' }}>
      {/* Profile Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        {profile?.profile_picture?.image_url && (
          <img 
            src={profile.profile_picture.image_url} 
            alt="Profile" 
            style={{ 
              width: isMobile ? '60px' : '80px', 
              height: isMobile ? '60px' : '80px', 
              borderRadius: '50%', 
              border: '2px solid #000',
              marginBottom: '10px',
              objectFit: 'cover'
            }} 
          />
        )}
        <h3 style={{ margin: '8px 0', fontSize: isMobile ? '16px' : '18px' }}>{displayName}</h3>
        {profile?.username && (
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>@{profile.username}</div>
        )}
        <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#888', marginTop: '4px' }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>

      {/* Username Section */}
      <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
        {!profile?.username ? (
          <>
            <h4 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '13px' : '14px' }}>Create Username</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="3-20 characters"
                maxLength={20}
                style={{
                  flex: 1,
                  padding: '6px',
                  border: usernameError ? '2px solid #ff0000' : '1px solid #ccc',
                  borderRadius: '2px',
                  fontSize: isMobile ? '12px' : '13px'
                }}
              />
              <button 
                onClick={handleSetUsername}
                disabled={!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername}
                style={{
                  padding: '6px 12px',
                  background: '#000080',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '11px' : '12px',
                  opacity: (!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername) ? 0.5 : 1
                }}
              >
                {isCheckingUsername ? 'Checking...' : 'Set'}
              </button>
            </div>
            {usernameError && <div style={{ color: '#ff0000', fontSize: isMobile ? '11px' : '12px', marginTop: '4px' }}>{usernameError}</div>}
            {usernameSuccess && <div style={{ color: '#008000', fontSize: isMobile ? '11px' : '12px', marginTop: '4px' }}>Username set!</div>}
          </>
        ) : (
          <>
            <div style={{ marginBottom: '8px', fontSize: isMobile ? '12px' : '13px' }}>Username: <strong>@{profile.username}</strong></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="New username"
                maxLength={20}
                style={{
                  flex: 1,
                  padding: '6px',
                  border: usernameError ? '2px solid #ff0000' : '1px solid #ccc',
                  borderRadius: '2px',
                  fontSize: isMobile ? '12px' : '13px'
                }}
              />
              <button 
                onClick={handleSetUsername}
                disabled={!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername}
                style={{
                  padding: '6px 12px',
                  background: '#000080',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '11px' : '12px',
                  opacity: (!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername) ? 0.5 : 1
                }}
              >
                Change
              </button>
            </div>
            {usernameError && <div style={{ color: '#ff0000', fontSize: isMobile ? '11px' : '12px', marginTop: '4px' }}>{usernameError}</div>}
            {usernameSuccess && <div style={{ color: '#008000', fontSize: isMobile ? '11px' : '12px', marginTop: '4px' }}>Updated!</div>}
          </>
        )}
      </div>

      {/* Game Stats */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '13px' : '14px' }}>Game Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: isMobile ? '11px' : '12px' }}>
          <div>Total Games: <strong>{stats.total_games}</strong></div>
          <div>Wins: <strong>{stats.wins}</strong></div>
          <div>Losses: <strong>{stats.losses}</strong></div>
          <div>Draws: <strong>{stats.draws}</strong></div>
          <div>Win Rate: <strong>{(stats.win_rate * 100).toFixed(1)}%</strong></div>
          <div>Points: <strong>{stats.total_points}</strong></div>
        </div>
      </div>

      {/* NFT Inventory */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: isMobile ? '13px' : '14px' }}>NFT Inventory ({totalNFTs})</h4>
          <button
            onClick={handleRefreshInventory}
            disabled={refreshingInventory}
            style={{
              padding: '4px 8px',
              background: '#000080',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: isMobile ? '10px' : '11px',
              opacity: refreshingInventory ? 0.5 : 1
            }}
          >
            {refreshingInventory ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div style={{ fontSize: isMobile ? '11px' : '12px', lineHeight: '1.6' }}>
          <div>Lawbsters: {inventory.lawbsters.length}</div>
          <div>Lawbstarz: {inventory.lawbstarz.length}</div>
          <div>Halloween Lawbsters: {inventory.halloween_lawbsters.length}</div>
          <div>Pixelawbs: {inventory.pixelawbs.length}</div>
        </div>
        {totalNFTs === 0 && (
          <div style={{ marginTop: '8px', fontSize: isMobile ? '11px' : '12px', color: '#888', fontStyle: 'italic' }}>
            No NFTs found. Click Refresh to check your wallet.
          </div>
        )}
      </div>

      {/* Profile Picture Selection (simplified - just shows current) */}
      {profile?.profile_picture && (
        <div style={{ marginTop: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
          <div style={{ fontSize: isMobile ? '12px' : '13px', marginBottom: '8px' }}>Profile Picture</div>
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
            {NFT_COLLECTIONS[profile.profile_picture.collection].name} #{profile.profile_picture.token_id}
          </div>
        </div>
      )}
    </div>
  );
};

