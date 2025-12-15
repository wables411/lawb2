/**
 * Safe wrapper for useAppKit that returns no-op functions in Base/Farcaster app
 * to prevent WalletConnect initialization and CSP violations
 */
import { isBaseMiniApp } from '../utils/baseMiniapp';
import { useState, useEffect } from 'react';

// Type for useAppKit return value
// Note: useAppKit() only returns open and close
// setThemeMode and setThemeVariables are on the AppKit instance, not the hook
// We add them here for compatibility with code that expects them
type AppKitReturn = {
  open: (options?: any) => any;
  close: () => any;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setThemeVariables: (variables: Record<string, string>) => void;
};

export const useAppKitSafe = (): AppKitReturn => {
  const isBase = isBaseMiniApp();
  const [appKitModule, setAppKitModule] = useState<typeof import('@reown/appkit/react') | null>(null);
  
  // Only load AppKit module if NOT in Base app
  useEffect(() => {
    if (isBase || typeof window === 'undefined') {
      return;
    }
    
    // Dynamic import to prevent WalletConnect from loading in Base app
    import('@reown/appkit/react')
      .then((module) => {
        setAppKitModule(module);
      })
      .catch((error) => {
        console.warn('[useAppKitSafe] Failed to load AppKit module:', error);
      });
  }, [isBase]);
  
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
  
  // If module not loaded yet, return no-ops temporarily
  if (!appKitModule) {
    return {
      open: () => console.warn('[AppKit] useAppKit module not loaded yet'),
      close: () => {},
      setThemeMode: () => {},
      setThemeVariables: () => {},
    };
  }
  
  // Use AppKit normally when NOT in Base app and module is loaded
  const appKitHook = appKitModule.useAppKit();
  
  // useAppKit() returns { open, close }
  // setThemeMode and setThemeVariables don't exist on the hook, so we add no-ops
  return {
    open: appKitHook.open,
    close: appKitHook.close,
    setThemeMode: () => {}, // Not available on hook, only on AppKit instance
    setThemeVariables: () => {}, // Not available on hook, only on AppKit instance
  };
};
