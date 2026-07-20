import { erc20Abi, formatUnits, parseUnits } from 'viem';
import type { PublicClient, WalletClient } from 'viem';

export interface RequiredErc20 {
  address: `0x${string}`;
  amount: bigint;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * ERC-20 payments the mint transaction will pull from the minter.
 * Scatter's /mint response lists them in `erc20s`; if the API omits the field,
 * derive them from the selected invite lists (token_price is in human units).
 */
export function getRequiredErc20s(
  apiErc20s: Array<{ address: string; amount: string }> | undefined,
  selectedLists: Array<{
    currency_address?: string;
    token_price?: string;
    decimals?: number;
    quantity: number;
  }>
): RequiredErc20[] {
  const totals = new Map<string, bigint>();

  if (apiErc20s && apiErc20s.length > 0) {
    for (const { address, amount } of apiErc20s) {
      if (!address || address.toLowerCase() === ZERO_ADDRESS) continue;
      const key = address.toLowerCase();
      totals.set(key, (totals.get(key) || 0n) + BigInt(amount));
    }
  } else {
    for (const list of selectedLists) {
      const token = list.currency_address;
      if (!token || token.toLowerCase() === ZERO_ADDRESS) continue;
      if (!list.token_price || list.quantity <= 0) continue;
      const unitPrice = parseUnits(list.token_price, list.decimals ?? 18);
      const key = token.toLowerCase();
      totals.set(key, (totals.get(key) || 0n) + unitPrice * BigInt(list.quantity));
    }
  }

  return [...totals.entries()].map(([address, amount]) => ({
    address: address as `0x${string}`,
    amount,
  }));
}

/**
 * For each required ERC-20 payment: verify the wallet holds enough, and if the
 * collection's allowance is short, prompt an approve tx and wait for it to
 * confirm. Throws a human-readable Error when the balance is insufficient.
 */
export async function ensureErc20Approvals(opts: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  owner: `0x${string}`;
  spender: `0x${string}`;
  required: RequiredErc20[];
  onStatus?: (message: string) => void;
}): Promise<void> {
  const { walletClient, publicClient, owner, spender, required, onStatus } = opts;

  for (const { address, amount } of required) {
    if (amount <= 0n) continue;

    const [balance, allowance, symbol, decimals] = await Promise.all([
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'balanceOf', args: [owner] }),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'allowance', args: [owner, spender] }),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'symbol' }).catch(() => 'tokens'),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'decimals' }).catch(() => 18),
    ]);

    const fmt = (v: bigint) => formatUnits(v, decimals);

    if (balance < amount) {
      throw new Error(
        `Not enough ${symbol}: this mint costs ${fmt(amount)} ${symbol} but the wallet only has ${fmt(balance)}.`
      );
    }

    if (allowance < amount) {
      onStatus?.(
        `This mint is paid in ${symbol}. First approve ${fmt(amount)} ${symbol} in your wallet, then confirm the mint.`
      );
      const hash = await walletClient.writeContract({
        address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
        account: owner,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
    }
  }
}

export { friendlyTxError as friendlyMintError } from './friendlyTxError';
