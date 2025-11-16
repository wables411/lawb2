import { getEnsName } from '@wagmi/core';
import { config } from '../wagmi';

export async function getDisplayName(walletAddress: string): Promise<string> {
  if (!walletAddress) return '';
  
  // Try to get username from Firebase (will be implemented in profile component)
  // For now, try ENS
  try {
    const ensName = await getEnsName(config, { address: walletAddress as `0x${string}` });
    if (ensName) return ensName;
  } catch (error) {
    console.error('Error fetching ENS name:', error);
  }
  
  // Fallback to truncated address
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

export function getDisplayNameSync(walletAddress: string, username?: string, ensName?: string): string {
  if (!walletAddress) return '';
  if (username) return username;
  if (ensName) return ensName;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

