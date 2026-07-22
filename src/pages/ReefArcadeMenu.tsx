import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WALLET_CONNECT_LEADERBOARD_BONUS,
  addEcosystemPoints,
  normalizeLeaderboardPathKey,
} from '../firebaseLeaderboard';
import { database } from '../firebaseApp';
import { firebaseProfiles } from '../firebaseProfiles';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { reefRunLeaderboardPointsForRound } from '../utils/reefRunLeaderboardPoints';
import { CHARACTER_STATS, starsRow } from './arcade/arcadeCharacterStats';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import { reefRunHudFromSurvivalSec, type ReefRunHudPayload } from './arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from './arcade/arcadePickupKinds';
import type { ArcadeBootProgress, ArcadeGameScreen } from './arcade/ArcadeSceneController';
import type { ArcadePlayInputHandle } from './ArcadeThreeBackground';
import './reefArcadeMenu.css';

const LazyArcadeThree = lazy(async () => {
  const m = await import('./ArcadeThreeBackground');
  return { default: m.ArcadeThreeBackground };
});
const LazyArcadeLoadingPeptides = lazy(async () => {
  const m = await import('./arcade/ArcadeLoadingPeptides');
  return { default: m.ArcadeLoadingPeptides };
});

type Phase = 'intro' | 'menu';
type ModalKind = 'difficulty' | 'wallet' | 'howto' | null;
type TouchGesture = { pointerId: number; startY: number };

const CHARACTERS: { id: ArcadeCharacterId; name: string; color: string }[] = [
  { id: 'clawb', name: 'CLAWB', color: '#ff6b35' },
  { id: 'radbro', name: 'RADBRO', color: '#e8a0bf' },
  { id: 'milady', name: 'MILADY', color: '#9eddcf' },
];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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

function runEndSummary(reason: RunEndReason): string {
  switch (reason) {
    case 'oxygen':
      return 'Ran out of oxygen — stay on Milady/Radbro’s timed O₂ tanks. Clawb does not run out of breath underwater.';
    case 'crush':
      return 'Coral block collision — change lanes with A/D or touch lane controls.';
    case 'wrecked':
      return 'Armor depleted — avoid jellyfish, pufferfish, and mines; grab peptides.';
    default:
      return 'Run ended.';
  }
}

/**
 * Full-screen arcade shell for lawb.xyz — Three.js tunnel, FBX idle/dance/swim, lane dodge.
 */
