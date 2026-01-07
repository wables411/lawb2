# LAWB Repository Separation Game Plan

## Executive Summary

**Goal**: Separate the Base/Farcaster miniapp from the main lawb.xyz web browser app repository to eliminate conflicts and create a clean, maintainable codebase for each deployment target.

**Current State**: 
- Single repo (`lawb2`) deploys:
  - `lawb.xyz` - Desktop web browser app
  - `lawb.xyz` - Mobile web browser app  
  - `lawb.xyz?v=2` - Base/Farcaster miniapp (via conditional logic)

**Target State**:
- **Repo 1** (`lawb2`): Web browser app only (desktop + mobile)
- **Repo 2** (`lawb-baseapp`): Base/Farcaster miniapp only (new domain)

**Key Benefits**:
- ✅ No conditional logic conflicts
- ✅ Cleaner, simpler codebases
- ✅ Independent deployments
- ✅ Easier debugging and maintenance
- ✅ Better separation of concerns

---

## Phase 1: Preparation & Planning

### 1.1 Domain Planning
- [ ] **Decide on new domain for Base miniapp**
  - Options: `base.lawb.xyz`, `miniapp.lawb.xyz`, `app.lawb.xyz`, or completely new domain
  - Recommendation: Use subdomain like `base.lawb.xyz` for brand consistency
  - Update DNS records if needed

### 1.2 Repository Setup
- [ ] **Create new GitHub repository**: `lawb-baseapp`
  - Initialize with README
  - Set up branch protection if needed
  - Configure GitHub Actions/CI if applicable

### 1.3 Manifest Decision
- [ ] **Decide on manifest approach**
  - Option A: Use same manifest (update `homeUrl` to new domain)
  - Option B: Create new manifest (new `accountAssociation` credentials)
  - **Recommendation**: Option B (new manifest) for cleaner separation
  - If Option A: Update existing manifest's `homeUrl` field
  - If Option B: Generate new account association credentials via Base Builder

### 1.4 Backup Current State
- [ ] Create backup branch: `git checkout -b backup-before-separation`
- [ ] Commit current state
- [ ] Tag current release: `git tag v1.0.0-before-separation`

---

## Phase 2: Create New Repository Structure

### 2.1 Initialize New Repo
```bash
mkdir lawb-baseapp
cd lawb-baseapp
git init
git remote add origin <new-repo-url>
```

### 2.2 Copy Base App Specific Files

#### Core App Files (Rename baseapp → main app)
- [ ] `src/baseapp/BaseApp.tsx` → `src/App.tsx`
- [ ] `src/baseapp/BaseAppChessPage.tsx` → `src/ChessPage.tsx`
- [ ] `src/baseapp/BaseAppChessGame.tsx` → `src/ChessGame.tsx`
- [ ] `src/baseapp/BaseAppChessMultiplayer.tsx` → `src/ChessMultiplayer.tsx`
- [ ] `src/baseapp/HowToContent.tsx` → `src/HowToContent.tsx`

#### SDK & Utilities
- [ ] `src/utils/baseMiniapp.ts` (keep as-is)
- [ ] `src/utils/` (copy all other utils except web-app-specific ones)

#### Manifest & Config
- [ ] `public/.well-known/farcaster.json` (will update domain later)
- [ ] `index.base-miniapp.html` → `index.html`

### 2.3 Copy Shared Components
- [ ] `src/components/ChessChat.tsx`
- [ ] `src/components/Desktop.tsx`
- [ ] `src/components/Taskbar.tsx`
- [ ] `src/components/Popup.tsx`
- [ ] `src/components/PlayerProfile.tsx`
- [ ] `src/components/MintPopup.tsx`
- [ ] `src/components/NFTGallery.tsx`
- [ ] `src/components/MemeGenerator.tsx`
- [ ] `src/components/AsciiLawbsterMint.tsx`
- [ ] `src/components/ThemeToggle.tsx`
- [ ] `src/components/Icon.tsx`
- [ ] `src/components/TokenSelector.tsx`
- [ ] `src/components/CORSImage.tsx`
- [ ] `src/components/MediaGallery.tsx`
- [ ] `src/components/NFTDetailPopup.tsx`
- [ ] All CSS files from `src/components/`

