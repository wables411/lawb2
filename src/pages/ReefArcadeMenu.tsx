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
import { useReefJackpot } from '../hooks/useReefJackpot';
import {
  entryTokenLabel,
  formatSurvivalMs,
  type ReefJackpotVerdict,
} from '../config/reefJackpotOnchain';
import { reefRunLeaderboardPointsForRound } from '../utils/reefRunLeaderboardPoints';
import { CHARACTER_STATS, starsRow } from './arcade/arcadeCharacterStats';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import { reefRunHudFromSurvivalSec, type ReefRunHudPayload } from './arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from './arcade/arcadePickupKinds';
import type { ArcadeBootProgress, ArcadeGameScreen } from './arcade/ArcadeSceneController';
import { reefSfx } from './arcade/arcadeSounds';
import {
  loadReefLang,
  saveReefLang,
  REEF_STRINGS,
  type ReefLang,
  type ReefStrings,
} from './arcade/reefLang';
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
type ModalKind = 'difficulty' | 'wallet' | 'howto' | 'jackpot' | null;

function formatTokenAmount(raw: bigint, decimals = 18): string {
  const whole = raw / 10n ** BigInt(decimals);
  const frac = raw % 10n ** BigInt(decimals);
  if (frac === 0n) return whole.toLocaleString();
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 2).replace(/0+$/, '');
  return fracStr ? `${whole.toLocaleString()}.${fracStr}` : whole.toLocaleString();
}
type TouchGesture = { pointerId: number; startY: number };

