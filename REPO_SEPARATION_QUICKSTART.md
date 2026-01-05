# Repository Separation - Quick Start Guide

## TL;DR

**Goal**: Split Base/Farcaster miniapp into separate repo to eliminate conflicts.

**Steps**:
1. Create new GitHub repo: `lawb-baseapp`
2. Copy Base App files (rename `baseapp/` → main app)
3. Simplify code (remove all conditionals, Base-only)
4. Deploy to new domain
5. Clean up original repo

---

## Key Files to Copy

### Core App (Rename)
- `src/baseapp/BaseApp.tsx` → `src/App.tsx`
- `src/baseapp/BaseAppChessPage.tsx` → `src/ChessPage.tsx`
- `src/baseapp/BaseAppChessGame.tsx` → `src/ChessGame.tsx`
- `src/baseapp/BaseAppChessMultiplayer.tsx` → `src/ChessMultiplayer.tsx`

### Always Copy
- `src/utils/baseMiniapp.ts`
- `src/components/` (all shared components)
- `src/firebase*.ts` files
- `src/hooks/`, `src/config/`
- `public/.well-known/farcaster.json`
- `public/assets/`
- `index.base-miniapp.html` → `index.html`

### Never Copy
- `src/App.tsx` (web version)
- `src/mobile/Mobile.tsx`
- `src/appkit.ts`
- `src/main.tsx` (create new simplified version)

---

## Simplifications Needed

### Remove Conditionals
- `isBaseMiniApp()` → Always `true`
- `isMobile` → Always `true`
- Remove all Base App detection logic

### Simplify Config
- **Chains**: Base only (remove Arbitrum, Sanko, etc.)
- **Connectors**: Farcaster miniapp connector only
- **Routing**: Simple `/` and `/chess` routes

### CSS Cleanup
- Remove `.baseapp` selectors (make those styles default)
- Remove desktop-specific styles

---

## New Files to Create

### `src/main.tsx` (Simplified)
```typescript
import './firebaseApp';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { config as wagmiConfig } from './wagmi';
import './index.css';

const ChessPage = lazy(() => import('./ChessPage'));
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chess" element={
              <Suspense fallback={<div>Loading...</div>}>
                <ChessPage />
              </Suspense>
            } />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
```

### `src/wagmi.ts` (Base Only)
```typescript
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export const config = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  multiInjectedProviderDiscovery: false,
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
});
```

---

## Deployment Checklist

- [ ] Create new Netlify site
- [ ] Deploy new repo
- [ ] Update `farcaster.json` with new domain
- [ ] Test in Base App
- [ ] Update Base Builder with new domain
- [ ] Clean up original repo

---

## Manifest Decision

**Option A**: Update existing manifest
- Change `homeUrl` to new domain
- Keep same `accountAssociation` credentials

**Option B**: Create new manifest (Recommended)
- Generate new account association credentials
- Cleaner separation

---

## Domain Recommendation

Use subdomain: `base.lawb.xyz` or `miniapp.lawb.xyz`

---

## Full Details

See `REPO_SEPARATION_GAMEPLAN.md` for complete step-by-step guide.




