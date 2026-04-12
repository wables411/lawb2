import React, { useEffect, useRef } from 'react';

/** Local Lawbster GIFs (transparent) — same assets used elsewhere on lawb.xyz */
const LAWBSTER_SPRITES = [
  '/assets/lawbsters.gif',
  '/assets/lawbidle_5s_finalfix_transparent_loop.gif',
  '/assets/lawbidle_5s_fullbody_facing_transparent_loop.gif',
  '/assets/lawbdance2_5s_finalfix_transparent_loop.gif',
  '/assets/lawbdance2_5s_fullbody_facing_transparent_loop.gif',
] as const;

async function loadImages(urls: readonly string[]): Promise<HTMLImageElement[]> {
  const out: HTMLImageElement[] = [];
  for (const src of urls) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error(src));
        im.src = src;
      });
      out.push(img);
    } catch {
      // One bad path must not drop the whole backdrop
    }
  }
  return out;
}

/**
 * Desktop backdrop: Lawbster GIFs in a slow orbit, nudged away from the cursor.
 * Canvas + local assets only (no network at runtime beyond cache).
 */
const DesktopLobsterBackground: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    void (async () => {
      let sprites: HTMLImageElement[] = [];
      try {
        sprites = await loadImages(LAWBSTER_SPRITES);
      } catch {
        sprites = [];
      }
      if (cancelled || sprites.length === 0) return;

      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      Object.assign(canvas.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        display: 'block',
      });
      wrap.appendChild(canvas);

      const ctxRaw = canvas.getContext('2d');
      if (!ctxRaw) {
        wrap.removeChild(canvas);
        return;
      }
      const ctx = ctxRaw;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isNarrow = () => window.innerWidth <= 768;
      const lawbsterCount = () => (isNarrow() ? 12 : 24);

      const mouse = { x: -1e6, y: -1e6, active: false };

      const onMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
      };
      const onLeave = () => {
        mouse.active = false;
      };

      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('mouseleave', onLeave);
      document.addEventListener('mouseleave', onLeave);

      type Lawb = {
        phase: number;
        orbitR: number;
        orbitSpeed: number;
        size: number;
        spriteIndex: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
      };

      let lawbs: Lawb[] = [];
      let w = 0;
      let h = 0;
      let dpr = 1;
      let raf = 0;
      let last = performance.now();
      let globalT = 0;

      function isDarkUi(): boolean {
        return (
          document.documentElement.classList.contains('lawb-app-dark-mode') ||
          document.body.classList.contains('lawb-app-dark-mode')
        );
      }

      const AVOID_R = 130;
      const AVOID_STR = 520;
      const SPRING = 1.35;
      const DRAG = 2.8;

      function patternTarget(lawb: Lawb, t: number): { tx: number; ty: number } {
        const driftX = Math.sin(t * 0.11) * w * 0.08;
        const driftY = Math.cos(t * 0.09) * h * 0.06;
        const cx = w * 0.5 + driftX;
        const cy = h * 0.5 + driftY;
        const ang = lawb.phase + t * lawb.orbitSpeed;
        const tx = cx + Math.cos(ang) * lawb.orbitR;
        const ty = cy + Math.sin(ang * 1.31) * lawb.orbitR * 0.52;
        return {
          tx: tx + Math.sin(t * 0.45 + lawb.phase * 3) * 14,
          ty: ty + Math.cos(t * 0.38 + lawb.phase * 2) * 10,
        };
      }

      function drawLawbsterSprite(
        x: number,
        y: number,
        angle: number,
        scale: number,
        img: HTMLImageElement,
        narrow: boolean,
      ) {
        const baseW = 52 * scale * (narrow ? 0.9 : 1);
        const nw = img.naturalWidth || 1;
        const nh = img.naturalHeight || 1;
        const dw = baseW;
        const dh = baseW * (nh / nw);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      function drawGradient(dark: boolean) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        if (dark) {
          g.addColorStop(0, '#060d14');
          g.addColorStop(0.5, '#0f2434');
          g.addColorStop(1, '#040810');
        } else {
          g.addColorStop(0, '#0c1e36');
          g.addColorStop(0.5, '#1a4a6c');
          g.addColorStop(1, '#0a1628');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      function drawFrame(dt: number) {
        const dark = isDarkUi();
        drawGradient(dark);

        const t = globalT;
        const mx = mouse.x;
        const my = mouse.y;
        const narrow = isNarrow();

        for (const lawb of lawbs) {
          const { tx, ty } = patternTarget(lawb, t);
          let ax = (tx - lawb.x) * SPRING;
          let ay = (ty - lawb.y) * SPRING;

          if (mouse.active) {
            const dx = lawb.x - mx;
            const dy = lawb.y - my;
            const dist = Math.hypot(dx, dy);
            if (dist < AVOID_R && dist > 0.5) {
              const push = ((AVOID_R - dist) / AVOID_R) ** 1.6;
              ax += (dx / dist) * push * AVOID_STR;
              ay += (dy / dist) * push * AVOID_STR;
            }
          }

          lawb.vx = (lawb.vx + ax * dt) / (1 + DRAG * dt);
          lawb.vy = (lawb.vy + ay * dt) / (1 + DRAG * dt);
          lawb.x += lawb.vx * dt;
          lawb.y += lawb.vy * dt;

          const margin = 80;
          if (lawb.x < margin) lawb.x += (margin - lawb.x) * 0.04;
          if (lawb.x > w - margin) lawb.x -= (lawb.x - (w - margin)) * 0.04;
          if (lawb.y < margin) lawb.y += (margin - lawb.y) * 0.04;
          if (lawb.y > h - margin) lawb.y -= (lawb.y - (h - margin)) * 0.04;

          const { tx: tx2, ty: ty2 } = patternTarget(lawb, t);
          const ang = Math.atan2(ty2 - lawb.y, tx2 - lawb.x);
          const img = sprites[lawb.spriteIndex % sprites.length]!;
          drawLawbsterSprite(lawb.x, lawb.y, ang, lawb.size, img, narrow);
        }
      }

      function staticFrame() {
        const dark = isDarkUi();
        drawGradient(dark);
        const t = 1.2;
        const narrow = isNarrow();
        for (const lawb of lawbs) {
          const { tx, ty } = patternTarget(lawb, t);
          const { tx: txN, ty: tyN } = patternTarget(lawb, t + 0.04);
          const ang = Math.atan2(tyN - ty, txN - tx);
          const img = sprites[lawb.spriteIndex % sprites.length]!;
          drawLawbsterSprite(tx, ty, ang, lawb.size, img, narrow);
        }
      }

      function loop(now: number) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!reducedMotion) {
          globalT += dt;
          drawFrame(dt);
        }
        raf = requestAnimationFrame(loop);
      }

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const n = lawbsterCount();
        const shortSide = Math.min(w, h);
        const baseR = shortSide * (isNarrow() ? 0.2 : 0.22);
        lawbs = Array.from({ length: n }, (_, i) => {
          const t = (i / n) * Math.PI * 2;
          return {
            phase: t + Math.random() * 0.4,
            orbitR: baseR * (0.72 + (i % 5) * 0.06),
            orbitSpeed: 0.22 + (i % 7) * 0.028,
            size: 0.78 + (i % 4) * 0.1,
            spriteIndex: i % sprites.length,
            x: w * 0.5 + Math.cos(t) * baseR,
            y: h * 0.5 + Math.sin(t) * baseR * 0.58,
            vx: 0,
            vy: 0,
          };
        });
        if (reducedMotion) staticFrame();
      }

      resize();
      window.addEventListener('resize', resize);

      let themeObs: MutationObserver | null = null;
      if (reducedMotion) {
        staticFrame();
        themeObs = new MutationObserver(() => staticFrame());
        themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        themeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      } else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }

      const onVis = () => {
        if (document.hidden) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else if (!reducedMotion && raf === 0) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      };
      document.addEventListener('visibilitychange', onVis);

      dispose = () => {
        cancelAnimationFrame(raf);
        themeObs?.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('visibilitychange', onVis);
        if (canvas.parentNode === wrap) wrap.removeChild(canvas);
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
};

export default DesktopLobsterBackground;
