import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArcadeRunHudState } from './arcadePickupKinds';
import { TRASH_VARIANTS } from './arcadeTrashVariants';
import { SATCHEL_ITEM_NAMES, type ReefLang, type ReefStrings } from './reefLang';
import { reefSfx } from './arcadeSounds';

/**
 * End-of-run scorecard — a RemiliaNET-style ID-card "dive report" with a Beetleboy
 * haul manifest. Rows print in like a receipt (pentatonic tick per row — the SFX
 * palette guarantees the ticks harmonize with the score), then the dive time stamps.
 * `treasure` swaps the mint card for the gold paid-entry variant. SAVE draws the card
 * to a real PNG entirely client-side (Web Share sheet on mobile, download on desktop).
 * Portrait: live engine snapshot of the character that swam the run (milady-tracker
 * philosophy — rendered in the browser, never canned art).
 */

export type ScoreCardData = {
  characterId: string;
  survivalSec: number;
  roman: string;
  hud: ArcadeRunHudState | null;
  /** Player's profile picture URL (dead-gateway rewritten); null/undefined = site default. */
  pfp?: string | null;
  /** Paid-entry (treasure) run → gold variant. */
  treasure: boolean;
  /** Validator-confirmed ms for treasure runs → VERIFIED stamp. */
  verifiedMs?: number;
  /** ENS / short address, or null for guest divers. */
  diver: string | null;
};

/** Rotating full-body swimmer strip (pre-rendered like the satchel item strips). */
const swimmerStrip = (characterId: string): string => `/assets/satchel/strip_swimmer_${characterId}.webp`;

/** Sitewide default pfp — same convention as PlayerProfile/ChessChat. */
const DEFAULT_PFP = '/images/sticker4.png';

type HaulRow = { key: string; strip: string; latin?: string; count: number };

const CARD_STAMP = 'LAWB INSTRUMENTS · RR-2K5 · ©Lawb Inc. 2023';

function haulRows(hud: ArcadeRunHudState | null): HaulRow[] {
  if (!hud) return [];
  const rows: HaulRow[] = [];
  const byKind = hud.trashByKind ?? {};
  for (const v of TRASH_VARIANTS) {
    const n = byKind[v.id] ?? 0;
    if (n > 0) {
      rows.push({ key: v.id, latin: v.latin, strip: `/assets/satchel/strip_trash_${v.id}.webp`, count: n });
    }
  }
  // Untyped trash (pre-variant runs / fallback): only when the variant sum runs short.
  const typed = rows.reduce((a, r) => a + r.count, 0);
  if (hud.trash > typed) {
    rows.push({ key: 'trash', strip: '/assets/satchel/strip_trash.webp', count: hud.trash - typed });
  }
  if (hud.coins > 0) rows.push({ key: 'coin', strip: '/assets/satchel/strip_coin.webp', count: hud.coins });
  if (hud.cheeseCollected > 0) rows.push({ key: 'cheese', strip: '/assets/satchel/strip_cheese.webp', count: hud.cheeseCollected });
  if (hud.peptidesCollected > 0) rows.push({ key: 'peptides', strip: '/assets/satchel/strip_peptides.webp', count: hud.peptidesCollected });
  return rows;
}

