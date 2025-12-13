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
  console.log('[Base Mini App] Attempting to initialize SDK...');
  console.log('[Base Mini App] isBaseMiniApp check:', isBaseMiniApp());
  console.log('[Base Mini App] In iframe:', typeof window !== 'undefined' && window.self !== window.top);
  
  // Always try to initialize - the SDK will handle if it's in the right context
  // This ensures it works when embedded in Base app even without env var
  try {
    console.log('[Base Mini App] Importing SDK...');
    const { sdk } = await import('@farcaster/miniapp-sdk');
    console.log('[Base Mini App] SDK imported:', !!sdk);
    
    // Check if SDK is available in this context
    if (sdk && sdk.actions) {
      console.log('[Base Mini App] Calling sdk.actions.ready()...');
      await sdk.actions.ready();
      console.log('[Base Mini App] ✅ SDK initialized and ready!');
      return true;
    } else {
      console.warn('[Base Mini App] SDK imported but actions not available');
    }
  } catch (error) {
    // Log error details for debugging
    console.error('[Base Mini App] ❌ Failed to initialize SDK:', error);
    if (error instanceof Error) {
      console.error('[Base Mini App] Error message:', error.message);
      console.error('[Base Mini App] Error stack:', error.stack);
    }
    
    // If we think we're in Base app context, this is a problem
    if (isBaseMiniApp()) {
      console.error('[Base Mini App] ⚠️ Expected to be in Base app but SDK failed!');
    } else {
      console.log('[Base Mini App] Not in Base app context (this is OK for regular web)');
    }
    return false;
  }
  
  return false;
};








