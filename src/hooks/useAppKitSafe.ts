/**
 * Safe wrapper for useAppKit that returns no-op functions in Base/Farcaster app
 * to prevent WalletConnect initialization and CSP violations
 */
import { isBaseMiniApp } from '../utils/baseMiniapp';

// Conditional import - only import useAppKit if NOT in Base app
// This prevents WalletConnect from initializing in Base/Farcaster app
let useAppKitHook: (() => ReturnType<typeof import('@reown/appkit/react').useAppKit>) | null = null;

// Check if we're in Base app BEFORE importing useAppKit
// This prevents the import from happening at all in Base app
const shouldUseAppKit = typeof window !== 'undefined' ? !isBaseMiniApp() : true;

if (shouldUseAppKit) {
  // Only import if NOT in Base app
  // Use require to avoid static import that would trigger WalletConnect
  try {
    const appkitModule = require('@reown/appkit/react');
    useAppKitHook = appkitModule.useAppKit;
  } catch (e) {
    console.warn('[useAppKitSafe] Failed to import useAppKit:', e);
  }
}

export const useAppKitSafe = () => {
  const isBase = isBaseMiniApp();
  
  if (isBase) {
    // Return no-op functions in Base app to prevent WalletConnect initialization
    return {
      open: () => {
        console.log('[Base Mini App] AppKit.open() called but ignored - using Farcaster wallet');
      },
      close: () => {
        console.log('[Base Mini App] AppKit.close() called but ignored');
      },
      setThemeMode: () => {},
      setThemeVariables: () => {},
    };
  }
  
  // Use AppKit normally when NOT in Base app
  if (!useAppKitHook) {
    // Fallback if import failed
    return {
      open: () => console.warn('[AppKit] useAppKit not available'),
      close: () => {},
      setThemeMode: () => {},
      setThemeVariables: () => {},
    };
  }
  return useAppKitHook();
};
