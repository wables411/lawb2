import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignMessage } from 'wagmi';
import { WALLET_CONNECT_LEADERBOARD_BONUS } from '../firebaseLeaderboard';
import { database } from '../firebaseApp';
import { firebaseProfiles, type ReefRunProfileStats } from '../firebaseProfiles';
import { ensureWalletDbAuth, waitForWalletDbAuth, base58Encode } from '../firebaseWalletAuth';
import { appKit } from '../appkit';
import { getBestReefVerified, type ReefVerifiedEntry } from '../reefVerified';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import { useConnectionDisplay } from '../hooks/useConnectionDisplay';
import { useReefJackpot } from '../hooks/useReefJackpot';
import { ENABLE_DIVE_CONSOLE } from '../config/diveConsole';
import TidesRail from './arcade/TidesRail';
import {
  entryTokenLabel,
  formatSurvivalMs,
  type ReefJackpotVerdict,
} from '../config/reefJackpotOnchain';
import { CHARACTER_STATS, starsRow } from './arcade/arcadeCharacterStats';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import { parseUnits } from 'viem';
import { reefRunHudFromSurvivalSec, type ReefRunHudPayload } from './arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from './arcade/arcadePickupKinds';
import type { ArcadeBootProgress, ArcadeGameScreen } from './arcade/ArcadeSceneController';
import { reefSfx } from './arcade/arcadeSounds';
import {
  loadReefLang,
  saveReefLang,
  REEF_STRINGS,
  SATCHEL_ITEM_NAMES,
  type ReefLang,
  type ReefStrings,
} from './arcade/reefLang';
import { TRASH_VARIANTS } from './arcade/arcadeTrashVariants';
import { ReefScoreCard } from './arcade/ReefScoreCard';
import { ipfsToHttp } from '../utils/ipfs';
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
type ReefRunSavePayload = Parameters<typeof firebaseProfiles.updateReefRunStats>[1];

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