function fmtDiveTime(sec: number): string {
  const s = Math.floor(sec);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Load one image; resolves null on failure so export degrades gracefully.
 * crossOrigin so remote pfps (ipfs gateways) don't taint the export canvas —
 * a tainted canvas would make toBlob throw and kill the whole SAVE.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Hand-drawn PNG of the card (no DOM-capture libs — full pixel control, zero deps). */
async function drawCardPng(
  data: ScoreCardData,
  rows: HaulRow[],
  names: Record<string, string>,
  t: ReefStrings,
  dateStr: string,
): Promise<Blob | null> {
  const W = 720;
  const gold = data.treasure;
  const pal = gold
    ? { case: '#f6efdc', lcd: '#f3e9c9', head: '#e7d9a8', line: '#c9a94e', navy: '#6b4d12', ink: '#5a4a20', dim: '#9c8a55', dot: '#e9dfb8' }
    : { case: '#f4f8f7', lcd: '#dff0e9', head: '#bfe3d6', line: '#8fc9b6', navy: '#1d3a5f', ink: '#2c4a43', dim: '#6d8f86', dot: '#cfe8df' };

  const rowH = 46;
  const haulTop = 424;
  const H = haulTop + Math.max(rows.length, 1) * rowH + 150;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  if (!c) return null;
  const mono = '"Courier New", Courier, monospace';

  // Case + LCD panel
  c.fillStyle = pal.case;
  c.fillRect(0, 0, W, H);
  c.fillStyle = pal.lcd;
  c.strokeStyle = pal.line;
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(14, 14, W - 28, H - 28, 22);
  c.fill();
  c.stroke();

  // Header band
  c.fillStyle = pal.head;
  c.beginPath();
  c.roundRect(14, 14, W - 28, 74, [22, 22, 0, 0]);
  c.fill();
  c.fillStyle = pal.navy;
  c.font = `800 30px ${mono}`;
  c.fillText(gold ? t.cardTitleTreasure : t.cardTitleFree, 36, 62);
  c.font = `700 14px ${mono}`;
  c.textAlign = 'right';
  c.fillText('REEF RUN', W - 36, 48);
  c.fillStyle = pal.dim;
  c.font = `400 11px ${mono}`;
  c.fillText('lawb.xyz/arcade', W - 36, 68);
  c.textAlign = 'left';

  // Portrait (left) + ID fields (right)
  const px = 36;
  const py = 112;
  const ps = 240;
  c.fillStyle = '#fbfdfc';
  c.strokeStyle = pal.line;
  c.lineWidth = 2.5;
  c.beginPath();
  c.roundRect(px, py, ps, ps, 12);
  c.fill();
  c.stroke();
  // Pearlescent dither behind the bust (matches .sc-portrait).
  c.save();
  c.beginPath();
  c.roundRect(px + 2, py + 2, ps - 4, ps - 4, 10);
  c.clip();
  c.fillStyle = pal.dot;
  for (let dy = py + 6; dy < py + ps; dy += 11) {
    for (let dx = px + 6; dx < px + ps; dx += 11) {
      c.beginPath();
      c.arc(dx, dy, 1.1, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
  const pfpImg = (await loadImage(data.pfp || DEFAULT_PFP)) ?? (await loadImage(DEFAULT_PFP));
  if (pfpImg) {
    c.save();
    c.beginPath();
    c.roundRect(px + 3, py + 3, ps - 6, ps - 6, 10);
    c.clip();
    // cover-fit the pfp
    const s = Math.max((ps - 6) / pfpImg.width, (ps - 6) / pfpImg.height);
    const dw = pfpImg.width * s;
    const dh = pfpImg.height * s;
    c.drawImage(pfpImg, px + 3 + (ps - 6 - dw) / 2, py + 3 + (ps - 6 - dh) / 2, dw, dh);
    c.restore();
  } else {
    c.fillStyle = pal.dim;
    c.font = `700 60px ${mono}`;
    c.textAlign = 'center';
    c.fillText('?', px + ps / 2, py + ps / 2 + 22);
    c.textAlign = 'left';
  }
  // Full-body swimmer (first frame of the rotation strip), top-right of the ID block.
  const swim = await loadImage(swimmerStrip(data.characterId));
  if (swim) c.drawImage(swim, 0, 0, swim.height, swim.height, W - 116, 118, 80, 80);

  const fx = px + ps + 28;
  const field = (label: string, value: string, y: number, big = false) => {
    c.fillStyle = pal.dim;
    c.font = `700 11px ${mono}`;
    c.fillText(label, fx, y);
    c.fillStyle = pal.navy;
    c.font = `${big ? 800 : 700} ${big ? 34 : 18}px ${mono}`;
    c.fillText(value, fx, y + (big ? 40 : 24));
  };
  field(t.cardDiver, data.diver ?? t.cardGuest, 140);
  field('SWIMMER', data.characterId.toUpperCase(), 196);
  field(t.cardDate, dateStr, 252);
  field(`${t.cardDiveTime} · ${t.depth} ${data.roman}`, fmtDiveTime(data.survivalSec), 300, true);
  if (gold && data.verifiedMs !== undefined) {
    c.strokeStyle = pal.navy;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(fx, 356, 150, 34, 8);
    c.stroke();
    c.fillStyle = pal.navy;
    c.font = `800 16px ${mono}`;
    c.fillText(`✓ ${t.cardVerified}`, fx + 14, 379);
  }

  // Haul manifest
  c.fillStyle = pal.navy;
  c.font = `800 15px ${mono}`;
  c.fillText(t.cardHaul, 36, haulTop - 16);
  c.strokeStyle = pal.line;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(36, haulTop - 6);
  c.lineTo(W - 36, haulTop - 6);
  c.stroke();

  if (rows.length === 0) {
    c.fillStyle = pal.dim;
    c.font = `400 15px ${mono}`;
    c.fillText(t.cardNoHaul, 36, haulTop + 30);
  }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const y = haulTop + i * rowH;
    const sprite = await loadImage(r.strip);
    // First frame of the 12-frame strip.
    if (sprite) c.drawImage(sprite, 0, 0, sprite.height, sprite.height, 36, y, 38, 38);
    c.fillStyle = pal.ink;
    c.font = `700 16px ${mono}`;
    c.fillText(names[r.key] ?? r.key, 88, y + 20);
    if (r.latin) {
      c.fillStyle = pal.dim;
      c.font = `italic 400 12px ${mono}`;
      c.fillText(r.latin, 88, y + 36);
    }
    c.fillStyle = pal.navy;
    c.font = `800 20px ${mono}`;
    c.textAlign = 'right';
    c.fillText(`×${r.count}`, W - 36, y + 26);
    c.textAlign = 'left';
  }

  // Footer stamp
  c.fillStyle = pal.dim;
  c.font = `400 10.5px ${mono}`;
  c.fillText(CARD_STAMP, 36, H - 44);
  c.fillText('PROOF OF LAWB · NOT FOR SALE', 36, H - 28);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export function ReefScoreCard({
  data,
  t,
  lang,
}: {
  data: ScoreCardData;
  t: ReefStrings;
  lang: ReefLang;
}): JSX.Element {
  const names = SATCHEL_ITEM_NAMES[lang];
  const rows = useMemo(() => haulRows(data.hud), [data.hud]);
  /** Receipt print-in: how many rows are revealed; rows.length+1 = time stamped too. */
  const [printed, setPrinted] = useState(() => (prefersReducedMotion() ? rows.length + 1 : 0));
  const [saveNote, setSaveNote] = useState<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPrinted(rows.length + 1);
      return undefined;
    }
    setPrinted(0);
    /**
     * Elapsed-time driven, NOT a chain of one-shot timeouts: under main-thread jank
     * (asset loads, GC) a chained 240ms step reveals one row per starved callback and
     * the receipt looks frozen — computing the target from wall time always catches up.
     */
    const t0 = performance.now();
    let last = 0;
    const id = window.setInterval(() => {
      const target = Math.min(
        rows.length + 1,
        Math.max(0, Math.floor((performance.now() - t0 - 420) / 240) + 1),
      );
      if (target > last) {
        last = target;
        setPrinted(target);
        // Each printed row plinks on the scale; the final stamp gets the coin motif.
        reefSfx.play(target > rows.length ? 'coin' : 'ui');
        if (target >= rows.length + 1) window.clearInterval(id);
      }
    }, 90);
    return () => window.clearInterval(id);
  }, [rows.length, data.survivalSec]);

  const stamped = printed > rows.length;

  const saveCard = async (): Promise<void> => {
    reefSfx.play('ui');
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = await drawCardPng(data, rows, names, t, dateStr);
    if (!blob) return;
    const file = new File([blob], `reef-run-${dateStr}.png`, { type: 'image/png' });
    // Mobile: native share sheet (straight to X/Discord). Desktop: download.
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'REEF RUN' });
        return;
      }
    } catch {
      /* user cancelled the sheet — fall through to nothing, not a forced download */
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    setSaveNote(t.cardSaved);
    window.setTimeout(() => setSaveNote(null), 2000);
  };

  return (
    <div className={`sc-card${data.treasure ? ' sc-card-gold' : ''}`}>
      <div className="sc-head">
        <b>{data.treasure ? t.cardTitleTreasure : t.cardTitleFree}</b>
        <span>
          REEF RUN
          <small>lawb.xyz/arcade</small>
        </span>
      </div>

      <div className="sc-id">
        <div className="sc-portrait">
          <img
            src={data.pfp || DEFAULT_PFP}
            alt=""
            onError={(e) => {
              e.currentTarget.src = DEFAULT_PFP;
            }}
          />
        </div>
        <div className="sc-fields">
          <div className="sc-field">
            <label>{t.cardDiver}</label>
            <span>{data.diver ?? t.cardGuest}</span>
          </div>
          <div className="sc-field">
            <label>SWIMMER</label>
            <span>{data.characterId.toUpperCase()}</span>
          </div>
          <div className={`sc-field sc-time${stamped ? ' sc-time-stamped' : ''}`}>
            <label>
              {t.cardDiveTime} · {t.depth} {data.roman}
            </label>
            <span>{fmtDiveTime(data.survivalSec)}</span>
          </div>
          {data.treasure && data.verifiedMs !== undefined && (
            <div className="sc-verified">✓ {t.cardVerified}</div>
          )}
        </div>
        <span
          className="sc-swim-sprite"
          style={{ backgroundImage: `url(${swimmerStrip(data.characterId)})` }}
          role="img"
          aria-label={data.characterId}
        />
      </div>

      <div className="sc-haul">
        <div className="sc-haul-head">{t.cardHaul}</div>
        {rows.length === 0 && printed > 0 && <p className="sc-none">{t.cardNoHaul}</p>}
        {rows.map((r, i) => (
          <div key={r.key} className={`sc-row${i < printed ? ' sc-row-in' : ''}`}>
            <span className="rw-sprite" style={{ backgroundImage: `url(${r.strip})` }} aria-hidden />
            <span className="sc-row-name">
              {names[r.key] ?? r.key}
              {r.latin && <i>{r.latin}</i>}
            </span>
            <b>×{r.count}</b>
          </div>
        ))}
      </div>

      <div className="sc-foot">
        <button type="button" className="ra-btn sc-save" onClick={() => void saveCard()}>
          {saveNote ?? `💾 ${t.cardSave} / ${t.cardShare}`}
        </button>
        <small>PROOF OF LAWB · ©Lawb Inc. 2023</small>
      </div>
    </div>
  );
}
