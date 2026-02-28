import React, { useState, useEffect } from 'react';
import { firebaseProfiles, type PlayerProfile as PlayerProfileData, type LinkedWallet } from '../firebaseProfiles';
import { fetchLawbampUploadsForUser, type LawbampUploadEntry } from '../firebaseLawbampUploads';
import { fetchNFTInventory, fetchAggregatedNFTInventory, type WalletDescriptor } from '../utils/nftInventory';
import { fetchTokenMetadata } from '../utils/nftMetadata';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getUserLeaderboardEntry, getUserRank } from '../firebaseLeaderboard';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { useMultiChainBalances } from '../hooks/useMultiChainBalances';
import { useAppKit } from '@reown/appkit/react';

interface PlayerProfileProps {
  isMobile?: boolean;
  address?: string; // Optional: view a specific user's profile instead of connected wallet
}

interface SolanaGalleryCard {
  collection: 'lawbstation' | 'lawbnexus';
  tokenId: string;
  name: string;
  imageUrl: string;
}

function shortenAddr(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function detectWalletChain(address: string): 'evm' | 'solana' | null {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'evm';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'solana';
  return null;
}

const WalletLinkingSection: React.FC<{
  isOwnProfile: boolean;
  isMobile: boolean;
  primaryWallet: string | null;
  linkedWallets: LinkedWallet[];
  connectedEvmAddress?: string;
  connectedSolanaAddress?: string;
  linkingWallet: boolean;
  onOpenConnect: () => void;
  onLink: (address: string, chain: 'evm' | 'solana') => void;
  onUnlink: (address: string) => void;
}> = ({
  isOwnProfile,
  isMobile,
  primaryWallet,
  linkedWallets,
  connectedEvmAddress,
  connectedSolanaAddress,
  linkingWallet,
  onOpenConnect,
  onLink,
  onUnlink,
}) => {
  const [manualWalletInput, setManualWalletInput] = useState('');
  const [manualWalletError, setManualWalletError] = useState<string | null>(null);
  if (!primaryWallet) return null;

  const linkedAddrs = new Set(linkedWallets.map((w) => w.address.toLowerCase()));
  linkedAddrs.add(primaryWallet.toLowerCase());

  const canLinkEvm =
    isOwnProfile &&
    connectedEvmAddress &&
    !linkedAddrs.has(connectedEvmAddress.toLowerCase());

  const canLinkSolana =
    isOwnProfile &&
    connectedSolanaAddress &&
    !linkedAddrs.has(connectedSolanaAddress.toLowerCase());

  const hasAnythingToShow = linkedWallets.length > 0 || canLinkEvm || canLinkSolana;
  if (!hasAnythingToShow && !isOwnProfile) return null;

  return (
    <div style={{
      marginBottom: '20px',
      width: '100%',
      maxWidth: '600px',
      padding: '12px',
      background: '#f0f0f0',
      borderRadius: '4px',
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '13px' : '14px' }}>
        Linked Wallets
      </h4>
      <div style={{ fontSize: isMobile ? '11px' : '12px', marginBottom: '8px' }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: '3px',
          background: primaryWallet.startsWith('0x') ? '#627EEA' : '#9945FF',
          color: '#fff',
          fontSize: isMobile ? '9px' : '10px',
          marginRight: '6px',
        }}>
          {primaryWallet.startsWith('0x') ? 'EVM' : 'SOL'}
        </span>
        {shortenAddr(primaryWallet)} <span style={{ color: '#888' }}>(primary)</span>
      </div>
      {linkedWallets.map((lw) => (
        <div
          key={lw.address}
          style={{
            fontSize: isMobile ? '11px' : '12px',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: '3px',
            background: lw.chain === 'evm' ? '#627EEA' : '#9945FF',
            color: '#fff',
            fontSize: isMobile ? '9px' : '10px',
          }}>
            {lw.chain === 'evm' ? 'EVM' : 'SOL'}
          </span>
          {shortenAddr(lw.address)}
          {isOwnProfile && (
            <button
              onClick={() => onUnlink(lw.address)}
              disabled={linkingWallet}
              style={{
                padding: '1px 6px',
                background: '#c0392b',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: isMobile ? '9px' : '10px',
                opacity: linkingWallet ? 0.5 : 1,
              }}
            >
              Unlink
            </button>
          )}
        </div>
      ))}
      {canLinkEvm && connectedEvmAddress && (
        <button
          onClick={() => onLink(connectedEvmAddress, 'evm')}
          disabled={linkingWallet}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: '#627EEA',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: isMobile ? '11px' : '12px',
            opacity: linkingWallet ? 0.5 : 1,
          }}
        >
          {linkingWallet ? 'Linking...' : `Link EVM Wallet (${shortenAddr(connectedEvmAddress)})`}
        </button>
      )}
      {canLinkSolana && connectedSolanaAddress && (
        <button
          onClick={() => onLink(connectedSolanaAddress, 'solana')}
          disabled={linkingWallet}
          style={{
            marginTop: '8px',
            marginLeft: canLinkEvm ? '8px' : '0',
            padding: '6px 12px',
            background: '#9945FF',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: isMobile ? '11px' : '12px',
            opacity: linkingWallet ? 0.5 : 1,
          }}
        >
          {linkingWallet ? 'Linking...' : `Link Solana Wallet (${shortenAddr(connectedSolanaAddress)})`}
        </button>
      )}
      {isOwnProfile && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={onOpenConnect}
            disabled={linkingWallet}
            style={{
              marginBottom: '8px',
              padding: '6px 12px',
              background: '#000080',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: linkingWallet ? 'default' : 'pointer',
              fontSize: isMobile ? '11px' : '12px',
              opacity: linkingWallet ? 0.5 : 1,
            }}
          >
            Connect Wallet
          </button>
          <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', color: '#444' }}>
            Link another wallet address
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <input
              value={manualWalletInput}
              onChange={(e) => {
                setManualWalletInput(e.target.value);
                setManualWalletError(null);
              }}
              placeholder="0x... or Solana address"
              style={{
                flex: 1,
                minWidth: isMobile ? '100%' : '260px',
                padding: '6px',
                border: manualWalletError ? '2px solid #c0392b' : '1px solid #bbb',
                borderRadius: '3px',
                fontSize: isMobile ? '11px' : '12px',
              }}
            />
            <button
              disabled={linkingWallet || !manualWalletInput.trim()}
              onClick={() => {
                const candidate = manualWalletInput.trim();
                const chain = detectWalletChain(candidate);
                if (!chain) {
                  setManualWalletError('Enter a valid EVM (0x...) or Solana address.');
                  return;
                }
                if (linkedAddrs.has(candidate.toLowerCase())) {
                  setManualWalletError('That wallet is already linked.');
                  return;
                }
                void onLink(candidate, chain);
                setManualWalletInput('');
              }}
              style={{
                padding: '6px 10px',
                background: '#1f6f3f',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: linkingWallet ? 'default' : 'pointer',
                fontSize: isMobile ? '11px' : '12px',
                opacity: linkingWallet || !manualWalletInput.trim() ? 0.5 : 1,
              }}
            >
              {linkingWallet ? 'Linking...' : 'Link Address'}
            </button>
          </div>
          {manualWalletError && (
            <div style={{ marginTop: '4px', color: '#c0392b', fontSize: isMobile ? '10px' : '11px' }}>
              {manualWalletError}
            </div>
          )}
        </div>
      )}
      {!canLinkEvm && !canLinkSolana && linkedWallets.length === 0 && isOwnProfile && (
        <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
          Connect wallets in AppKit or paste an address to link it.
        </div>
      )}
    </div>
  );
};

