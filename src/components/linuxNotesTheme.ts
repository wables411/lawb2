import type { CSSProperties } from 'react';

const NOTES_BG = '#f3f3f1';
const NOTES_CARD = '#ffffff';
const NOTES_BORDER = '#d7d7d2';
const NOTES_TEXT = '#1f1f1f';
const NOTES_MUTED = '#6f6f6a';
const NOTES_ACCENT = '#f5db84';
const NOTES_ACCENT_DARK = '#d6b04a';

export function linuxNotesShellStyle(isMobile = false): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    background: NOTES_BG,
    border: `1px solid ${NOTES_BORDER}`,
    borderRadius: 12,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.82), 0 1px 3px rgba(0,0,0,0.06)',
    color: NOTES_TEXT,
    fontFamily: '"Cantarell","DejaVu Sans","Liberation Sans",Arial,sans-serif',
    fontSize: isMobile ? 13 : 12,
    padding: isMobile ? '12px' : '13px',
  };
}

export function linuxNotesHeaderStyle(isMobile = false): CSSProperties {
  return {
    margin: '0 0 11px 0',
    fontSize: isMobile ? 16 : 15,
    fontWeight: 650,
    color: '#1f1f1f',
    letterSpacing: 0.15,
  };
}

export function linuxNotesSubtleTextStyle(isMobile = false): CSSProperties {
  return {
    margin: 0,
    color: NOTES_MUTED,
    fontSize: isMobile ? 11 : 10.5,
    lineHeight: 1.45,
  };
}

export function linuxNotesSectionStyle(isMobile = false): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    background: NOTES_CARD,
    border: `1px solid ${NOTES_BORDER}`,
    borderRadius: 10,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    padding: isMobile ? '10px' : '11px',
  };
}

export function linuxNotesInputStyle(isMobile = false): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: isMobile ? '8px 9px' : '7px 9px',
    border: `1px solid ${NOTES_BORDER}`,
    borderRadius: 8,
    background: '#ffffff',
    color: NOTES_TEXT,
    fontSize: isMobile ? 12 : 11.5,
    outline: 'none',
  };
}

export function linuxNotesButtonStyle(isMobile = false): CSSProperties {
  return {
    boxSizing: 'border-box',
    border: `1px solid ${NOTES_ACCENT_DARK}`,
    borderRadius: 8,
    background: `linear-gradient(180deg, #fae8a9 0%, ${NOTES_ACCENT} 100%)`,
    color: '#1f1a12',
    fontWeight: 600,
    fontSize: isMobile ? 11.5 : 11,
    padding: isMobile ? '7px 11px' : '6px 10px',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.42)',
  };
}

export function linuxNotesPillStyle(isMobile = false): CSSProperties {
  return {
    display: 'inline-block',
    padding: isMobile ? '2px 7px' : '1px 6px',
    borderRadius: 999,
    border: `1px solid ${NOTES_BORDER}`,
    background: '#f7f7f3',
    color: '#64645e',
    fontSize: isMobile ? 10 : 9.5,
    lineHeight: 1.3,
  };
}
