# Version Differences: lawb.xyz vs lawb.xyz?v=2

## Summary

The `?v=2` query parameter is **NOT functionally used** by the application code. It's only present in the Farcaster/Base miniapp configuration metadata. The actual behavior differences are determined by:

1. **Base Mini App Detection** (iframe, hostname, referrer, user agent)
2. **Screen Width** (mobile ≤768px vs desktop >768px)

## Behavior Matrix

| Scenario | Component Used | Visual Style | Functional Differences |
|----------|---------------|--------------|------------------------|
| **lawb.xyz (mobile browser)** | `Mobile.tsx` | Mobile-optimized grid layout, bottom taskbar, touch-friendly | Uses AppKit for wallet connection |
| **lawb.xyz (desktop browser)** | `App.tsx` | Desktop Windows 95-style interface, draggable windows | Uses AppKit for wallet connection |
| **lawb.xyz?v=2 (mobile browser)** | `Mobile.tsx` | Same as lawb.xyz mobile | Same as lawb.xyz mobile (parameter ignored) |
| **lawb.xyz?v=2 (desktop browser)** | `App.tsx` | Same as lawb.xyz desktop | Same as lawb.xyz desktop (parameter ignored) |
| **lawb.xyz?v=2 (Base/Farcaster app)** | `BaseApp.tsx` | Vertical miniapp style, always mobile-like | Uses Farcaster connector, haptic feedback, safe area insets |

## Key Findings

### 1. The `?v=2` Parameter is Not Read
- The code does NOT check for `?v=2` or any `v` parameter
- The parameter is only in Farcaster metadata (`farcaster.json`, `index.html`, `index.base-miniapp.html`)
- Regular browser visits ignore this parameter completely

### 2. Base Mini App Detection
The app detects Base Mini App via:
- **Iframe detection**: `window.self !== window.top` (most reliable)
- **Hostname**: Contains `farcaster.xyz`, `warpcast.com`, `base.app`, etc.
- **Referrer**: Contains Farcaster/Base domains
- **User Agent**: Contains Farcaster/Base indicators
- **URL parameter**: `?base_miniapp` (not `?v=2`)

### 3. Routing Logic (from `main.tsx`)

```typescript
// BASE APP: Use BaseApp component
if (isBaseApp) {
  return <BaseApp />;
}

// WEB BROWSER: Use App/Mobile based on screen width
return isMobile ? <Mobile /> : <App />;
```

## Visual Differences

### Mobile Browser (lawb.xyz or lawb.xyz?v=2)
- **Component**: `Mobile.tsx`
- **Layout**: Grid of icons (2 columns), bottom taskbar
- **Styling**: Press Start 2P font, red header, cyan accents
- **Features**: Touch-optimized, mobile popups, simplified navigation

### Desktop Browser (lawb.xyz or lawb.xyz?v=2)
- **Component**: `App.tsx`
- **Layout**: Windows 95-style desktop with draggable windows
- **Styling**: MS Sans Serif font, classic Windows UI
- **Features**: Draggable/resizable popups, desktop taskbar, full window management

### Base/Farcaster App (lawb.xyz?v=2 when launched from Base app)
- **Component**: `BaseApp.tsx`
- **Layout**: Vertical miniapp style, always mobile-like regardless of device
- **Styling**: Optimized for miniapp container, safe area insets
- **Features**: 
  - Farcaster wallet connector (auto-connect)
  - Haptic feedback
  - Safe area inset handling
  - Miniapp-optimized popups

## Functional Differences

### Wallet Connection
- **Regular Browser (mobile/desktop)**: Uses AppKit with WalletConnect
- **Base/Farcaster App**: Uses Farcaster miniapp connector (auto-connects)

### Haptic Feedback
- **Regular Browser**: Not available
- **Base/Farcaster App**: Available (light, medium, heavy impacts, notifications, selection)

### Safe Area Insets
- **Regular Browser**: Not applicable
- **Base/Farcaster App**: Handles device safe areas (notches, home indicators)

### Popup Behavior
- **Desktop Browser**: Draggable and resizable windows
- **Mobile Browser**: Full-screen modals
- **Base/Farcaster App**: Miniapp-optimized popups with safe area insets

## Code References

- **Routing**: `src/main.tsx` (lines 29-78)
- **Base App Detection**: `src/utils/baseMiniapp.ts` (lines 20-142)
- **Mobile Component**: `src/mobile/Mobile.tsx`
- **Desktop Component**: `src/App.tsx`
- **Base App Component**: `src/baseapp/BaseApp.tsx`
- **Farcaster Config**: `public/.well-known/farcaster.json` (line 13)

## Conclusion

**For regular browser users:**
- `lawb.xyz` and `lawb.xyz?v=2` are **functionally identical**
- The `?v=2` parameter is ignored
- Behavior depends only on screen width (mobile vs desktop)

**For Base/Farcaster app users:**
- When launched from Base/Farcaster app, `lawb.xyz?v=2` will be detected as Base Mini App
- This triggers `BaseApp` component with miniapp-specific features
- The `?v=2` parameter itself doesn't cause this - it's the iframe embedding that triggers detection








