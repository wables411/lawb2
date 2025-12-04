/**
 * Base Mini App utilities
 * Only active when running as a Base Mini App (detected via environment variable)
 */

// Check if we're running as a Base Mini App
export const isBaseMiniApp = () => {
  // Check for environment variable or URL parameter
  return import.meta.env.VITE_BASE_MINIAPP === 'true' || 
         typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('base_miniapp');
};

// Initialize Base Mini App SDK if running as mini app
export const initBaseMiniApp = async () => {
  if (isBaseMiniApp()) {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      console.log('[Base Mini App] SDK initialized');
    } catch (error) {
      console.error('[Base Mini App] Failed to initialize SDK:', error);
    }
  }
};




