import WormholeConnect, {
  type config,
  type WormholeConnectTheme,
} from '@wormhole-foundation/wormhole-connect';

const LAWB_SOL = '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6';
const LAWB_ARB = '0x741f8FbF42485E772D97f1955c31a5B8098aC962';

// Pinned to RPC hosts already allowlisted in _headers CSP connect-src.
const bridgeConfig: config.WormholeConnectConfig = {
  network: 'Mainnet',
  chains: ['Solana', 'Arbitrum'],
  tokens: ['LAWB'],
  rpcs: {
    Solana: 'https://solana-rpc.publicnode.com',
    Arbitrum: 'https://arb1.arbitrum.io/rpc',
  },
  tokensConfig: {
    LAWB: {
      symbol: 'LAWB',
      name: '$LAWB',
      tokenId: { chain: 'Solana', address: LAWB_SOL },
      icon: 'https://lawb.xyz/assets/lawbpointer.png',
      decimals: 6,
    },
  },
  wrappedTokens: {
    Solana: {
      [LAWB_SOL]: { Arbitrum: LAWB_ARB },
    },
  },
  ui: {
    title: '$LAWB bridge',
    defaultInputs: {
      source: { chain: 'Solana', token: 'LAWB' },
      destination: { chain: 'Arbitrum' },
    },
  },
};

const bridgeTheme: WormholeConnectTheme = {
  mode: 'light',
  primary: '#c0c0c0',
  font: '"MS Sans Serif", Arial, sans-serif',
};

export default function LawbBridge() {
  return (
    <div style={{ width: '100%', minHeight: '540px', background: '#f0f0f0', border: '2px inset #808080', marginBottom: '12px' }}>
      <WormholeConnect config={bridgeConfig} theme={bridgeTheme} />
    </div>
  );
}
