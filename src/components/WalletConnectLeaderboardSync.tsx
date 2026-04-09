import { useEffect } from 'react';
import { database } from '../firebaseApp';
import { claimWalletConnectLeaderboardBonus } from '../firebaseLeaderboard';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';

/**
 * When Firebase RTDB is configured, awards a one-time `wallet_connect` leaderboard bonus per EVM / Solana
 * address (see `claimWalletConnectLeaderboardBonus`). Mounted once under `WagmiProvider` so desktop, mobile,
 * and `/arcade` all participate without duplicating logic.
 */
export function WalletConnectLeaderboardSync() {
  const { evmAddress, solanaAddress } = useConnectionDisplay();

  useEffect(() => {
    if (!database || !evmAddress?.startsWith('0x')) return;
    void claimWalletConnectLeaderboardBonus(evmAddress).then((r) => {
      if (r.claimed) {
        console.log('[LEADERBOARD] Wallet connect bonus applied (EVM)');
      }
    });
  }, [evmAddress]);

  useEffect(() => {
    if (!database || !solanaAddress || solanaAddress.startsWith('0x')) return;
    void claimWalletConnectLeaderboardBonus(solanaAddress).then((r) => {
      if (r.claimed) {
        console.log('[LEADERBOARD] Wallet connect bonus applied (Solana)');
      }
    });
  }, [solanaAddress]);

  return null;
}