export default function ReefArcadeMenu() {
  const navigate = useNavigate();
  const { open } = useAppKitSafe();
  const connection = useConnectionDisplay();
  const [sceneReady, setSceneReady] = useState(false);
  const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(true);
  const [bootProgress, setBootProgress] = useState<ArcadeBootProgress>({
    loaded: 0,
    total: 5,
    label: 'Waking the reef',
  });
  const [bootError, setBootError] = useState<string | null>(null);
  /** Increments on Retry so the Three layer can be unmounted+remounted from scratch. */
  const [bootAttempt, setBootAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [modal, setModal] = useState<ModalKind>(null);
  const [gameScreen, setGameScreen] = useState<ArcadeGameScreen>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<ArcadeCharacterId>('clawb');
  const [runHud, setRunHud] = useState<ReefRunHudPayload | null>(null);
  const [runStatsHud, setRunStatsHud] = useState<ArcadeRunHudState | null>(null);
  const [lastRunEndReason, setLastRunEndReason] = useState<RunEndReason | null>(null);
  /** Leaderboard note after last run (points saved, or hint if no wallet). */
  const [lastRunLbNote, setLastRunLbNote] = useState<string | null>(null);
  const [touchUiEnabled, setTouchUiEnabled] = useState<boolean>(prefersTouchInput);
  const [touchThrottleMode, setTouchThrottleMode] = useState<-1 | 0 | 1>(0);
  const arcadeInputRef = useRef<ArcadePlayInputHandle | null>(null);
  const touchGestureRef = useRef<TouchGesture | null>(null);

  const skipIntro = useCallback(() => setPhase('menu'), []);

  useEffect(() => {
    if (phase !== 'intro') return;
    const onKey = () => skipIntro();
    const onClick = () => skipIntro();
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    window.addEventListener('touchstart', onClick, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
      window.removeEventListener('touchstart', onClick);
    };
  }, [phase, skipIntro]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return;
      if (phase === 'intro') {
        skipIntro();
        return;
      }
      if (gameScreen === 'play' || gameScreen === 'gameover' || gameScreen === 'select') {
        ev.preventDefault();
        setTouchThrottleMode(0);
        arcadeInputRef.current?.clearVirtualThrottle();
        setGameScreen('menu');
        setRunHud(null);
        setRunStatsHud(null);
        setLastRunEndReason(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, gameScreen, skipIntro]);

  useEffect(() => {
    const refreshTouchUi = () => setTouchUiEnabled(prefersTouchInput());
    refreshTouchUi();
    window.addEventListener('resize', refreshTouchUi);
    const coarse = window.matchMedia('(pointer: coarse)');
    const hoverNone = window.matchMedia('(hover: none)');
    const bind = (mq: MediaQueryList) => {
      if (mq.addEventListener) mq.addEventListener('change', refreshTouchUi);
      else mq.addListener(refreshTouchUi);
    };
    const unbind = (mq: MediaQueryList) => {
      if (mq.removeEventListener) mq.removeEventListener('change', refreshTouchUi);
      else mq.removeListener(refreshTouchUi);
    };
    bind(coarse);
    bind(hoverNone);
    return () => {
      window.removeEventListener('resize', refreshTouchUi);
      unbind(coarse);
      unbind(hoverNone);
    };
  }, []);

  const onPickCharacter = useCallback((id: ArcadeCharacterId) => {
    setSelectedCharacterId(id);
  }, []);

  const cycleCharacter = useCallback((delta: -1 | 1) => {
    setSelectedCharacterId((prev) => {
      const idx = CHARACTERS.findIndex((c) => c.id === prev);
      if (idx < 0) return prev;
      const next = (idx + delta + CHARACTERS.length) % CHARACTERS.length;
      return CHARACTERS[next]!.id;
    });
  }, []);

  const onRunHud = useCallback((hud: ArcadeRunHudState) => {
    setRunStatsHud(hud);
  }, []);

  const onGameOver = useCallback(
    (survivalSec: number, reason: RunEndReason, finalHud?: ArcadeRunHudState) => {
      setRunHud(reefRunHudFromSurvivalSec(survivalSec));
      setLastRunEndReason(reason);
      if (finalHud) setRunStatsHud(finalHud);
      setGameScreen('gameover');

      if (!connection.connected || !connection.address) {
        setLastRunLbNote(
          'Connect a wallet to earn Lawb leaderboard points (1 pt if under 1 min, then 3 pts per full minute).',
        );
        return;
      }
      if (!database) {
        setLastRunLbNote('Leaderboard unavailable (Firebase not configured).');
        return;
      }

      const pts = reefRunLeaderboardPointsForRound(survivalSec);
      const runHud = finalHud ?? runStatsHud;
      // Single leaderboard sync per run (see reefRunLeaderboardPoints.ts) — avoids Firebase write spam.
      void (async () => {
        const primary = await firebaseProfiles.getPrimaryWallet(connection.address!);
        const key = normalizeLeaderboardPathKey(primary);
        if (!key) {
          setLastRunLbNote('Could not record points for this wallet address.');
          return;
        }
        const [okPoints] = await Promise.all([
          addEcosystemPoints(key, 'reef_run', pts),
          firebaseProfiles.updateReefRunStats(primary, {
            characterId: selectedCharacterId,
            survivalSec,
            coinsCollected: runHud?.coins ?? 0,
            cheeseCollected: runHud?.cheeseCollected ?? 0,
            peptidesCollected: runHud?.peptidesCollected ?? 0,
          }),
        ]);
        const ok = okPoints;
        if (ok) {
          setLastRunLbNote(`+${pts} leaderboard pts (Reef Run). Synced to Firebase.`);
        } else {
          setLastRunLbNote('Could not save leaderboard points. Check connection and try again.');
        }
      })();
    },
    [connection.connected, connection.address, runStatsHud, selectedCharacterId],
  );

  const onRunDifficulty = useCallback((payload: ReefRunHudPayload) => {
    setRunHud(payload);
  }, []);

  const onEngineReady = useCallback(() => {
    setSceneReady(true);
    setBootProgress({ loaded: 5, total: 5, label: 'Ready' });
  }, []);

  const onBootProgress = useCallback((p: ArcadeBootProgress) => {
    setBootProgress(p);
  }, []);

  const onBootError = useCallback((err: unknown) => {
    setBootError(err instanceof Error ? err.message : String(err ?? 'Unknown error'));
  }, []);

  const retryBoot = useCallback(() => {
    setBootError(null);
    setSceneReady(false);
    setLoadingOverlayVisible(true);
    setBootProgress({ loaded: 0, total: 5, label: 'Retrying' });
    setBootAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!sceneReady) return;
    const timer = window.setTimeout(() => {
      setLoadingOverlayVisible(false);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [sceneReady]);

  useEffect(() => {
    if (gameScreen === 'menu' || gameScreen === 'select') {
      setRunHud(null);
    }
  }, [gameScreen]);

  const goConnect = () => {
    void open({ view: connection.connected ? 'Account' : 'Connect' });
  };

  const beginRun = useCallback(() => {
    if (!sceneReady) return;
    setLastRunLbNote(null);
    setLastRunEndReason(null);
    setRunStatsHud(null);
    setTouchThrottleMode(0);
    arcadeInputRef.current?.clearVirtualThrottle();
    setGameScreen('play');
  }, [sceneReady]);

  const goMainMenu = useCallback(() => {
    setGameScreen('menu');
    setRunHud(null);
    setRunStatsHud(null);
    setLastRunEndReason(null);
    setTouchThrottleMode(0);
    arcadeInputRef.current?.clearVirtualThrottle();
  }, []);

  const tapLane = useCallback((delta: -1 | 1) => {
    arcadeInputRef.current?.nudgeLane(delta);
  }, []);

  const applySwipeThrottle = useCallback((deltaY: number) => {
    const threshold = 28;
    const nextMode: -1 | 0 | 1 = deltaY <= -threshold ? 1 : deltaY >= threshold ? -1 : 0;
    setTouchThrottleMode((prev) => (prev === nextMode ? prev : nextMode));
  }, []);

  const onTouchSurfacePointerDown = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      if (!touchUiEnabled || gameScreen !== 'play' || ev.pointerType === 'mouse') return;
      ev.preventDefault();
      ev.currentTarget.setPointerCapture?.(ev.pointerId);
      touchGestureRef.current = { pointerId: ev.pointerId, startY: ev.clientY };
      tapLane(ev.clientX < window.innerWidth * 0.5 ? -1 : 1);
      setTouchThrottleMode(0);
    },
    [gameScreen, tapLane, touchUiEnabled],
  );

  const onTouchSurfacePointerMove = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      const g = touchGestureRef.current;
      if (!g || g.pointerId !== ev.pointerId) return;
      ev.preventDefault();
      applySwipeThrottle(ev.clientY - g.startY);
    },
    [applySwipeThrottle],
  );

  const onTouchSurfacePointerEnd = useCallback((ev: React.PointerEvent<HTMLDivElement>) => {
    const g = touchGestureRef.current;
    if (!g || g.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    touchGestureRef.current = null;
    setTouchThrottleMode(0);
  }, []);

  useEffect(() => {
    if (gameScreen !== 'play') {
      touchGestureRef.current = null;
      arcadeInputRef.current?.clearVirtualThrottle();
      return;
    }
    arcadeInputRef.current?.setVirtualThrottle({
      forward: touchThrottleMode > 0,
      backward: touchThrottleMode < 0,
    });
  }, [gameScreen, touchThrottleMode]);

  useEffect(() => {
    if (!touchUiEnabled || gameScreen !== 'play') return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscroll = html.style.overscrollBehaviorY;
    const prevBodyOverscroll = body.style.overscrollBehaviorY;
    const prevBodyTouchAction = body.style.touchAction;
    html.style.overscrollBehaviorY = 'none';
    body.style.overscrollBehaviorY = 'none';
    body.style.touchAction = 'none';

    const preventSurfaceScroll = (ev: TouchEvent) => {
      const el = ev.target as Element | null;
      if (el?.closest('.ra-touch-surface')) ev.preventDefault();
    };
    document.addEventListener('touchmove', preventSurfaceScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventSurfaceScroll);
      html.style.overscrollBehaviorY = prevHtmlOverscroll;
      body.style.overscrollBehaviorY = prevBodyOverscroll;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [touchUiEnabled, gameScreen]);

  useEffect(() => {
    if (phase !== 'menu') return;
    const onShortcutKey = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (!sceneReady) {
        if (k === 'x') {
          ev.preventDefault();
          navigate('/');
        }
        return;
      }
      if (modal) {
        if (ev.key === 'Escape') {
          ev.preventDefault();
          setModal(null);
          return;
        }
        if ((modal === 'difficulty' || modal === 'howto') && (ev.key === 'Enter' || ev.key === ' ')) {
          ev.preventDefault();
          setModal(null);
          return;
        }
        if (modal === 'wallet' && (ev.key === 'Enter' || ev.key === ' ' || k === 'w')) {
          ev.preventDefault();
          goConnect();
        }
        return;
      }

      if (gameScreen === 'menu') {
        if (ev.key === 'Enter' || ev.key === ' ' || k === '1') {
          ev.preventDefault();
          beginRun();
          return;
        }
        if (k === '2' || k === 'p') {
          ev.preventDefault();
          setGameScreen('select');
          return;
        }
        if (k === '3' || k === 'w') {
          ev.preventDefault();
          setModal('wallet');
          return;
        }
        if (k === '4' || k === 'd') {
          ev.preventDefault();
          setModal('difficulty');
          return;
        }
        if (k === '5' || k === 'h') {
          ev.preventDefault();
          setModal('howto');
          return;
        }
        if (k === 'x') {
          ev.preventDefault();
          navigate('/');
        }
        return;
      }

      if (gameScreen === 'select') {
        if (ev.key === 'ArrowLeft' || k === 'a') {
          ev.preventDefault();
          cycleCharacter(-1);
          return;
        }
        if (ev.key === 'ArrowRight' || k === 'd') {
          ev.preventDefault();
          cycleCharacter(1);
          return;
        }
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          beginRun();
          return;
        }
        if (ev.key === 'Backspace') {
          ev.preventDefault();
          goMainMenu();
          return;
        }
      }

      if (gameScreen === 'gameover') {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          beginRun();
          return;
        }
        if (k === 'c') {
          ev.preventDefault();
          setGameScreen('select');
          return;
        }
        if (k === 'm') {
          ev.preventDefault();
          goMainMenu();
        }
      }
    };

    window.addEventListener('keydown', onShortcutKey);
    return () => window.removeEventListener('keydown', onShortcutKey);
  }, [phase, modal, gameScreen, beginRun, cycleCharacter, goMainMenu, navigate, sceneReady]);

  return (
    <div className="ra-root" role="application" aria-label="Reef Run arcade menu">
      <Suspense fallback={null}>
        <LazyArcadeThree
          key={bootAttempt}
          ref={arcadeInputRef}
          phase={phase}
          gameScreen={gameScreen}
          selectedCharacterId={selectedCharacterId}
          onPickCharacter={onPickCharacter}
          onGameOver={onGameOver}
          onRunDifficulty={onRunDifficulty}
          onRunHud={onRunHud}
          onEngineReady={onEngineReady}
          onBootProgress={onBootProgress}
          onBootError={onBootError}
        />
      </Suspense>
      <div className="ra-bg" aria-hidden />
      <div className="ra-scanlines" aria-hidden />
      <div className="ra-vignette" aria-hidden />
      <div className="ra-grain" aria-hidden />
      {loadingOverlayVisible && (
        <div
          className={`ra-loading-overlay${sceneReady ? ' ra-loading-overlay-ready' : ''}${bootError ? ' ra-loading-overlay-error' : ''}`}
          role="status"
          aria-live="polite"
          aria-label="Loading Reef Run assets"
        >
          <Suspense fallback={<div className="ra-loading-model-fallback" aria-hidden />}>
            <LazyArcadeLoadingPeptides />
          </Suspense>
          {bootError ? (
            <div className="ra-loading-error">
              <p className="ra-loading-error-title">Could not load Reef Run</p>
              <p className="ra-loading-error-detail">{bootError}</p>
              <button type="button" className="ra-btn" onClick={retryBoot}>
                RETRY
              </button>
            </div>
          ) : (
            <div className="ra-loading-status">
              <p className="ra-loading-text">
                {bootProgress.label}
                {bootProgress.total > 0
                  ? ` · ${Math.round((bootProgress.loaded / bootProgress.total) * 100)}%`
                  : ''}
              </p>
              <div className="ra-loading-bar" aria-hidden>
                <div
                  className="ra-loading-bar-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((bootProgress.loaded / Math.max(bootProgress.total, 1)) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ra-inner">
        {phase === 'intro' && (
          <div className="ra-intro">
            <p className="ra-intro-eyebrow">LAWB.XYZ</p>
            <h1 className="ra-intro-title">REEF RUN</h1>
            <p className="ra-intro-sub">ENDLESS SWIM · ARCADE EDITION</p>
            <p className="ra-intro-hint">PRESS ANY KEY · TAP TO CONTINUE</p>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'menu' && (
          <div className="ra-menu">
            <div className="ra-logo-block">
              <div className="ra-logo-small">ARCADE</div>
              <h1 className="ra-logo-main">REEF RUN</h1>
              <p className="ra-logo-tag">Clawb · Radbro · Milady</p>
            </div>

            <div className="ra-menu-status" aria-label="Session status">
              <button
                type="button"
                className={`ra-status-chip ra-status-chip-wallet${connection.connected ? ' ra-status-chip-on' : ''}`}
                onClick={() => setModal('wallet')}
                aria-label={connection.connected ? 'Wallet connected' : 'Connect wallet'}
              >
                <span className="ra-status-chip-dot" aria-hidden />
                <span className="ra-status-chip-label">Wallet</span>
                <span className="ra-status-chip-value">
                  {connection.connected
                    ? connection.ens ?? (connection.address ? shortenAddress(connection.address) : 'Connected')
                    : 'Not connected'}
                </span>
              </button>
              <button
                type="button"
                className="ra-status-chip ra-status-chip-character"
                onClick={() => {
                  if (!sceneReady) return;
                  setGameScreen('select');
                }}
                disabled={!sceneReady}
                aria-label="Change swimmer"
              >
                <span
                  className="ra-status-chip-dot"
                  style={{ background: CHARACTERS.find((c) => c.id === selectedCharacterId)?.color ?? '#ff6b35' }}
                  aria-hidden
                />
                <span className="ra-status-chip-label">Swimmer</span>
                <span className="ra-status-chip-value">
                  {CHARACTERS.find((c) => c.id === selectedCharacterId)?.name ?? 'CLAWB'}
                </span>
              </button>
            </div>

            <div className="ra-tile-grid">
              <button
                type="button"
                className="ra-tile ra-tile-primary"
                onClick={beginRun}
                disabled={!sceneReady}
              >
                <span className="ra-tile-icon" aria-hidden>▶</span>
                <span className="ra-tile-label">Start run</span>
                <span className="ra-tile-meta">Space · Enter · 1</span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => {
                  if (!sceneReady) return;
                  setGameScreen('select');
                }}
                disabled={!sceneReady}
              >
                <span className="ra-tile-icon" aria-hidden>⚙</span>
                <span className="ra-tile-label">Swimmer</span>
                <span className="ra-tile-meta">Pick character · 2</span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => setModal('wallet')}
              >
                <span className="ra-tile-icon" aria-hidden>◈</span>
                <span className="ra-tile-label">Wallet</span>
                <span className="ra-tile-meta">
                  {connection.connected ? 'Manage · 3' : 'Connect · 3'}
                </span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => setModal('difficulty')}
              >
                <span className="ra-tile-icon" aria-hidden>⌁</span>
                <span className="ra-tile-label">Depth</span>
                <span className="ra-tile-meta">Tier &amp; speed · 4</span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => setModal('howto')}
              >
                <span className="ra-tile-icon" aria-hidden>?</span>
                <span className="ra-tile-label">How to play</span>
                <span className="ra-tile-meta">30-second guide · 5</span>
              </button>
            </div>

            <p className="ra-menu-kbd-hint">Keyboard: 1 start · 2 swimmer · 3 wallet · 4 depth · 5 how to · X exit</p>

            <div className="ra-footer-row">
              <button type="button" className="ra-link-quiet" onClick={() => navigate('/')}>
                ← EXIT TO DESKTOP
              </button>
              <a
                className="ra-link-quiet"
                href="https://retake.tv/clawb"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}
              >
                CLAWB TV
              </a>
            </div>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'select' && (
          <div className="ra-select-layer">
            <div className="ra-select-panel">
              <h2 className="ra-select-title">PICK YOUR SWIMMER</h2>
              <p className="ra-select-hint">
                Click models, tap chips, or use keyboard (←/→ to swap, Enter confirm).
              </p>
              <div className="ra-stat-block" style={{ marginBottom: 14, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>
                {(() => {
                  const s = CHARACTER_STATS[selectedCharacterId];
                  return (
                    <>
                      <div>{starsRow('Speed', s.speed)}</div>
                      {selectedCharacterId === 'clawb' ? (
                        <div>Breath (O₂) ★★★★★ — lawbster lungs (unlimited underwater)</div>
                      ) : (
                        <div>{starsRow('Breath (O₂)', s.oxygen)}</div>
                      )}
                      <div>{starsRow('Armor', s.armor)}</div>
                      <p style={{ margin: '8px 0 0', fontSize: 11, opacity: 0.75 }}>
                        {selectedCharacterId === 'clawb' ? (
                          <>
                            Clawb does not use the O₂ meter — dodge coral and protect armor. Milady &amp; Radbro rely on
                            timed O₂ tanks (tighter spacing at depth) plus bonus pickups.
                          </>
                        ) : (
                          <>
                            O₂ tanks spawn on a timer (spacing widens as depth increases) and randomly from the pickup
                            table — collect them to keep swimming.
                          </>
                        )}
                      </p>
                    </>
                  );
                })()}
              </div>
              <div className="ra-select-chips">
                {CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`ra-chip ${selectedCharacterId === c.id ? 'ra-chip-active' : ''}`}
                    onClick={() => setSelectedCharacterId(c.id)}
                  >
                    <span className="ra-chip-dot" style={{ background: c.color }} aria-hidden />
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="ra-select-actions">
                <button type="button" className="ra-btn" onClick={beginRun}>
                  CONFIRM
                </button>
                <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setGameScreen('menu')}>
                  BACK
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'play' && (
          <div className="ra-play-hud" aria-live="polite">
            <div className="ra-play-hud-top">
              <div className="ra-play-hud-depth-col">
                <p className="ra-play-hud-brand">REEF RUN</p>
                {runHud && (
                  <div className="ra-play-depth">
                    <p className="ra-play-depth-label">DEPTH</p>
                    <p className="ra-play-depth-roman" aria-label={`Depth tier ${runHud.roman}`}>
                      {runHud.roman}
                    </p>
                    <div className="ra-play-depth-bar-wrap" aria-hidden>
                      <div
                        className="ra-play-depth-bar"
                        style={{
                          width: `${Math.min(100, (100 * runHud.secondsElapsedInTier) / runHud.tierDurationSec)}%`,
                        }}
                      />
                    </div>
                    <p className="ra-play-depth-meta">
                      {Math.floor(runHud.secondsElapsedInTier)}s / {runHud.tierDurationSec}s → next ·{' '}
                      {runHud.speedMultiplier.toFixed(2)}×
                    </p>
                  </div>
                )}
              </div>
              {runStatsHud && (
                <div className="ra-play-hud-stats-col">
                  <div className="ra-play-stats">
                    <div className="ra-play-stat-row">
                      <span className="ra-play-stat-label">O₂</span>
                      {runStatsHud.oxygenInfinite ? (
                        <div className="ra-play-stat-lobster">∞ lawbster lungs</div>
                      ) : (
                        <div className="ra-play-meter">
                          <div
                            className="ra-play-meter-fill ra-play-meter-oxy"
                            style={{
                              width: `${Math.min(100, (100 * runStatsHud.oxygen) / Math.max(1, runStatsHud.oxygenMax))}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="ra-play-stat-row">
                      <span className="ra-play-stat-label">ARM</span>
                      <div className="ra-play-meter">
                        <div
                          className="ra-play-meter-fill ra-play-meter-armor"
                          style={{
                            width: `${Math.min(100, (100 * runStatsHud.armor) / Math.max(1, runStatsHud.armorMax))}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="ra-play-stat-line">
                      <span className="ra-play-stat-chip" title="Coins">
                        {runStatsHud.coins}c
                      </span>
                      <span className="ra-play-stat-chip" title="Trash">
                        {runStatsHud.trash}t
                      </span>
                      <span className="ra-play-stat-chip" title="Swim speed">
                        ×{runStatsHud.relativeSpeed.toFixed(2)}
                      </span>
                      {runStatsHud.cheeseSecLeft > 0 && (
                        <span className="ra-play-stat-chip ra-play-stat-cheese">cheese</span>
                      )}
                      {runStatsHud.dragSecLeft > 0 && (
                        <span className="ra-play-stat-chip ra-play-stat-drag">drag</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="ra-play-hud-bottom">
              <p className="ra-play-hud-keys">
                <span className="ra-play-keys-line">
                  {touchUiEnabled
                    ? 'Tap left/right half to move · hold + swipe up/down to boost/slow'
                    : 'A/D lanes · W/S speed · dodge coral · grab pickups'}
                  {runStatsHud?.oxygenInfinite ? ' · armor' : ' · O₂ & armor'}
                </span>
              </p>
            </div>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'play' && touchUiEnabled && (
          <div
            className="ra-touch-surface"
            role="application"
            aria-label="Touch play area: tap left or right to move lanes, hold and swipe up or down to control speed"
            onPointerDown={onTouchSurfacePointerDown}
            onPointerMove={onTouchSurfacePointerMove}
            onPointerUp={onTouchSurfacePointerEnd}
            onPointerCancel={onTouchSurfacePointerEnd}
          >
            <div className="ra-touch-side ra-touch-side-left" aria-hidden>
              TAP LEFT
            </div>
            <div className="ra-touch-side ra-touch-side-right" aria-hidden>
              TAP RIGHT
            </div>
            <div className="ra-touch-throttle" aria-hidden>
              {touchThrottleMode > 0 ? 'BOOST' : touchThrottleMode < 0 ? 'SLOW' : 'CRUISE'}
            </div>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'gameover' && (
          <div className="ra-gameover-layer">
            <div className="ra-gameover-panel">
              <h2 className="ra-gameover-title">GAME OVER</h2>
              {runHud && (
                <p className="ra-gameover-depth">
                  Depth reached · <span className="ra-gameover-roman">{runHud.roman}</span>
                  <span className="ra-gameover-time"> · {Math.floor(runHud.survivalSec)}s run</span>
                </p>
              )}
              <p className="ra-gameover-sub">
                {lastRunEndReason ? runEndSummary(lastRunEndReason) : 'Swim again?'}
              </p>
              {runStatsHud && (
                <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>
                  Loot: {runStatsHud.coins} coins · {runStatsHud.trash} trash hauled
                </p>
              )}
              {lastRunLbNote && (
                <p className="ra-gameover-lb-note" style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>
                  {lastRunLbNote}
                </p>
              )}
              <div className="ra-gameover-actions">
                <button type="button" className="ra-btn" onClick={beginRun}>
                  RETRY
                </button>
                <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setGameScreen('select')}>
                  PICK CHARACTER
                </button>
                <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setGameScreen('menu')}>
                  MAIN MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="ra-overlay" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="ra-panel" onClick={(e) => e.stopPropagation()}>
            {modal === 'difficulty' && (
              <>
                <h2>DEPTH & SPEED</h2>
                <p>
                  <strong>W / S</strong> throttle forward swim. <strong>Milady / Radbro:</strong> faster swim burns O₂
                  faster. <strong>Clawb</strong> is underwater indefinitely — no O₂ fail. <strong>A / D</strong> change
                  lanes. Mobile touch: <strong>tap left/right</strong> to lane shift, then <strong>hold + swipe up/down</strong>{' '}
                  to boost/slow. The reef tube <strong>banks and sways</strong> as you dive deeper.
                </p>
                <p>
                  The longer you survive, the faster the baseline current. Every <strong>45 seconds</strong> you cross a
                  new <strong>depth mark</strong> (Roman numerals). <strong>O₂ tanks</strong> for Milady/Radbro spawn on
                  a schedule (wider gaps at depth) plus random pickups — never zero in the table, but timing gets urgent.
                  Collect cheese for a nitro burst, peptides for armor + cleanse, and note that jellyfish/puffers/mines
                  damage armor while also draining some O₂ on non-Clawb swimmers.
                </p>
              </>
            )}

            {modal === 'wallet' && (
              <>
                <h2>WALLET CONNECT</h2>
                <p>
                  Connect the same wallet you use on lawb.xyz. <strong>Reef Run</strong> adds{' '}
                  <strong>Games</strong> points to the same Firebase leaderboard as Chess and profile holdings:{' '}
                  <strong>1 pt</strong> if your run is under one minute, then <strong>3 pts</strong> for each full
                  minute survived (same value as a chess win per minute). Your first site-wide wallet connect can also
                  add <strong>{WALLET_CONNECT_LEADERBOARD_BONUS} pts</strong> elsewhere on lawb.xyz.
                </p>
                {connection.connected && connection.address ? (
                  <p className="ra-wallet-status">CONNECTED · {shortenAddress(connection.address)}</p>
                ) : (
                  <p className="ra-wallet-status" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    NOT CONNECTED
                  </p>
                )}
                <div className="ra-panel-actions">
                  <button type="button" className="ra-btn" onClick={goConnect}>
                    {connection.connected ? 'MANAGE WALLET' : 'CONNECT'}
                  </button>
                  <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setModal(null)}>
                    BACK
                  </button>
                </div>
              </>
            )}

            {modal === 'howto' && (
              <>
                <h2>HOW TO PLAY</h2>
                <div className="ra-howto-cards">
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">🕹 STEER</p>
                    <p>
                      Three lanes. <strong>A / D</strong> or <strong>← / →</strong> switch lanes ·{' '}
                      <strong>W</strong> swim faster · <strong>S</strong> ease off. Touch:{' '}
                      <strong>tap left/right</strong> to lane shift, <strong>hold + swipe up/down</strong> for speed.
                    </p>
                  </div>
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">🫧 SURVIVE</p>
                    <p>
                      Score = <strong>seconds survived</strong>. Watch two meters: <strong>Armor</strong> and{' '}
                      <strong>O₂</strong>. Jellyfish and pufferfish sting armor + breath and slow you down; mines hit
                      hard. The deeper you go, the meaner the reef gets.
                    </p>
                  </div>
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">🧀 GRAB</p>
                    <p>
                      <strong>Air tank</strong> refills O₂ · <strong>Peptides</strong> restore armor (both cleanse
                      slow) · <strong>Cheese</strong> = nitro burst · <strong>Trash</strong> a little armor ·{' '}
                      <strong>Coin</strong> +1 and a sip of O₂.
                    </p>
                  </div>
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">🦞 SWIMMERS</p>
                    <p>
                      <strong>Clawb</strong> — lawbster lungs, never runs out of breath, extra loot ·{' '}
                      <strong>Milady</strong> — fastest fins · <strong>Radbro</strong> — toughest armor. Connect a
                      wallet to save your best run and earn Games points.
                    </p>
                  </div>
                </div>
              </>
            )}

            {(modal === 'difficulty' || modal === 'howto') && (
              <div className="ra-panel-actions">
                <button type="button" className="ra-btn" onClick={() => setModal(null)}>
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
