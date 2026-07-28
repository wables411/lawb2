import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArcadeThreeBackground, type ArcadePlayInputHandle } from '../pages/ArcadeThreeBackground';
import { ARCADE_CHARACTERS } from '../pages/arcade/arcadeAssetConfig';
import type { ReefRunHudPayload } from '../pages/arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from '../pages/arcade/arcadePickupKinds';
import type { ArcadeBootProgress, ArcadeGameScreen } from '../pages/arcade/ArcadeSceneController';
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

const RADBRO = ARCADE_CHARACTERS.filter((c) => c.id === 'radbro');

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

function runEndSummary(reason: RunEndReason): string {
  switch (reason) {
    case 'oxygen':
      return 'Ran out of oxygen — grab air tanks to keep breathing.';
    case 'crush':
      return 'Coral block collision — change lanes with A/D or tap left/right.';
    case 'wrecked':
      return 'Armor depleted — dodge jellyfish, pufferfish, and mines; grab peptides.';
    default:
      return 'Run ended.';
  }
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
    if (!briefSeen) {
      setPanel('brief');
      return;
    }
    launchRun();
  }, [sceneReady, briefSeen, launchRun]);

  const diveFromBrief = useCallback(() => {
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
        } else if (k === 'h' || k === '2') {
          ev.preventDefault();
          setPanel('howto');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, gameScreen, beginRun, diveFromBrief]);

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
        selectedCharacterId="radbro"
        characters={RADBRO}
        onPickCharacter={() => undefined}
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
            <h2 className="ra-gameover-title">LOAD FAILED</h2>
            <p className="ra-gameover-sub">{bootError}</p>
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={() => window.location.reload()}>
                RELOAD
              </button>
            </div>
          </div>
        </div>
      )}

      {sceneReady && panel === 'menu' && gameScreen !== 'play' && gameScreen !== 'gameover' && (
        <div className="rr-menu-layer">
          <div className="rr-menu-panel">
            <p className="rr-menu-kicker">RADBRO.FUN PRESENTS</p>
            <h1 className="rr-menu-title">RADBRO REEF RUN</h1>
            <p className="rr-menu-sub">Endless swim · dodge the reef · haul the trash</p>
            {best > 0 && <p className="rr-menu-best">BEST DIVE · {best}s</p>}
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={beginRun} disabled={!sceneReady}>
                ▶ START RUN
              </button>
              <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setPanel('howto')}>
                HOW TO PLAY
              </button>
            </div>
            <p className="ra-brief-hint">ENTER · SPACE · TAP</p>
          </div>
        </div>
      )}

      {panel === 'brief' && (
        <div className="ra-gameover-layer" role="dialog" aria-label="Mission brief">
          <div className="ra-gameover-panel ra-brief-panel">
            <h2 className="ra-gameover-title">MISSION BRIEF</h2>
            <div className="ra-brief-body">
              <p>
                Divers have been recruited to help save the ocean. Lawbsters have recorded an
                increase of trash sightings across all corners of the ocean floor — roughly{' '}
                <strong>33 billion pounds</strong> added yearly. While the lawbsters continue to
                collect trash on a regular schedule, any and all help is greatly appreciated.
              </p>
              <p>
                The goal: <strong>collect as much trash as you can</strong> before running out of
                air or colliding with something. You&rsquo;re welcome to keep any treasure you find
                while on your diving excursion.
              </p>
            </div>
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={diveFromBrief}>
                DIVE ▶
              </button>
              <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setPanel('menu')}>
                BACK
              </button>
            </div>
            <p className="ra-brief-hint">ENTER · SPACE · TAP DIVE</p>
          </div>
        </div>
      )}

      {panel === 'howto' && (
        <div className="ra-gameover-layer" role="dialog" aria-label="How to play">
          <div className="ra-gameover-panel ra-brief-panel">
            <h2 className="ra-gameover-title">HOW TO PLAY</h2>
            <div className="ra-brief-body">
              <p>
                <strong>Steer:</strong> A/D or ←/→ switch lanes · W faster · S slower. Touch: tap
                left/right to move, hold + swipe up/down for speed.
              </p>
              <p>
                <strong>Survive:</strong> score is seconds survived. Watch O₂ and armor — jellyfish,
                pufferfish, and mines hurt. The water darkens the deeper you dive. Statues and
                wrecks on the sides are scenery: only your three lanes can hurt you.
              </p>
              <p>
                <strong>Grab:</strong> air tank refills O₂ · peptides restore armor · cheese = nitro
                burst · trash = a little armor · coin +1 and a sip of O₂.
              </p>
            </div>
            <div className="ra-gameover-actions">
              <button
                type="button"
                className="ra-btn"
                onClick={() => setPanel(gameScreen === 'gameover' ? null : 'menu')}
              >
                OK
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
                  DEPTH <span className="ra-play-depth-roman">{runHud.roman}</span> ·{' '}
                  {Math.floor(runHud.survivalSec)}s · {runHud.speedMultiplier.toFixed(2)}×
                </p>
              )}
            </div>
            {runStatsHud && (
              <div className="rr-hud-stats">
                <div className="rr-hud-meter" title="Oxygen">
                  <span>O₂</span>
                  <div className="rr-hud-bar">
                    <div
                      className="rr-hud-fill rr-hud-fill-o2"
                      style={{
                        width: `${Math.min(100, (100 * runStatsHud.oxygen) / Math.max(1, runStatsHud.oxygenMax))}%`,
                      }}
                    />
                  </div>
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
            TAP LEFT
          </div>
          <div
            className={`ra-touch-side ra-touch-side-right${tapFlash === 1 ? ' ra-touch-side-flash' : ''}`}
            aria-hidden
          >
            TAP RIGHT
          </div>
          <div className="ra-touch-throttle" aria-hidden>
            {throttleMode > 0 ? 'BOOST' : throttleMode < 0 ? 'SLOW' : 'CRUISE'}
          </div>
        </div>
      )}

      {gameScreen === 'gameover' && panel === null && (
        <div className="ra-gameover-layer">
          <div className="ra-gameover-panel">
            <h2 className="ra-gameover-title">GAME OVER</h2>
            <p className="ra-gameover-depth">
              {Math.floor(lastSurvival)}s dive
              {best > 0 && <span className="ra-gameover-time"> · best {best}s</span>}
            </p>
            <p className="ra-gameover-sub">
              {lastRunEndReason ? runEndSummary(lastRunEndReason) : 'Swim again?'}
            </p>
            {runStatsHud && (
              <p className="ra-gameover-sub">
                🗑 <strong>{runStatsHud.trash} trash hauled</strong> · {runStatsHud.coins} coins
              </p>
            )}
            <div className="ra-gameover-actions">
              <button type="button" className="ra-btn" onClick={beginRun}>
                RETRY
              </button>
              <button
                type="button"
                className="ra-btn ra-btn-secondary"
                onClick={() => {
                  setGameScreen('menu');
                  setPanel('menu');
                }}
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
