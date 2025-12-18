/**
 * Safe wrapper for useAppKit that returns no-op functions in Base/Farcaster app
 * to prevent WalletConnect initialization and CSP violations
 */
import { isBaseMiniApp } from '../utils/baseMiniapp';
import { useState, useEffect } from 'react';
import { appKit } from '../appkit';

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
  const [appKitReady, setAppKitReady] = useState(false);
  
  // Check if AppKit instance is ready (from appkit.ts)
  useEffect(() => {
    if (isBase || typeof window === 'undefined') {
      return;
    }
    
    // Check if appKit instance is ready
    const checkAppKit = () => {
      if (appKit && typeof appKit === 'object') {
        setAppKitReady(true);
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (checkAppKit()) {
      return;
    }
    
    // Poll for AppKit to be ready (from appkit.ts dynamic import)
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds
    const interval = setInterval(() => {
      attempts++;
      if (checkAppKit() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isBase]);
  
  // Only load AppKit module if NOT in Base app and AppKit instance is ready
  useEffect(() => {
    if (isBase || typeof window === 'undefined' || !appKitReady) {
      return;
    }
    
    // Dynamic import to prevent WalletConnect from loading in Base app
    import('@reown/appkit/react')
      .then((module) => {
        setAppKitModule(module);
        console.log('[useAppKitSafe] AppKit module loaded successfully');
      })
      .catch((error) => {
        console.warn('[useAppKitSafe] Failed to load AppKit module:', error);
      });
  }, [isBase, appKitReady]);
  
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
  
  // If AppKit instance not ready or module not loaded yet, wait and retry
  if (!appKitReady || !appKitModule) {
    return {
      open: (options?: any) => {
        // Retry loading if not ready
        if (!appKitReady) {
          console.log('[AppKit] AppKit instance not ready yet, retrying...');
          // Trigger re-check
          setTimeout(() => {
            if (appKit && typeof appKit === 'object') {
              setAppKitReady(true);
            }
          }, 100);
        } else if (!appKitModule) {
          console.log('[AppKit] AppKit module not loaded yet, retrying...');
          import('@reown/appkit/react')
            .then((module) => {
              setAppKitModule(module);
              // Try to open again after module loads
              if (module && module.useAppKit) {
                const hook = module.useAppKit();
                hook.open(options);
              }
            })
            .catch((error) => {
              console.error('[AppKit] Failed to load module on retry:', error);
              alert('Unable to connect wallet. Please refresh the page and try again.');
            });
        }
      },
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
