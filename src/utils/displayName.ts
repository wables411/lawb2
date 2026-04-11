import { getEnsName } from '@wagmi/core';
import { config } from '../wagmi';
import { firebaseProfiles } from '../firebaseProfiles';

export async function getDisplayName(walletAddress: string): Promise<string> {
  if (!walletAddress) return '';

  // Username + inventory live on the primary profile; leaderboard rows may be keyed by a linked wallet.
  let primary = walletAddress;
  try {
    primary = await firebaseProfiles.getPrimaryWallet(walletAddress);
  } catch {
    // keep walletAddress
  }

  try {
    const profile = await firebaseProfiles.getProfile(primary);
    if (profile?.username?.trim()) {
      return profile.username;
    }
  } catch {
    // continue
  }

  if (primary !== walletAddress) {
    try {
      const profile = await firebaseProfiles.getProfile(walletAddress);
      if (profile?.username?.trim()) {
        return profile.username;
      }
    } catch {
      // continue
    }
  }

  const ensTarget =
    primary.startsWith('0x') ? primary : walletAddress.startsWith('0x') ? walletAddress : null;
  if (ensTarget) {
    try {
      const ensName = await getEnsName(config, { address: ensTarget as `0x${string}` });
      if (ensName) return ensName;
    } catch {
      // fallback below
    }
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

export function getDisplayNameSync(walletAddress: string, username?: string, ensName?: string): string {
  if (!walletAddress) return '';
  if (username && username.trim() !== '') return username;
  if (ensName) return ensName;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