const TokenBalancesSection: React.FC<{
  isMobile: boolean;
  primaryWallet: string | null;
  linkedWallets: LinkedWallet[];
}> = ({ isMobile, primaryWallet, linkedWallets }) => {
  const evmAddress = (() => {
    if (!primaryWallet) return undefined;
    if (primaryWallet.startsWith('0x')) return primaryWallet;
    const evmLink = linkedWallets.find((w) => w.chain === 'evm');
    return evmLink?.address;
  })();

  const solanaAddress = (() => {
    if (!primaryWallet) return undefined;
    if (!primaryWallet.startsWith('0x')) return primaryWallet;
    const solLink = linkedWallets.find((w) => w.chain === 'solana');
    return solLink?.address;
  })();

  const balances = useMultiChainBalances(evmAddress, solanaAddress);

  if (!primaryWallet) return null;

  const formatBalance = (val: number): string => {
    if (val === 0) return '0';
    if (val < 0.01) return '<0.01';
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
    return val.toFixed(2);
  };

  const tokens = [
    { label: '$CLAWB', chain: 'Base', value: balances.clawbBase, color: '#E74C3C', chainColor: '#627EEA', hasWallet: !!evmAddress },
    { label: '$CLAWB', chain: 'Solana', value: balances.clawbSol, color: '#E74C3C', chainColor: '#9945FF', hasWallet: !!solanaAddress },
    { label: '$LAWB', chain: 'Solana', value: balances.lawbSol, color: '#8B4513', chainColor: '#9945FF', hasWallet: !!solanaAddress },
    { label: '$LAWB', chain: 'Arbitrum', value: balances.lawbArb, color: '#8B4513', chainColor: '#28A0F0', hasWallet: !!evmAddress },
  ];

  return (
    <div style={{
      marginBottom: '20px',
      width: '100%',
      maxWidth: '600px',
      padding: '12px',
      background: '#f0f0f0',
      borderRadius: '4px',
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '13px' : '14px' }}>
        Token Balances {balances.loading && <span style={{ fontWeight: 400, fontSize: isMobile ? '10px' : '11px', color: '#888' }}>(loading...)</span>}
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
        gap: '8px',
      }}>
        {tokens.map((t) => (
          <div
            key={`${t.label}-${t.chain}`}
            style={{
              padding: '10px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              opacity: t.hasWallet ? 1 : 0.45,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}>
              <span style={{
                fontWeight: 700,
                fontSize: isMobile ? '12px' : '13px',
                color: t.color,
              }}>
                {t.label}
              </span>
              <span style={{
                padding: '1px 5px',
                borderRadius: '3px',
                background: t.chainColor,
                color: '#fff',
                fontSize: isMobile ? '8px' : '9px',
                fontWeight: 600,
              }}>
                {t.chain}
              </span>
            </div>
            <div style={{
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 700,
            }}>
              {t.hasWallet ? formatBalance(t.value) : '—'}
            </div>
            {!t.hasWallet && (
              <div style={{ fontSize: isMobile ? '9px' : '10px', color: '#888', fontStyle: 'italic' }}>
                Link {t.chain === 'Solana' ? 'Solana' : 'EVM'} wallet
              </div>
            )}
          </div>
        ))}
      </div>
      {balances.error && (
        <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#c0392b', marginTop: '6px' }}>
          {balances.error}
        </div>
      )}
    </div>
  );
};

