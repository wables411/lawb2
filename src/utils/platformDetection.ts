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
  
  // Check for Base app context
  const isBaseApp = 
    embedParam === 'base' ||
    parentParam === 'base' ||
    window.location.search.includes('base') ||
    window.location.hash.includes('base') ||
    navigator.userAgent.includes('Base') ||
    (window.parent !== window && (document.referrer.includes('base.org') || document.referrer.includes('base.xyz'))) ||
    // Check for Base-specific context
    (window as any).__BASE_APP__ !== undefined ||
    (window as any).base !== undefined;

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
 * Get platform info (cached)
 */
let cachedPlatformInfo: PlatformInfo | null = null;

export function getPlatformInfo(): PlatformInfo {
  if (!cachedPlatformInfo) {
    cachedPlatformInfo = detectPlatform();
  }
  return cachedPlatformInfo;
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

