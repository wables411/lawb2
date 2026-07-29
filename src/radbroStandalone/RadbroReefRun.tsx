import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArcadeThreeBackground, type ArcadePlayInputHandle } from '../pages/ArcadeThreeBackground';
import { ARCADE_CHARACTERS, type ArcadeCharacterId } from '../pages/arcade/arcadeAssetConfig';
import type { ReefRunHudPayload } from '../pages/arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from '../pages/arcade/arcadePickupKinds';
import type { ArcadeBootProgress, ArcadeGameScreen } from '../pages/arcade/ArcadeSceneController';
import { reefSfx } from '../pages/arcade/arcadeSounds';
import {
  loadReefLang,
  saveReefLang,
  REEF_STRINGS,
  type ReefLang,
  type ReefStrings,
} from '../pages/arcade/reefLang';
import '../pages/reefArcadeMenu.css';
import './radbroStandalone.css';

/**
 * RADBRO REEF RUN — the standalone radbro.fun build.
 *
 * Same Three.js engine as lawb.xyz/arcade, but: radbro-only roster, no wallet, no Firebase,
 * no router — best run is kept in localStorage (best-effort: the portal serves this inside a
 * sandboxed iframe where storage may be blocked). Everything ships in one ZIP with relative
 * paths, so it runs from any static path.
 */

/** Full trio — radbro leads the bill on radbro.fun, but everyone's playable. */
const SWIMMERS: { id: ArcadeCharacterId; name: string; color: string }[] = [
  { id: 'radbro', name: 'RADBRO', color: '#e8a0bf' },
  { id: 'clawb', name: 'CLAWB', color: '#ff6b35' },
  { id: 'milady', name: 'MILADY', color: '#9eddcf' },
];

function swimmerBlurb(id: ArcadeCharacterId, t: ReefStrings): string {
  if (id === 'radbro') return t.blurbRadbro;
  if (id === 'clawb') return t.blurbClawb;
  return t.blurbMilady;
}

const BEST_KEY = 'radbroReefRunBest';

function loadBest(): number {
  try {
    const v = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function saveBest(sec: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.floor(sec)));
  } catch {
    /* sandboxed iframe without storage — best just isn't persisted */
  }
}

function runEndSummary(reason: RunEndReason, t: ReefStrings): string {
  switch (reason) {
    case 'oxygen':
      return t.reasonOxygen;
    case 'crush':
      return t.reasonCrush;
    case 'wrecked':
      return t.reasonWrecked;
    default:
      return t.swimAgain;
  }
}

/** Menu click blip — the menus were silent before. Also nudges the mobile audio unlock. */
function uiClick(): void {
  reefSfx.resume();
  reefSfx.play('ui');
}

function prefersTouchInput(): boolean {
  if (typeof window === 'undefined') return false;
  const narrow = Math.min(window.innerWidth, window.innerHeight) <= 900;
  const touchCapable =
    window.matchMedia?.('(pointer: coarse)').matches ||
    window.matchMedia?.('(hover: none)').matches ||
    navigator.maxTouchPoints > 0;
  return Boolean(narrow || touchCapable);
}

type Panel = 'menu' | 'brief' | 'howto' | null;

