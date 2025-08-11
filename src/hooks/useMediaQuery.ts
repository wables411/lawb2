import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    matchMedia.addEventListener('change', handleChange);

    return () => {
      matchMedia.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// New hook for mobile device detection and capabilities
export function useMobileCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isMobile: false,
    isTouchDevice: false,
    isLandscape: false,
    hasHapticFeedback: false,
    hasSafeArea: false,
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    orientation: 'portrait' as 'portrait' | 'landscape'
  });

  useEffect(() => {
    const updateCapabilities = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileDevice = width <= 768 || height <= 768;
      const isLandscapeMode = width > height;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Detect touch capabilities
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detect haptic feedback support
      const hasHapticFeedback = 'vibrate' in navigator;
      
      // Detect safe area support
      const hasSafeArea = CSS.supports('padding', 'env(safe-area-inset-top)');
      
      setCapabilities({
        isMobile: isMobileDevice,
        isTouchDevice,
        isLandscape: isLandscapeMode,
        hasHapticFeedback,
        hasSafeArea,
        screenWidth: width,
        screenHeight: height,
        pixelRatio,
        orientation: isLandscapeMode ? 'landscape' : 'portrait'
      });
    };

    // Initial check
    updateCapabilities();

    // Listen for changes
    const handleResize = () => {
      updateCapabilities();
    };

    const handleOrientationChange = () => {
      // Add delay to ensure orientation change is complete
      setTimeout(updateCapabilities, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return capabilities;
} 