const CLAWB_SOLANA_WALLET = 'FveSNArbJsdx5JTmGE8cti9pBt5gH8NVTrUvcp1C2Mbp';
const METEORA_POSITION = '13N61SZdGVFgM24t6mtYbAhV7T2nD67QmzEqsaT1DEeg';
const METEORA_PAIR = 'AVoLSxAV41A2estUDUkV4yCM9GJ7dM7V2A57jNtoaoWD';
const METEORA_API = 'https://dlmm-api.meteora.ag';

interface LpPositionData {
  pairName: string;
  currentPrice: number;
  feesClaimedUsd: number;
  feeApy24h: number;
  volume24h: number;
  fees24h: number;
  poolApr: number;
  reserveX: number;
  reserveY: number;
}

function useMeteorLpPosition() {
  const [data, setData] = useState<LpPositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [pos, pair] = await Promise.all([
          fetch(`${METEORA_API}/position/${METEORA_POSITION}`, { signal: AbortSignal.timeout(12000) }).then(r => r.json()),
          fetch(`${METEORA_API}/pair/${METEORA_PAIR}`, { signal: AbortSignal.timeout(12000) }).then(r => r.json()),
        ]);
        if (cancelled) return;
        setData({
          pairName: pair.name || 'CLAWB-LAWB',
          currentPrice: pair.current_price ?? 0,
          feesClaimedUsd: pos.total_fee_usd_claimed ?? 0,
          feeApy24h: pos.fee_apy_24h ?? 0,
          volume24h: pair.trade_volume_24h ?? 0,
          fees24h: pair.fees_24h ?? 0,
          poolApr: pair.apr ?? 0,
          reserveX: pair.reserve_x_amount ?? 0,
          reserveY: pair.reserve_y_amount ?? 0,
        });
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load LP data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

const ClawbLpSection: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { data, loading, error } = useMeteorLpPosition();

  const fmtNum = (v: number, dec = 2): string => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(dec)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(dec)}K`;
    return v.toFixed(dec);
  };

  return (
    <div style={{
      marginBottom: '20px',
      width: '100%',
      maxWidth: '600px',
      padding: '12px',
      background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 100%)',
      borderRadius: '6px',
      border: '1px solid #9945FF44',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', color: '#fff' }}>
          Clawb LP Position
          {loading && <span style={{ fontWeight: 400, fontSize: '11px', color: '#888', marginLeft: '6px' }}>(loading...)</span>}
        </h4>
        <a
          href={`https://www.meteora.ag/dlmm/${METEORA_PAIR}?referrer=portfolio&position=${METEORA_POSITION}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: isMobile ? '9px' : '10px', color: '#9945FF', textDecoration: 'none' }}
        >
          Meteora ↗
        </a>
      </div>

      {error && <div style={{ fontSize: '11px', color: '#c0392b' }}>{error}</div>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Pool', value: data.pairName, sub: 'Meteora DLMM' },
            { label: 'Price', value: `${data.currentPrice.toFixed(4)}`, sub: 'CLAWB/LAWB' },
            { label: 'Pool APR', value: `${data.poolApr.toFixed(1)}%`, sub: '24h' },
            { label: '24h Volume', value: `$${fmtNum(data.volume24h)}`, sub: '' },
            { label: '24h Fees', value: `$${fmtNum(data.fees24h)}`, sub: '' },
            { label: 'Fees Claimed', value: `$${fmtNum(data.feesClaimedUsd)}`, sub: 'total' },
          ].map((cell) => (
            <div key={cell.label} style={{
              padding: '8px',
              background: '#ffffff08',
              borderRadius: '4px',
              border: '1px solid #ffffff12',
            }}>
              <div style={{ fontSize: isMobile ? '9px' : '10px', color: '#9945FF', fontWeight: 600, marginBottom: '2px' }}>
                {cell.label}
              </div>
              <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: '#fff' }}>
                {cell.value}
              </div>
              {cell.sub && (
                <div style={{ fontSize: isMobile ? '8px' : '9px', color: '#888' }}>{cell.sub}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ isMobile = false, address: viewAddress }) => {
  const connectionDisplay = useConnectionDisplay();
  const { open } = useAppKit();
  const connectedAddress = connectionDisplay.address;
  const address = viewAddress || connectedAddress; // Use provided address or fallback to connected wallet
  const normalizeAddress = (value?: string) => {
    if (!value) return '';
    return value.startsWith('0x') ? value.toLowerCase() : value;
  };
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
  const [playlistEntries, setPlaylistEntries] = useState<LawbampUploadEntry[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [solanaGalleryCards, setSolanaGalleryCards] = useState<SolanaGalleryCard[]>([]);
  const [solanaGalleryLoading, setSolanaGalleryLoading] = useState(false);
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
  const [primaryWallet, setPrimaryWallet] = useState<string | null>(null);
  const [linkingWallet, setLinkingWallet] = useState(false);

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
        const resolvedPrimary = await firebaseProfiles.getPrimaryWallet(address);
        setPrimaryWallet(resolvedPrimary);
        const profileAddress = resolvedPrimary;
        let profileData = await firebaseProfiles.getProfile(profileAddress);

        const linked = await firebaseProfiles.getLinkedWallets(profileAddress);
        setLinkedWallets(linked);
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
        
        const isOwnProfile = normalizeAddress(address) === normalizeAddress(connectedAddress);
        
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
              wallet_address: normalizeAddress(address),
          nft_inventory: {
            lawbsters: [],
            lawbstarz: [],
            halloween_lawbsters: [],
            pixelawbs: [],
            asciilawbs: [],
            lawbstation: [],
            lawbnexus: []
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
              asciilawbs: [],
              lawbstation: [],
              lawbnexus: []
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
        
        if (profileData && isOwnProfile) {
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[PROFILE] Refreshing NFT inventory to ensure accuracy...');
          }
          try {
            const allWallets: WalletDescriptor[] = [
              { address: profileAddress, chain: profileAddress.startsWith('0x') ? 'evm' : 'solana' },
              ...linked.map((lw) => ({ address: lw.address, chain: lw.chain })),
            ];
            const inventory = allWallets.length > 1
              ? await fetchAggregatedNFTInventory(allWallets)
              : await fetchNFTInventory(profileAddress);
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[PROFILE] NFT inventory fetched:', inventory);
            }
            await firebaseProfiles.updateNFTInventory(profileAddress, inventory);
            const updated = await firebaseProfiles.getProfile(profileAddress);
            if (updated) {
              profileData = updated;
              setProfile(updated);
            }
          } catch (invError) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.error('[PROFILE] Error fetching NFT inventory:', invError);
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
  }, [address, connectedAddress]);

  useEffect(() => {
    if (!address) {
      setPlaylistEntries([]);
      return;
    }
    const loadPlaylistEntries = async () => {
      setPlaylistLoading(true);
      setPlaylistError(null);
      try {
        const entries = await fetchLawbampUploadsForUser(address, 50);
        setPlaylistEntries(entries);
      } catch (e: any) {
        setPlaylistError(e?.message || 'Failed to load playlist entries');
      } finally {
        setPlaylistLoading(false);
      }
    };
    void loadPlaylistEntries();
  }, [address]);

  useEffect(() => {
    if (!address || !profile?.nft_inventory) {
      setSolanaGalleryCards([]);
      return;
    }

    const stationIds = (profile.nft_inventory.lawbstation || []).slice(0, 6);
    const nexusIds = (profile.nft_inventory.lawbnexus || []).slice(0, 6);
    if (stationIds.length === 0 && nexusIds.length === 0) {
      setSolanaGalleryCards([]);
      return;
    }

    let cancelled = false;
    const loadGallery = async () => {
      setSolanaGalleryLoading(true);
      try {
        const loadCollection = async (
          collection: 'lawbstation' | 'lawbnexus',
          tokenIds: string[]
        ): Promise<SolanaGalleryCard[]> => {
          const cards = await Promise.all(
            tokenIds.map(async (tokenId) => {
              try {
                const metadata = await fetchTokenMetadata(collection, tokenId, address);
                return {
                  collection,
                  tokenId,
                  name: metadata.name || `${NFT_COLLECTIONS[collection].name}`,
                  imageUrl: metadata.image_url || '/images/sticker4.png',
                } as SolanaGalleryCard;
              } catch {
                return {
                  collection,
                  tokenId,
                  name: `${NFT_COLLECTIONS[collection].name}`,
                  imageUrl: '/images/sticker4.png',
                } as SolanaGalleryCard;
              }
            })
          );
          return cards;
        };

        const [stationCards, nexusCards] = await Promise.all([
          loadCollection('lawbstation', stationIds),
          loadCollection('lawbnexus', nexusIds),
        ]);

        if (!cancelled) {
          setSolanaGalleryCards([...stationCards, ...nexusCards]);
        }
      } finally {
        if (!cancelled) {
          setSolanaGalleryLoading(false);
        }
      }
    };

    void loadGallery();
    return () => {
      cancelled = true;
    };
  }, [
    address,
    profile?.nft_inventory?.lawbstation,
    profile?.nft_inventory?.lawbnexus,
  ]);

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
    const targetWallet = primaryWallet || address;
    if (!targetWallet) return;
    
    setRefreshingInventory(true);
    try {
      const allWallets: WalletDescriptor[] = [
        { address: targetWallet, chain: targetWallet.startsWith('0x') ? 'evm' : 'solana' },
        ...linkedWallets.map((lw) => ({ address: lw.address, chain: lw.chain })),
      ];
      const inventory = allWallets.length > 1
        ? await fetchAggregatedNFTInventory(allWallets)
        : await fetchNFTInventory(targetWallet);
      await firebaseProfiles.updateNFTInventory(targetWallet, inventory);
      const updatedProfile = await firebaseProfiles.getProfile(targetWallet);
      setProfile(updatedProfile);
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
  const isOwnProfile = normalizeAddress(address) === normalizeAddress(connectedAddress);

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
    asciilawbs: profile?.nft_inventory?.asciilawbs || [],
    lawbstation: profile?.nft_inventory?.lawbstation || [],
    lawbnexus: profile?.nft_inventory?.lawbnexus || []
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
      asciilawbs: inventory.asciilawbs?.length || 0,
      lawbstation: inventory.lawbstation?.length || 0,
      lawbnexus: inventory.lawbnexus?.length || 0
    });
  }

  const totalNFTs = (inventory.lawbsters?.length || 0) + (inventory.lawbstarz?.length || 0) + 
                    (inventory.halloween_lawbsters?.length || 0) + (inventory.pixelawbs?.length || 0) +
                    (inventory.asciilawbs?.length || 0) + (inventory.lawbstation?.length || 0) +
                    (inventory.lawbnexus?.length || 0);

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

              <WalletLinkingSection
                isOwnProfile={isOwnProfile}
                isMobile={isMobile}
                primaryWallet={primaryWallet}
                linkedWallets={linkedWallets}
                connectedEvmAddress={connectionDisplay.evmConnected ? connectionDisplay.evmAddress : undefined}
                connectedSolanaAddress={connectionDisplay.solanaConnected ? connectionDisplay.solanaAddress : undefined}
                linkingWallet={linkingWallet}
                onOpenConnect={() => {
                  void open({ view: 'Connect' });
                }}
                onLink={async (secondaryAddress, chain) => {
                  if (!primaryWallet) return;
                  setLinkingWallet(true);
                  try {
                    const result = await firebaseProfiles.linkWallet(primaryWallet, secondaryAddress, chain);
                    if (result.success) {
                      const updated = await firebaseProfiles.getLinkedWallets(primaryWallet);
                      setLinkedWallets(updated);
                    } else {
                      alert(result.error || 'Failed to link wallet');
                    }
                  } finally {
                    setLinkingWallet(false);
                  }
                }}
                onUnlink={async (secondaryAddress) => {
                  if (!primaryWallet) return;
                  setLinkingWallet(true);
                  try {
                    const result = await firebaseProfiles.unlinkWallet(primaryWallet, secondaryAddress);
                    if (result.success) {
                      const updated = await firebaseProfiles.getLinkedWallets(primaryWallet);
                      setLinkedWallets(updated);
                    }
                  } finally {
                    setLinkingWallet(false);
                  }
                }}
              />

              <TokenBalancesSection
                isMobile={isMobile}
                primaryWallet={primaryWallet}
                linkedWallets={linkedWallets}
              />

              <ClawbLpSection isMobile={isMobile} />

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
          <div>LawbStation (SOL): {inventory.lawbstation?.length || 0}</div>
          <div>LawbNexus (SOL): {inventory.lawbnexus?.length || 0}</div>
        </div>
        {totalNFTs === 0 && (
          <div style={{ marginTop: '8px', fontSize: isMobile ? '11px' : '12px', color: '#888', fontStyle: 'italic' }}>
            No NFTs found. Click Refresh to check your wallet.
          </div>
        )}
      </div>

      {(inventory.lawbstation.length > 0 || inventory.lawbnexus.length > 0) && (
        <div style={{ marginBottom: '20px', width: '100%', maxWidth: '600px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: isMobile ? '13px' : '14px' }}>Solana Lawb Gallery</h4>
            {solanaGalleryLoading && (
              <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#666' }}>Loading...</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>
            {solanaGalleryCards.map((card) => {
              const selected =
                profile?.profile_picture?.collection === card.collection &&
                profile?.profile_picture?.token_id === card.tokenId;
              return (
                <button
                  key={`${card.collection}-${card.tokenId}`}
                  onClick={() => {
                    if (isOwnProfile) {
                      void handleSelectProfilePicture(card.collection, card.tokenId);
                    }
                  }}
                  style={{
                    border: selected ? '2px solid #000080' : '1px solid #999',
                    background: '#fff',
                    padding: '4px',
                    borderRadius: '2px',
                    cursor: isOwnProfile ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                  title={`${card.name} (${card.tokenId})`}
                >
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      border: '1px solid #000',
                      marginBottom: '4px',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/images/sticker4.png';
                    }}
                  />
                  <div style={{ fontSize: isMobile ? '9px' : '10px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {card.name}
                  </div>
                  <div style={{ fontSize: isMobile ? '8px' : '9px', color: '#555' }}>
                    {card.collection === 'lawbstation' ? 'LawbStation' : 'LawbNexus'}
                  </div>
                  <div style={{ fontSize: isMobile ? '8px' : '9px', color: '#666' }}>
                    {card.tokenId.slice(0, 4)}...{card.tokenId.slice(-4)}
                  </div>
                </button>
              );
            })}
          </div>
          {!solanaGalleryLoading && solanaGalleryCards.length === 0 && (
            <div style={{ marginTop: '8px', fontSize: isMobile ? '10px' : '11px', color: '#666' }}>
              No Solana preview cards available yet.
            </div>
          )}
          {isOwnProfile && solanaGalleryCards.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: isMobile ? '10px' : '11px', color: '#666' }}>
              Click a card to set it as profile picture.
            </div>
          )}
        </div>
      )}

          {/* Profile Picture Selection */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '4px', width: '100%', maxWidth: '600px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '13px' : '14px' }}>Profile Picture</h4>
        {(() => {
          if (!profile) return false;
          const totalNFTs = (profile?.nft_inventory?.lawbsters?.length || 0) + 
                           (profile?.nft_inventory?.lawbstarz?.length || 0) + 
                           (profile?.nft_inventory?.halloween_lawbsters?.length || 0) + 
                           (profile?.nft_inventory?.pixelawbs?.length || 0) +
                           (profile?.nft_inventory?.asciilawbs?.length || 0) +
                           (profile?.nft_inventory?.lawbstation?.length || 0) +
                           (profile?.nft_inventory?.lawbnexus?.length || 0);
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
            {(inventory.lawbstation?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>LawbStation (SOL):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.lawbstation || []).slice(0, 10).map((tokenId: string) => (
                    <button
                      key={`lawbstation-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('lawbstation', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'lawbstation' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'lawbstation' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      {tokenId.slice(0, 4)}...{tokenId.slice(-4)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(inventory.lawbnexus?.length || 0) > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: isMobile ? '10px' : '11px', marginBottom: '4px', fontWeight: 'bold' }}>LawbNexus (SOL):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(inventory.lawbnexus || []).slice(0, 10).map((tokenId: string) => (
                    <button
                      key={`lawbnexus-${tokenId}`}
                      onClick={() => handleSelectProfilePicture('lawbnexus', tokenId)}
                      style={{
                        padding: '4px 8px',
                        background: profile?.profile_picture?.collection === 'lawbnexus' && profile.profile_picture.token_id === tokenId ? '#000080' : '#ccc',
                        color: profile?.profile_picture?.collection === 'lawbnexus' && profile.profile_picture.token_id === tokenId ? '#fff' : '#000',
                        border: '1px solid #000',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      {tokenId.slice(0, 4)}...{tokenId.slice(-4)}
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

      <div style={{ marginBottom: '20px', width: '100%', maxWidth: '600px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '13px' : '14px' }}>Playlist entries ({playlistEntries.length})</h4>
        {playlistLoading && (
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>Loading playlist entries...</div>
        )}
        {playlistError && (
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#a10000' }}>{playlistError}</div>
        )}
        {!playlistLoading && !playlistError && playlistEntries.length === 0 && (
          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666', fontStyle: 'italic' }}>
            No uploads yet.
          </div>
        )}
        {!playlistLoading && !playlistError && playlistEntries.length > 0 && (
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {playlistEntries.slice(0, 25).map((entry) => (
              <a
                key={entry.id}
                href={entry.storage_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: '#000',
                  background: '#fff',
                  border: '1px solid #bbb',
                  borderRadius: '3px',
                  padding: '6px 8px',
                  marginBottom: '6px',
                  fontSize: isMobile ? '11px' : '12px',
                }}
              >
                <div style={{ fontWeight: 600 }}>{entry.title || entry.filename}</div>
                <div style={{ color: '#555', marginTop: '2px' }}>
                  {entry.mime.startsWith('video/') ? 'Video' : 'Audio'} • {Math.round((entry.duration_sec || 0) / 60)} min
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

