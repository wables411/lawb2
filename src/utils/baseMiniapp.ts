/**
 * Base Mini App utilities
 * Detects when running as a Base Mini App and initializes the SDK
 */

// Static import for better validator detection (instead of dynamic import)
import { sdk } from '@farcaster/miniapp-sdk';

// NOTE: ready() should NOT be called here on module load
// Per Farcaster docs: "Don't call ready until your interface has loaded"
// ready() is called in React useEffect hooks after components render

// Memoized result to avoid excessive re-computation and logging
let cachedResult: boolean | null = null;
let hasLogged = false;

// Synchronous check if we're running as a Base Mini App
// For async detection, use isBaseMiniAppAsync() which uses sdk.isInMiniApp()
// Result is memoized to prevent excessive logging and improve performance
export const isBaseMiniApp = () => {
  // Return cached result if available
  if (cachedResult !== null) {
    return cachedResult;
  }
  
  if (typeof window === 'undefined') {
    cachedResult = false;
    return false;
  }
  
  // Check for environment variable or URL parameter (highest priority)
  if (import.meta.env.VITE_BASE_MINIAPP === 'true' || 
      new URLSearchParams(window.location.search).has('base_miniapp')) {
    if (!hasLogged) {
      console.log('[Base Mini App Detection] ✅ Detected via env var or URL param');
      hasLogged = true;
    }
    cachedResult = true;
    return true;
  }
  
  // PRIMARY: Check if we're running in an iframe (embedded in Base/Farcaster app)
  // This is the most reliable indicator - regular browser visits to lawb.xyz are NOT in iframes
  // Regular browser users should NOT be detected as Base Mini App
  try {
    if (window.self !== window.top) {
      // We're in an iframe - definitely embedded in Base/Farcaster app
      if (!hasLogged) {
        console.log('[Base Mini App Detection] ✅ Detected via iframe (window.self !== window.top)');
        hasLogged = true;
      }
      cachedResult = true;
      return true;
    }
  } catch (e) {
    // Cross-origin iframe - can't access window.top, but we're definitely in an iframe
    // This is the case when embedded in Farcaster app (most common scenario)
    // The exception is thrown because we can't access window.top from cross-origin iframe
    if (!hasLogged) {
      console.log('[Base Mini App Detection] ✅ Detected via cross-origin iframe (exception accessing window.top)');
      hasLogged = true;
    }
    cachedResult = true;
    return true;
  }
  
  // If we're NOT in an iframe and NOT on a Base/Farcaster domain, we're a regular browser user
  // Regular browser users should NOT be detected as Base Mini App
  // This allows AppKit to load for wallet connection
  
  // Check for Farcaster/Base-specific domain indicators
  // Farcaster app uses wallet.farcaster.xyz domain
  // Base.app uses base.app domain
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('farcaster.xyz') || 
      hostname.includes('warpcast.com') ||
      hostname.includes('base.org') ||
      hostname.includes('base.dev') ||
      hostname.includes('base.app')) {
    if (!hasLogged) {
      console.log('[Base Mini App Detection] ✅ Detected via hostname:', hostname);
      hasLogged = true;
    }
    cachedResult = true;
    return true;
  }
  
  // Check document.referrer - if we were loaded from Base/Farcaster, referrer will contain those domains
  try {
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('farcaster') || 
        referrer.includes('warpcast') ||
        referrer.includes('base.org') ||
        referrer.includes('base.dev') ||
        referrer.includes('base.app') ||
        referrer.includes('wallet.farcaster')) {
      if (!hasLogged) {
        console.log('[Base Mini App Detection] ✅ Detected via referrer:', referrer);
        hasLogged = true;
      }
      cachedResult = true;
      return true;
    }
  } catch (e) {
    // Referrer might not be accessible in some contexts
  }
  
  // Check user agent for Farcaster/Base app indicators
  // Be very specific - don't match generic "base" words in user agent
  const userAgent = navigator.userAgent?.toLowerCase() || '';
  // Only match specific Base/Farcaster app indicators, not generic "base" strings
  if (userAgent.includes('farcaster') || 
      userAgent.includes('base.app') ||
      userAgent.includes('baseapp') ||
      (userAgent.includes('base') && (userAgent.includes('miniapp') || userAgent.includes('mini-app')))) {
    if (!hasLogged) {
      console.log('[Base Mini App Detection] ✅ Detected via user agent:', userAgent);
      hasLogged = true;
    }
    cachedResult = true;
    return true;
  }
  
  // IMPORTANT: Do NOT check SDK availability here - SDK might be in bundle but not active
  // SDK check should only be used in async detection (isBaseMiniAppAsync)
  // Regular browser users should NOT be detected as Base Mini App just because SDK exists in bundle
  
  // Only log once if not detected
  if (!hasLogged) {
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })();
    console.log('[Base Mini App Detection] ❌ Not detected (regular browser). hostname:', hostname, 'isInIframe:', isInIframe);
    hasLogged = true;
  }
  cachedResult = false;
  return false;
};

