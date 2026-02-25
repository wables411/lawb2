/**
 * Single source of truth for wallet connection display state.
 * Uses wagmi useAccount with handling for reconnecting state to avoid
 * navbar/Reown modal mismatch (e.g. modal shows connected, navbar shows disconnected).
 */
import { useAccount, useEnsName } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';

export interface ConnectionDisplay {
  connected: boolean;
  address?: string;
  ens?: string;
  namespace?: 'eip155' | 'solana';
  evmConnected: boolean;
  solanaConnected: boolean;
  /** True when reconnecting - use to show "Reconnecting..." if desired */
  isReconnecting: boolean;
}

export function useConnectionDisplay(ensOverride?: string): ConnectionDisplay {
  const { address: wagmiAddress, isConnected: wagmiConnected, status } = useAccount();
  const evmAccount = useAppKitAccount({ namespace: 'eip155' });
  const solanaAccount = useAppKitAccount({ namespace: 'solana' });

  // During reconnect, wagmi may briefly set isConnected=false while AppKit modal
  // still shows connected. Treat "reconnecting with address" as connected for display.
  const isReconnecting = status === 'reconnecting';
  const evmAddress = evmAccount.address ?? wagmiAddress;
  const evmConnected = evmAccount.isConnected || wagmiConnected || (isReconnecting && !!wagmiAddress);
  const solanaConnected = !!solanaAccount.isConnected;
  const displayConnected = evmConnected || solanaConnected;
  const address = evmAddress ?? solanaAccount.address;
  const namespace: 'eip155' | 'solana' | undefined = evmConnected ? 'eip155' : (solanaConnected ? 'solana' : undefined);
  const ensLookupAddress = evmAddress?.startsWith('0x') ? (evmAddress as `0x${string}`) : undefined;
  const { data: ensName } = useEnsName({ address: ensLookupAddress });

  return {
    connected: displayConnected,
    address,
    namespace,
    evmConnected,
    solanaConnected,
    ens: ensOverride ?? ensName ?? undefined,
    isReconnecting,
  };
}
