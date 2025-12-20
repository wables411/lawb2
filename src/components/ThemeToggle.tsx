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
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('lawb-app-theme');
    // Migrate old 'underwater' to 'light'
    if (saved === 'underwater') {
      localStorage.setItem('lawb-app-theme', 'light');
      return 'light';
    }
    return saved && ['light', 'dark'].includes(saved) ? saved as ThemeMode : 'light';
  });

  // Apply theme immediately on mount and when themeMode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes first
    root.classList.remove('lawb-app-dark-mode', 'lawb-app-light-mode', 'lawb-app-underwater-mode');
    body.classList.remove('lawb-app-dark-mode', 'lawb-app-light-mode', 'lawb-app-underwater-mode');
    
    // Light mode = default (no class), Dark mode = add class
    if (themeMode === 'dark') {
      root.classList.add('lawb-app-dark-mode');
      body.classList.add('lawb-app-dark-mode');
    }
    // For light mode, don't add any class - it's the default state
    localStorage.setItem('lawb-app-theme', themeMode);
  }, [themeMode]);

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

  // Render as menu item
  if (asMenuItem) {
    const isDark = themeMode === 'dark';
    const baseBg = isDark ? '#000000' : '#c0c0c0';
    const hoverBg = isDark ? '#001100' : '#d4d0c8';
    const activeBg = isDark ? '#002200' : '#a0a0a0';
    const textColor = isDark ? '#00ff00' : '#000';
    const borderColor = isDark ? '#00ff00' : '#808080';
    
    return (
      <button
        type="button"
        className="lawb-theme-menu-item"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          cycleTheme();
        }}
        style={{
          width: '100%',
          border: 'none',
          borderBottom: `1px solid ${borderColor}`,
          textAlign: 'left',
          background: baseBg,
          padding: '6px 14px',
          color: textColor,
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'MS Sans Serif, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = baseBg;
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.background = activeBg;
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.background = hoverBg;
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
