/**
 * Platform detection utilities for Farcaster/Base Mini Apps
 * Detects if app is running in Base app, Farcaster, or regular browser
 */

export type Platform = 'base' | 'farcaster' | 'sanko';

export interface PlatformInfo {
  platform: Platform;
  isMiniApp: boolean;
  isFreePlayMode: boolean;
  label: string;
}

/**
 * Detect the current platform context
 */
export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'sanko',
      isMiniApp: false,
      isFreePlayMode: false,
      label: 'Sanko'
    };
  }

  // Check URL parameters first (most reliable)
  const urlParams = new URLSearchParams(window.location.search);
  const embedParam = urlParams.get('embed');
  const parentParam = urlParams.get('parent');
  
  // Check for Base app context - Base app may inject context in various ways
  const userAgent = navigator.userAgent.toLowerCase();
  const isInIframe = window.self !== window.top;
  let topOrigin: string | null = null;
  try {
    // Try to access top origin, but catch cross-origin errors (expected in iframe contexts)
    topOrigin = isInIframe && window.top ? window.top.location?.origin : null;
  } catch (error) {
    // Cross-origin frame access is expected when embedded in Farcaster/Base apps
    // Use referrer as fallback
  }
  const referrer = document.referrer.toLowerCase();
  
  const isBaseApp = 
    embedParam === 'base' ||
    parentParam === 'base' ||
    window.location.search.toLowerCase().includes('base') ||
    window.location.hash.toLowerCase().includes('base') ||
    userAgent.includes('base') ||
    userAgent.includes('baseapp') ||
    userAgent.includes('base mobile') ||
    referrer.includes('base.org') ||
    referrer.includes('base.xyz') ||
    referrer.includes('base.org') ||
    (topOrigin && typeof topOrigin === 'string' && topOrigin.includes('base')) ||
    // Check for Base-specific context variables
    (window as any).__BASE_APP__ !== undefined ||
    (window as any).base !== undefined ||
    (window as any).__BASE__ !== undefined ||
    (window as any).Base !== undefined ||
    (window as any).__base__ !== undefined ||
    // Check window.name (sometimes used by iframes)
    (window.name && window.name.toLowerCase().includes('base'));
  
  // Debug logging
  if (typeof window !== 'undefined' && window.console) {
    console.log('[PLATFORM_DETECT] Base detection:', {
      embedParam,
      parentParam,
      userAgent,
      isInIframe,
      topOrigin,
      referrer,
      windowName: window.name,
      isBaseApp
    });
  }

  // Check for Farcaster context
  const isFarcaster = 
    embedParam === 'farcaster' ||
    parentParam === 'farcaster' ||
    window.location.search.includes('farcaster') ||
    window.location.hash.includes('farcaster') ||
    navigator.userAgent.includes('Farcaster') ||
    (window.parent !== window && (document.referrer.includes('farcaster.xyz') || document.referrer.includes('warpcast.com'))) ||
    // Check for Farcaster SDK context
    (window as any).farcaster !== undefined ||
    (window as any).__FARCASTER_SDK__ !== undefined ||
    (window as any).__farcasterSDK !== undefined;

  // Determine platform (Farcaster takes precedence if both detected)
  if (isFarcaster) {
    return {
      platform: 'farcaster',
      isMiniApp: true,
      isFreePlayMode: true,
      label: 'FC'
    };
  }

  if (isBaseApp) {
    return {
      platform: 'base',
      isMiniApp: true,
      isFreePlayMode: true,
      label: 'Base'
    };
  }

  // Default to Sanko (regular browser)
  return {
    platform: 'sanko',
    isMiniApp: false,
    isFreePlayMode: false,
    label: 'Sanko'
  };
}

/**
 * Get platform info (re-detect on each call to catch dynamic changes)
 * Note: We don't cache this because Base/Farcaster context might be injected after initial load
 */
export function getPlatformInfo(): PlatformInfo {
  return detectPlatform();
}

/**
 * Check if we're in a mini app context
 */
export function isMiniAppContext(): boolean {
  return getPlatformInfo().isMiniApp;
}

/**
 * Check if free play mode is enabled
 */
export function isFreePlayMode(): boolean {
  return getPlatformInfo().isFreePlayMode;
}

/**
 * Get platform label for display
 */
export function getPlatformLabel(): string {
  return getPlatformInfo().label;
}

