import React, { useState, useEffect } from 'react';
import { isBaseMiniApp } from '../utils/baseMiniapp';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const isBaseApp = isBaseMiniApp();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined' || !isBaseApp) return false;
    const saved = localStorage.getItem('lawb-app-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (!isBaseApp) return;
    
    const root = document.documentElement;
    const body = document.body;
    
    if (isDarkMode) {
      root.classList.add('lawb-app-dark-mode');
      body.classList.add('lawb-app-dark-mode');
      localStorage.setItem('lawb-app-theme', 'dark');
    } else {
      root.classList.remove('lawb-app-dark-mode');
      body.classList.remove('lawb-app-dark-mode');
      localStorage.setItem('lawb-app-theme', 'light');
    }
  }, [isDarkMode, isBaseApp]);

  // Debug logging
  useEffect(() => {
    const version = (window as any).__LAWB_APP_VERSION__ || 'unknown';
    console.log('[ThemeToggle] Version:', version, 'Base App:', isBaseApp, 'Dark Mode:', isDarkMode);
  }, [isBaseApp, isDarkMode]);

  if (!isBaseApp) {
    console.log('[ThemeToggle] Not rendering - not in Base app');
    return null;
  }

  console.log('[ThemeToggle] Rendering toggle button');

  return (
    <button
      className="lawb-theme-toggle"
      onClick={() => {
        console.log('[ThemeToggle] Toggle clicked, switching to:', !isDarkMode ? 'dark' : 'light');
        setIsDarkMode(!isDarkMode);
      }}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        fontSize: '24px',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
};
