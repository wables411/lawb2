/**
 * Base Mini App utilities
 * Detects when running as a Base Mini App and initializes the SDK
 */

// Check if we're running as a Base Mini App
export const isBaseMiniApp = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for environment variable or URL parameter
  if (import.meta.env.VITE_BASE_MINIAPP === 'true' || 
      new URLSearchParams(window.location.search).has('base_miniapp')) {
    return true;
  }
  
  // Check if we're running in an iframe (embedded in Base app)
  try {
    if (window.self !== window.top) {
      // We're in an iframe - likely embedded in Base app
      return true;
    }
  } catch (e) {
    // Cross-origin iframe - can't access window.top, but we're definitely in an iframe
    return true;
  }
  
  return false;
};

// Initialize Base Mini App SDK if running as mini app
export const initBaseMiniApp = async () => {
  // Always try to initialize - the SDK will handle if it's in the right context
  // This ensures it works when embedded in Base app even without env var
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    
    // Check if SDK is available in this context
    if (sdk && sdk.actions) {
      await sdk.actions.ready();
      console.log('[Base Mini App] SDK initialized and ready');
      return true;
    }
  } catch (error) {
    // SDK not available or not in Base app context - this is fine for regular web usage
    if (isBaseMiniApp()) {
      console.error('[Base Mini App] Failed to initialize SDK:', error);
    }
    return false;
  }
};