### 2.4 Copy Shared Infrastructure
- [ ] `src/firebaseApp.ts`
- [ ] `src/firebaseChat.ts`
- [src/firebaseChess.ts`
- [ ] `src/firebaseLeaderboard.ts`
- [ ] `src/hooks/` (all hooks)
- [ ] `src/config/` (all config files)

### 2.5 Copy Assets & Static Files
- [ ] `public/assets/` (all assets)
- [ ] `public/manifest.json`
- [ ] `_headers` file

### 2.6 Copy Config Files
- [ ] `package.json` (will modify)
- [ ] `vite.config.ts` (will simplify)
- [ ] `tsconfig.json`
- [ ] `tsconfig.app.json`
- [ ] `tsconfig.node.json`
- [ ] `eslint.config.js`
- [ ] `netlify.toml` (will modify)
- [ ] `.gitignore`
- [ ] `.nvmrc` (if exists)

### 2.7 Files to NOT Copy
- ❌ `src/App.tsx` (web app version)
- ❌ `src/mobile/Mobile.tsx`
- ❌ `src/components/ChessPage.tsx` (web version)
- ❌ `src/components/ChessGame.tsx` (web version)
- ❌ `src/components/ChessMultiplayer.tsx` (web version)
- ❌ `src/components/HowToContent.tsx` (Sanko version)
- ❌ `src/appkit.ts` (web app logic)
- ❌ `src/main.tsx` (has routing logic - will create new)
- ❌ `index.html` (web app version)

---

## Phase 3: Create New Simplified Files

### 3.1 Create `src/main.tsx` (Simplified)
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
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading Chess...</div>}>
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

**Tasks**:
- [ ] Create new `src/main.tsx` with above code
- [ ] Remove all Base App detection logic
- [ ] Remove conditional routing
- [ ] Remove AppKit initialization
- [ ] Always use `wagmiConfig` with Farcaster connector

### 3.2 Simplify `src/wagmi.ts` (Base Chain Only)
```typescript
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

const connectors = [farcasterMiniApp()];

export const config = createConfig({
  chains: [base], // Only Base chain
  connectors,
  multiInjectedProviderDiscovery: false, // Farcaster connector doesn't support EIP-6963
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
});

export const allChains = [base];
```

**Tasks**:
- [ ] Remove all chains except Base
- [ ] Remove chain switching logic
- [ ] Remove Sanko networks
- [ ] Remove `isBaseMiniApp()` checks (always use Farcaster connector)
- [ ] Simplify RPC configuration

### 3.3 Simplify `src/App.tsx` (from BaseApp.tsx)
**Key Changes**:
- [ ] Remove all `isBaseMiniApp()` checks (always true)
- [ ] Remove `base-miniapp` class logic (always add on mount)
- [ ] Remove conditional rendering
- [ ] Simplify component structure
- [ ] Remove comments about "Base App vs web app"
- [ ] Always use mobile/miniapp styling

**Example changes**:
```typescript
// BEFORE
if (isBaseMiniApp()) {
  document.body.classList.add('base-miniapp');
}

// AFTER
useEffect(() => {
  document.body.classList.add('base-miniapp');
  document.documentElement.classList.add('base-miniapp');
  return () => {
    document.body.classList.remove('base-miniapp');
    document.documentElement.classList.remove('base-miniapp');
  };
}, []);
```

### 3.4 Simplify `src/ChessPage.tsx` (from BaseAppChessPage.tsx)
**Key Changes**:
- [ ] Remove `isBaseMiniAppDetected` checks (always true)
- [ ] Remove `base-miniapp` class logic (always add)
- [ ] Simplify `isMobile` logic (always true)
- [ ] Remove fallback logic for desktop browser visits
- [ ] Always use mobile/miniapp layout

### 3.5 Simplify Chess Game Components
**`src/ChessGame.tsx`**:
- [ ] Remove `isBaseMiniAppDetected` checks
- [ ] Remove `effectiveIsMobile` (always true)
- [ ] Remove `shouldShowDesktopMenu` (always false)
- [ ] Simplify all conditional logic
- [ ] Remove Base App detection code

**`src/ChessMultiplayer.tsx`**:
- [ ] Remove `isBaseMiniAppDetected` checks
- [ ] Remove `effectiveIsMobile` (always true)
- [ ] Set `isBase = true`, `isArbitrum = false`, `isSanko = false` (hardcode)
- [ ] Remove chain switching logic (Base only)
- [ ] Simplify all conditionals

### 3.6 Simplify Component Files
**`src/components/Desktop.tsx`**:
- [ ] Remove `isBaseMiniApp()` checks (always true)
- [ ] Simplify `isMobile` logic (always true)
- [ ] Remove desktop layout code
- [ ] Keep only mobile/miniapp layout

**`src/components/Taskbar.tsx`**:
- [ ] Remove `isBaseMiniApp()` checks (always true)
- [ ] Simplify `isMobile` logic (always true)
- [ ] Remove web app specific features

**`src/components/Popup.tsx`**:
- [ ] Remove `isBaseMiniAppDetected` state (always true)
- [ ] Remove detection logic
- [ ] Always use Base App inline styles
- [ ] Remove JSS classes for Base App (always use inline)

**`src/components/Icon.tsx`**:
- [ ] Remove `isBaseMiniApp()` checks (always use miniapp styles)

### 3.7 Clean Up CSS Files
**Tasks**:
- [ ] `ChessGame.css`: Remove `.baseapp` selectors, make those styles default
- [ ] `ChessMultiplayer.css`: Remove `.baseapp` selectors, make those styles default
- [ ] Remove media queries that are Base App specific
- [ ] Keep `.base-miniapp` selectors but make them default (or remove selector)
- [ ] Remove desktop-specific styles

**Example**:
```css
/* BEFORE */
.chess-game.baseapp .game-stable-layout {
  padding: 0;
}

/* AFTER */
.chess-game .game-stable-layout {
  padding: 0;
}
```

### 3.8 Update `package.json`
**Tasks**:
- [ ] Remove `build:base-miniapp` script (not needed)
- [ ] Update `build` script to just `tsc && vite build`
- [ ] Keep all dependencies (they're the same)
- [ ] Update `name` to `lawb-baseapp`

### 3.9 Update `index.html`
**Tasks**:
- [ ] Copy from `index.base-miniapp.html`
- [ ] Update `fc:miniapp` meta tag with new domain
- [ ] Update `base:app_id` if needed
- [ ] Update all URLs to new domain

### 3.10 Update `netlify.toml`
**Tasks**:
- [ ] Keep same structure
- [ ] Update redirects if needed
- [ ] Remove any Base App specific config

---

## Phase 4: Environment Setup

### 4.1 Create `.env` File
- [ ] Copy environment variables from original repo
- [ ] Update Firebase config (can use same or separate)
- [ ] Update RPC URLs if needed
- [ ] Add new domain-specific variables if needed

### 4.2 Install Dependencies
```bash
npm install
```

**Tasks**:
- [ ] Run `npm install`
- [ ] Verify all dependencies install correctly
- [ ] Check for any missing dependencies

---

## Phase 5: Code Simplification & Cleanup

### 5.1 Remove Conditional Logic
**Search and replace patterns**:
- [ ] Find all `isBaseMiniApp()` calls → Remove checks, assume always true
- [ ] Find all `isBaseMiniAppDetected` → Remove state, assume always true
- [ ] Find all `isMobile` conditionals → Simplify to always true
- [ ] Find all chain switching logic → Remove, hardcode Base

### 5.2 Remove Unused Imports
- [ ] Remove `@reown/appkit` imports (not needed)
- [ ] Remove AppKit-related code
- [ ] Remove mobile detection utilities (always mobile)
- [ ] Remove chain selector components

### 5.3 Simplify Component Props
- [ ] Remove `isMobile` props (always true)
- [ ] Remove `isBaseMiniApp` props (always true)
- [ ] Remove chain-related props

### 5.4 Update Type Definitions
- [ ] Remove optional Base App types
- [ ] Simplify interfaces
- [ ] Remove conditional types

---

## Phase 6: Testing

### 6.1 Local Development Testing
```bash
npm run dev
```

**Test Checklist**:
- [ ] Home page loads correctly
- [ ] Desktop icons display properly
- [ ] Taskbar works
- [ ] Chess single player works
- [ ] Chess multiplayer works
- [ ] Wallet connection works (Farcaster connector)
- [ ] Popups work correctly
- [ ] Mobile/miniapp styling works
- [ ] Haptic feedback works (if on device)
- [ ] Safe area insets work
- [ ] Navigation works (`/` and `/chess` routes)

### 6.2 Build Testing
```bash
npm run build
npm run preview
```

**Test Checklist**:
- [ ] Build completes without errors
- [ ] Preview works locally
- [ ] All assets load correctly
- [ ] No console errors
- [ ] Bundle size is reasonable

### 6.3 Base App Integration Testing
- [ ] Test in Base App preview tool
- [ ] Verify manifest loads correctly
- [ ] Test wallet connection flow
- [ ] Test all features in Base App context
- [ ] Verify haptic feedback
- [ ] Verify safe area insets

---

## Phase 7: Deployment

### 7.1 Netlify Setup
- [ ] Create new Netlify site for Base miniapp
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] Set environment variables
- [ ] Configure custom domain (if using subdomain)

### 7.2 Initial Deployment
- [ ] Deploy to Netlify
- [ ] Verify site loads
- [ ] Test all functionality
- [ ] Check console for errors

### 7.3 Update Manifest
**Update `public/.well-known/farcaster.json`**:
```json
{
  "miniapp": {
    "homeUrl": "https://your-new-domain.netlify.app",
    "iconUrl": "https://your-new-domain.netlify.app/assets/chessicon.png",
    "imageUrl": "https://your-new-domain.netlify.app/assets/hero.png",
    // ... update all URLs to new domain
  }
}
```

**Tasks**:
- [ ] Update all URLs in manifest to new domain
- [ ] Generate new account association credentials (if creating new manifest)
- [ ] Update Base Builder with new domain
- [ ] Test manifest accessibility: `https://your-new-domain/.well-known/farcaster.json`

### 7.4 Base Builder Registration
- [ ] Navigate to Base Builder
- [ ] Update miniapp URL to new domain
- [ ] Test preview in Base Builder
- [ ] Publish if ready

---

## Phase 8: Clean Up Original Repository

### 8.1 Remove Base App Code
- [ ] Delete `src/baseapp/` folder entirely
- [ ] Remove `index.base-miniapp.html`
- [ ] Remove Base App detection logic from `src/main.tsx`
- [ ] Remove Base App routing logic

### 8.2 Update `src/main.tsx`
**Simplified version**:
```typescript
// Remove all Base App detection
// Remove BaseApp imports
// Remove conditional routing
// Keep only web app routing
```

### 8.3 Remove Base App Dependencies (Optional)
- [ ] Consider removing `@farcaster/miniapp-sdk` (if not needed)
- [ ] Consider removing `@farcaster/miniapp-wagmi-connector` (if not needed)
- [ ] Keep if you want to support Base App in future

### 8.4 Update Manifest in Original Repo
- [ ] Update `public/.well-known/farcaster.json` to point to new domain
- [ ] Or remove manifest if not needed

### 8.5 Clean Up CSS
- [ ] Remove `.baseapp` class selectors
- [ ] Remove `.base-miniapp` class selectors
- [ ] Remove Base App specific media queries

### 8.6 Remove Unused Utilities
- [ ] Review `src/utils/baseMiniapp.ts` - remove if not needed
- [ ] Remove Base App detection functions if not needed

### 8.7 Update Documentation
- [ ] Update README to reflect separation
- [ ] Remove Base App deployment instructions
- [ ] Add note about separate Base App repo

---

## Phase 9: Verification & Final Steps

### 9.1 Verify Both Repos Work
- [ ] Test web app (`lawb.xyz`) - should work normally
- [ ] Test Base miniapp (new domain) - should work in Base App
- [ ] Verify no conflicts between deployments

### 9.2 Update Documentation
- [ ] Update README in both repos
- [ ] Document the separation
- [ ] Add deployment instructions for each

### 9.3 Communication
- [ ] Update any deployment scripts
- [ ] Update CI/CD if applicable
- [ ] Notify team of separation

### 9.4 Monitor
- [ ] Monitor both deployments for issues
- [ ] Check error logs
- [ ] Verify user experience

---

## Quick Reference: What Changes in New Repo

### Always True (No Conditionals Needed)
- `isBaseMiniApp()` → Always `true`
- `isMobile` → Always `true`
- `isBase` → Always `true`
- `isArbitrum` → Always `false`
- `isSanko` → Always `false`
- `shouldShowDesktopMenu` → Always `false`
- `effectiveIsMobile` → Always `true`
- `isBaseMiniAppDetected` → Always `true`

### Simplified Config
- **Chains**: Base only
- **Connectors**: Farcaster miniapp connector only
- **Routing**: Simple `/` and `/chess` routes
- **Styling**: Always mobile/miniapp style

### Removed Features
- AppKit wallet connection (use Farcaster connector)
- Chain switching UI
- Desktop layout code
- Web app specific components
- Sanko network support

---

## Troubleshooting

### Common Issues

**Issue**: Build fails with missing dependencies
- **Solution**: Check `package.json`, ensure all dependencies are copied

**Issue**: Manifest not accessible
- **Solution**: Verify `public/.well-known/farcaster.json` exists and Netlify serves it correctly

**Issue**: Wallet connection doesn't work
- **Solution**: Verify Farcaster connector is configured correctly in `wagmi.ts`

**Issue**: Styling looks wrong
- **Solution**: Check CSS files, ensure `.baseapp` styles are now default

**Issue**: Routes don't work
- **Solution**: Verify `netlify.toml` has correct redirect rules

---

## Timeline Estimate

- **Phase 1-2**: 2-4 hours (Setup & file copying)
- **Phase 3**: 4-6 hours (Create new files)
- **Phase 4**: 1 hour (Environment setup)
- **Phase 5**: 4-6 hours (Code simplification)
- **Phase 6**: 2-3 hours (Testing)
- **Phase 7**: 2-3 hours (Deployment)
- **Phase 8**: 2-3 hours (Cleanup)
- **Phase 9**: 1-2 hours (Verification)

**Total**: ~18-28 hours

---

## Success Criteria

✅ New repo builds and runs locally  
✅ New repo deploys to Netlify successfully  
✅ Base miniapp works in Base App  
✅ Original repo still works for web app  
✅ No conflicts between deployments  
✅ Code is cleaner and easier to maintain  
✅ All features work in both repos  

---

## Notes

- **Manifest**: Can reuse same manifest (update `homeUrl`) or create new one
- **Domain**: Recommend subdomain like `base.lawb.xyz` for brand consistency
- **Firebase**: Can share same Firebase project or create separate one
- **Assets**: Can share same CDN or copy to new deployment

---

## Next Steps After Separation

1. Set up separate CI/CD for each repo
2. Consider shared component library if code duplication becomes an issue
3. Monitor both deployments for performance
4. Iterate on Base miniapp features independently
5. Keep web app and Base app in sync for shared features (chess, NFTs, etc.)





