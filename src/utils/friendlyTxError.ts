/**
 * Map raw wallet/RPC errors to something a human can act on, instead of the
 * multi-kilobyte JSON dumps viem/ethers produce. Knows the custom-error
 * selectors of the Scatter/Archetype mint contract; unknown errors fall back
 * to viem's shortMessage or a truncated raw message.
 */
const KNOWN_ERROR_SELECTORS: Record<string, string> = {
  // Scatter Archetype (Pixelawbs mint) custom errors
  '0x1d23a742': 'This mint has not started yet.',
  '0x49084b94': 'This mint has ended.',
  '0xd838648f': 'This wallet is not eligible for the selected mint list.',
  '0xf244866f': 'Not enough ETH sent to cover the mint price.',
  '0x2355d738': 'The wallet does not hold enough of the payment token for this mint.',
  '0x8a164f63': 'Sold out — the collection has reached max supply.',
  '0x81fa2398': 'This mint list is sold out.',
  '0x15fcbc9d': 'This wallet has reached its mint limit for this list.',
  '0xeb560756': 'Minting is currently paused.',
  '0x7a7e96df': 'Quantity is over the per-transaction limit — try minting fewer at once.',
  '0x0b7d20d4': 'The payment token has not been approved yet — try again to trigger the approval step.',
  '0x09550c77': 'This wallet is blocked from minting.',
};

export function friendlyTxError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  for (const [selector, message] of Object.entries(KNOWN_ERROR_SELECTORS)) {
    if (raw.includes(selector)) return message;
  }
  if (/user (rejected|denied)|rejected the request/i.test(raw)) {
    return 'Transaction was rejected in the wallet.';
  }
  if (/insufficient funds/i.test(raw)) {
    return 'Not enough ETH in the wallet to pay for gas.';
  }
  // viem errors carry a concise one-line summary
  const short = (err as { shortMessage?: unknown })?.shortMessage;
  if (typeof short === 'string' && short.length > 0) return short;
  return raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
}
