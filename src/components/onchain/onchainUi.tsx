// Shared "deep-sea on-chain arena" design tokens + primitives for the on-chain chess UI.
// One source of truth for the lobby, board, sidebar, game screen, and result overlay.
//
// Colors/backgrounds are applied INLINE (linear-gradient / explicit color) because the
// chess page's .lawb-app-dark-mode universal rules force background:#000 / color:#00ff00
// on any element without an inline background-image or color. Elements carrying an inline
// background-image are exempted from that override (see ThemeToggle.css), so every surface
// here sets `backgroundImage` rather than `background`.

import React from 'react';

export const oc = {
  panel: 'linear-gradient(180deg, #0e1a2e, #0a1322)',
  card: 'linear-gradient(180deg, #101d33, #0b1626)',
  inset: 'linear-gradient(180deg, #081019, #0a1322)',
  chipOff: 'linear-gradient(180deg, #0e1a2e, #0c1728)',
  cyan: '#3fe0d6', gold: '#f2b73c', ink: '#dbe6f5', muted: '#8298b8', muted2: '#5f728f',
  blue: '#4a86e8', red: '#e8564a',
  line: 'rgba(86,196,214,.18)', line2: 'rgba(86,196,214,.34)',
  goldline: 'rgba(242,183,60,.42)', redline: 'rgba(232,86,74,.38)',
} as const;

/** A flat fill that still counts as an inline background-image (theme-nuke exempt). */
export const solid = (c: string): string => `linear-gradient(${c}, ${c})`;

/* ---- buttons ---- */
export const ocBtnPrimary: React.CSSProperties = {
  border: 0, cursor: 'pointer', borderRadius: 11, padding: '13px 16px',
  fontWeight: 800, fontSize: 12.5, letterSpacing: '.09em', textTransform: 'uppercase', color: '#04211f',
  backgroundImage: 'linear-gradient(150deg, #5cf0e4, #25b3a8)', boxShadow: '0 10px 24px rgba(63,224,214,.28)',
};
export const ocBtnSecondary: React.CSSProperties = {
  border: `1px solid ${oc.line2}`, cursor: 'pointer', borderRadius: 10, padding: '11px 15px',
  fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: oc.cyan,
  backgroundImage: solid('#12213a'),
};
export const ocBtnGhost: React.CSSProperties = {
  border: `1px solid ${oc.line}`, cursor: 'pointer', borderRadius: 10, padding: '10px 13px',
  fontWeight: 700, fontSize: 11.5, letterSpacing: '.05em', textTransform: 'uppercase', color: oc.muted,
  backgroundImage: oc.chipOff,
};
export const ocBtnDanger: React.CSSProperties = {
  border: `1px solid ${oc.redline}`, cursor: 'pointer', borderRadius: 10, padding: '10px 13px',
  fontWeight: 700, fontSize: 11.5, letterSpacing: '.05em', textTransform: 'uppercase', color: oc.red,
  backgroundImage: solid('rgba(232,86,74,.08)'),
};

export const ocInput = (): React.CSSProperties => ({
  flex: 1, minWidth: 0, backgroundImage: oc.inset, border: `1px solid ${oc.line}`, borderRadius: 9,
  color: oc.ink, fontFamily: 'ui-monospace, monospace', fontSize: 12.5, padding: '9px 10px', outline: 'none',
});

export const ocChip = (on: boolean, accent: string = oc.line2): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderRadius: 10,
  cursor: 'pointer', fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em',
  color: on ? oc.ink : oc.muted,
  backgroundImage: on ? solid('rgba(63,224,214,.10)') : oc.chipOff,
  border: `1px solid ${on ? accent : oc.line}`,
  boxShadow: on ? `0 0 0 1px ${accent}` : 'none',
});

/* ---- small components ---- */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.14em',
    textTransform: 'uppercase', color: oc.muted2, marginBottom: 7 }}>{children}</div>
);

export const TokenGlyph: React.FC<{ on: boolean; char: string }> = ({ on, char }) => (
  <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11,
    color: on ? '#241701' : oc.cyan,
    backgroundImage: on ? solid(oc.gold) : solid('rgba(63,224,214,.12)') }}>{char}</span>
);

/** Branded arena header used by the lobby and game screen. */
export const OcArenaHeader: React.FC<{ right?: React.ReactNode }> = ({ right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 18,
        backgroundImage: solid('#0c2436'), border: `1px solid ${oc.line2}`, boxShadow: 'inset 0 0 16px rgba(63,224,214,.25)',
      }}>⛓</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', color: oc.ink }}>
          Lawbster <span style={{ color: oc.cyan }}>Chess</span>
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: oc.muted2 }}>
          On-Chain Arena
        </div>
      </div>
    </div>
    {right}
  </div>
);

/** Rounded network/status pill. `tone` gold = attention, cyan = ok, muted = neutral. */
export const OcPill: React.FC<{ tone?: 'cyan' | 'gold' | 'muted'; children: React.ReactNode }> = ({ tone = 'muted', children }) => {
  const dot = tone === 'gold' ? oc.gold : tone === 'cyan' ? oc.cyan : oc.muted2;
  const border = tone === 'gold' ? oc.goldline : oc.line;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'ui-monospace, monospace', fontSize: 11,
      padding: '7px 11px', borderRadius: 999, color: tone === 'gold' ? oc.gold : oc.muted,
      backgroundImage: solid('#0a1322'), border: `1px solid ${border}`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundImage: solid(dot), boxShadow: `0 0 8px ${dot}` }} />
      {children}
    </span>
  );
};
