# Farcaster Mini App Implementation Review

## ✅ What's Working Well

1. **Manifest File** (`/.well-known/farcaster.json`)
   - ✅ Properly structured with `accountAssociation` and `miniapp` objects
   - ✅ All required fields present (name, iconUrl, homeUrl, etc.)
   - ✅ Domain matches hosting domain (lawb.xyz)

2. **Embed Metadata**
   - ✅ `fc:miniapp` meta tag present in HTML
   - ✅ Valid JSON structure with version, imageUrl, button, and action

## ⚠️ Issues Found

### 1. **CRITICAL: SDK `ready()` Called Too Early**

**Problem:** `ready()` is being called immediately when the module loads in `src/utils/baseMiniapp.ts` (lines 11-17). This violates Farcaster best practices.

**Per Documentation:**
> "You should call ready as soon as possible while avoiding jitter and content reflows. Don't call ready until your interface has loaded."

**Current Code:**
```typescript
// ❌ WRONG - Called immediately on module load
if (typeof window !== 'undefined' && sdk && sdk.actions && sdk.actions.ready) {
  sdk.actions.ready().catch(() => {});
}
```

**Fix:** Remove the immediate call. Only call `ready()` in React `useEffect` hooks after the UI is rendered.

### 2. **Embed Action Type Should Be `launch_miniapp`**

**Problem:** Using `"type": "launch_frame"` for backward compatibility, but should use `"launch_miniapp"` for new implementations.

**Current:**
```json
"action": {
  "type": "launch_frame",  // ❌ Legacy format
  ...
}
```

**Should Be:**
```json
"action": {
  "type": "launch_miniapp",  // ✅ Current format
  ...
}
```

### 3. **Multiple `ready()` Calls**

**Problem:** `ready()` is being called in multiple places:
- Immediately on module load (baseMiniapp.ts)
- In `initBaseMiniApp()` function
- In component `useEffect` hooks

**Fix:** Call `ready()` only once, in a `useEffect` after the component has rendered and the UI is ready.

### 4. **Missing `webhookUrl` in Manifest**

**Problem:** No `webhookUrl` specified, which means notifications won't work.

**Fix:** Add `webhookUrl` to manifest if you want to support notifications:
```json
"webhookUrl": "https://lawb.xyz/api/webhook"
```

## 📋 Recommended Fixes

### Fix 1: Remove Immediate `ready()` Call

**File:** `src/utils/baseMiniapp.ts`

Remove lines 9-17:
```typescript
// DELETE THIS ENTIRE BLOCK:
// Call ready() immediately when module loads (for Farcaster validator detection)
if (typeof window !== 'undefined' && sdk && sdk.actions && sdk.actions.ready) {
  sdk.actions.ready().catch(() => {
    // Silently fail - SDK will handle if not in Base app context
  });
}
```

### Fix 2: Update Embed Action Type

**Files:** `index.html` and `index.base-miniapp.html`

Change:
```html
"type": "launch_frame",
```

To:
```html
"type": "launch_miniapp",
```

### Fix 3: Ensure `ready()` Called Once Per Component

**Files:** `src/baseapp/BaseApp.tsx`, `src/baseapp/BaseAppChessPage.tsx`

Make sure `ready()` is only called once in a `useEffect` after render:

```typescript
useEffect(() => {
  const initialize = async () => {
    // Only call ready() here, after component has rendered
    await initBaseMiniApp();
    // ... rest of initialization
  };
  void initialize();
}, []);
```

And ensure `initBaseMiniApp()` doesn't call `ready()` multiple times.

### Fix 4: Add Webhook URL (Optional)

**File:** `public/.well-known/farcaster.json`

Add webhook URL if you want notifications:
```json
{
  "miniapp": {
    ...
    "webhookUrl": "https://lawb.xyz/api/webhook"
  }
}
```

## 🎯 Priority Order

1. **HIGH:** Fix `ready()` being called too early (causes infinite splash screen)
2. **MEDIUM:** Update embed action type to `launch_miniapp`
3. **LOW:** Add webhook URL for notifications (if needed)

## 📚 Reference

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz)
- [Loading Your App Guide](https://miniapps.farcaster.xyz/docs/guides/loading)
- [Sharing Your App Guide](https://miniapps.farcaster.xyz/docs/guides/sharing)