// Async check using SDK's built-in detection (more reliable, especially on mobile)
// Use this when you can handle async detection
export const isBaseMiniAppAsync = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Check for environment variable or URL parameter (highest priority)
  if (import.meta.env.VITE_BASE_MINIAPP === 'true' || 
      new URLSearchParams(window.location.search).has('base_miniapp')) {
    console.log('[Base Mini App Detection] ✅ Detected via env var or URL param (async)');
    return true;
  }
  
  // PRIMARY: Use SDK's built-in detection method (most reliable, especially on mobile Base app)
  // This is the most accurate way to detect if we're in a miniapp
  try {
    if (sdk && typeof sdk.isInMiniApp === 'function') {
      const isInMiniApp = await sdk.isInMiniApp();
      if (isInMiniApp) {
        console.log('[Base Mini App Detection] ✅ Detected via SDK isInMiniApp()');
        // Optionally check if it's specifically Base App (clientFid === 309857)
        try {
          const context = await sdk.context;
          if (context?.client?.clientFid === 309857) {
            console.log('[Base Mini App Detection] ✅ Confirmed Base App (clientFid: 309857)');
            return true; // Confirmed Base App
          }
          console.log('[Base Mini App Detection] ✅ Detected miniapp (not specifically Base, but miniapp)');
          return true; // Any miniapp (including Base)
        } catch (e) {
          console.log('[Base Mini App Detection] ✅ Detected miniapp (context check failed, but isInMiniApp=true)');
          return isInMiniApp; // Fallback to miniapp detection
        }
      } else {
        console.log('[Base Mini App Detection] ❌ SDK isInMiniApp() returned false');
      }
    } else {
      console.log('[Base Mini App Detection] ⚠️ SDK or isInMiniApp function not available');
    }
  } catch (e) {
    console.warn('[Base Mini App Detection] ⚠️ SDK check failed:', e);
    // SDK check failed, fall through to synchronous checks
  }
  
  // Fallback to synchronous detection
  const syncResult = isBaseMiniApp();
  if (syncResult) {
    console.log('[Base Mini App Detection] ✅ Fallback: Detected via sync check');
  } else {
    console.log('[Base Mini App Detection] ❌ Fallback: Not detected via sync check');
  }
  return syncResult;
};

// Initialize Base Mini App SDK if running as mini app
// Per Farcaster docs: ready() should be called after UI is ready, not immediately
// This function should be called from React useEffect after component renders
export const initBaseMiniApp = async () => {
  // Always try to initialize - the SDK will handle if it's in the right context
  // This ensures it works when embedded in Base app even without env var
  try {
    if (sdk && sdk.actions && sdk.actions.ready) {
      // Call ready() to dismiss splash screen - only call this after UI is ready
      // Per Farcaster docs: "Don't call ready until your interface has loaded"
      // This should be called from React useEffect after component renders
      try {
        await sdk.actions.ready();
        console.log('[Base Mini App] ✅ SDK ready() called successfully');
        return true;
      } catch (readyError) {
        // ready() might fail if not in Base app context - that's OK
        // But log it if we think we ARE in Base app
        if (isBaseMiniApp()) {
          console.error('[Base Mini App] ⚠️ ready() failed but we appear to be in Base app:', readyError);
        }
        // Return false but don't throw - this is expected in non-Base contexts
        return false;
      }
    } else {
      console.warn('[Base Mini App] SDK structure unexpected. Available keys:', sdk ? Object.keys(sdk) : 'null');
    }
  } catch (error) {
    // SDK might not be available - this is expected if not in Base app context
    // Only log if we think we're in Base app context
    if (isBaseMiniApp()) {
      console.error('[Base Mini App] ❌ SDK error:', error);
      if (error instanceof Error) {
        console.error('[Base Mini App] Error message:', error.message);
      }
    }
    return false;
  }
  
  return false;
};

/**
 * Haptic Feedback Utilities
 * Provides safe haptic feedback functions that check for capability before calling
 */

// Cache for haptic capability to avoid repeated checks
let hapticCapabilityCache: boolean | null = null;
let hapticCapabilityChecked = false;

/**
 * Check if haptic feedback is available
 */