/** Render a string-table template, replacing {slot} markers with React nodes (i18n-safe word order). */
function tSlots(template: string, slots: Record<string, React.ReactNode>): React.ReactNode {
  return template.split(/(\{\w+\})/g).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    return m ? <React.Fragment key={i}>{slots[m[1]!] ?? ''}</React.Fragment> : part;
  });
}

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
  /** Paid entry: dive uses its seed. KEPT after the run (enteredAt gates the submit
   *  countdown — the contract's TTL covers pay→dive→submit as one window). */
  const [jackpotEntry, setJackpotEntry] = useState<{ nonce: number; seed: number; enteredAt: number } | null>(null);
  /** Validator signature block for the last jackpot run (submit on-chain from game over). */
  const [jackpotVerdict, setJackpotVerdict] = useState<ReefJackpotVerdict | null>(() => {
    // Survive reloads AND tab closes: a signed verdict is money — it must not live
    // only in React state. localStorage (not sessionStorage) because the validator
    // signs each entry exactly ONCE — a user who closes the tab while topping up
    // gas would otherwise burn their only signature. The deadline check below (and
    // the contract's entry TTL) still bounds how long a stashed verdict is usable.
    try {
      const raw = localStorage.getItem('reef_jackpot_verdict_v1');
      if (!raw) return null;
      const saved = JSON.parse(raw) as ReefJackpotVerdict;
      return Date.now() / 1000 < saved.deadline ? saved : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (jackpotVerdict) localStorage.setItem('reef_jackpot_verdict_v1', JSON.stringify(jackpotVerdict));
      else localStorage.removeItem('reef_jackpot_verdict_v1');
    } catch { /* storage unavailable — degrade to in-memory only */ }
  }, [jackpotVerdict]);
  /** 1s ticker while a paid entry / unsubmitted verdict is racing the TTL clock. */
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!jackpotEntry && !jackpotVerdict) return undefined;
    const id = window.setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [jackpotEntry, jackpotVerdict]);
  /** Seconds left to act (dive and/or submit). null = nothing pending. */
  const jackpotSecLeft: number | null = (() => {
    if (!jackpotEntry && !jackpotVerdict) return null;
    let deadline = Infinity;
    if (jackpotEntry) deadline = jackpotEntry.enteredAt + jackpot.entryTtlSec;
    if (jackpotVerdict) deadline = Math.min(deadline, jackpotVerdict.deadline);
    return deadline === Infinity ? null : Math.max(0, Math.floor(deadline - nowSec));
  })();
  const jackpotExpired = jackpotSecLeft !== null && jackpotSecLeft <= 0;
  const fmtSecLeft = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  /** Step label while a jackpot tx / flow is in flight (also disables buttons). */
  const [jackpotBusy, setJackpotBusy] = useState<string | null>(null);
  const [jackpotNote, setJackpotNote] = useState<string | null>(null);
  /** Sponsor top-up amount (human units, e.g. "500" CULT). */
  const [sponsorAmount, setSponsorAmount] = useState('');

  // ── Dive-device menu data: satchel stats + verified best (one fetch per connect) ──
  const [reefStats, setReefStats] = useState<ReefRunProfileStats | null>(null);
  /** Dive-log showcase: which satchel item's field notes are open (hover or tap). */
  const [logFocus, setLogFocus] = useState<string | null>(null);
  /** Player's profile picture for the diver ID card + scorecard (dead-gateway rewritten). */
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [verifiedBest, setVerifiedBest] = useState<ReefVerifiedEntry | null>(null);
  /** Bumped when a run's stats finish saving, so the satchel refetches even if the
   *  player reached the menu before the Firebase write landed. */
  const [statsVersion, setStatsVersion] = useState(0);
  const [surfaceTime, setSurfaceTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
  );
  useEffect(() => {
    const id = setInterval(
      () => setSurfaceTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })),
      30_000,
    );
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    let stale = false;
    // Refetch on every return to the menu (gameScreen dep), not just on connect —
    // otherwise a run's freshly saved haul doesn't show in the satchel until reload.
    if (gameScreen !== 'menu' || !connection.connected || !connection.address) {
      if (!connection.connected) {
        setReefStats(null);
        setPfpUrl(null);
        setVerifiedBest(null);
      }
      return undefined;
    }
    void (async () => {
      try {
        const primary = await firebaseProfiles.getPrimaryWallet(connection.address!);
        const [profile, best] = await Promise.all([
          database ? firebaseProfiles.getProfile(primary) : Promise.resolve(null),
          getBestReefVerified([primary, connection.address!]),
        ]);
        if (stale) return;
        setReefStats(profile?.reef_run_stats ?? null);
        setPfpUrl(
          profile?.profile_picture?.image_url ? ipfsToHttp(profile.profile_picture.image_url) : null,
        );
        setVerifiedBest(best);
      } catch {
        if (!stale) {
          setReefStats(null);
          setPfpUrl(null);
          setVerifiedBest(null);
        }
      }
    })();
    return () => { stale = true; };
  }, [connection.connected, connection.address, gameScreen, statsVersion]);
  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: ReefLang = prev === 'en' ? 'zh' : 'en';
      saveReefLang(next);
      return next;
    });
  }, []);
  const t = REEF_STRINGS[lang];

  const skipIntro = useCallback(() => setPhase('menu'), []);

  /** DEV-only (`?carddemo`): jump straight to the game-over scorecard with fake haul
   *  data so the card is inspectable without playing a run. Compiled out of prod. */
  useEffect(() => {
    if (!import.meta.env.DEV || !window.location.search.includes('carddemo')) return undefined;
    // Defer past mount: the gameScreen-reset effect nulls runHud while the initial
    // screen is still 'menu', which would clobber the demo hud set synchronously here.
    const id = window.setTimeout(() => {
      setPhase('menu');
      setRunHud(reefRunHudFromSurvivalSec(97));
      setRunStatsHud({
        oxygen: 0, oxygenMax: 100, oxygenInfinite: true, armor: 0, armorMax: 60,
        coins: 23, trash: 17, cheeseCollected: 3, peptidesCollected: 2,
        relativeSpeed: 1, cheeseSecLeft: 0, dragSecLeft: 0,
        trashByKind: { cube: 5, vape: 4, crt: 2, cigpack: 3, bag: 3 },
      });
      setLastRunEndReason('wrecked');
      setGameScreen('gameover');
    }, 60);
    return () => window.clearTimeout(id);
  }, []);

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

  /** Haul waiting for a successful save (auth pending/declined/rejected) — powers the retry button. */
  const [pendingSave, setPendingSave] = useState<ReefRunSavePayload | null>(null);
  const { signMessageAsync } = useSignMessage();
  /** Login-message signer for whichever chain the connected wallet is on (mirrors WalletConnectLeaderboardSync). */
  const signLoginMessage = useCallback(
    async (message: string): Promise<string> => {
      if (connection.address?.startsWith('0x')) return signMessageAsync({ message });
      const provider = appKit?.getProvider('solana') as
        | { signMessage?: (m: Uint8Array) => Promise<Uint8Array> }
        | undefined;
      if (!provider?.signMessage) throw new Error('Wallet cannot sign messages');
      return base58Encode(await provider.signMessage(new TextEncoder().encode(message)));
    },
    [connection.address, signMessageAsync],
  );

  const saveRunStats = useCallback(
    async (payload: ReefRunSavePayload) => {
      const address = connection.address;
      if (!address || !database) return;
      // The connect-time sign-in prompt may still be open (short first runs) — wait
      // for it briefly, then re-prompt ourselves rather than writing into a rules
      // rejection. Rules only accept writes from the authed wallet's own session.
      let authed = await waitForWalletDbAuth(address, 4000);
      if (!authed) {
        authed = await ensureWalletDbAuth(
          address,
          address.startsWith('0x') ? 'evm' : 'solana',
          signLoginMessage,
        );
      }
      const primary = authed ? await firebaseProfiles.getPrimaryWallet(address) : null;
      const saved = primary ? await firebaseProfiles.updateReefRunStats(primary, payload) : false;
      const s = REEF_STRINGS[loadReefLang()];
      if (saved) {
        setPendingSave(null);
        setLastRunLbNote(s.noteStatsSaved);
        setStatsVersion((v) => v + 1);
      } else {
        setPendingSave(payload);
        setLastRunLbNote(authed ? s.noteStatsFailed : s.noteSignToSave);
      }
    },
    [connection.address, signLoginMessage],
  );

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
        setLastRunLbNote(REEF_STRINGS[loadReefLang()].noteLbUnavailable);
        return;
      }

      const runHud = finalHud ?? runStatsHud;
      // Jackpot launch (locked decision 2026-08-02): free runs award NO leaderboard
      // points — only profile run stats are kept. Jackpot runs pay out on-chain instead.
      void saveRunStats({
        characterId: selectedCharacterId,
        survivalSec,
        coinsCollected: runHud?.coins ?? 0,
        cheeseCollected: runHud?.cheeseCollected ?? 0,
        peptidesCollected: runHud?.peptidesCollected ?? 0,
        trashCollected: runHud?.trash ?? 0,
        trashByKind: runHud?.trashByKind,
      });
    },
    [connection.connected, connection.address, runStatsHud, selectedCharacterId, saveRunStats],
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

  /** Sponsor flow: approve (if needed) + fundPot(amount) — grows the pot, no entry. */
  const sponsorPot = useCallback(async () => {
    if (jackpotBusy) return;
    setJackpotNote(null);
    let amount: bigint;
    try {
      amount = parseUnits(sponsorAmount.trim() as `${number}`, 18);
    } catch {
      setJackpotNote(REEF_STRINGS[loadReefLang()].noteSponsorInvalid);
      return;
    }
    if (amount <= 0n) {
      setJackpotNote(REEF_STRINGS[loadReefLang()].noteSponsorInvalid);
      return;
    }
    try {
      setJackpotBusy(REEF_STRINGS[loadReefLang()].busyConfirmWallet);
      await jackpot.fundPot(amount);
      setJackpotBusy(null);
      setSponsorAmount('');
      setJackpotNote(
        REEF_STRINGS[loadReefLang()].noteSponsorThanks.replace(
          '{amount}',
          `${sponsorAmount.trim()} ${entryTokenLabel(jackpot.chainId)}`,
        ),
      );
    } catch (e) {
      setJackpotBusy(null);
      const msg = e instanceof Error ? e.message : String(e);
      setJackpotNote(msg.length > 160 ? `${msg.slice(0, 160)}…` : msg);
    }
  }, [jackpot, jackpotBusy, sponsorAmount]);

  /**
   * Open a bar nobody has beaten in 7 days. Permissionless on-chain, so the reef's own
   * divers can open it from here instead of the chest quietly going to a chain-watcher.
   */
  const openStaleBar = useCallback(async () => {
    if (jackpotBusy) return;
    setJackpotNote(null);
    try {
      setJackpotBusy(REEF_STRINGS[loadReefLang()].jpBarStaleBusy);
      await jackpot.resetStaleBar();
      setJackpotBusy(null);
      setJackpotNote(REEF_STRINGS[loadReefLang()].jpBarStaleDone);
    } catch (e) {
      setJackpotBusy(null);
      const msg = e instanceof Error ? e.message : String(e);
      setJackpotNote(msg.length > 160 ? `${msg.slice(0, 160)}…` : msg);
    }
  }, [jackpot, jackpotBusy]);

  /** Validator verdict for the last run — the jackpot block carries the submitScore() sig. */
  const onRunVerdict = useCallback((verdict: Record<string, unknown>) => {
    const j = verdict.jackpot as (ReefJackpotVerdict & { alreadySigned?: boolean }) | undefined;
    if (!j) return;
    if (j.alreadySigned) {
      setJackpotNote(REEF_STRINGS[loadReefLang()].noteAlreadySigned);
      return;
    }
    if (typeof j.signature === 'string') {
      setJackpotVerdict(j);
      setJackpotNote(null);
      // NOTE: jackpotEntry is deliberately KEPT — its enteredAt drives the submit
      // countdown (contract TTL spans pay→dive→submit; learned the hard way 2026-08-08).
    }
  }, []);

  /** Pay the entry (approve if needed), then dive immediately on the assigned seed. */
  const enterJackpotAndDive = useCallback(async () => {
    if (jackpotBusy) return;
    setJackpotNote(null);
    setJackpotVerdict(null);
    try {
      setJackpotBusy(REEF_STRINGS[loadReefLang()].busyConfirmWallet);
      const entry = await jackpot.enterJackpot();
      setJackpotEntry({ ...entry, enteredAt: Math.floor(Date.now() / 1000) });
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

  /**
   * Adopt a paid-but-unused entry straight from CONTRACT STATE. Rescues entries
   * orphaned by reloads or flaky enter receipts (observed live 2026-08-08: entry
   * landed on-chain, receipt had no logs, UI threw and the paid seed was lost).
   * Freshness window = the contract's live entryTtlSec minus 60s (owner raised the
   * TTL to 30 min on 2026-08-27 via setEntryTtl; no client constant to keep in sync)
   * so we never offer a dive that can't be submitted in time.
   */
  useEffect(() => {
    const pending = jackpot.pendingEntry;
    if (!pending || jackpotEntry) return;
    if (jackpotVerdict) {
      // Reload with a saved verdict: re-attach the matching entry purely for its
      // enteredAt (the TTL countdown) — never adopt a different entry over a verdict.
      if (jackpotVerdict.entryNonce !== pending.nonce) return;
      setJackpotEntry({ nonce: pending.nonce, seed: pending.seed, enteredAt: pending.enteredAt });
      return;
    }
    // Leave at least 60s of TTL — adopting a nearly-dead entry offers a dive
    // whose score could never be submitted in time.
    if (Date.now() / 1000 - pending.enteredAt > jackpot.entryTtlSec - 60) return;
    setJackpotEntry({ nonce: pending.nonce, seed: pending.seed, enteredAt: pending.enteredAt });
    setJackpotNote(REEF_STRINGS[loadReefLang()].noteFoundEntry);
  }, [jackpot.pendingEntry, jackpot.entryTtlSec, jackpotEntry, jackpotVerdict]);

  /** Submit the validator-signed score on-chain (win → instant payout). */
  const submitJackpotScore = useCallback(async () => {
    if (!jackpotVerdict || jackpotBusy) return;
    try {
      setJackpotBusy(REEF_STRINGS[loadReefLang()].busySubmitting);
      const { won, payout } = await jackpot.submitJackpotScore(jackpotVerdict);
      setJackpotBusy(null);
      setJackpotVerdict(null);
      setJackpotEntry(null);
      const s = REEF_STRINGS[loadReefLang()];
      if (won && payout !== null) {
        setJackpotNote(
          s.noteWon
            .replace('{time}', formatSurvivalMs(jackpotVerdict.survivalMs))
            .replace('{amount}', `${formatTokenAmount(payout)} ${entryTokenLabel(jackpot.chainId)}`),
        );
      } else {
        setJackpotNote(s.noteBarHolds.replace('{time}', formatSurvivalMs(jackpotVerdict.survivalMs)));
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
    <div className={`ra-root${ENABLE_DIVE_CONSOLE ? ' ra-dc' : ''}`} role="application" aria-label="Reef Run arcade menu">
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
      {/* Dive-console: living pixel static (RemiliaNET technique — per-frame re-rolled
          ordered noise, pure CSS, no asset). Rides ABOVE the grade layers so the whole
          scene shimmers; see .ra-livegrain in reefArcadeMenu.css. */}
      {ENABLE_DIVE_CONSOLE && <div className="ra-livegrain" aria-hidden />}
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
            <p className="ra-intro-eyebrow">MADE WITH LAWB</p>
            <h1 className="ra-intro-title-gif-wrap">
              <img
                className="ra-intro-title-gif"
                src="/arcade-assets/reefrun-title.gif"
                alt="REEF RUN"
                width={533}
                height={93}
              />
            </h1>
            <p className="ra-intro-sub">{t.introTagline}</p>
            <p className="ra-intro-hint">{t.pressAny}</p>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'menu' && (
          <div className="ra-menu rw-menu">
            <div className="rw-device">
              <span className="rw-screw rw-screw-tl" aria-hidden /><span className="rw-screw rw-screw-tr" aria-hidden />
              <span className="rw-screw rw-screw-bl" aria-hidden /><span className="rw-screw rw-screw-br" aria-hidden />

              <div className="rw-brand-row">
                <div className="rw-wordmark">REEF<span>RUN</span></div>
                <div className="rw-model-no">LAWB INSTRUMENTS<br />RR-2K5 · 200m</div>
              </div>

              <div className="rw-screen">
                <div className="rw-comps">
                  <button
                    type="button"
                    className={`rw-comp${connection.connected ? ' rw-comp-on' : ''}`}
                    onClick={() => { uiClick(); setModal('wallet'); }}
                    aria-label={connection.connected ? 'Wallet connected' : 'Connect wallet'}
                  >
                    <span className="rw-comp-ico" aria-hidden>◈</span>
                    <span>
                      <b>{t.wallet}</b>
                      <span>
                        {connection.connected
                          ? connection.ens ?? (connection.address ? shortenAddress(connection.address) : 'Connected')
                          : t.notConnected}
                      </span>
                    </span>
                  </button>
                  {jackpot.enabled && (
                    <button
                      type="button"
                      className="rw-comp"
                      onClick={() => { uiClick(); setModal('jackpot'); }}
                    >
                      <span className="rw-comp-ico" aria-hidden>⚓</span>
                      <span>
                        <b>{t.jpTreasureName}</b>
                        <span>
                          {jackpot.board
                            ? `${formatTokenAmount(jackpot.board.pot)} ${entryTokenLabel(jackpot.chainId)}`
                            : '…'}
                        </span>
                      </span>
                    </button>
                  )}
                  <button type="button" className="rw-comp" onClick={toggleSfx}>
                    <span className="rw-comp-ico" aria-hidden>{sfxMuted ? '🔇' : '🔊'}</span>
                    <span><b>{t.sound}</b><span>{sfxMuted ? t.soundOff : t.soundOn} · M</span></span>
                  </button>
                  <button type="button" className="rw-comp" onClick={toggleLang} aria-label="Switch language">
                    <span className="rw-comp-ico" aria-hidden>文</span>
                    <span><b>{lang === 'en' ? '中文' : 'EN'}</b></span>
                  </button>
                  <button
                    type="button"
                    className="rw-comp"
                    onClick={() => { uiClick(); navigate('/'); }}
                    aria-label="Exit to lawb.xyz desktop"
                  >
                    <span className="rw-comp-ico" aria-hidden>⏏</span>
                    <span><b>EXIT</b><span>lawb.xyz</span></span>
                  </button>
                  <div className="rw-clock">
                    {surfaceTime}
                    <small>{t.deviceSurfaceTime}</small>
                  </div>
                </div>

                <div className="rw-instruments">
                  <div className="rw-gauges">
                    <div className="rw-gauge">
                      <div className="rw-gauge-lab">{t.deviceBestDive}</div>
                      <div className="rw-seg">
                        {verifiedBest
                          ? <>{verifiedBest.best_survival_sec.toFixed(1)}<small>s ✓</small></>
                          : reefStats
                            ? <>{Math.floor(reefStats.longest_run_seconds)}<small>s</small></>
                            : <>—</>}
                      </div>
                    </div>
                    {jackpot.enabled && (
                      <>
                        <div className="rw-gauge">
                          <div className="rw-gauge-lab">{t.deviceSurvivalBar}</div>
                          <div className="rw-seg">
                            {jackpot.board
                              ? jackpot.board.highScoreMs > 0
                                ? <>{(jackpot.board.highScoreMs / 1000).toFixed(1)}<small>s</small></>
                                : <>{t.deviceBarOpen}</>
                              : <>…</>}
                          </div>
                        </div>
                        <div className="rw-gauge">
                          <div className="rw-gauge-lab">{t.devicePot}</div>
                          <div className="rw-seg">
                            {jackpot.board
                              ? <>{formatTokenAmount(jackpot.board.pot)}<small> {entryTokenLabel(jackpot.chainId)}</small></>
                              : <>…</>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rw-center">
                    <button type="button" className="rw-btn rw-btn-go" onClick={beginRun} disabled={!sceneReady}>
                      <span className="rw-key">1</span>{t.startRun}<small>{t.startMeta}</small>
                    </button>
                    <button
                      type="button"
                      className="rw-btn"
                      onClick={() => { if (sceneReady) setGameScreen('select'); }}
                      disabled={!sceneReady}
                    >
                      <span className="rw-key">2</span>{t.swimmer}
                      <small>{CHARACTERS.find((c) => c.id === selectedCharacterId)?.name ?? 'CLAWB'}</small>
                    </button>
                    <button type="button" className="rw-btn" onClick={() => { uiClick(); setModal('wallet'); }}>
                      <span className="rw-key">3</span>{t.wallet}
                      <small>{connection.connected ? t.walletManage : t.walletConnect}</small>
                    </button>
                    <button type="button" className="rw-btn" onClick={() => { uiClick(); setModal('difficulty'); }}>
                      <span className="rw-key">4</span>{t.depth}<small>{t.depthMeta}</small>
                    </button>
                    <button type="button" className="rw-btn" onClick={() => { uiClick(); setModal('howto'); }}>
                      <span className="rw-key">5</span>{t.howTo}<small>{t.howToMeta}</small>
                    </button>
                    {jackpot.enabled && (
                      <button
                        type="button"
                        className="rw-btn rw-btn-pink"
                        onClick={() => { uiClick(); setModal('jackpot'); }}
                        disabled={!sceneReady}
                      >
                        <span className="rw-key" aria-hidden>⚓</span>{t.jpTreasureName}
                        <small>
                          {jackpot.board
                            ? `${formatTokenAmount(jackpot.board.entryAmount)} ${entryTokenLabel(jackpot.chainId)} · ${t.jpTileMeta}`
                            : t.jpTilePaid}
                        </small>
                      </button>
                    )}
                  </div>

                  <div className="rw-idpane">
                    <h4>{t.deviceDiver} <span className="rw-zh">· 潜水士証</span></h4>
                    <div className="rw-idcard">
                      <div className="rw-idcard-t">LAWB 珊瑚礁 潜水士</div>
                      <div className="rw-idcard-main">
                        <img
                          className="rw-pfp"
                          src={pfpUrl ?? '/images/sticker4.png'}
                          alt=""
                          onError={(e) => {
                            // Sitewide default pfp convention (PlayerProfile/ChessChat).
                            e.currentTarget.src = '/images/sticker4.png';
                          }}
                        />
                        <div className="rw-idf">
                          <div className="rw-idf-v">
                            {connection.connected
                              ? connection.ens ?? (connection.address ? shortenAddress(connection.address) : '')
                              : t.notConnected}
                          </div>
                          <div>
                            {t.deviceLongestDive}:{' '}
                            {reefStats ? `${Math.floor(reefStats.longest_run_seconds)}s` : '—'}
                          </div>
                          <div>
                            {t.deviceRuns}:{' '}
                            {reefStats
                              ? Object.values(reefStats.character_runs || {}).reduce((a, b) => a + b, 0)
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="rw-idcard-foot">
                        <span>Lawb Inc. 2023</span>
                        <span className="rw-stamp">PROOF OF LAWB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rw-drawer">
                  <div className="rw-drawer-head">
                    {t.deviceSatchel} <span className="rw-zh">· 潜水背包</span>
                    <span className="rw-drawer-hint">{t.deviceSatchelHint}</span>
                  </div>
                  {(() => {
                    /** DEV-only (`?satcheldemo`): fake stats so the dive log is inspectable
                     *  without a wallet/Firebase. The flag is compiled out of prod builds. */
                    const demoStats: ReefRunProfileStats | null =
                      import.meta.env.DEV && window.location.search.includes('satcheldemo')
                        ? {
                            cheese_collected: 7, peptides_collected: 12, coins_collected: 88,
                            trash_collected: 41, best_trash_run: 15, longest_run_seconds: 96,
                            character_runs: { clawb: 4 }, favored_character: 'clawb',
                            trash_by_kind: { trash1: 6, cube: 11, cigpack: 5, vape: 9, bag: 7, crt: 3 },
                          }
                        : null;
                    const stats = demoStats ?? reefStats;
                    if ((!connection.connected && !demoStats) || !stats) {
                      return (
                        <div className="rw-satchel">
                          <p className="rw-satchel-note">
                            {connection.connected ? t.deviceSatchelEmpty : t.deviceSatchelConnect}
                          </p>
                        </div>
                      );
                    }
                    const reefStatsView = stats;
                    const names = SATCHEL_ITEM_NAMES[lang];
                    const byKind = reefStatsView.trash_by_kind ?? {};
                    const supplies: { key: string; latin?: string; strip: string; count: number }[] = [
                      { key: 'trash', strip: '/assets/satchel/strip_trash.webp', count: reefStatsView.trash_collected ?? 0 },
                      { key: 'coin', strip: '/assets/satchel/strip_coin.webp', count: reefStatsView.coins_collected },
                      { key: 'cheese', strip: '/assets/satchel/strip_cheese.webp', count: reefStatsView.cheese_collected },
                      { key: 'peptides', strip: '/assets/satchel/strip_peptides.webp', count: reefStatsView.peptides_collected },
                    ];
                    const specimens = TRASH_VARIANTS.map((v) => ({
                      key: v.id,
                      latin: v.latin,
                      strip: `/assets/satchel/strip_trash_${v.id}.webp`,
                      count: byKind[v.id] ?? 0,
                    }));
                    const focused =
                      [...supplies, ...specimens].find((e) => e.key === logFocus && e.count > 0) ?? null;
                    const slot = (e: { key: string; strip: string; count: number }) => (
                      <button
                        key={e.key}
                        type="button"
                        className={`rw-slot rw-slot-btn${logFocus === e.key ? ' rw-slot-focus' : ''}`}
                        onClick={() => { uiClick(); setLogFocus(e.key); }}
                        onMouseEnter={() => setLogFocus(e.key)}
                        aria-label={names[e.key] ?? e.key}
                      >
                        <span className="rw-sprite" style={{ backgroundImage: `url(${e.strip})` }} role="img" aria-hidden />
                        <span>{e.count}</span>
                      </button>
                    );
                    return (
                      <>
                        <div className="rw-satchel">{supplies.map(slot)}</div>
                        <div className="rw-log-sub">
                          {t.satchelJunkLog}
                          {lang === 'en' && <span className="rw-zh">· 垃圾图鉴</span>}
                          <span className="rw-drawer-hint">
                            {touchUiEnabled ? t.satchelLogHintTouch : t.satchelLogHint}
                          </span>
                        </div>
                        <div className="rw-satchel rw-junklog">
                          {specimens.map((e) =>
                            e.count > 0 ? (
                              slot(e)
                            ) : (
                              <div key={e.key} className="rw-slot rw-slot-locked" title={t.satchelUndiscovered}>
                                <span>?</span>
                              </div>
                            ),
                          )}
                        </div>
                        {focused && (
                          <div className="rw-lognote" aria-live="polite">
                            <span
                              className="rw-sprite rw-sprite-lg"
                              style={{ backgroundImage: `url(${focused.strip})` }}
                              role="img"
                              aria-label={names[focused.key] ?? focused.key}
                            />
                            <div className="rw-lognote-text">
                              <b>{names[focused.key] ?? focused.key}</b>
                              {focused.latin ? <i>{focused.latin}</i> : null}
                              <span>
                                ×{focused.count} {t.satchelHauled}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {ENABLE_DIVE_CONSOLE && <TidesRail lang={lang} />}
              </div>
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
                  {t.back}
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
            <div className="ra-gameover-panel ra-report-panel">
              <h2 className="ra-gameover-title">{t.gameOver}</h2>
              <p className="ra-gameover-sub">
                {lastRunEndReason ? runEndSummary(lastRunEndReason, t) : t.swimAgain}
              </p>
              {runHud && (
                <ReefScoreCard
                  t={t}
                  lang={lang}
                  data={{
                    characterId: selectedCharacterId,
                    characterLabel:
                      CHARACTERS.find((c) => c.id === selectedCharacterId)?.name ??
                      selectedCharacterId.toUpperCase(),
                    survivalSec: runHud.survivalSec,
                    roman: runHud.roman,
                    hud: runStatsHud,
                    pfp: pfpUrl,
                    treasure: Boolean(jackpot.enabled && jackpotVerdict),
                    verifiedMs: jackpotVerdict?.survivalMs,
                    diver: connection.connected
                      ? connection.ens ??
                        (connection.address ? shortenAddress(connection.address) : null)
                      : null,
                  }}
                />
              )}
              {lastRunLbNote && (
                <p className="ra-gameover-lb-note" style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>
                  {lastRunLbNote}
                  {pendingSave && (
                    <button
                      type="button"
                      className="ra-link-quiet"
                      style={{ marginLeft: 10 }}
                      onClick={() => { uiClick(); void saveRunStats(pendingSave); }}
                    >
                      {t.saveHaul}
                    </button>
                  )}
                </p>
              )}
              {jackpot.enabled && jackpotVerdict && (
                <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>
                  {t.goVerified} <strong>{formatSurvivalMs(jackpotVerdict.survivalMs)}</strong>
                  {jackpot.board && jackpot.board.highScoreMs > 0 && (
                    <> · {t.goVerifiedBar} {formatSurvivalMs(jackpot.board.highScoreMs)}</>
                  )}
                </p>
              )}
              {jackpot.enabled && jackpotNote && !jackpotVerdict && (
                <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45 }}>{jackpotNote}</p>
              )}
              {jackpot.enabled && jackpotVerdict && jackpotSecLeft !== null && !jackpotExpired && (
                <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 700, color: jackpotSecLeft < 60 ? '#ff5566' : undefined }} aria-live="polite">
                  {tSlots(t.goSubmitWithin, { time: fmtSecLeft(jackpotSecLeft) })}
                </p>
              )}
              {jackpot.enabled && jackpotVerdict && jackpotExpired && (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: '#ff5566' }}>
                  {t.goExpired}
                </p>
              )}
              <div className="ra-gameover-actions">
                {jackpot.enabled && jackpotVerdict && !jackpotExpired && (
                  <button type="button" className="ra-btn" onClick={submitJackpotScore} disabled={Boolean(jackpotBusy)}>
                    {jackpotBusy ?? t.goSubmitTreasure}
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
          <div className="ra-panel rw-console-page" onClick={(e) => e.stopPropagation()}>
            {modal === 'difficulty' && (
              <>
                <h2>{t.depthModalTitle}</h2>
                <p>{t.depthModalP1}</p>
                <p>{t.depthModalP2}</p>
              </>
            )}

            {modal === 'wallet' && (
              <>
                <h2>{t.walletModalTitle}</h2>
                <p>
                  {tSlots(t.walletModalBody, {
                    pts: <strong>{WALLET_CONNECT_LEADERBOARD_BONUS}</strong>,
                  })}
                </p>
                {connection.connected && connection.address ? (
                  <p className="ra-wallet-status">{t.walletConnectedPrefix} {shortenAddress(connection.address)}</p>
                ) : (
                  <p className="ra-wallet-status" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {t.walletStatusNot}
                  </p>
                )}
                <div className="ra-panel-actions">
                  <button type="button" className="ra-btn" onClick={goConnect}>
                    {connection.connected ? t.manageWallet : t.connectBtn}
                  </button>
                  <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setModal(null); }}>
                    {t.back}
                  </button>
                </div>
              </>
            )}

            {modal === 'jackpot' && (
              <>
                <h2>{t.howtoJackpot}</h2>
                {!jackpot.contract ? (
                  <p>{t.jpNotDeployed}</p>
                ) : (
                  <>
                    <p>
                      {tSlots(t.jpIntro, {
                        amount: (
                          <strong>
                            {jackpot.board ? formatTokenAmount(jackpot.board.entryAmount) : '…'}{' '}
                            {entryTokenLabel(jackpot.chainId)}
                          </strong>
                        ),
                        challenge:
                          jackpot.board &&
                          jackpot.board.champion !== '0x0000000000000000000000000000000000000000' ? (
                            <>{tSlots(t.jpOutswim, { champ: <strong>{shortenAddress(jackpot.board.champion)}</strong> })}</>
                          ) : (
                            <strong>{t.jpSetBar}</strong>
                          ),
                        fallShort: <strong>{t.jpFallShort}</strong>,
                        share: jackpot.board ? Math.round(jackpot.board.championShareBps / 100) : 50,
                      })}
                    </p>
                    <p>
                      {tSlots(t.jpRules, {
                        faq: (
                          <a
                            href="/?tokens=faq"
                            onClick={(e) => { e.preventDefault(); uiClick(); navigate('/?tokens=faq'); }}
                            style={{ color: 'inherit', textDecoration: 'underline' }}
                          >
                            {t.jpFaqWord}
                          </a>
                        ),
                      })}
                    </p>
                    <p className="ra-wallet-status">
                      {t.devicePot}:{' '}
                      <strong>
                        {jackpot.board ? formatTokenAmount(jackpot.board.pot) : '…'}{' '}
                        {entryTokenLabel(jackpot.chainId)}
                      </strong>
                      {' · '}{t.jpBar}:{' '}
                      <strong>
                        {jackpot.board
                          ? jackpot.board.highScoreMs > 0
                            ? formatSurvivalMs(jackpot.board.highScoreMs)
                            : t.jpBarOpen
                          : '…'}
                      </strong>
                      {jackpot.board && jackpot.board.champion !== '0x0000000000000000000000000000000000000000' && (
                        <> {' · '}{t.jpChampion}: <strong>{shortenAddress(jackpot.board.champion)}</strong></>
                      )}
                    </p>
                    {!connection.connected && (
                      <p className="ra-wallet-status" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {t.jpConnectToEnter}
                      </p>
                    )}
                    {jackpotVerdict && (
                      <p className="ra-wallet-status">
                        {t.jpUnsubmitted} <strong>{formatSurvivalMs(jackpotVerdict.survivalMs)}</strong>
                      </p>
                    )}
                    {jackpotEntry && !jackpotVerdict && !jackpotExpired && jackpotSecLeft !== null && (
                      <p className="ra-wallet-status">
                        {tSlots(t.jpCountdownLine, {
                          time: (
                            <strong style={jackpotSecLeft < 60 ? { color: '#ff5566' } : undefined}>
                              {fmtSecLeft(jackpotSecLeft)}
                            </strong>
                          ),
                        })}
                      </p>
                    )}
                    {(jackpotEntry || jackpotVerdict) && jackpotExpired && (
                      <p className="ra-wallet-status" style={{ color: '#ff5566' }}>
                        {jackpotVerdict ? t.jpExpiredScore : t.jpExpiredUnused}
                        {t.jpExpiredTail}
                      </p>
                    )}
                    {jackpot.barIsStale && (
                      <p className="ra-wallet-status" style={{ color: '#ffcc55' }}>
                        {t.jpBarStale}
                      </p>
                    )}
                    {jackpotNote && <p style={{ fontSize: 13, lineHeight: 1.45 }}>{jackpotNote}</p>}
                    {connection.connected && (
                      <div className="ra-sponsor-row">
                        <input
                          className="ra-sponsor-input"
                          type="text"
                          inputMode="decimal"
                          placeholder={t.jpSponsorAmount.replace('{token}', entryTokenLabel(jackpot.chainId))}
                          value={sponsorAmount}
                          onChange={(e) => setSponsorAmount(e.target.value)}
                          aria-label="Sponsor amount"
                          disabled={Boolean(jackpotBusy)}
                        />
                        <button
                          type="button"
                          className="ra-btn ra-btn-secondary ra-sponsor-btn"
                          onClick={sponsorPot}
                          disabled={Boolean(jackpotBusy) || !sponsorAmount.trim() || !jackpot.board}
                        >
                          {t.jpSponsorBtn}
                        </button>
                      </div>
                    )}
                    <div className="ra-panel-actions">
                      {jackpot.barIsStale && connection.connected && !jackpotEntry && !jackpotVerdict ? (
                        <button
                          type="button"
                          className="ra-btn"
                          onClick={openStaleBar}
                          disabled={Boolean(jackpotBusy)}
                        >
                          {jackpotBusy ?? t.jpBarStaleBtn}
                        </button>
                      ) : jackpotVerdict && !jackpotExpired ? (
                        <button type="button" className="ra-btn" onClick={submitJackpotScore} disabled={Boolean(jackpotBusy)}>
                          {jackpotBusy ?? `${t.jpSubmitBtn}${jackpotSecLeft !== null ? ` · ${fmtSecLeft(jackpotSecLeft)}` : ''}`}
                        </button>
                      ) : jackpotEntry && !jackpotExpired ? (
                        <button type="button" className="ra-btn" onClick={diveWithPaidEntry} disabled={!sceneReady}>
                          {t.jpDivePaid}
                        </button>
                      ) : connection.connected ? (
                        <button
                          type="button"
                          className="ra-btn"
                          onClick={enterJackpotAndDive}
                          disabled={Boolean(jackpotBusy) || !sceneReady || !jackpot.board}
                        >
                          {jackpotBusy ?? t.jpPayDive}
                        </button>
                      ) : (
                        <button type="button" className="ra-btn" onClick={goConnect}>
                          {t.connectBtn}
                        </button>
                      )}
                      <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { uiClick(); setModal(null); }}>
                        {t.back}
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
                  {jackpot.enabled && (
                    <div className="ra-howto-card">
                      <p className="ra-howto-card-title">{t.howtoJackpot}</p>
                      <p>{t.howtoJackpotBody}</p>
                    </div>
                  )}
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
