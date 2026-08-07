// DEV-ONLY diagnostic: a fake EIP-1193/EIP-6963 injected wallet so wallet-state
// plumbing (AppKit ↔ wagmi) can be exercised in a browser with no extension.
// Inert unless running under `vite dev` AND localStorage.DEV_FAKE_WALLET is set.
// Never bundled into production output (import.meta.env.DEV guard is compile-time).

if (import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('DEV_FAKE_WALLET')) {
  const address = '0x00a63d34051602b2cb268c94f2312cbc0b4c724e';
  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<string, Set<Listener>>();

  const provider = {
    isMetaMask: true,
    request: async ({ method, params }: { method: string; params?: unknown[] }) => {
      const delay = Number(localStorage.getItem('DEV_FAKE_WALLET_DELAY') || 0);
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      window.console.log('[FAKE WALLET] request:', method, params ?? '', delay ? `(+${delay}ms)` : '');
      switch (method) {
        case 'eth_accounts':
          // UNAUTH mode: behaves like a MetaMask the user never approved for this site.
          return localStorage.getItem('DEV_FAKE_WALLET_UNAUTH') ? [] : [address];
        case 'eth_requestAccounts':
          return [address];
        case 'eth_chainId':
          return '0x1';
        case 'wallet_switchEthereumChain':
          return null;
        case 'wallet_getPermissions':
        case 'wallet_requestPermissions':
          return [{ parentCapability: 'eth_accounts' }];
        default:
          throw Object.assign(new Error(`[FAKE WALLET] unsupported method ${method}`), { code: -32601 });
      }
    },
    on: (event: string, cb: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    },
    removeListener: (event: string, cb: Listener) => {
      listeners.get(event)?.delete(cb);
    },
  };

  (window as any).ethereum = provider;

  const info = {
    uuid: 'd3f4ke00-0000-4000-8000-000000000001',
    name: 'MetaMask',
    rdns: 'io.metamask',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=',
  };
  const announce = () =>
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
  window.console.log('[FAKE WALLET] installed as MetaMask (EIP-6963 + window.ethereum),', address);
}

export {};