export const checkHapticCapability = async (): Promise<boolean> => {
  if (hapticCapabilityChecked && hapticCapabilityCache !== null) {
    return hapticCapabilityCache;
  }

  try {
    if (!sdk || typeof sdk !== 'object') {
      hapticCapabilityCache = false;
      hapticCapabilityChecked = true;
      return false;
    }

    // Check via capabilities API
    if (typeof sdk.getCapabilities === 'function') {
      const capabilities = await sdk.getCapabilities();
      hapticCapabilityCache = capabilities.includes('haptics.impactOccurred') ||
                              capabilities.includes('haptics.notificationOccurred') ||
                              capabilities.includes('haptics.selectionChanged');
      hapticCapabilityChecked = true;
      return hapticCapabilityCache;
    }

    // Check via context features
    if (typeof sdk.context !== 'undefined') {
      const context = await sdk.context;
      hapticCapabilityCache = context?.features?.haptics === true;
      hapticCapabilityChecked = true;
      return hapticCapabilityCache;
    }

    // Check if haptics object exists
    hapticCapabilityCache = !!(sdk.haptics && typeof sdk.haptics === 'object');
    hapticCapabilityChecked = true;
    return hapticCapabilityCache;
  } catch (error) {
    console.warn('[Base Mini App] Error checking haptic capability:', error);
    hapticCapabilityCache = false;
    hapticCapabilityChecked = true;
    return false;
  }
};

/**
 * Trigger impact haptic feedback
 * @param type - Type of impact: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'
 */
export const triggerHapticImpact = async (type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'light'): Promise<void> => {
  try {
    const hasHaptics = await checkHapticCapability();
    if (!hasHaptics || !sdk?.haptics?.impactOccurred) {
      return;
    }
    await sdk.haptics.impactOccurred(type);
  } catch (error) {
    // Silently fail - haptics are optional
    console.debug('[Base Mini App] Haptic impact failed:', error);
  }
};

/**
 * Trigger notification haptic feedback
 * @param type - Type of notification: 'success' | 'warning' | 'error'
 */
export const triggerHapticNotification = async (type: 'success' | 'warning' | 'error' = 'success'): Promise<void> => {
  try {
    const hasHaptics = await checkHapticCapability();
    if (!hasHaptics || !sdk?.haptics?.notificationOccurred) {
      return;
    }
    await sdk.haptics.notificationOccurred(type);
  } catch (error) {
    // Silently fail - haptics are optional
    console.debug('[Base Mini App] Haptic notification failed:', error);
  }
};

/**
 * Trigger selection haptic feedback
 */
export const triggerHapticSelection = async (): Promise<void> => {
  try {
    const hasHaptics = await checkHapticCapability();
    if (!hasHaptics || !sdk?.haptics?.selectionChanged) {
      return;
    }
    await sdk.haptics.selectionChanged();
  } catch (error) {
    // Silently fail - haptics are optional
    console.debug('[Base Mini App] Haptic selection failed:', error);
  }
};

/**
 * Safe Area Insets Utilities
 * Provides safe area inset values from SDK context
 */

// Cache for safe area insets
let safeAreaInsetsCache: { top: number; bottom: number; left: number; right: number } | null = null;
let safeAreaInsetsChecked = false;

/**
 * Get safe area insets from SDK context
 * Returns default values if not available
 */
export const getSafeAreaInsets = async (): Promise<{ top: number; bottom: number; left: number; right: number }> => {
  if (safeAreaInsetsChecked && safeAreaInsetsCache !== null) {
    return safeAreaInsetsCache;
  }

  const defaultInsets = { top: 0, bottom: 0, left: 0, right: 0 };

  try {
    if (!sdk || typeof sdk !== 'object' || typeof sdk.context === 'undefined') {
      safeAreaInsetsCache = defaultInsets;
      safeAreaInsetsChecked = true;
      return defaultInsets;
    }

    const context = await sdk.context;
    const insets = context?.client?.safeAreaInsets;

    if (insets && typeof insets === 'object') {
      safeAreaInsetsCache = {
        top: insets.top ?? 0,
        bottom: insets.bottom ?? 0,
        left: insets.left ?? 0,
        right: insets.right ?? 0,
      };
    } else {
      safeAreaInsetsCache = defaultInsets;
    }

    safeAreaInsetsChecked = true;
    return safeAreaInsetsCache;
  } catch (error) {
    console.warn('[Base Mini App] Error getting safe area insets:', error);
    safeAreaInsetsCache = defaultInsets;
    safeAreaInsetsChecked = true;
    return defaultInsets;
  }
};

/**
 * Apply safe area insets as CSS custom properties on the document root
 * This makes them available throughout the app via CSS variables
 */
export const applySafeAreaInsets = async (): Promise<void> => {
  try {
    const insets = await getSafeAreaInsets();
    const root = document.documentElement;

    root.style.setProperty('--safe-area-top', `${insets.top}px`);
    root.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-area-left', `${insets.left}px`);
    root.style.setProperty('--safe-area-right', `${insets.right}px`);
  } catch (error) {
    console.warn('[Base Mini App] Error applying safe area insets:', error);
  }
};

/**
 * Reset caches (useful for testing or when context changes)
 */
export const resetBaseMiniAppCaches = (): void => {
  hapticCapabilityCache = null;
  hapticCapabilityChecked = false;
  safeAreaInsetsCache = null;
  safeAreaInsetsChecked = false;
};




