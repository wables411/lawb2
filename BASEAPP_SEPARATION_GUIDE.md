# Base App Separation Guide

## Overview

This guide helps you create a **completely separate repository** for the Base Mini App, deployed to a new Netlify domain. This eliminates all the conditional logic, duplicate components, and UI/UX conflicts.

## New Repository Structure

```
lawb-baseapp/                    # New repo name
├── public/
│   ├── .well-known/
│   │   └── farcaster.json      # Base App manifest
│   ├── assets/                  # All assets (images, icons, etc.)
│   └── manifest.json
├── src/
│   ├── baseapp/                 # Rename this to just be the main app
│   │   ├── App.tsx              # Rename BaseApp.tsx → App.tsx
│   │   ├── ChessPage.tsx        # Rename BaseAppChessPage.tsx
│   │   ├── ChessGame.tsx        # Rename BaseAppChessGame.tsx
│   │   ├── ChessMultiplayer.tsx # Rename BaseAppChessMultiplayer.tsx
│   │   └── HowToContent.tsx
│   ├── components/              # Shared components (no duplicates)
│   │   ├── ChessChat.tsx
│   │   ├── Desktop.tsx
│   │   ├── Taskbar.tsx
│   │   ├── Popup.tsx
│   │   ├── PlayerProfile.tsx
│   │   ├── MintPopup.tsx
│   │   ├── NFTGallery.tsx
│   │   ├── MemeGenerator.tsx
│   │   ├── AsciiLawbsterMint.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── ... (other shared components)
│   ├── utils/
│   │   ├── baseMiniapp.ts       # Keep this (SDK utilities)
│   │   └── ... (other utils)
│   ├── hooks/
│   ├── config/
│   ├── firebaseApp.ts
│   ├── firebaseChat.ts
│   ├── firebaseChess.ts
│   ├── firebaseLeaderboard.ts
│   ├── firebaseProfiles.ts
│   ├── wagmi.ts                 # Simplified (Base chain only)
│   ├── main.tsx                 # Simplified (no routing logic)
│   └── index.css
├── index.html                   # Use index.base-miniapp.html as template
├── package.json
├── vite.config.ts
├── tsconfig.json
└── netlify.toml
```

## Files to Copy to New Repo

### ✅ Must Copy (Base App Specific)
- `src/baseapp/` → `src/` (rename baseapp folder contents to be main app)
  - `BaseApp.tsx` → `App.tsx`
  - `BaseAppChessPage.tsx` → `ChessPage.tsx`
  - `BaseAppChessGame.tsx` → `ChessGame.tsx`
  - `BaseAppChessMultiplayer.tsx` → `ChessMultiplayer.tsx`
  - `HowToContent.tsx` (Base version)
- `src/utils/baseMiniapp.ts`
- `public/.well-known/farcaster.json`
- `index.base-miniapp.html` → `index.html`

### ✅ Must Copy (Shared Components)
- `src/components/ChessChat.tsx`
- `src/components/Desktop.tsx`
- `src/components/Taskbar.tsx`
- `src/components/Popup.tsx`
- `src/components/PlayerProfile.tsx`
- `src/components/MintPopup.tsx`
- `src/components/NFTGallery.tsx`
- `src/components/MemeGenerator.tsx`
- `src/components/AsciiLawbsterMint.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/Icon.tsx`
- `src/components/TokenSelector.tsx`
- `src/components/ChessGame.css` (will need cleanup)
- `src/components/ChessMultiplayer.css` (will need cleanup)
- `src/components/ChessPage.css`
- `src/components/ChessChat.css`
- `src/components/ThemeToggle.css`

### ✅ Must Copy (Shared Utilities)
- `src/firebaseApp.ts`
- `src/firebaseChat.ts`
- `src/firebaseChess.ts`
- `src/firebaseLeaderboard.ts`
- `src/firebaseProfiles.ts`
- `src/hooks/` (all hooks)
- `src/config/` (all config files)
- `src/utils/` (except any web-app-specific ones)

### ✅ Must Copy (Assets)
- `public/assets/` (all assets)
- `public/manifest.json`

### ✅ Must Copy (Config Files)
- `package.json` (will need modification)
- `vite.config.ts` (will need simplification)
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `eslint.config.js`
- `netlify.toml` (will need modification)
- `_headers`

