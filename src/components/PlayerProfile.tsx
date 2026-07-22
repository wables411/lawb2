import React, { useState, useEffect, useMemo } from 'react';
import { database } from '../firebaseApp';
import { firebaseProfiles, type PlayerProfile as PlayerProfileData, type LinkedWallet } from '../firebaseProfiles';
import { waitForWalletDbAuth } from '../firebaseWalletAuth';
import {
  getUserLeaderboardEntry,
  mergeLeaderboardEntriesForDisplay,
  normalizeLeaderboardPathKey,
  type LeaderboardEntry,
  type PointsBreakdown,
} from '../firebaseLeaderboard';
import { fetchNFTInventory, fetchAggregatedNFTInventory, type WalletDescriptor } from '../utils/nftInventory';
import { fetchBaseLawbClawbHoldingsBonus } from '../utils/leaderboardTokenBonus';
import { fetchTokenMetadata } from '../utils/nftMetadata';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { useMultiChainBalances } from '../hooks/useMultiChainBalances';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import { getDisplayName } from '../utils/displayName';
import {
  linuxNotesButtonStyle,
  linuxNotesHeaderStyle,
  linuxNotesInputStyle,
  linuxNotesPillStyle,
  linuxNotesSectionStyle,
  linuxNotesShellStyle,
  linuxNotesSubtleTextStyle,
} from './linuxNotesTheme';

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

/** Firebase / Alchemy may store token ids as strings or nested `{ token_id }` objects — never render raw objects in React children. */
function normalizeInventoryEntry(entry: unknown): string {
  if (entry === null || entry === undefined) return '';
  if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
  if (typeof entry === 'object' && entry !== null && 'token_id' in entry) {
    return String((entry as { token_id: unknown }).token_id);
  }
  return String(entry);
}

function sameProfileToken(stored: unknown, candidate: unknown): boolean {
  return normalizeInventoryEntry(stored) === normalizeInventoryEntry(candidate);
}

const LB_BREAKDOWN_ORDER = ['chess', 'reef_run', 'holdings', 'wallet_connect', 'stream', 'games'] as const;

const LB_BREAKDOWN_LABELS: Record<(typeof LB_BREAKDOWN_ORDER)[number], string> = {
  chess: 'Chess',
  reef_run: 'Reef Run',
  holdings: 'Lawb (NFTs & tokens)',
  wallet_connect: 'Wallet connect bonus',
  stream: 'Stream participation',
  games: 'Games',
};

function formatDurationSec(sec?: number | null): string {
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec <= 0) return '—';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function isProfileDebugVerbose(): boolean {
  try {
    return Boolean(
      import.meta.env.DEV &&
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('lawbDebugProfile') === '1',
    );
  } catch {
    return false;
  }
}

function profileDebugLog(...args: unknown[]): void {
  if (!isProfileDebugVerbose()) return;
  if (typeof window !== 'undefined' && window.console) {
    window.console.log(...args);
  }
}

function collectProfileLeaderboardKeys(
  primaryWallet: string | null,
  pageAddress: string | undefined,
  linked: LinkedWallet[],
): string[] {
  const set = new Set<string>();
  const add = (raw: string | null | undefined) => {
    const k = normalizeLeaderboardPathKey(raw ?? '');
    if (k) set.add(k);
  };
  add(primaryWallet);
  add(pageAddress);
  for (const w of linked) add(w.address);
  return [...set];
}

