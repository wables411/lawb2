import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { firebaseProfiles, type PlayerProfile as PlayerProfileData } from '../firebaseProfiles';
import { fetchNFTInventory } from '../utils/nftInventory';
import { fetchTokenMetadata } from '../utils/nftMetadata';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getUserLeaderboardEntry, getUserRank } from '../firebaseLeaderboard';

interface PlayerProfileProps {
  isMobile?: boolean;
  address?: string; // Optional: view a specific user's profile instead of connected wallet
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ isMobile = false, address: viewAddress }) => {
  const { address: connectedAddress } = useAccount();
  const address = viewAddress || connectedAddress; // Use provided address or fallback to connected wallet
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [refreshingInventory, setRefreshingInventory] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [profileImageSize, setProfileImageSize] = useState<{ width: number; height: number } | null>(null);
  const [statsVisible, setStatsVisible] = useState(true);

  // Immediate console log on render - use window.console to ensure it's not stripped
  if (typeof window !== 'undefined' && window.console) {
    window.console.log('[PROFILE] Component rendered', { address, isMobile, hasProfile: !!profile });
  }

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    
    const loadProfile = async () => {
      setLoading(true);
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] Loading profile for', address);
      }
      try {
        let profileData = await firebaseProfiles.getProfile(address);
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[PROFILE] Profile data from Firebase:', profileData);
        }
        
        // Load game stats from leaderboard
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[PROFILE] Fetching leaderboard entry...');
        }
        const leaderboardEntry = await getUserLeaderboardEntry(address);
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[PROFILE] Leaderboard entry:', leaderboardEntry);
        }
        
        // Get leaderboard rank for border color
        const rank = await getUserRank(address);
        setLeaderboardRank(rank);
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[PROFILE] Leaderboard rank:', rank);
        }
        
        const isOwnProfile = address?.toLowerCase() === connectedAddress?.toLowerCase();
        
        if (!profileData) {
          // Only create profile if it's the user's own profile
          if (isOwnProfile) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE] Creating new profile for own account...');
            }
            await firebaseProfiles.upsertProfile(address, {});
            profileData = await firebaseProfiles.getProfile(address);
          } else {
            // For viewing other users, create a minimal profile object with default values
            profileData = {
              wallet_address: address.toLowerCase(),
          nft_inventory: {
            lawbsters: [],
            lawbstarz: [],
            halloween_lawbsters: [],
            pixelawbs: [],
            asciilawbs: []
          },
              game_stats: {
                total_games: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                total_points: 0,
                win_rate: 0,
                last_match_timestamp: null,
                last_match_invite_code: null
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as PlayerProfileData;
          }
        }
        
        // Ensure profileData has required fields
        if (profileData) {
          if (!profileData.nft_inventory) {
            profileData.nft_inventory = {
              lawbsters: [],
              lawbstarz: [],
              halloween_lawbsters: [],
              pixelawbs: [],
              asciilawbs: []
            };
          }
          if (!profileData.game_stats) {
            profileData.game_stats = {
              total_games: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              total_points: 0,
              win_rate: 0,
              last_match_timestamp: null,
              last_match_invite_code: null
            };
          }
        }
        
        // Sync leaderboard stats to profile if leaderboard has data
        if (leaderboardEntry && profileData) {
          // Validate and convert leaderboard data to numbers
          const totalGames = Number(leaderboardEntry.total_games) || 0;
          const wins = Number(leaderboardEntry.wins) || 0;
          const losses = Number(leaderboardEntry.losses) || 0;
          const draws = Number(leaderboardEntry.draws) || 0;
          const points = Number(leaderboardEntry.points) || 0;
          
          const leaderboardStats = {
            total_games: totalGames,
            wins: wins,
            losses: losses,
            draws: draws,
            total_points: points,
            win_rate: totalGames > 0 ? wins / totalGames : 0,
            last_match_timestamp: leaderboardEntry.updated_at || null,
            last_match_invite_code: null
          };
          
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[PROFILE] Syncing leaderboard stats:', leaderboardStats, 'from entry:', leaderboardEntry);
          }
          // Always use leaderboard data for display (it's the source of truth)
          profileData.game_stats = leaderboardStats;
          // Only sync to Firebase profile if it's the user's own profile
          if (isOwnProfile) {
            await firebaseProfiles.upsertProfile(address, { game_stats: leaderboardStats });
            const updated = await firebaseProfiles.getProfile(address);
            if (updated) profileData = updated;
          }
        } else {
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[PROFILE] No leaderboard entry found. Leaderboard entry:', leaderboardEntry, 'Profile data:', profileData);
          }
        }
        
        // Always refresh NFT inventory to ensure accuracy (Etherscan/contract data is source of truth)
        // Only refresh for own profile to avoid unnecessary API calls
        if (profileData && isOwnProfile) {
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[PROFILE] Refreshing NFT inventory to ensure accuracy...');
          }
          try {
            const inventory = await fetchNFTInventory(address);
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE] NFT inventory fetched:', inventory);
            }
            await firebaseProfiles.updateNFTInventory(address, inventory);
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE] NFT inventory saved to Firebase');
            }
            const updated = await firebaseProfiles.getProfile(address);
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE] Updated profile from Firebase:', updated);
              window.console.log('[PROFILE] Updated profile nft_inventory:', updated?.nft_inventory);
            }
            if (updated) {
              profileData = updated;
              // Force update the state immediately
              setProfile(updated);
            }
          } catch (invError) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.error('[PROFILE] Error fetching NFT inventory:', invError);
            }
            // If refresh fails, use existing inventory as fallback
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE] Using existing NFT inventory as fallback:', profileData.nft_inventory);
            }
          }
        }
        
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[PROFILE] Final profile data:', profileData);
        }
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[PROFILE] Error loading profile:', error);
        }
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
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] Refreshing NFT inventory for', address);
      }
      const inventory = await fetchNFTInventory(address);
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] NFT inventory fetched:', inventory);
      }
      await firebaseProfiles.updateNFTInventory(address, inventory);
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] NFT inventory saved to Firebase');
      }
      const updatedProfile = await firebaseProfiles.getProfile(address);
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] Updated profile from Firebase:', updatedProfile);
        window.console.log('[PROFILE] Updated profile nft_inventory:', updatedProfile?.nft_inventory);
      }
      setProfile(updatedProfile);
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] Profile state updated with inventory');
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('[PROFILE] Error refreshing NFT inventory:', error);
      }
    } finally {
      setRefreshingInventory(false);
    }
  };

  const handleSelectProfilePicture = async (collection: keyof typeof NFT_COLLECTIONS, tokenId: string) => {
    if (!address) return;
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[PROFILE] Selecting profile picture:', collection, tokenId);
    }
    try {
      const metadata = await fetchTokenMetadata(collection, tokenId, address);
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[PROFILE] Metadata fetched:', metadata);
      }
      
      if (!metadata.image_url) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[PROFILE] No image URL found for token', tokenId, 'in collection', collection);
        }
        alert('Failed to fetch image URL for this NFT. Please try another one.');
        return;
      }
      
      await firebaseProfiles.updateProfilePicture(address, {
        collection,
        token_id: tokenId,
        image_url: metadata.image_url
      });
      const updatedProfile = await firebaseProfiles.getProfile(address);
      if (updatedProfile) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[PROFILE] Profile picture updated:', updatedProfile.profile_picture);
        }
        setProfile(updatedProfile);
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('[PROFILE] Error setting profile picture:', error);
      }
      alert('Failed to set profile picture. Please try again.');
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

  // Determine if this is own profile
  const isOwnProfile = address?.toLowerCase() === connectedAddress?.toLowerCase();

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

  const inventory = {
    lawbsters: profile?.nft_inventory?.lawbsters || [],
    lawbstarz: profile?.nft_inventory?.lawbstarz || [],
    halloween_lawbsters: profile?.nft_inventory?.halloween_lawbsters || [],
    pixelawbs: profile?.nft_inventory?.pixelawbs || [],
    asciilawbs: profile?.nft_inventory?.asciilawbs || []
  };

  // Debug logging
  if (typeof window !== 'undefined' && window.console) {
    window.console.log('[PROFILE RENDER] Current profile:', profile);
    window.console.log('[PROFILE RENDER] Current inventory:', inventory);
    window.console.log('[PROFILE RENDER] Inventory counts:', {
      lawbsters: inventory.lawbsters?.length || 0,
      lawbstarz: inventory.lawbstarz?.length || 0,
      halloween_lawbsters: inventory.halloween_lawbsters?.length || 0,
      pixelawbs: inventory.pixelawbs?.length || 0,
      asciilawbs: inventory.asciilawbs?.length || 0
    });
  }

  const totalNFTs = (inventory.lawbsters?.length || 0) + (inventory.lawbstarz?.length || 0) + 
                    (inventory.halloween_lawbsters?.length || 0) + (inventory.pixelawbs?.length || 0) +
                    (inventory.asciilawbs?.length || 0);

  // Determine border color based on leaderboard rank
  const getBorderColor = () => {
    if (!leaderboardRank) return '#ff0000'; // Default red
    if (leaderboardRank === 1) return '#ffd700'; // Gold
    if (leaderboardRank === 2) return '#c0c0c0'; // Silver
    if (leaderboardRank >= 3 && leaderboardRank <= 10) return '#4169e1'; // Blue
    return '#ff0000'; // Red for below 10th place
  };

  // Get profile image URL or default
  const profileImageUrl = profile?.profile_picture?.image_url || '/images/sticker4.png';

  // Handle image load to get dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setProfileImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[PROFILE] Image loaded, dimensions:', img.naturalWidth, 'x', img.naturalHeight);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      padding: isMobile ? '16px' : '20px',
      gap: '20px'
    }}>
      {/* Pokemon Card Style Profile */}
      <div style={{
        position: 'relative',
        width: profileImageSize ? `${Math.min(profileImageSize.width, isMobile ? 350 : 600)}px` : '100%',
        maxWidth: '100%',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `4px solid ${getBorderColor()}`,
        transform: 'perspective(1000px) rotateX(2deg)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        background: '#fff',
        zIndex: 1,
        cursor: !isOwnProfile ? 'pointer' : 'default'
      }}
      onClick={(e) => {
        // Removed stats toggle - stats are now in separate section, not overlay
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'perspective(1000px) rotateX(2deg)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)';
        }
      }}
      >
        {/* Profile Image as Background */}
        <img 
          src={profileImageUrl}
          alt="Profile"
          onError={(e) => {
            if (typeof window !== 'undefined' && window.console) {
              window.console.error('[PROFILE] Failed to load profile picture:', profileImageUrl);
            }
            // Fallback to default
            e.currentTarget.src = '/images/sticker4.png';
          }}
          onLoad={handleImageLoad}
          style={{ 
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            background: '#fff'
          }} 
        />
        
        {/* Stats overlay removed - moved to separate section above NFT inventory */}
      </div>

      {/* Editing Features - Only show when viewing own profile */}
      {isOwnProfile && (
        <>

          {/* Username Section */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '4px', width: '100%', maxWidth: '600px' }}>
        {!profile?.username ? (
          <>
            <h4 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '13px' : '14px' }}>Create Username</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                id="username-input"
                name="username"
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
                id="username-change-input"
                name="username-change"
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

              {/* Chess Stats Section - Above NFT Inventory */}
              {statsVisible && (() => {
                // Check if dark mode is active
                const isDarkMode = typeof document !== 'undefined' && 
                  (document.body.classList.contains('lawb-app-dark-mode') || 
                   document.documentElement.classList.contains('lawb-app-dark-mode'));
                
                return (
                  <div style={{ 
                    marginBottom: '20px', 
                    width: '100%', 
                    maxWidth: '600px',
                    padding: '12px',
                    background: isDarkMode ? '#000000' : '#f0f0f0',
                    border: isDarkMode ? '2px outset #00ff00' : '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: isMobile ? '13px' : '14px',
                        color: isDarkMode ? '#00ff00' : '#000000'
                      }}>
                        Chess Stats
                      </h4>
                      {!isOwnProfile && (
                        <button
                          onClick={() => setStatsVisible(false)}
                          style={{
                            padding: '2px 6px',
                            background: isDarkMode ? '#000000' : '#c0c0c0',
                            border: isDarkMode ? '1px solid #00ff00' : '1px solid #999',
                            color: isDarkMode ? '#00ff00' : '#000000',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '9px' : '10px'
                          }}
                        >
                          Hide
                        </button>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: isDarkMode ? '#00ff00' : '#000000'
                    }}>
                      {displayName}
                    </div>
                    {profile?.username && (
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '11px', 
                        color: isDarkMode ? '#00ff00' : '#666',
                        marginBottom: '12px'
                      }}>
                        @{profile.username}
                      </div>
                    )}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '8px',
                      fontSize: isMobile ? '11px' : '12px',
                      color: isDarkMode ? '#00ff00' : '#000000'
                    }}>
                      <div>Games: <strong>{stats.total_games}</strong></div>
                      <div>Wins: <strong>{stats.wins}</strong></div>
                      <div>Losses: <strong>{stats.losses}</strong></div>
                      <div>Draws: <strong>{stats.draws}</strong></div>
                      <div>Win Rate: <strong>{(stats.win_rate * 100).toFixed(1)}%</strong></div>
                      <div>Points: <strong>{stats.total_points}</strong></div>
                    </div>
                    {leaderboardRank && (
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '11px', 
                        color: isDarkMode ? '#00ff00' : '#666',
                        marginTop: '8px',
                        textAlign: 'center'
                      }}>
                        Rank: <strong>#{leaderboardRank}</strong>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {!statsVisible && !isOwnProfile && (() => {
                // Check if dark mode is active
                const isDarkMode = typeof document !== 'undefined' && 
                  (document.body.classList.contains('lawb-app-dark-mode') || 
                   document.documentElement.classList.contains('lawb-app-dark-mode'));
                
                return (
                  <div style={{ 
                    marginBottom: '20px', 
                    width: '100%', 
                    maxWidth: '600px',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => setStatsVisible(true)}
                      style={{
                        padding: '8px 16px',
                        background: isDarkMode ? '#000000' : '#c0c0c0',
                        border: isDarkMode ? '2px outset #00ff00' : '2px outset #fff',
                        color: isDarkMode ? '#00ff00' : '#000000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '11px' : '12px'
                      }}
                    >
                      Show Chess Stats
                    </button>
                  </div>
                );
              })()}

              <div style={{ marginBottom: '20px', width: '100%', maxWidth: '600px' }}>
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
          <div>Lawbsters: {inventory.lawbsters?.length || 0}</div>
          <div>Lawbstarz: {inventory.lawbstarz?.length || 0}</div>
          <div>Halloween Lawbsters: {inventory.halloween_lawbsters?.length || 0}</div>
          <div>Pixelawbs: {inventory.pixelawbs?.length || 0}</div>
          <div>ASCII Lawbsters: {inventory.asciilawbs?.length || 0}</div>
        </div>
        {totalNFTs === 0 && (
          <div style={{ marginTop: '8px', fontSize: isMobile ? '11px' : '12px', color: '#888', fontStyle: 'italic' }}>
            No NFTs found. Click Refresh to check your wallet.
          </div>
        )}
      </div>

          {/* Profile Picture Selection */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '4px', width: '100%', maxWidth: '600px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '13px' : '14px' }}>Profile Picture</h4>
        {(() => {
          if (!profile) return false;
          const totalNFTs = (profile?.nft_inventory?.lawbsters?.length || 0) + 
                           (profile?.nft_inventory?.lawbstarz?.length || 0) + 
                           (profile?.nft_inventory?.halloween_lawbsters?.length || 0) + 
                           (profile?.nft_inventory?.pixelawbs?.length || 0) +
                           (profile?.nft_inventory?.asciilawbs?.length || 0);
          // Clear profile picture if no NFTs owned
          if (totalNFTs === 0 && profile?.profile_picture) {
            // Clear profile picture asynchronously
            firebaseProfiles.updateProfilePicture(address, null).catch(err => {
              if (typeof window !== 'undefined' && window.console) {
                window.console.error('[PROFILE] Error clearing profile picture:', err);
              }
            });
          }
          return profile?.profile_picture && totalNFTs > 0;
        })() ? (
          profile?.profile_picture && (
            <div style={{ marginBottom: '12px' }}>
              <img 
                src={profile.profile_picture.image_url} 
                alt="Current profile picture"
                onError={(e) => {
                  if (typeof window !== 'undefined' && window.console) {
                    window.console.error('[PROFILE] Failed to load profile picture in selection:', profile.profile_picture?.image_url);
                  }
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  if (typeof window !== 'undefined' && window.console) {
                    window.console.log('[PROFILE] Profile picture loaded in selection:', profile.profile_picture?.image_url);
                  }
                }}
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '4px', 
                  border: '2px solid #000',
                  objectFit: 'cover',
                  marginBottom: '8px',
                  backgroundColor: '#f0f0f0'
                }} 
              />
              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                {NFT_COLLECTIONS[profile.profile_picture.collection].name} #{profile.profile_picture.token_id}
              </div>
            </div>
          )
        ) : (
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#888', marginBottom: '12px' }}>
            No profile picture set. Select an NFT below.
          </div>
        )}
        
        {/* NFT Selection for Profile Picture */}
        {totalNFTs > 0 && (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <div style={{ fontSize: isMobile ? '11px' : '12px', marginBottom: '8px', fontWeight: 'bold' }}>
              Select from your NFTs:
            </div>
            {(inventory.pixelawbs?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>Pixelawbs:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.pixelawbs || []).slice(0, 10).map(tokenId => (
                    <button
                      key={`pixelawbs-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('pixelawbs', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'pixelawbs' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'pixelawbs' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      #{tokenId}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(inventory.lawbsters?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>Lawbsters:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.lawbsters || []).slice(0, 10).map(tokenId => (
                    <button
                      key={`lawbsters-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('lawbsters', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'lawbsters' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'lawbsters' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      #{tokenId}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(inventory.lawbstarz?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>Lawbstarz:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.lawbstarz || []).slice(0, 10).map(tokenId => (
                    <button
                      key={`lawbstarz-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('lawbstarz', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'lawbstarz' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'lawbstarz' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      #{tokenId}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(inventory.halloween_lawbsters?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>Halloween Lawbsters:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.halloween_lawbsters || []).slice(0, 10).map(tokenId => (
                    <button
                      key={`halloween-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('halloween_lawbsters', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'halloween_lawbsters' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'halloween_lawbsters' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      #{tokenId}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(inventory.asciilawbs?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>ASCII Lawbsters:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.asciilawbs || []).slice(0, 10).map((tokenId: string) => (
                    <button
                      key={`asciilawbs-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('asciilawbs', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'asciilawbs' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'asciilawbs' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      #{tokenId}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {totalNFTs === 0 && (
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#888', fontStyle: 'italic' }}>
            No NFTs found. Click "Refresh" above to check your wallet.
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
};