### ❌ Do NOT Copy (Web App Only)
- `src/App.tsx` (regular web app)
- `src/mobile/Mobile.tsx`
- `src/components/ChessPage.tsx` (regular version)
- `src/components/ChessGame.tsx` (regular version)
- `src/components/ChessMultiplayer.tsx` (regular version)
- `src/components/HowToContent.tsx` (Sanko version)
- `src/appkit.ts` (has web app logic)
- `src/main.tsx` (has routing logic - will create new simplified version)

## Files to Modify in New Repo

### 1. `src/main.tsx` (Create New Simplified Version)
```typescript
import './firebaseApp';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // No more BaseApp, just App
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { config as wagmiConfig } from './wagmi';
import './index.css';
import './walletModal.css';

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
              <Suspense fallback={<div>Loading Chess...</div>}>
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

### 2. `src/wagmi.ts` (Simplify - Base Chain Only)
Remove all chain switching logic, keep only Base chain configuration.

### 3. `src/App.tsx` (Rename from BaseApp.tsx)
- Remove all conditional Base App detection (it's always Base App now)
- Simplify component
- Remove `base-miniapp` class logic (always apply it)

### 4. `package.json`
- Remove `build:base-miniapp` script (not needed)
- Keep all dependencies (they're the same)

### 5. `vite.config.ts`
- Remove any Base App conditional logic
- Simplify build config

### 6. `netlify.toml`
- Update redirects if needed
- Remove any Base App specific config

### 7. CSS Files
- Remove all `.baseapp` class selectors (always apply those styles)
- Remove all `@media (max-width: 768px)` that are Base App specific
- Keep `.base-miniapp` selectors but make them default styles

## Step-by-Step Migration Process

### Step 1: Create New Repository
```bash
mkdir lawb-baseapp
cd lawb-baseapp
git init
```

### Step 2: Copy Files
Use the list above to copy files, renaming as needed:
- `src/baseapp/BaseApp.tsx` → `src/App.tsx`
- `src/baseapp/BaseAppChessPage.tsx` → `src/ChessPage.tsx`
- etc.

### Step 3: Create New `main.tsx`
Create simplified version (see above).

### Step 4: Simplify Components
- Remove all `isBaseMiniApp()` checks (always true)
- Remove all conditional logic for Base App vs web app
- Remove duplicate component references
- Simplify `Desktop.tsx` (remove web app logic)
- Simplify `Taskbar.tsx` (remove web app logic)

### Step 5: Clean Up CSS
- Remove `.baseapp` selectors, make those styles default
- Remove media queries that are Base App specific
- Keep mobile-first responsive design

### Step 6: Update Dependencies
Copy `package.json` and run:
```bash
npm install
```

### Step 7: Update Environment Variables
Create `.env` file:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### Step 8: Test Locally
```bash
npm run dev
```

### Step 9: Build and Deploy
```bash
npm run build
# Deploy dist/ to new Netlify site
```

### Step 10: Update Farcaster Manifest
Update `public/.well-known/farcaster.json` with new domain:
```json
{
  "miniapp": {
    "homeUrl": "https://your-new-netlify-domain.netlify.app"
  }
}
```

## Benefits of Separation

1. ✅ **No Conditional Logic** - Code is always Base App, no detection needed
2. ✅ **No Duplicate Components** - Single source of truth
3. ✅ **Cleaner Codebase** - Easier to understand and maintain
4. ✅ **Independent Deployment** - Can deploy Base App without affecting lawb.xyz
5. ✅ **Easier Debugging** - No confusion about which code path is running
6. ✅ **Simpler Testing** - Test one app, not two in one codebase

## What to Keep in Original Repo

- Remove `src/baseapp/` folder entirely
- Remove Base App detection logic from `main.tsx`
- Remove `index.base-miniapp.html`
- Keep `public/.well-known/farcaster.json` but update it to point to new domain
- Remove Base App specific CSS selectors (`.baseapp`, `.base-miniapp`)

## Next Steps

1. Create the new repository
2. Copy files following this guide
3. Simplify and clean up code
4. Test locally
5. Deploy to new Netlify domain
6. Update Farcaster manifest with new domain
7. Remove Base App code from original repo