export default function RadbroReefRun() {
  const [sceneReady, setSceneReady] = useState(false);
  const [bootProgress, setBootProgress] = useState<ArcadeBootProgress>({
    loaded: 0,
    total: 3,
    label: 'Waking the reef',
  });
  const [bootError, setBootError] = useState<string | null>(null);
  const [gameScreen, setGameScreen] = useState<ArcadeGameScreen>('menu');
  const [panel, setPanel] = useState<Panel>('menu');
  const [runHud, setRunHud] = useState<ReefRunHudPayload | null>(null);
  const [runStatsHud, setRunStatsHud] = useState<ArcadeRunHudState | null>(null);
  const [lastRunEndReason, setLastRunEndReason] = useState<RunEndReason | null>(null);
  const [lastSurvival, setLastSurvival] = useState(0);
  const [best, setBest] = useState<number>(() => loadBest());
  const [swimmerId, setSwimmerId] = useState<ArcadeCharacterId>('radbro');
  const [sfxMuted, setSfxMuted] = useState<boolean>(() => reefSfx.isMuted());
  const toggleSfx = useCallback(() => {
    setSfxMuted((prev) => {
      reefSfx.setMuted(!prev);
      // Unmuting should confirm itself audibly.
      if (prev) {
        reefSfx.resume();
        reefSfx.play('ui');
      }
      return !prev;
    });
  }, []);
  const [lang, setLang] = useState<ReefLang>(() => loadReefLang());
  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: ReefLang = prev === 'en' ? 'zh' : 'en';
      saveReefLang(next);
      return next;
    });
  }, []);
  const t = REEF_STRINGS[lang];
  const [briefSeen, setBriefSeen] = useState(false);
  const [touchUi] = useState<boolean>(prefersTouchInput);
  const [tapFlash, setTapFlash] = useState<-1 | 0 | 1>(0);
  const [throttleMode, setThrottleMode] = useState<-1 | 0 | 1>(0);

  const inputRef = useRef<ArcadePlayInputHandle | null>(null);
  const gestureRef = useRef<{ pointerId: number; startY: number } | null>(null);
  const tapFlashTimer = useRef<number | null>(null);

  const launchRun = useCallback(() => {
    setLastRunEndReason(null);
    setRunStatsHud(null);
    setRunHud(null);
    setThrottleMode(0);
    inputRef.current?.clearVirtualThrottle();
    setPanel(null);
    setGameScreen('play');
  }, []);

  const beginRun = useCallback(() => {
    if (!sceneReady) return;
    uiClick();
    if (!briefSeen) {
      setPanel('brief');
      return;
    }
    launchRun();
  }, [sceneReady, briefSeen, launchRun]);

  const diveFromBrief = useCallback(() => {
    uiClick();
    setBriefSeen(true);
    launchRun();
  }, [launchRun]);

  const onGameOver = useCallback(
    (survivalSec: number, reason: RunEndReason, finalHud?: ArcadeRunHudState) => {
      setLastSurvival(survivalSec);
      setLastRunEndReason(reason);
      if (finalHud) setRunStatsHud(finalHud);
      setBest((prev) => {
        const next = Math.max(prev, Math.floor(survivalSec));
        if (next > prev) saveBest(next);
        return next;
      });
      setGameScreen('gameover');
    },
    [],
  );

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (k === 'm') {
        ev.preventDefault();
        toggleSfx();
        return;
      }
      if (panel === 'brief') {
        if (ev.key === 'Enter' || ev.key === ' ' || k === '1') {
          ev.preventDefault();
          diveFromBrief();
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          setPanel('menu');
        }
        return;
      }
      if (panel === 'howto') {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape') {
          ev.preventDefault();
          setPanel(gameScreen === 'gameover' ? null : 'menu');
        }
        return;
      }
      if (panel === 'menu' || gameScreen === 'gameover') {
        if (ev.key === 'Enter' || ev.key === ' ' || k === '1') {
          ev.preventDefault();
          beginRun();
        } else if (k === 'h' || k === '3') {
          ev.preventDefault();
          setPanel('howto');
        } else if (k === 'c' || k === '2') {
          ev.preventDefault();
          setSwimmerId((prev) => {
            const i = SWIMMERS.findIndex((c) => c.id === prev);
            return SWIMMERS[(i + 1) % SWIMMERS.length]!.id;
          });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, gameScreen, beginRun, diveFromBrief, toggleSfx]);

  const onTouchDown = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      if (!touchUi || gameScreen !== 'play' || ev.pointerType === 'mouse') return;
      ev.preventDefault();
      ev.currentTarget.setPointerCapture?.(ev.pointerId);
      gestureRef.current = { pointerId: ev.pointerId, startY: ev.clientY };
      const dir: -1 | 1 = ev.clientX < window.innerWidth * 0.5 ? -1 : 1;
      inputRef.current?.nudgeLane(dir);
      setTapFlash(dir);
      if (tapFlashTimer.current !== null) window.clearTimeout(tapFlashTimer.current);
      tapFlashTimer.current = window.setTimeout(() => setTapFlash(0), 190);
      setThrottleMode(0);
    },
    [touchUi, gameScreen],
  );

  const onTouchMove = useCallback((ev: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    const dy = ev.clientY - g.startY;
    const mode: -1 | 0 | 1 = dy <= -28 ? 1 : dy >= 28 ? -1 : 0;
    setThrottleMode((prev) => {
      if (prev !== mode) {
        inputRef.current?.setVirtualThrottle({ forward: mode > 0, backward: mode < 0 });
      }
      return mode;
    });
  }, []);

  const onTouchEnd = useCallback((ev: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    gestureRef.current = null;
    setThrottleMode(0);
    inputRef.current?.clearVirtualThrottle();
  }, []);

  const bootPct = Math.min(100, Math.round((100 * bootProgress.loaded) / Math.max(1, bootProgress.total)));

  return (
    <div className="ra-root rr-standalone" role="application" aria-label="Radbro Reef Run">
      <ArcadeThreeBackground
        ref={inputRef}
        phase="menu"
        gameScreen={gameScreen}
        selectedCharacterId={swimmerId}
        characters={ARCADE_CHARACTERS}
        onPickCharacter={setSwimmerId}
        onGameOver={onGameOver}
        onRunDifficulty={setRunHud}
        onRunHud={setRunStatsHud}
        onEngineReady={() => setSceneReady(true)}
        onBootProgress={setBootProgress}
        onBootError={(err) => setBootError(err instanceof Error ? err.message : String(err))}
      />

      {!sceneReady && (
        <div className="rr-boot" aria-live="polite">
          <p className="rr-boot-title">RADBRO REEF RUN</p>
          <div className="rr-boot-bar">
            <div className="rr-boot-fill" style={{ width: `${bootPct}%` }} />
          </div>
          <p className="rr-boot-label">{bootProgress.label}…</p>
        </div>
      )}
      {bootError && (
        <div className="ra-gameover-layer">
          <div className="ra-gameover-panel">
            <h2 className="ra-gameover-title">{t.loadFailed}</h2>
            <p className="ra-gameover-sub">{bootError}</p>
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={() => window.location.reload()}>
                {t.reload}
              </button>
            </div>
          </div>
        </div>
      )}

      {sceneReady && panel === 'menu' && gameScreen !== 'play' && gameScreen !== 'gameover' && (
        <div className="rr-menu-layer">
          <div className="rr-menu-panel">
            <p className="rr-menu-kicker">{t.presents}</p>
            <h1 className="rr-menu-title">RADBRO REEF RUN</h1>
            <p className="rr-menu-sub">{t.menuTagline}</p>
            {best > 0 && <p className="rr-menu-best">{t.bestDive} · {best}s</p>}
            <div className="rr-swimmer-row" role="radiogroup" aria-label="Pick your swimmer">
              {SWIMMERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={swimmerId === c.id}
                  className={`rr-swimmer-chip${swimmerId === c.id ? ' rr-swimmer-chip-active' : ''}`}
                  style={{ '--chip': c.color } as React.CSSProperties}
                  onClick={() => {
                    uiClick();
                    setSwimmerId(c.id);
                  }}
                  title={swimmerBlurb(c.id, t)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="rr-swimmer-blurb">{swimmerBlurb(swimmerId, t)}</p>
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={beginRun} disabled={!sceneReady}>
                ▶ {t.startRun}
              </button>
              <button
                type="button"
                className="ra-btn ra-btn-secondary"
                onClick={() => {
                  uiClick();
                  setPanel('howto');
                }}
              >
                {t.howTo}
              </button>
            </div>
            <p className="ra-brief-hint">{t.saMenuHint}</p>
          </div>
        </div>
      )}

      {sceneReady && (
        <>
          <button
            type="button"
            className="rr-sound-btn"
            onClick={toggleSfx}
            aria-label={sfxMuted ? 'Unmute sound' : 'Mute sound'}
            title="Sound (M)"
          >
            {sfxMuted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            className="rr-sound-btn rr-lang-btn"
            onClick={toggleLang}
            aria-label="Switch language"
            title="EN / 中文"
          >
            {lang === 'en' ? '中' : 'EN'}
          </button>
        </>
      )}

      {panel === 'brief' && (
        <div className="ra-gameover-layer" role="dialog" aria-label="Mission brief">
          <div className="ra-gameover-panel ra-brief-panel">
            <h2 className="ra-gameover-title">{t.briefTitle}</h2>
            <div className="ra-brief-body">
              <p>{t.briefP1}</p>
              <p>{t.briefP2}</p>
            </div>
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={diveFromBrief}>
                {t.dive}
              </button>
              <button
                type="button"
                className="ra-btn ra-btn-secondary"
                onClick={() => {
                  uiClick();
                  setPanel('menu');
                }}
              >
                {t.back}
              </button>
            </div>
            <p className="ra-brief-hint">{t.briefHint}</p>
          </div>
        </div>
      )}

      {panel === 'howto' && (
        <div className="ra-gameover-layer" role="dialog" aria-label="How to play">
          <div className="ra-gameover-panel ra-brief-panel">
            <h2 className="ra-gameover-title">{t.howtoTitle}</h2>
            <div className="ra-brief-body">
              <p>
                <strong>{t.howtoMission}</strong> — {t.howtoMissionBody}
              </p>
              <p>
                <strong>{t.howtoSteer}</strong> — {t.howtoSteerBody}
              </p>
              <p>
                <strong>{t.howtoSurvive}</strong> — {t.howtoSurviveBody}
              </p>
              <p>
                <strong>{t.howtoGrab}</strong> — {t.howtoGrabBody}
              </p>
            </div>
            <div className="ra-gameover-actions">
              <button
                type="button"
                className="ra-btn"
                onClick={() => {
                  uiClick();
                  setPanel(gameScreen === 'gameover' ? null : 'menu');
                }}
              >
                {t.ok}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameScreen === 'play' && (
        <div className="ra-play-hud" aria-live="polite">
          <div className="ra-play-hud-top">
            <div className="ra-play-hud-depth-col">
              <p className="ra-play-hud-brand">RADBRO REEF RUN</p>
              {runHud && (
                <p className="rr-hud-depth">
                  {t.depth} <span className="ra-play-depth-roman">{runHud.roman}</span> ·{' '}
                  {Math.floor(runHud.survivalSec)}s · {runHud.speedMultiplier.toFixed(2)}×
                </p>
              )}
            </div>
            {runStatsHud && (
              <div className="rr-hud-stats">
                <div className="rr-hud-meter" title="Oxygen">
                  <span>O₂</span>
                  {runStatsHud.oxygenInfinite ? (
                    <span className="rr-hud-inf">{t.lawbsterLungs}</span>
                  ) : (
                    <div className="rr-hud-bar">
                      <div
                        className="rr-hud-fill rr-hud-fill-o2"
                        style={{
                          width: `${Math.min(100, (100 * runStatsHud.oxygen) / Math.max(1, runStatsHud.oxygenMax))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="rr-hud-meter" title="Armor">
                  <span>ARM</span>
                  <div className="rr-hud-bar">
                    <div
                      className="rr-hud-fill rr-hud-fill-arm"
                      style={{
                        width: `${Math.min(100, (100 * runStatsHud.armor) / Math.max(1, runStatsHud.armorMax))}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="ra-play-stat-line">
                  <span key={`c${runStatsHud.coins}`} className="ra-play-stat-chip ra-chip-pop" title="Coins">
                    {runStatsHud.coins}c
                  </span>
                  <span key={`t${runStatsHud.trash}`} className="ra-play-stat-chip ra-chip-pop" title="Trash">
                    {runStatsHud.trash}t
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameScreen === 'play' && touchUi && (
        <div
          className="ra-touch-surface"
          role="application"
          aria-label="Touch play area: tap left or right to move lanes, hold and swipe up or down to control speed"
          onPointerDown={onTouchDown}
          onPointerMove={onTouchMove}
          onPointerUp={onTouchEnd}
          onPointerCancel={onTouchEnd}
        >
          <div
            className={`ra-touch-side ra-touch-side-left${tapFlash === -1 ? ' ra-touch-side-flash' : ''}`}
            aria-hidden
          >
            {t.tapLeft}
          </div>
          <div
            className={`ra-touch-side ra-touch-side-right${tapFlash === 1 ? ' ra-touch-side-flash' : ''}`}
            aria-hidden
          >
            {t.tapRight}
          </div>
          <div className="ra-touch-throttle" aria-hidden>
            {throttleMode > 0 ? t.boost : throttleMode < 0 ? t.slow : t.cruise}
          </div>
        </div>
      )}

      {gameScreen === 'gameover' && panel === null && (
        <div className="ra-gameover-layer">
          <div className="ra-gameover-panel">
            <h2 className="ra-gameover-title">{t.gameOver}</h2>
            <p className="ra-gameover-depth">
              {Math.floor(lastSurvival)}s {t.dived}
              {best > 0 && <span className="ra-gameover-time"> · {t.best} {best}s</span>}
            </p>
            <p className="ra-gameover-sub">
              {lastRunEndReason ? runEndSummary(lastRunEndReason, t) : t.swimAgain}
            </p>
            {runStatsHud && (
              <p className="ra-gameover-sub">
                🗑 <strong>{t.thankYou.replace('{n}', String(runStatsHud.trash))}</strong>
                <br />
                <span style={{ opacity: 0.85 }}>{runStatsHud.coins} {t.coins}</span>
              </p>
            )}
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={beginRun}>
                {t.retry}
              </button>
              <button
                type="button"
                className="ra-btn ra-btn-secondary"
                onClick={() => {
                  uiClick();
                  setGameScreen('menu');
                  setPanel('menu');
                }}
              >
                {t.mainMenu}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