const CHARACTERS: { id: ArcadeCharacterId; name: string; color: string }[] = [
  { id: 'clawb', name: 'CLAWB', color: '#ff6b35' },
  { id: 'radbro', name: 'RADBRO', color: '#e8a0bf' },
  { id: 'milady', name: 'MILADY', color: '#9eddcf' },
];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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
  /** Brief highlight of the tapped TAP LEFT / TAP RIGHT zone so touch input visibly registers. */
  const [tapFlash, setTapFlash] = useState<-1 | 0 | 1>(0);
  const tapFlashTimerRef = useRef<number | null>(null);
  /** Mission-brief overlay (shown before the first run of each session). */
  const [showBrief, setShowBrief] = useState(false);
  /** Synthesized SFX mute (persisted by arcadeSounds; M key or the Sound tile toggles). */
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
  /** EN / 简体中文 (persisted; see reefLang.ts). */
  const [lang, setLang] = useState<ReefLang>(() => loadReefLang());

  // ── Jackpot (VITE_REEF_JACKPOT, spec §7) ──────────────────────────────────
  const jackpot = useReefJackpot();
  /** Paid entry not yet run: dive uses its seed; cleared when a run consumes it. */
  const [jackpotEntry, setJackpotEntry] = useState<{ nonce: number; seed: number } | null>(null);
  /** Validator signature block for the last jackpot run (submit on-chain from game over). */
  const [jackpotVerdict, setJackpotVerdict] = useState<ReefJackpotVerdict | null>(null);
  /** Step label while a jackpot tx / flow is in flight (also disables buttons). */
  const [jackpotBusy, setJackpotBusy] = useState<string | null>(null);
  const [jackpotNote, setJackpotNote] = useState<string | null>(null);
  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: ReefLang = prev === 'en' ? 'zh' : 'en';
      saveReefLang(next);
      return next;
    });
  }, []);
  const t = REEF_STRINGS[lang];

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
        setLastRunLbNote(REEF_STRINGS[loadReefLang()].lbConnectHint);
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
            trashCollected: runHud?.trash ?? 0,
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

  const launchRun = useCallback(() => {
    setLastRunLbNote(null);
    setLastRunEndReason(null);
    setRunStatsHud(null);
    setTouchThrottleMode(0);
    arcadeInputRef.current?.clearVirtualThrottle();
    setGameScreen('play');
  }, []);

  /** Validator verdict for the last run — the jackpot block carries the submitScore() sig. */
  const onRunVerdict = useCallback((verdict: Record<string, unknown>) => {
    const j = verdict.jackpot as (ReefJackpotVerdict & { alreadySigned?: boolean }) | undefined;
    if (!j) return;
    if (j.alreadySigned) {
      setJackpotNote('This entry was already signed once — one submitted attempt per entry.');
      return;
    }
    if (typeof j.signature === 'string') {
      setJackpotVerdict(j);
      setJackpotNote(null);
      setJackpotEntry(null); // the paid entry has been run; what remains is the signed score
    }
  }, []);

  /** Pay the entry (approve if needed), then dive immediately on the assigned seed. */
  const enterJackpotAndDive = useCallback(async () => {
    if (jackpotBusy) return;
    setJackpotNote(null);
    setJackpotVerdict(null);
    try {
      setJackpotBusy('Confirm in wallet…');
      const entry = await jackpot.enterJackpot();
      setJackpotEntry(entry);
      setJackpotBusy(null);
      arcadeInputRef.current?.setJackpotRun(entry.seed, entry.nonce);
      setModal(null);
      launchRun();
    } catch (err) {
      setJackpotBusy(null);
      const msg = err instanceof Error ? err.message : String(err);
      setJackpotNote(msg.length > 160 ? `${msg.slice(0, 160)}…` : msg);
    }
  }, [jackpot, jackpotBusy, launchRun]);

  /** Dive on an already-paid entry (e.g. the modal was closed between pay and dive). */
  const diveWithPaidEntry = useCallback(() => {
    if (!jackpotEntry) return;
    arcadeInputRef.current?.setJackpotRun(jackpotEntry.seed, jackpotEntry.nonce);
    setModal(null);
    launchRun();
  }, [jackpotEntry, launchRun]);

  /** Submit the validator-signed score on-chain (win → instant payout). */
  const submitJackpotScore = useCallback(async () => {
    if (!jackpotVerdict || jackpotBusy) return;
    try {
      setJackpotBusy('Submitting score…');
      const { won, payout } = await jackpot.submitJackpotScore(jackpotVerdict);
      setJackpotBusy(null);
      setJackpotVerdict(null);
      setJackpotEntry(null);
      if (won && payout !== null) {
        setJackpotNote(
          `🏆 JACKPOT! ${formatSurvivalMs(jackpotVerdict.survivalMs)} takes the pot — ${formatTokenAmount(payout)} ${entryTokenLabel(jackpot.chainId)} paid out.`,
        );
      } else {
        setJackpotNote(
          `Score ${formatSurvivalMs(jackpotVerdict.survivalMs)} submitted — bar not beaten, your entry stays in the pot.`,
        );
      }
    } catch (err) {
      setJackpotBusy(null);
      const msg = err instanceof Error ? err.message : String(err);
      setJackpotNote(msg.length > 160 ? `${msg.slice(0, 160)}…` : msg);
    }
  }, [jackpot, jackpotVerdict, jackpotBusy]);

  /** First run of the session opens the mission brief; after that, straight into the water. */
  const beginRun = useCallback(() => {
    if (!sceneReady) return;
    uiClick();
    let briefSeen = false;
    try {
      briefSeen = sessionStorage.getItem('reefRunBriefSeen') === '1';
    } catch {
      briefSeen = true; // storage unavailable → never gate the run on it
    }
    if (!briefSeen) {
      setShowBrief(true);
      return;
    }
    launchRun();
  }, [sceneReady, launchRun]);

  const diveFromBrief = useCallback(() => {
    uiClick();
    try {
      sessionStorage.setItem('reefRunBriefSeen', '1');
    } catch {
      /* ignore */
    }
    setShowBrief(false);
    launchRun();
  }, [launchRun]);

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
      const dir: -1 | 1 = ev.clientX < window.innerWidth * 0.5 ? -1 : 1;
      tapLane(dir);
      setTapFlash(dir);
      if (tapFlashTimerRef.current !== null) window.clearTimeout(tapFlashTimerRef.current);
      tapFlashTimerRef.current = window.setTimeout(() => setTapFlash(0), 190);
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
      if (k === 'm' && !modal) {
        ev.preventDefault();
        toggleSfx();
        return;
      }

      if (showBrief) {
        if (ev.key === 'Enter' || ev.key === ' ' || k === '1') {
          ev.preventDefault();
          diveFromBrief();
        } else if (ev.key === 'Escape' || ev.key === 'Backspace') {
          ev.preventDefault();
          setShowBrief(false);
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
  }, [phase, modal, gameScreen, beginRun, cycleCharacter, goMainMenu, navigate, sceneReady, showBrief, diveFromBrief, toggleSfx]);

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
          walletAddress={connection.connected ? connection.address ?? null : null}
          onRunVerdict={onRunVerdict}
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
            <p className="ra-intro-hint">{t.pressAny}</p>
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
                onClick={() => { uiClick(); setModal('wallet'); }}
                aria-label={connection.connected ? 'Wallet connected' : 'Connect wallet'}
              >
                <span className="ra-status-chip-dot" aria-hidden />
                <span className="ra-status-chip-label">{t.wallet}</span>
                <span className="ra-status-chip-value">
                  {connection.connected
                    ? connection.ens ?? (connection.address ? shortenAddress(connection.address) : 'Connected')
                    : t.notConnected}
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
                <span className="ra-status-chip-label">{t.swimmer}</span>
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
                <span className="ra-tile-label">{t.startRun}</span>
                <span className="ra-tile-meta">{t.startMeta}</span>
              </button>
              {jackpot.enabled && (
                <button
                  type="button"
                  className="ra-tile"
                  onClick={() => { uiClick(); setModal('jackpot'); }}
                  disabled={!sceneReady}
                >
                  <span className="ra-tile-icon" aria-hidden>💰</span>
                  <span className="ra-tile-label">JACKPOT</span>
                  <span className="ra-tile-meta">
                    {jackpot.board
                      ? `${formatTokenAmount(jackpot.board.pot)} ${entryTokenLabel(jackpot.chainId)} POT`
                      : 'PAID RUNS · BEAT THE BAR'}
                  </span>
                </button>
              )}
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
                <span className="ra-tile-label">{t.swimmer}</span>
                <span className="ra-tile-meta">{t.pickCharacter}</span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => { uiClick(); setModal('wallet'); }}
              >
                <span className="ra-tile-icon" aria-hidden>◈</span>
                <span className="ra-tile-label">{t.wallet}</span>
                <span className="ra-tile-meta">
                  {connection.connected ? t.walletManage : t.walletConnect}
                </span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => { uiClick(); setModal('difficulty'); }}
              >
                <span className="ra-tile-icon" aria-hidden>⌁</span>
                <span className="ra-tile-label">{t.depth}</span>
                <span className="ra-tile-meta">{t.depthMeta}</span>
              </button>
              <button
                type="button"
                className="ra-tile"
                onClick={() => { uiClick(); setModal('howto'); }}
              >
                <span className="ra-tile-icon" aria-hidden>?</span>
                <span className="ra-tile-label">{t.howTo}</span>
                <span className="ra-tile-meta">{t.howToMeta}</span>
              </button>
              <button type="button" className="ra-tile" onClick={toggleSfx}>
                <span className="ra-tile-icon" aria-hidden>{sfxMuted ? '🔇' : '🔊'}</span>
                <span className="ra-tile-label">{t.sound}</span>
                <span className="ra-tile-meta">{sfxMuted ? t.soundOff : t.soundOn} · M</span>
              </button>
            </div>

            <p className="ra-menu-kbd-hint">{t.kbdHint}</p>

            <div className="ra-footer-row">
              <button type="button" className="ra-link-quiet" onClick={() => navigate('/')}>
                {t.exitDesktop}
              </button>
              <button type="button" className="ra-link-quiet" onClick={toggleLang}>
                {lang === 'en' ? '中文' : 'EN'}
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
              <h2 className="ra-select-title">{t.selectTitle}</h2>
              <p className="ra-select-hint">{t.selectHint}</p>
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
                  {t.confirm}
                </button>
                <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setGameScreen('menu'); }}>
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
                        <div className="ra-play-stat-lobster">{t.lawbsterLungs}</div>
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
                      {/* key on the count so a fresh mount replays the pop animation per pickup */}
                      <span key={`c${runStatsHud.coins}`} className="ra-play-stat-chip ra-chip-pop" title="Coins">
                        {runStatsHud.coins}c
                      </span>
                      <span key={`t${runStatsHud.trash}`} className="ra-play-stat-chip ra-chip-pop" title="Trash">
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
                    ? t.playHint
                    : lang === 'zh'
                      ? 'A/D 泳道 · W/S 速度 · 躲珊瑚 · 拾道具'
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
              {touchThrottleMode > 0 ? t.boost : touchThrottleMode < 0 ? t.slow : t.cruise}
            </div>
          </div>
        )}

        {phase === 'menu' && showBrief && (
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
                  onClick={() => setShowBrief(false)}
                >
                  {t.back}
                </button>
              </div>
              <p className="ra-brief-hint">{t.briefHint}</p>
            </div>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'gameover' && (
          <div className="ra-gameover-layer">
            <div className="ra-gameover-panel">
              <h2 className="ra-gameover-title">{t.gameOver}</h2>
              {runHud && (
                <p className="ra-gameover-depth">
                  {t.depthReached} · <span className="ra-gameover-roman">{runHud.roman}</span>
                  <span className="ra-gameover-time"> · {Math.floor(runHud.survivalSec)}s {t.run}</span>
                </p>
              )}
              <p className="ra-gameover-sub">
                {lastRunEndReason ? runEndSummary(lastRunEndReason, t) : t.swimAgain}
              </p>
              {runStatsHud && (
                <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                  🗑 <strong>{t.thankYou.replace('{n}', String(runStatsHud.trash))}</strong>
                  <span style={{ opacity: 0.85, display: 'block', marginTop: 2 }}>
                    {runStatsHud.coins} {t.coins}
                  </span>
                </p>
              )}
              {lastRunLbNote && (
                <p className="ra-gameover-lb-note" style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>
                  {lastRunLbNote}
                </p>
              )}
              {jackpot.enabled && jackpotVerdict && (
                <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>
                  💰 Jackpot run verified: <strong>{formatSurvivalMs(jackpotVerdict.survivalMs)}</strong>
                  {jackpot.board && jackpot.board.highScoreMs > 0 && (
                    <> · bar {formatSurvivalMs(jackpot.board.highScoreMs)}</>
                  )}
                </p>
              )}
              {jackpot.enabled && jackpotNote && !jackpotVerdict && (
                <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>{jackpotNote}</p>
              )}
              <div className="ra-gameover-actions">
                {jackpot.enabled && jackpotVerdict && (
                  <button type="button" className="ra-btn" onClick={submitJackpotScore} disabled={Boolean(jackpotBusy)}>
                    {jackpotBusy ?? '💰 SUBMIT TO JACKPOT'}
                  </button>
                )}
                <button type="button" className="ra-btn" onClick={beginRun}>
                  {t.retry}
                </button>
                <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setGameScreen('select'); }}>
                  {t.selectTitle}
                </button>
                <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setGameScreen('menu'); }}>
                  {t.mainMenu}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="ra-overlay" role="dialog" aria-modal="true" onClick={() => { uiClick(); setModal(null); }}>
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
                  <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setModal(null); }}>
                    BACK
                  </button>
                </div>
              </>
            )}

            {modal === 'jackpot' && (
              <>
                <h2>💰 REEF JACKPOT</h2>
                {!jackpot.contract ? (
                  <p>
                    The jackpot contract is not deployed on this chain. Switch your wallet network
                    and try again.
                  </p>
                ) : (
                  <>
                    <p>
                      Pay <strong>
                        {jackpot.board ? formatTokenAmount(jackpot.board.entryAmount) : '…'}{' '}
                        {entryTokenLabel(jackpot.chainId)}
                      </strong>{' '}
                      for one seeded run. Beat the survival bar and the whole pot pays out instantly
                      (minus 5%). Lose and your entry grows the pot. Your run seed is assigned
                      on-chain at entry — dive right away, entries expire after ~15 minutes.
                    </p>
                    <p className="ra-wallet-status">
                      POT:{' '}
                      <strong>
                        {jackpot.board ? formatTokenAmount(jackpot.board.pot) : '…'}{' '}
                        {entryTokenLabel(jackpot.chainId)}
                      </strong>
                      {' · '}BAR:{' '}
                      <strong>
                        {jackpot.board
                          ? jackpot.board.highScoreMs > 0
                            ? formatSurvivalMs(jackpot.board.highScoreMs)
                            : 'OPEN (any run wins)'
                          : '…'}
                      </strong>
                      {jackpot.board && jackpot.board.champion !== '0x0000000000000000000000000000000000000000' && (
                        <> {' · '}CHAMPION: <strong>{shortenAddress(jackpot.board.champion)}</strong></>
                      )}
                    </p>
                    {!connection.connected && (
                      <p className="ra-wallet-status" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        CONNECT A WALLET TO ENTER
                      </p>
                    )}
                    {jackpotVerdict && (
                      <p className="ra-wallet-status">
                        UNSUBMITTED SCORE: <strong>{formatSurvivalMs(jackpotVerdict.survivalMs)}</strong>
                      </p>
                    )}
                    {jackpotEntry && !jackpotVerdict && (
                      <p className="ra-wallet-status">ENTRY PAID · SEED ASSIGNED — DIVE BEFORE IT EXPIRES</p>
                    )}
                    {jackpotNote && <p style={{ fontSize: 13, lineHeight: 1.45 }}>{jackpotNote}</p>}
                    <div className="ra-panel-actions">
                      {jackpotVerdict ? (
                        <button type="button" className="ra-btn" onClick={submitJackpotScore} disabled={Boolean(jackpotBusy)}>
                          {jackpotBusy ?? 'SUBMIT SCORE ON-CHAIN'}
                        </button>
                      ) : jackpotEntry ? (
                        <button type="button" className="ra-btn" onClick={diveWithPaidEntry} disabled={!sceneReady}>
                          DIVE (ENTRY PAID)
                        </button>
                      ) : connection.connected ? (
                        <button
                          type="button"
                          className="ra-btn"
                          onClick={enterJackpotAndDive}
                          disabled={Boolean(jackpotBusy) || !sceneReady || !jackpot.board}
                        >
                          {jackpotBusy ?? 'PAY ENTRY & DIVE'}
                        </button>
                      ) : (
                        <button type="button" className="ra-btn" onClick={goConnect}>
                          CONNECT
                        </button>
                      )}
                      <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setModal(null); }}>
                        BACK
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {modal === 'howto' && (
              <>
                <h2>{t.howtoTitle}</h2>
                <div className="ra-howto-cards">
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">{t.howtoMission}</p>
                    <p>{t.howtoMissionBody}</p>
                  </div>
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">{t.howtoSteer}</p>
                    <p>{t.howtoSteerBody}</p>
                  </div>
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">{t.howtoSurvive}</p>
                    <p>{t.howtoSurviveBody}</p>
                  </div>
                  <div className="ra-howto-card">
                    <p className="ra-howto-card-title">{t.howtoGrab}</p>
                    <p>{t.howtoGrabBody}</p>
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
                <button type="button" className="ra-btn" onClick={() => { uiClick(); setModal(null); }}>
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
