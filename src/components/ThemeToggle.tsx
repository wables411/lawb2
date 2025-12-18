import React, { useState, useEffect } from 'react';
import { isBaseMiniApp } from '../utils/baseMiniapp';
import './ThemeToggle.css';

type ThemeMode = 'light' | 'dark';

export const ThemeToggle: React.FC<{ asMenuItem?: boolean }> = ({ asMenuItem = false }) => {
  // Force check Base app - same logic as HowToContent
  const checkIsBaseApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Check iframe - PRIMARY method
    try {
      if (window.self !== window.top) return true;
    } catch (e) {
      // Cross-origin iframe = definitely Base app
      return true;
    }
    
    // Check URL/referrer for Base/Farcaster indicators
    const hostname = window.location.hostname.toLowerCase();
    const referrer = document.referrer.toLowerCase();
    if (hostname.includes('farcaster') || hostname.includes('base') ||
        referrer.includes('farcaster') || referrer.includes('base') ||
        referrer.includes('warpcast')) {
      return true;
    }
    
    // Check user agent
    const ua = navigator.userAgent?.toLowerCase() || '';
    if (ua.includes('farcaster') || ua.includes('base')) {
      return true;
    }
    
    return isBaseMiniApp();
  };
  
  const isBaseApp = checkIsBaseApp();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined' || !isBaseApp) return 'light';
    const saved = localStorage.getItem('lawb-app-theme');
    // Migrate old 'underwater' to 'light'
    if (saved === 'underwater') {
      localStorage.setItem('lawb-app-theme', 'light');
      return 'light';
    }
    return saved && ['light', 'dark'].includes(saved) ? saved as ThemeMode : 'light';
  });

  useEffect(() => {
    if (!isBaseApp) return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes first
    root.classList.remove('lawb-app-dark-mode', 'lawb-app-light-mode', 'lawb-app-underwater-mode');
    body.classList.remove('lawb-app-dark-mode', 'lawb-app-light-mode', 'lawb-app-underwater-mode');
    
    // Add the current theme class
    root.classList.add(`lawb-app-${themeMode}-mode`);
    body.classList.add(`lawb-app-${themeMode}-mode`);
    localStorage.setItem('lawb-app-theme', themeMode);
  }, [themeMode, isBaseApp]);

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
    }
  };

  if (!isBaseApp) return null;

  // Render as menu item
  if (asMenuItem) {
    const isDark = themeMode === 'dark';
    // Match the menu button styling - transparent background since parent button handles it
    return (
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        fontSize: 'inherit',
        color: 'inherit'
      }}>
        <span>{getThemeIcon()}</span>
        <span>Theme: {getThemeLabel()}</span>
      </span>
    );
  }

  // Render as standalone button (for backwards compatibility)
  return (
    <button
      className="lawb-theme-toggle"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cycleTheme();
      }}
      title={`Current: ${getThemeLabel()} Mode - Click to cycle`}
      aria-label={`Current: ${getThemeLabel()} Mode - Click to cycle`}
      style={{
        fontSize: '24px',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {getThemeIcon()}
    </button>
  );
};
