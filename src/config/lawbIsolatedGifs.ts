/**
 * Transparent (alpha) Lawb / Clawb GIFs in `public/assets/`.
 * Use these for overlays — avoid collection icons like `lawbsters.gif` (typically not keyed).
 */
export const ISOLATED_LAWB_TRANSPARENT_GIFS = [
  '/assets/lawbidle_5s_finalfix_transparent_loop.webp',
  '/assets/lawbidle_5s_fullbody_facing_transparent_loop.gif',
  '/assets/lawbdance2_5s_finalfix_transparent_loop.webp',
  '/assets/lawbdance2_5s_fullbody_facing_transparent_loop.gif',
] as const;

/** Retake CTA — matches first entry */
export const CLAWB_STREAM_IDLE_GIF = ISOLATED_LAWB_TRANSPARENT_GIFS[0];
/** Retake CTA — matches third entry */
export const CLAWB_STREAM_DANCE_GIF = ISOLATED_LAWB_TRANSPARENT_GIFS[2];
