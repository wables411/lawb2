/**
 * Safe wrapper for useAppKit that returns no-op functions in Base/Farcaster app
 * to prevent WalletConnect initialization and CSP violations
 */
import { useAppKit } from '@reown/appkit/react';
import { isBaseMiniApp } from '../utils/baseMiniapp';

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
  return useAppKit();
};
