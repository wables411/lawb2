# Base App Migration Checklist

## Pre-Migration: Identify What to Change

### Files That Need Simplification

#### 1. `src/App.tsx` (from BaseApp.tsx)
- [ ] Remove `isBaseMiniApp()` checks (always true)
- [ ] Remove `base-miniapp` class logic (always add it on mount)
- [ ] Simplify component (no conditional rendering)
- [ ] Remove comments about "Base App vs web app"

#### 2. `src/ChessPage.tsx` (from BaseAppChessPage.tsx)
- [ ] Remove `isBaseMiniAppDetected` checks (always true)
- [ ] Remove `base-miniapp` class logic (always add it)
- [ ] Simplify `isMobile` logic (always true for Base App)
- [ ] Remove fallback logic for desktop browser visits

#### 3. `src/ChessGame.tsx` (from BaseAppChessGame.tsx)
- [ ] Remove `isBaseMiniAppDetected` checks
- [ ] Remove `effectiveIsMobile` (always true)
- [ ] Remove `shouldShowDesktopMenu` (always false)
- [ ] Simplify all conditional logic
- [ ] Remove Base App detection code

#### 4. `src/ChessMultiplayer.tsx` (from BaseAppChessMultiplayer.tsx)
- [ ] Remove `isBaseMiniAppDetected` checks
- [ ] Remove `effectiveIsMobile` (always true)
- [ ] Set `isBase = true`, `isArbitrum = false`, `isSanko = false` (hardcode)
- [ ] Remove chain switching logic (Base only)
- [ ] Simplify all conditionals

#### 5. `src/components/Desktop.tsx`
- [ ] Remove `isBaseMiniApp()` checks (always true)
- [ ] Simplify `isMobile` logic (always true)
- [ ] Remove desktop layout code
- [ ] Keep only mobile/miniapp layout

#### 6. `src/components/Taskbar.tsx`
- [ ] Remove `isBaseMiniApp()` checks (always true)
- [ ] Simplify `isMobile` logic (always true)
- [ ] Remove web app specific features

#### 7. `src/components/Popup.tsx`
- [ ] Remove `isBaseMiniAppDetected` state (always true)
- [ ] Remove detection logic
- [ ] Always use Base App inline styles
- [ ] Remove JSS classes for Base App (always use inline)

#### 8. `src/utils/baseMiniapp.ts`
- [ ] Keep as-is (still needed for SDK)
- [ ] `isBaseMiniApp()` will always return true (but keep for SDK compatibility)

#### 9. `src/wagmi.ts`
- [ ] Remove all chains except Base
- [ ] Remove chain switching logic
- [ ] Simplify connectors (Farcaster only)

#### 10. CSS Files
- [ ] `ChessGame.css`: Remove `.baseapp` selectors, make those styles default
- [ ] `ChessMultiplayer.css`: Remove `.baseapp` selectors, make those styles default
- [ ] Remove media queries that are Base App specific
- [ ] Keep `.base-miniapp` selectors but make them default (or remove selector)

## Migration Steps

### Phase 1: Setup New Repo
- [ ] Create new GitHub repository: `lawb-baseapp`
- [ ] Clone locally
- [ ] Initialize with `npm init`

### Phase 2: Copy Files
- [ ] Copy `src/baseapp/` → `src/` (with renames)
- [ ] Copy `src/components/` (shared components only)
- [ ] Copy `src/utils/`
- [ ] Copy `src/hooks/`
- [ ] Copy `src/config/`
- [ ] Copy `src/firebase*.ts` files
- [ ] Copy `public/` folder
- [ ] Copy config files (`package.json`, `vite.config.ts`, etc.)

### Phase 3: Create New Files
- [ ] Create simplified `src/main.tsx`
- [ ] Create simplified `src/wagmi.ts` (Base only)
- [ ] Create `.env` file with Firebase config

### Phase 4: Simplify Code
- [ ] Simplify `src/App.tsx`
- [ ] Simplify `src/ChessPage.tsx`
- [ ] Simplify `src/ChessGame.tsx`
- [ ] Simplify `src/ChessMultiplayer.tsx`
- [ ] Simplify `src/components/Desktop.tsx`
- [ ] Simplify `src/components/Taskbar.tsx`
- [ ] Simplify `src/components/Popup.tsx`
- [ ] Clean up CSS files

### Phase 5: Test
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test all features:
  - [ ] Home page loads
  - [ ] Chess single player works
  - [ ] Chess multiplayer works
  - [ ] Wallet connection works
  - [ ] Popups work correctly
  - [ ] Mobile styling works
  - [ ] Haptic feedback works (if on device)

### Phase 6: Build & Deploy
- [ ] Run `npm run build`
- [ ] Test build locally: `npm run preview`
- [ ] Create Netlify site
- [ ] Deploy to Netlify
- [ ] Verify domain works

### Phase 7: Update Farcaster Config
- [ ] Update `public/.well-known/farcaster.json` with new domain
- [ ] Update Base Builder with new domain
- [ ] Test miniapp opens correctly in Farcaster/Base

### Phase 8: Clean Up Original Repo
- [ ] Remove `src/baseapp/` folder
- [ ] Remove Base App detection from `main.tsx`
- [ ] Remove `index.base-miniapp.html`
- [ ] Remove Base App CSS selectors
- [ ] Update `public/.well-known/farcaster.json` to point to new domain
- [ ] Commit and push changes

## Quick Reference: What Always True in Base App

- `isBaseMiniApp()` → Always `true`
- `isMobile` → Always `true`
- `isBase` → Always `true`
- `isArbitrum` → Always `false`
- `isSanko` → Always `false`
- `shouldShowDesktopMenu` → Always `false`
- `effectiveIsMobile` → Always `true`
- `isBaseMiniAppDetected` → Always `true`

## Files to Delete from New Repo

- Any `Mobile.tsx` references
- Any `App.tsx` (web app version)
- Any `ChessPage.tsx` (web app version)
- Any `ChessGame.tsx` (web app version)
- Any `ChessMultiplayer.tsx` (web app version)
- Any Sanko-specific content
- Any chain switching UI






