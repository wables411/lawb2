import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
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
import type { ArcadeGameScreen } from './arcade/ArcadeSceneController';
import './reefArcadeMenu.css';

const LazyArcadeThree = lazy(async () => {
  const m = await import('./ArcadeThreeBackground');
  return { default: m.ArcadeThreeBackground };
});

type Phase = 'intro' | 'menu';
type ModalKind = 'difficulty' | 'wallet' | null;

const CHARACTERS: { id: ArcadeCharacterId; name: string; color: string }[] = [
  { id: 'clawb', name: 'CLAWB', color: '#ff6b35' },
  { id: 'radbro', name: 'RADBRO', color: '#e8a0bf' },
  { id: 'milady', name: 'MILADY', color: '#9eddcf' },
];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function runEndSummary(reason: RunEndReason): string {
  switch (reason) {
    case 'oxygen':
      return 'Ran out of oxygen — stay on Milady/Radbro’s timed O₂ tanks. Clawb does not run out of breath underwater.';
    case 'crush':
      return 'Coral block collision — change lanes with A/D.';
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
  const [phase, setPhase] = useState<Phase>('intro');
  const [modal, setModal] = useState<ModalKind>(null);
  const [gameScreen, setGameScreen] = useState<ArcadeGameScreen>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<ArcadeCharacterId>('clawb');
  const [runHud, setRunHud] = useState<ReefRunHudPayload | null>(null);
  const [runStatsHud, setRunStatsHud] = useState<ArcadeRunHudState | null>(null);
  const [lastRunEndReason, setLastRunEndReason] = useState<RunEndReason | null>(null);
  /** Leaderboard note after last run (points saved, or hint if no wallet). */
  const [lastRunLbNote, setLastRunLbNote] = useState<string | null>(null);

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
        setGameScreen('menu');
        setRunHud(null);
        setRunStatsHud(null);
        setLastRunEndReason(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, gameScreen, skipIntro]);

  const onPickCharacter = useCallback((id: ArcadeCharacterId) => {
    setSelectedCharacterId(id);
  }, []);

  const onRunHud = useCallback((hud: ArcadeRunHudState) => {
    setRunStatsHud(hud);
  }, []);

  const onGameOver = useCallback(
    (survivalSec: number, reason: RunEndReason) => {
      setRunHud(reefRunHudFromSurvivalSec(survivalSec));
      setLastRunEndReason(reason);
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
      // Single leaderboard sync per run (see reefRunLeaderboardPoints.ts) — avoids Firebase write spam.
      void (async () => {
        const primary = await firebaseProfiles.getPrimaryWallet(connection.address!);
        const key = normalizeLeaderboardPathKey(primary);
        if (!key) {
          setLastRunLbNote('Could not record points for this wallet address.');
          return;
        }
        const ok = await addEcosystemPoints(key, 'games', pts);
        if (ok) {
          setLastRunLbNote(`+${pts} leaderboard pts (Reef Run → Games). Synced to Firebase.`);
        } else {
          setLastRunLbNote('Could not save leaderboard points. Check connection and try again.');
        }
      })();
    },
    [connection.connected, connection.address],
  );

  const onRunDifficulty = useCallback((payload: ReefRunHudPayload) => {
    setRunHud(payload);
  }, []);

  useEffect(() => {
    if (gameScreen === 'menu' || gameScreen === 'select') {
      setRunHud(null);
    }
  }, [gameScreen]);

  const goConnect = () => {
    void open({ view: connection.connected ? 'Account' : 'Connect' });
  };

  const beginRun = useCallback(() => {
    setLastRunLbNote(null);
    setLastRunEndReason(null);
    setRunStatsHud(null);
    setGameScreen('play');
  }, []);

  return (
    <div className="ra-root" role="application" aria-label="Reef Run arcade menu">
      <Suspense fallback={null}>
        <LazyArcadeThree
          phase={phase}
          gameScreen={gameScreen}
          selectedCharacterId={selectedCharacterId}
          onPickCharacter={onPickCharacter}
          onGameOver={onGameOver}
          onRunDifficulty={onRunDifficulty}
          onRunHud={onRunHud}
        />
      </Suspense>
      <div className="ra-bg" aria-hidden />
      <div className="ra-scanlines" aria-hidden />
      <div className="ra-vignette" aria-hidden />
      <div className="ra-grain" aria-hidden />

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

            <div className="ra-btn-stack">
              <button type="button" className="ra-btn" onClick={beginRun}>
                START RUN
              </button>
              <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setGameScreen('select')}>
                PLAYER SELECT
              </button>
              <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setModal('wallet')}>
                WALLET CONNECT
              </button>
              <button type="button" className="ra-btn ra-btn-secondary" onClick={() => setModal('difficulty')}>
                DEPTH & SPEED
              </button>
            </div>

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
              <p className="ra-select-hint">Click the 3D models or use the buttons — idle preview, dance when selected.</p>
              <div className="ra-stat-block" style={{ marginBottom: 14, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>
                {(() => {
                  const s = CHARACTER_STATS[selectedCharacterId];
                  return (
                    <>
                      <div>{starsRow('Speed', s.speed)}</div>
                      {selectedCharacterId === 'clawb' ? (
                        <div>Breath (O₂) ★★★★★ — unlimited underwater (lobster)</div>
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
                        <div className="ra-play-stat-lobster">∞ lobster</div>
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
                  A/D lanes · W/S speed · dodge coral · grab pickups
                  {runStatsHud?.oxygenInfinite ? ' · armor' : ' · O₂ & armor'}
                </span>
              </p>
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
                  lanes. The reef tube <strong>banks and sways</strong> as you dive deeper.
                </p>
                <p>
                  The longer you survive, the faster the baseline current. Every <strong>45 seconds</strong> you cross a
                  new <strong>depth mark</strong> (Roman numerals). <strong>O₂ tanks</strong> for Milady/Radbro spawn on
                  a schedule (wider gaps at depth) plus random pickups — never zero in the table, but timing gets urgent.
                  Collect cheese for a nitro burst, peptides for armor; jellyfish, puffers, and mines chew armor.
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

            {modal === 'difficulty' && (
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
