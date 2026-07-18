import { useEffect } from 'react';
import { useSignMessage } from 'wagmi';
import { database } from '../firebaseApp';
import { claimWalletConnectLeaderboardBonus } from '../firebaseLeaderboard';
import { ensureWalletDbAuth, base58Encode } from '../firebaseWalletAuth';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { appKit } from '../appkit';

/** Minimal slice of the AppKit Solana wallet provider we need. */
type SolanaSigner = { signMessage?: (message: Uint8Array) => Promise<Uint8Array> };

/**
 * Mounted once under `WagmiProvider` (desktop, mobile, /arcade).
 * On wallet connect:
 *  1. Signs the wallet into Firebase Auth (one signature; session persists) so
 *     database rules accept writes to this wallet's leaderboard/profile entries.
 *  2. Awards the one-time `wallet_connect` leaderboard bonus.
 */
export function WalletConnectLeaderboardSync() {
  const { evmAddress, solanaAddress } = useConnectionDisplay();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    if (!database || !evmAddress?.startsWith('0x')) return;
    void (async () => {
      const authed = await ensureWalletDbAuth(evmAddress, 'evm', (message) =>
        signMessageAsync({ message }),
      );
      if (!authed) return;
      const r = await claimWalletConnectLeaderboardBonus(evmAddress);
      if (r.claimed) console.log('[LEADERBOARD] Wallet connect bonus applied (EVM)');
    })();
  }, [evmAddress, signMessageAsync]);

  useEffect(() => {
    if (!database || !solanaAddress || solanaAddress.startsWith('0x')) return;
    void (async () => {
      const authed = await ensureWalletDbAuth(solanaAddress, 'solana', async (message) => {
        const provider = appKit?.getProvider('solana') as SolanaSigner | undefined;
        if (!provider?.signMessage) throw new Error('Solana wallet cannot sign messages');
        const sig = await provider.signMessage(new TextEncoder().encode(message));
        return base58Encode(sig);
      });
      if (!authed) return;
      const r = await claimWalletConnectLeaderboardBonus(solanaAddress);
      if (r.claimed) console.log('[LEADERBOARD] Wallet connect bonus applied (Solana)');
    })();
  }, [solanaAddress]);

  return null;
}
