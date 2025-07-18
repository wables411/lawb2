import { createClient, convertViemChainToRelayChain, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk';
import { arbitrum, mainnet } from 'viem/chains';

// Initialize Relay client
export const relayClient = createClient({
  baseApiUrl: MAINNET_RELAY_API,
  source: "lawb.xyz",
  chains: [
    convertViemChainToRelayChain(arbitrum),
    convertViemChainToRelayChain(mainnet)
  ]
});

export default relayClient; 