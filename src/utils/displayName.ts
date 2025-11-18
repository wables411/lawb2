import { getEnsName } from '@wagmi/core';
import { config } from '../wagmi';
import { firebaseProfiles } from '../firebaseProfiles';

export async function getDisplayName(walletAddress: string): Promise<string> {
  if (!walletAddress) return '';
  
  // Try to get username from Firebase profile
  try {
    const profile = await firebaseProfiles.getProfile(walletAddress);
    if (profile?.username && profile.username.trim() !== '') {
      return profile.username;
    }
  } catch (error) {
    // Silently fail - fallback to other methods
  }
  
  // Try ENS
  try {
    const ensName = await getEnsName(config, { address: walletAddress as `0x${string}` });
    if (ensName) return ensName;
  } catch (error) {
    // Silently fail - fallback to address
  }
  
  // Fallback to truncated address
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

export function getDisplayNameSync(walletAddress: string, username?: string, ensName?: string): string {
  if (!walletAddress) return '';
  if (username && username.trim() !== '') return username;
  if (ensName) return ensName;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