function leaderboardBreakdownRows(pb: PointsBreakdown | undefined): { key: string; label: string; value: number }[] {
  const b = pb ?? ({} as PointsBreakdown);
  const seen = new Set<string>();
  const out: { key: string; label: string; value: number }[] = [];
  for (const k of LB_BREAKDOWN_ORDER) {
    const v = typeof b[k] === 'number' ? b[k]! : 0;
    out.push({ key: k, label: LB_BREAKDOWN_LABELS[k], value: v });
    seen.add(k);
  }
  for (const k of Object.keys(b)) {
    if (seen.has(k)) continue;
    const v = b[k as keyof PointsBreakdown];
    if (typeof v === 'number') {
      out.push({ key: k, label: k, value: v });
    }
  }
  return out;
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
  const sectionStyle = linuxNotesSectionStyle(isMobile);
  const buttonStyle = linuxNotesButtonStyle(isMobile);
  const inputStyle = linuxNotesInputStyle(isMobile);

  return (
    <div style={{
      ...sectionStyle,
      marginBottom: '20px',
      maxWidth: '600px',
    }}>
      <h4 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 8 }}>
        Linked Wallets
      </h4>
      <div style={{ fontSize: isMobile ? '11px' : '12px', marginBottom: '8px', color: '#2f2f2b' }}>
        <span style={{
          ...linuxNotesPillStyle(isMobile),
          background: primaryWallet.startsWith('0x') ? '#627EEA' : '#9945FF',
          color: '#fff',
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
            ...linuxNotesPillStyle(isMobile),
            background: lw.chain === 'evm' ? '#627EEA' : '#9945FF',
            color: '#fff',
          }}>
            {lw.chain === 'evm' ? 'EVM' : 'SOL'}
          </span>
          {shortenAddr(lw.address)}
          {isOwnProfile && (
            <button
              onClick={() => onUnlink(lw.address)}
              disabled={linkingWallet}
              style={{
                ...buttonStyle,
                padding: '1px 6px',
                background: '#c0392b',
                color: '#fff',
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
            ...buttonStyle,
            marginTop: '8px',
            background: '#627EEA',
            color: '#fff',
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
            ...buttonStyle,
            marginTop: '8px',
            marginLeft: canLinkEvm ? '8px' : '0',
            background: '#9945FF',
            color: '#fff',
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
              ...buttonStyle,
              marginBottom: '8px',
              background: '#000080',
              color: '#fff',
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
                ...inputStyle,
                flex: 1,
                minWidth: isMobile ? '100%' : '260px',
                border: manualWalletError ? '2px solid #c0392b' : '1px solid #bbb',
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
                ...buttonStyle,
                padding: '6px 10px',
                background: '#1f6f3f',
                color: '#fff',
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
    { label: '$LAWB', chain: 'Solana', value: balances.lawbSol, color: '#8B4513', chainColor: '#9945FF', hasWallet: !!solanaAddress },
    { label: '$LAWB', chain: 'Arbitrum', value: balances.lawbArb, color: '#8B4513', chainColor: '#28A0F0', hasWallet: !!evmAddress },
  ];
  const sectionStyle = linuxNotesSectionStyle(isMobile);

  return (
    <div style={{
      ...sectionStyle,
      marginBottom: '20px',
      maxWidth: '600px',
    }}>
      <h4 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 10 }}>
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
              background: '#ffffff',
              border: '1px solid #d8d8d3',
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

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ isMobile = false, address: viewAddress }) => {
  const connectionDisplay = useConnectionDisplay();
  const { open } = useAppKitSafe();
  const connectedAddress = connectionDisplay.address;
  const connectedSolana = connectionDisplay.solanaAddress;
  const connectedEvm = connectionDisplay.evmAddress;
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
  const [profileImageSize, setProfileImageSize] = useState<{ width: number; height: number } | null>(null);
  const [solanaGalleryCards, setSolanaGalleryCards] = useState<SolanaGalleryCard[]>([]);
  const [solanaGalleryLoading, setSolanaGalleryLoading] = useState(false);
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
  const [primaryWallet, setPrimaryWallet] = useState<string | null>(null);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [leaderboardEntry, setLeaderboardEntry] = useState<LeaderboardEntry | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardMergedMultiKey, setLeaderboardMergedMultiKey] = useState(false);
  const [profileCardTitle, setProfileCardTitle] = useState('');

  profileDebugLog('[PROFILE] Component rendered', { address, isMobile, hasProfile: !!profile });

  const linkedWalletKeysDep = useMemo(
    () => linkedWallets.map((w) => `${w.chain}:${w.address}`).join('|'),
    [linkedWallets],
  );

  useEffect(() => {
    if (!address) {
      setProfileCardTitle('');
      return;
    }
    if (profile?.username?.trim()) {
      setProfileCardTitle(profile.username.trim());
    } else {
      setProfileCardTitle(shortenAddr(address));
    }
    let cancelled = false;
    void getDisplayName(address).then((name) => {
      if (!cancelled && name) setProfileCardTitle(name);
    });
    return () => {
      cancelled = true;
    };
  }, [address, profile?.username, profile?.updated_at]);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      setProfileLoadError(null);
      return;
    }
    
    const loadProfile = async () => {
      setLoading(true);
      setProfileLoadError(null);
      if (!database) {
        setProfileLoadError('Profiles are unavailable until Firebase is configured for this site.');
        setLoading(false);
        return;
      }
      profileDebugLog('[PROFILE] Loading profile for', address);
      try {
        const resolvedPrimary = await firebaseProfiles.getPrimaryWallet(address);
        setPrimaryWallet(resolvedPrimary);
        const profileAddress = resolvedPrimary;
        let profileData = await firebaseProfiles.getProfile(profileAddress);

        const linked = await firebaseProfiles.getLinkedWallets(profileAddress);
        setLinkedWallets(linked);
        profileDebugLog('[PROFILE] Profile data from Firebase:', profileData);
        
        const isOwnProfile = normalizeAddress(address) === normalizeAddress(connectedAddress);
        
        if (!profileData) {
          // Only create profile if it's the user's own profile
          if (isOwnProfile) {
            // First visit races the wallet-auth sign-in (the login-signature prompt may
            // still be open) — the locked DB rules reject writes until it completes.
            // Wait for auth; on timeout skip the write and show defaults instead of erroring.
            const authed = await waitForWalletDbAuth(profileAddress);
            if (authed) {
              profileDebugLog('[PROFILE] Creating new profile for own account...');
              try {
                await firebaseProfiles.upsertProfile(profileAddress, {});
                profileData = await firebaseProfiles.getProfile(profileAddress);
              } catch (createErr) {
                profileDebugLog('[PROFILE] Profile create failed, showing defaults:', createErr);
              }
            } else {
              profileDebugLog('[PROFILE] Wallet auth not ready — showing defaults without creating');
            }
          }
          if (!profileData) {
            // Minimal in-memory profile: viewing another user, or own profile before auth lands
            profileData = {
              wallet_address: normalizeAddress(address),
              nft_inventory: {
                lawbsters: [],
                lawbstarz: [],
                halloween_lawbsters: [],
                pixelawbs: [],
                asciilawbs: [],
                lawbstation: [],
                lawbnexus: [],
                lawb_lore: [],
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
              chess_stats: {
                wins: 0,
                losses: 0,
                fastest_win_seconds: null,
              },
              reef_run_stats: {
                cheese_collected: 0,
                peptides_collected: 0,
                coins_collected: 0,
                longest_run_seconds: 0,
                character_runs: {},
                favored_character: null,
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
              lawbnexus: [],
              lawb_lore: [],
            };
          }
          if (!Array.isArray(profileData.nft_inventory.lawb_lore)) {
            profileData.nft_inventory.lawb_lore = [];
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
          if (!profileData.chess_stats) {
            profileData.chess_stats = {
              wins: profileData.game_stats?.wins || 0,
              losses: profileData.game_stats?.losses || 0,
              fastest_win_seconds: null,
            };
          }
          if (!profileData.reef_run_stats) {
            profileData.reef_run_stats = {
              cheese_collected: 0,
              peptides_collected: 0,
              coins_collected: 0,
              longest_run_seconds: 0,
              character_runs: {},
              favored_character: null,
            };
          }
        }
        
        if (profileData && isOwnProfile) {
          profileDebugLog('[PROFILE] Refreshing NFT inventory to ensure accuracy...');
          try {
            const allWallets: WalletDescriptor[] = [
              { address: profileAddress, chain: profileAddress.startsWith('0x') ? 'evm' : 'solana' },
              ...linked.map((lw) => ({ address: lw.address, chain: lw.chain })),
            ];
            const inventory = allWallets.length > 1
              ? await fetchAggregatedNFTInventory(allWallets)
              : await fetchNFTInventory(profileAddress);
            profileDebugLog('[PROFILE] NFT inventory fetched:', inventory);
            const tokenBonus = await fetchBaseLawbClawbHoldingsBonus(
              allWallets.filter((w) => w.chain === 'evm').map((w) => w.address),
            );
            await firebaseProfiles.updateNFTInventory(profileAddress, inventory, {
              tokenBonusPoints: tokenBonus,
            });
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
        
        profileDebugLog('[PROFILE] Final profile data:', profileData);
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[PROFILE] Error loading profile:', error);
        }
        setProfileLoadError('Could not load profile. Try again later or check your connection.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [address, connectedAddress]);

  useEffect(() => {
    if (!database || !primaryWallet) {
      setLeaderboardEntry(null);
      setLeaderboardMergedMultiKey(false);
      return;
    }
    const keys = collectProfileLeaderboardKeys(primaryWallet, address, linkedWallets);
    if (keys.length === 0) {
      setLeaderboardEntry(null);
      setLeaderboardMergedMultiKey(false);
      return;
    }
    let cancelled = false;
    setLeaderboardLoading(true);
    void (async () => {
      try {
        const entries = await Promise.all(keys.map((k) => getUserLeaderboardEntry(k)));
        const merged = mergeLeaderboardEntriesForDisplay(entries);
        if (!cancelled) {
          setLeaderboardEntry(merged);
          setLeaderboardMergedMultiKey(keys.length > 1);
        }
      } catch {
        if (!cancelled) {
          setLeaderboardEntry(null);
          setLeaderboardMergedMultiKey(false);
        }
      } finally {
        if (!cancelled) {
          setLeaderboardLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [primaryWallet, address, linkedWalletKeysDep, profile?.updated_at]);

  useEffect(() => {
    if (!address || !profile?.nft_inventory) {
      setSolanaGalleryCards([]);
      return;
    }

    const stationIds = (profile.nft_inventory.lawbstation || [])
      .map(normalizeInventoryEntry)
      .filter(Boolean)
      .slice(0, 6);
    const nexusIds = (profile.nft_inventory.lawbnexus || [])
      .map(normalizeInventoryEntry)
      .filter(Boolean)
      .slice(0, 6);
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
                const solOwner = profile.linked_wallets?.find((w) => w.chain === 'solana')?.address;
                const metadata = await fetchTokenMetadata(collection, tokenId, address, solOwner);
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
    profile?.linked_wallets,
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

    /** Always resolve primary at write time — `primaryWallet` state can lag linked-wallet resolution. */
    const profileOwner = await firebaseProfiles.getPrimaryWallet(address);

    setUsernameError(null);
    setUsernameSuccess(false);

    const result = await firebaseProfiles.setUsername(profileOwner, usernameInput);

    if (result.success) {
      setUsernameSuccess(true);
      setUsernameInput('');
      setPrimaryWallet(profileOwner);
      // Reload profile to get updated username
      const updatedProfile = await firebaseProfiles.getProfile(profileOwner);
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
      const targetWallet = await firebaseProfiles.getPrimaryWallet(address);
      setPrimaryWallet(targetWallet);
      const linkedFresh = await firebaseProfiles.getLinkedWallets(targetWallet);
      const allWallets: WalletDescriptor[] = [
        { address: targetWallet, chain: targetWallet.startsWith('0x') ? 'evm' : 'solana' },
        ...linkedFresh.map((lw) => ({ address: lw.address, chain: lw.chain })),
      ];
      const inventory = allWallets.length > 1
        ? await fetchAggregatedNFTInventory(allWallets)
        : await fetchNFTInventory(targetWallet);
      const tokenBonus = await fetchBaseLawbClawbHoldingsBonus(
        allWallets.filter((w) => w.chain === 'evm').map((w) => w.address),
      );
      await firebaseProfiles.updateNFTInventory(targetWallet, inventory, {
        tokenBonusPoints: tokenBonus,
      });
      setLinkedWallets(linkedFresh);
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

    const profileOwner = await firebaseProfiles.getPrimaryWallet(address);
    setPrimaryWallet(profileOwner);

    if (typeof window !== 'undefined' && window.console) {
      profileDebugLog('[PROFILE] Selecting profile picture:', collection, tokenId, 'owner', profileOwner);
    }
    try {
      const linkedForMeta = await firebaseProfiles.getLinkedWallets(profileOwner);
      const solOwner =
        linkedForMeta.find((w) => w.chain === 'solana')?.address ||
        profile?.linked_wallets?.find((w) => w.chain === 'solana')?.address;
      const metadata = await fetchTokenMetadata(collection, tokenId, profileOwner, solOwner);
      if (typeof window !== 'undefined' && window.console) {
        profileDebugLog('[PROFILE] Metadata fetched:', metadata);
      }
      
      if (!metadata.image_url) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[PROFILE] No image URL found for token', tokenId, 'in collection', collection);
        }
        alert('Failed to fetch image URL for this NFT. Please try another one.');
        return;
      }
      
      await firebaseProfiles.updateProfilePicture(profileOwner, {
        collection,
        token_id: normalizeInventoryEntry(tokenId) || String(tokenId),
        image_url: metadata.image_url
      });
      const updatedProfile = await firebaseProfiles.getProfile(profileOwner);
      if (updatedProfile) {
        if (typeof window !== 'undefined' && window.console) {
          profileDebugLog('[PROFILE] Profile picture updated:', updatedProfile.profile_picture);
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
      <div className="profile-compact" style={{ ...linuxNotesShellStyle(isMobile), padding: '20px', textAlign: 'center' }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  if (profileLoadError && !profile) {
    return (
      <div className="profile-compact" style={{ ...linuxNotesShellStyle(isMobile), padding: '20px', textAlign: 'center', color: '#a00' }}>
        <div>{profileLoadError}</div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="profile-compact" style={{ ...linuxNotesShellStyle(isMobile), padding: '20px', textAlign: 'center' }}>
        <div>Please connect your wallet to view your profile</div>
      </div>
    );
  }

  // Determine if this is own profile
  const isOwnProfile = normalizeAddress(address) === normalizeAddress(connectedAddress);

  const inventory = {
    lawbsters: (profile?.nft_inventory?.lawbsters || []).map(normalizeInventoryEntry).filter(Boolean),
    lawbstarz: (profile?.nft_inventory?.lawbstarz || []).map(normalizeInventoryEntry).filter(Boolean),
    halloween_lawbsters: (profile?.nft_inventory?.halloween_lawbsters || []).map(normalizeInventoryEntry).filter(Boolean),
    pixelawbs: (profile?.nft_inventory?.pixelawbs || []).map(normalizeInventoryEntry).filter(Boolean),
    asciilawbs: (profile?.nft_inventory?.asciilawbs || []).map(normalizeInventoryEntry).filter(Boolean),
    lawbstation: (profile?.nft_inventory?.lawbstation || []).map(normalizeInventoryEntry).filter(Boolean),
    lawbnexus: (profile?.nft_inventory?.lawbnexus || []).map(normalizeInventoryEntry).filter(Boolean),
    lawb_lore: (profile?.nft_inventory?.lawb_lore || []).map(normalizeInventoryEntry).filter(Boolean),
  };

  profileDebugLog('[PROFILE RENDER] Current profile:', profile);
  profileDebugLog('[PROFILE RENDER] Current inventory:', inventory);
  profileDebugLog('[PROFILE RENDER] Inventory counts:', {
    lawbsters: inventory.lawbsters?.length || 0,
    lawbstarz: inventory.lawbstarz?.length || 0,
    halloween_lawbsters: inventory.halloween_lawbsters?.length || 0,
    pixelawbs: inventory.pixelawbs?.length || 0,
    asciilawbs: inventory.asciilawbs?.length || 0,
    lawbstation: inventory.lawbstation?.length || 0,
    lawbnexus: inventory.lawbnexus?.length || 0,
    lawb_lore: inventory.lawb_lore?.length || 0,
  });

  const totalNFTs = (inventory.lawbsters?.length || 0) + (inventory.lawbstarz?.length || 0) + 
                    (inventory.halloween_lawbsters?.length || 0) + (inventory.pixelawbs?.length || 0) +
                    (inventory.asciilawbs?.length || 0) + (inventory.lawbstation?.length || 0) +
                    (inventory.lawbnexus?.length || 0) + (inventory.lawb_lore?.length || 0);

  const getBorderColor = () => '#d2d2cc';

  // Get profile image URL or default
  const profileImageUrl = profile?.profile_picture?.image_url || '/images/sticker4.png';

  // Handle image load to get dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setProfileImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    profileDebugLog('[PROFILE] Image loaded, dimensions:', img.naturalWidth, 'x', img.naturalHeight);
  };
  const sectionStyle = linuxNotesSectionStyle(isMobile);
  const buttonStyle = linuxNotesButtonStyle(isMobile);
  const inputStyle = linuxNotesInputStyle(isMobile);
  const chessStats = profile?.chess_stats;
  const reefStats = profile?.reef_run_stats;
  const chessWins = chessStats?.wins ?? leaderboardEntry?.wins ?? 0;
  const chessLosses = chessStats?.losses ?? leaderboardEntry?.losses ?? 0;
  const fastestWin = chessStats?.fastest_win_seconds ?? null;
  const reefFavored = reefStats?.favored_character ? reefStats.favored_character.toUpperCase() : '—';
  const notesTokenChipStyle = (selected: boolean): React.CSSProperties => ({
    padding: isMobile ? '4px 8px' : '3px 8px',
    background: selected ? '#d6b04a' : '#f4f4f1',
    color: selected ? '#1f1a12' : '#2d2d2a',
    border: selected ? '1px solid #a9842a' : '1px solid #d0d0cb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: isMobile ? '9px' : '10px',
    fontWeight: selected ? 600 : 500,
  });

  return (
    <div style={{ 
      ...linuxNotesShellStyle(isMobile),
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      padding: isMobile ? '16px' : '18px',
      gap: '16px'
    }}>
      <div style={{ width: '100%', maxWidth: 600, textAlign: 'left' }}>
        <h2
          style={{
            ...linuxNotesHeaderStyle(isMobile),
            marginBottom: 6,
            fontSize: isMobile ? 20 : 22,
          }}
        >
          {(() => {
            const t = (profileCardTitle || shortenAddr(address)).trim();
            const looksLikeShortAddr = /\.\.\./.test(t);
            if (t && !looksLikeShortAddr) return `@${t}`;
            return t;
          })()}
        </h2>
        {isOwnProfile &&
          primaryWallet &&
          normalizeAddress(address) !== normalizeAddress(primaryWallet) && (
            <p style={{ ...linuxNotesSubtleTextStyle(isMobile), marginBottom: 8 }}>
              Name and inventory follow your primary profile wallet ({shortenAddr(primaryWallet)}). This address is
              linked.
            </p>
          )}
      </div>
      {/* Profile card */}
      <div style={{
        ...sectionStyle,
        position: 'relative',
        width: profileImageSize ? `${Math.min(profileImageSize.width, isMobile ? 350 : 600)}px` : '100%',
        maxWidth: '100%',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${getBorderColor()}`,
        transform: 'none',
        transition: 'box-shadow 0.2s ease',
        background: '#ffffff',
        zIndex: 1,
        cursor: !isOwnProfile ? 'pointer' : 'default'
      }}
      onClick={(e) => {
        // Removed stats toggle - stats are now in separate section, not overlay
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.18)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.7)';
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
            background: '#ffffff'
          }} 
        />
        
        {/* Stats overlay removed - moved to separate section above NFT inventory */}
      </div>

      {database && primaryWallet && (
        <div
          style={{
            ...sectionStyle,
            width: '100%',
            maxWidth: '600px',
            boxSizing: 'border-box',
          }}
        >
          <h4 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 10, color: '#2a2a28' }}>
            Lawb leaderboard points
          </h4>
          {leaderboardLoading ? (
            <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#555' }}>Loading points…</div>
          ) : leaderboardEntry ? (
            <>
              <div
                style={{
                  fontSize: isMobile ? 22 : 24,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: '#2a2a28',
                }}
              >
                Total · {leaderboardEntry.points}
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: isMobile ? '11px' : '12px',
                  lineHeight: 1.65,
                  color: '#1a1a1a',
                }}
              >
                {leaderboardBreakdownRows(leaderboardEntry.points_breakdown).map((row) => (
                  <li key={row.key}>
                    <strong>{row.label}:</strong> {row.value}
                  </li>
                ))}
              </ul>
              {leaderboardMergedMultiKey && (
                <p
                  style={{
                    margin: '10px 0 0 0',
                    fontSize: isMobile ? '10px' : '11px',
                    color: '#696963',
                    lineHeight: 1.45,
                  }}
                >
                  Totals combine leaderboard rows for your primary wallet and any linked addresses (for example chess
                  points on EVM and NFT holdings points on Solana).
                </p>
              )}
            </>
          ) : (
            <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#555' }}>
              No leaderboard row yet for this wallet — play chess, refresh NFT holdings on your profile, or connect with
              WalletConnect to earn points.
            </div>
          )}
        </div>
      )}

      <div
        style={{
          ...sectionStyle,
          width: '100%',
          maxWidth: '600px',
          boxSizing: 'border-box',
        }}
      >
        <h4 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 10, color: '#2a2a28' }}>
          Player game stats
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: isMobile ? '12px' : '13px' }}>Chess</div>
            <div style={{ fontSize: isMobile ? '11px' : '12px', lineHeight: 1.65 }}>
              <div><strong>Wins:</strong> {chessWins}</div>
              <div><strong>Losses:</strong> {chessLosses}</div>
              <div><strong>Fastest win:</strong> {formatDurationSec(fastestWin)}</div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: isMobile ? '12px' : '13px' }}>Reef Run</div>
            <div style={{ fontSize: isMobile ? '11px' : '12px', lineHeight: 1.65 }}>
              <div><strong>Cheese:</strong> {reefStats?.cheese_collected ?? 0}</div>
              <div><strong>Peptides:</strong> {reefStats?.peptides_collected ?? 0}</div>
              <div><strong>Coins:</strong> {reefStats?.coins_collected ?? 0}</div>
              <div><strong>Longest run:</strong> {formatDurationSec(reefStats?.longest_run_seconds ?? 0)}</div>
              <div><strong>Favored character:</strong> {reefFavored}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Features - Only show when viewing own profile */}
      {isOwnProfile && (
        <>

          {/* Username Section */}
          <div style={{ ...sectionStyle, marginBottom: '20px', width: '100%', maxWidth: '600px' }}>
        {!profile?.username ? (
          <>
            <h4 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 8 }}>Create Username</h4>
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
                  ...inputStyle,
                  flex: 1,
                  border: usernameError ? '2px solid #ff0000' : '1px solid #ccc',
                  fontSize: isMobile ? '12px' : '13px'
                }}
              />
              <button 
                onClick={handleSetUsername}
                disabled={!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername}
                style={{
                  ...buttonStyle,
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
                  ...inputStyle,
                  flex: 1,
                  border: usernameError ? '2px solid #ff0000' : '1px solid #ccc',
                  fontSize: isMobile ? '12px' : '13px'
                }}
              />
              <button 
                onClick={handleSetUsername}
                disabled={!usernameInput || usernameInput.length < 3 || !!usernameError || isCheckingUsername}
                style={{
                  ...buttonStyle,
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

              <div style={{ ...sectionStyle, marginBottom: '20px', width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ ...linuxNotesHeaderStyle(isMobile), margin: 0 }}>NFT Inventory ({totalNFTs})</h4>
          <button
            onClick={handleRefreshInventory}
            disabled={refreshingInventory}
            style={{
              ...buttonStyle,
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
          <div>Lawb Lore: {inventory.lawb_lore?.length || 0}</div>
        </div>
        {totalNFTs === 0 && (
          <div style={{ marginTop: '8px', fontSize: isMobile ? '11px' : '12px', color: '#888', fontStyle: 'italic' }}>
            No NFTs found. Click Refresh to check your wallet.
          </div>
        )}
      </div>

      {(inventory.lawbstation.length > 0 || inventory.lawbnexus.length > 0) && (
        <div style={{ ...sectionStyle, marginBottom: '20px', width: '100%', maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ ...linuxNotesHeaderStyle(isMobile), margin: 0 }}>Solana Lawb Gallery</h4>
            {solanaGalleryLoading && (
              <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#666' }}>Loading...</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>
            {solanaGalleryCards.map((card) => {
              const selected =
                profile?.profile_picture?.collection === card.collection &&
                sameProfileToken(profile?.profile_picture?.token_id, card.tokenId);
              return (
                <button
                  key={`${card.collection}-${card.tokenId}`}
                  onClick={() => {
                    if (isOwnProfile) {
                      void handleSelectProfilePicture(card.collection, card.tokenId);
                    }
                  }}
                  style={{
                    border: selected ? '2px solid #d6b04a' : '1px solid #d0d0cb',
                    background: '#fff',
                    padding: '4px',
                    borderRadius: '6px',
                    cursor: isOwnProfile ? 'pointer' : 'default',
                    textAlign: 'left',
                    boxShadow: selected ? '0 0 0 1px rgba(169,132,42,0.25)' : 'none',
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
                      border: '1px solid #d9d9d4',
                      marginBottom: '4px',
                      borderRadius: '4px',
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
          <div style={{ ...sectionStyle, marginTop: '20px', width: '100%', maxWidth: '600px' }}>
        <h4 style={{ ...linuxNotesHeaderStyle(isMobile), marginBottom: 12 }}>Profile Picture</h4>
        {profile?.profile_picture ? (
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
                    profileDebugLog('[PROFILE] Profile picture loaded in selection:', profile.profile_picture?.image_url);
                  }
                }}
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '6px', 
                  border: '1px solid #d0d0cb',
                  objectFit: 'cover',
                  marginBottom: '8px',
                  backgroundColor: '#f4f4f1'
                }} 
              />
              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                {NFT_COLLECTIONS[profile.profile_picture.collection].name} #{normalizeInventoryEntry(profile.profile_picture.token_id)}
              </div>
            </div>
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'pixelawbs' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'lawbsters' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'lawbstarz' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'halloween_lawbsters' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'asciilawbs' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'lawbstation' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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
                      style={notesTokenChipStyle(
                        profile?.profile_picture?.collection === 'lawbnexus' &&
                          sameProfileToken(profile?.profile_picture?.token_id, tokenId),
                      )}
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

    </div>
  );
};

