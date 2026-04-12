import React, { useEffect, useRef } from 'react';

/**
 * Full-viewport canvas behind the Lawb OS desktop: procedural lobsters in a slow
 * “donut” pattern, nudged away from the cursor. No network, no Firebase — static JS only.
 */
const DesktopLobsterBackground: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

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
    if (!ctxRaw) return () => wrap.removeChild(canvas);
    const ctx = ctxRaw;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNarrow = () => window.innerWidth <= 768;
    const lobsterCount = () => (isNarrow() ? 14 : 30);

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

    type Lob = {
      phase: number;
      orbitR: number;
      orbitSpeed: number;
      size: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
    };

    let lobsters: Lob[] = [];
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

    function patternTarget(lob: Lob, t: number): { tx: number; ty: number } {
      const driftX = Math.sin(t * 0.11) * w * 0.08;
      const driftY = Math.cos(t * 0.09) * h * 0.06;
      const cx = w * 0.5 + driftX;
      const cy = h * 0.5 + driftY;
      const ang = lob.phase + t * lob.orbitSpeed;
      const tx = cx + Math.cos(ang) * lob.orbitR;
      const ty = cy + Math.sin(ang * 1.31) * lob.orbitR * 0.52;
      return {
        tx: tx + Math.sin(t * 0.45 + lob.phase * 3) * 14,
        ty: ty + Math.cos(t * 0.38 + lob.phase * 2) * 10,
      };
    }

    function drawLobster(x: number, y: number, angle: number, scale: number, dark: boolean) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      const shell = dark ? '#9e241a' : '#d12f24';
      const carapace = dark ? '#c42e22' : '#e0382a';
      const leg = dark ? '#5c1814' : '#7a221c';

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(1, 2, 17, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shell;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.bezierCurveTo(-28, -11, -34, -5, -38, 0);
      ctx.bezierCurveTo(-34, 7, -28, 11, -16, 0);
      ctx.fill();

      ctx.fillStyle = carapace;
      ctx.beginPath();
      ctx.ellipse(2, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shell;
      ctx.beginPath();
      ctx.arc(13, -9, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(15, -14, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(13, 9, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(15, 14, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = leg;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-5 + i * 3.2, 10);
        ctx.lineTo(-3 + i * 3.2, 17);
        ctx.stroke();
      }

      ctx.strokeStyle = dark ? '#4a1510' : '#6a1c16';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.quadraticCurveTo(10, -18, 6, -22);
      ctx.moveTo(8, 10);
      ctx.quadraticCurveTo(10, 18, 6, 22);
      ctx.stroke();

      ctx.fillStyle = '#121212';
      ctx.beginPath();
      ctx.arc(11, -4.5, 2.1, 0, Math.PI * 2);
      ctx.arc(11, 4.5, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(12, -5, 0.75, 0, Math.PI * 2);
      ctx.arc(12, 3.8, 0.75, 0, Math.PI * 2);
      ctx.fill();

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

      for (const lob of lobsters) {
        const { tx, ty } = patternTarget(lob, t);
        let ax = (tx - lob.x) * SPRING;
        let ay = (ty - lob.y) * SPRING;

        if (mouse.active) {
          const dx = lob.x - mx;
          const dy = lob.y - my;
          const dist = Math.hypot(dx, dy);
          if (dist < AVOID_R && dist > 0.5) {
            const push = ((AVOID_R - dist) / AVOID_R) ** 1.6;
            ax += (dx / dist) * push * AVOID_STR;
            ay += (dy / dist) * push * AVOID_STR;
          }
        }

        lob.vx = (lob.vx + ax * dt) / (1 + DRAG * dt);
        lob.vy = (lob.vy + ay * dt) / (1 + DRAG * dt);
        lob.x += lob.vx * dt;
        lob.y += lob.vy * dt;

        const margin = 80;
        if (lob.x < margin) lob.x += (margin - lob.x) * 0.04;
        if (lob.x > w - margin) lob.x -= (lob.x - (w - margin)) * 0.04;
        if (lob.y < margin) lob.y += (margin - lob.y) * 0.04;
        if (lob.y > h - margin) lob.y -= (lob.y - (h - margin)) * 0.04;

        const { tx: tx2, ty: ty2 } = patternTarget(lob, t);
        const ang = Math.atan2(ty2 - lob.y, tx2 - lob.x);
        drawLobster(lob.x, lob.y, ang, lob.size * (isNarrow() ? 0.92 : 1), dark);
      }
    }

    function staticFrame() {
      const dark = isDarkUi();
      drawGradient(dark);
      const t = 1.2;
      for (const lob of lobsters) {
        const { tx, ty } = patternTarget(lob, t);
        const { tx: txN, ty: tyN } = patternTarget(lob, t + 0.04);
        const ang = Math.atan2(tyN - ty, txN - tx);
        drawLobster(tx, ty, ang, lob.size * (isNarrow() ? 0.92 : 1), dark);
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

      const n = lobsterCount();
      const shortSide = Math.min(w, h);
      const baseR = shortSide * (isNarrow() ? 0.2 : 0.22);
      lobsters = Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        return {
          phase: t + Math.random() * 0.4,
          orbitR: baseR * (0.72 + (i % 5) * 0.06),
          orbitSpeed: 0.22 + (i % 7) * 0.028,
          size: 0.72 + (i % 4) * 0.09,
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

    return () => {
      cancelAnimationFrame(raf);
      themeObs?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      wrap.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        /* Must be ≥0 — z-index:-1 paints behind <body> (#1a3a5c) so the canvas was invisible. */
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
};

export default DesktopLobsterBackground;
