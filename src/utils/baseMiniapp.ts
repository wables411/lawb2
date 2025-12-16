/**
 * Base Mini App utilities
 * Detects when running as a Base Mini App and initializes the SDK
 */

// Static import for better validator detection (instead of dynamic import)
import { sdk } from '@farcaster/miniapp-sdk';

// Call ready() immediately when module loads (for Farcaster validator detection)
// The SDK will handle gracefully if not in Base app context
if (typeof window !== 'undefined' && sdk && sdk.actions && sdk.actions.ready) {
  // Call ready() immediately - this helps validator detect it
  // We'll also call it in React useEffect for proper timing per docs
  sdk.actions.ready().catch(() => {
    // Silently fail - SDK will handle if not in Base app context
  });
}

// Check if we're running as a Base Mini App
export const isBaseMiniApp = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for environment variable or URL parameter
  if (import.meta.env.VITE_BASE_MINIAPP === 'true' || 
      new URLSearchParams(window.location.search).has('base_miniapp')) {
    return true;
  }
  
  // Check if we're running in an iframe (embedded in Base/Farcaster app)
  try {
    if (window.self !== window.top) {
      // We're in an iframe - likely embedded in Base/Farcaster app
      return true;
    }
  } catch (e) {
    // Cross-origin iframe - can't access window.top, but we're definitely in an iframe
    // This is the case when embedded in Farcaster app
    return true;
  }
  
  // Check for Farcaster-specific indicators
  // Farcaster app uses wallet.farcaster.xyz domain
  if (window.location.hostname.includes('farcaster.xyz') || 
      window.location.hostname.includes('warpcast.com')) {
    return true;
  }
  
  // NOTE: We do NOT check SDK availability here because the SDK is statically imported
  // and will always be available in the bundle, even when not in Base app context.
  // The SDK being available doesn't mean we're in Base app - we rely on the other
  // indicators above (iframe, domain, env vars) which are more reliable.
  
  return false;
};

// Initialize Base Mini App SDK if running as mini app
// Use static import so validator can detect it early
export const initBaseMiniApp = async () => {
  // Always try to initialize - the SDK will handle if it's in the right context
  // This ensures it works when embedded in Base app even without env var
  try {
    if (sdk && sdk.actions && sdk.actions.ready) {
      // ALWAYS call ready() - the SDK will handle if it's in the right context
      // This is required to dismiss the splash screen in Base app
      // Even if detection logic fails, the SDK itself knows if it's in Base app
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








