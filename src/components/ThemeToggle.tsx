import React, { useState, useEffect } from 'react';
import { isBaseMiniApp } from '../utils/baseMiniapp';
import './ThemeToggle.css';

type ThemeMode = 'underwater' | 'light' | 'dark';

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
    if (typeof window === 'undefined' || !isBaseApp) return 'underwater';
    const saved = localStorage.getItem('lawb-app-theme') as ThemeMode;
    return saved && ['underwater', 'light', 'dark'].includes(saved) ? saved : 'underwater';
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
    const modes: ThemeMode[] = ['underwater', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'underwater': return 'Underwater';
      case 'light': return 'Light';
      case 'dark': return 'Dark';
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'underwater': return '🌊';
      case 'light': return '☀️';
      case 'dark': return '🌙';
    }
  };

  if (!isBaseApp) return null;

  // Render as menu item
  if (asMenuItem) {
    return (
      <button
        type="button"
        className="lawb-theme-menu-item"
        onClick={cycleTheme}
        style={{
          width: '100%',
          border: 'none',
          borderBottom: '1px solid #808080',
          textAlign: 'left',
          background: '#c0c0c0',
          padding: '6px 14px',
          color: '#000',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'MS Sans Serif, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#d4d0c8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#c0c0c0';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.background = '#a0a0a0';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.background = '#d4d0c8';
        }}
      >
        <span>{getThemeIcon()}</span>
        <span>Theme: {getThemeLabel()}</span>
      </button>
    );
  }

  // Render as standalone button (for backwards compatibility)
  return (
    <button
      className="lawb-theme-toggle"
      onClick={cycleTheme}
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
