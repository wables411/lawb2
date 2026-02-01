/**
 * Single source of truth for wallet connection display state.
 * Uses wagmi useAccount with handling for reconnecting state to avoid
 * navbar/Reown modal mismatch (e.g. modal shows connected, navbar shows disconnected).
 */
import { useAccount, useEnsName } from 'wagmi';

export interface ConnectionDisplay {
  connected: boolean;
  address?: string;
  ens?: string;
  /** True when reconnecting - use to show "Reconnecting..." if desired */
  isReconnecting: boolean;
}

export function useConnectionDisplay(ensOverride?: string): ConnectionDisplay {
  const { address, isConnected, status } = useAccount();
  const { data: ensName } = useEnsName({ address });

  // During reconnect, wagmi may briefly set isConnected=false while AppKit modal
  // still shows connected. Treat "reconnecting with address" as connected for display.
  const isReconnecting = status === 'reconnecting';
  const displayConnected = isConnected || (isReconnecting && !!address);

  return {
    connected: displayConnected,
    address,
    ens: ensOverride ?? ensName ?? undefined,
    isReconnecting,
  };
}
