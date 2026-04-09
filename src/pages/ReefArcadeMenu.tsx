import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { WALLET_CONNECT_LEADERBOARD_BONUS } from '../firebaseLeaderboard';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import type { ReefRunHudPayload } from './arcade/arcadeDifficulty';
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

/**
 * Full-screen arcade shell for lawb.xyz — Three.js tunnel, FBX idle/dance/swim, lane dodge.
 */
export default function ReefArcadeMenu() {
  const navigate = useNavigate();
  const { open } = useAppKitSafe();
  const { address, isConnected } = useAccount();
  const [phase, setPhase] = useState<Phase>('intro');
  const [modal, setModal] = useState<ModalKind>(null);
  const [gameScreen, setGameScreen] = useState<ArcadeGameScreen>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<ArcadeCharacterId>('clawb');
  const [runHud, setRunHud] = useState<ReefRunHudPayload | null>(null);

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

  const onPickCharacter = useCallback((id: ArcadeCharacterId) => {
    setSelectedCharacterId(id);
  }, []);

  const onGameOver = useCallback(() => {
    setGameScreen('gameover');
  }, []);

  const onRunDifficulty = useCallback((payload: ReefRunHudPayload) => {
    setRunHud(payload);
  }, []);

  useEffect(() => {
    if (gameScreen === 'menu' || gameScreen === 'select') {
      setRunHud(null);
    }
  }, [gameScreen]);

  const goConnect = () => {
    void open({ view: isConnected ? 'Account' : 'Connect' });
  };

  const startRun = () => {
    setGameScreen('play');
  };

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
              <button type="button" className="ra-btn" onClick={startRun}>
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
                <button type="button" className="ra-btn" onClick={() => setGameScreen('play')}>
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
            <p className="ra-play-hud-title">REEF RUN</p>
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
                  {Math.floor(runHud.secondsElapsedInTier)}s / {runHud.tierDurationSec}s → next mark ·{' '}
                  {runHud.speedMultiplier.toFixed(2)}× swim
                </p>
              </div>
            )}
            <p className="ra-play-hud-keys">← → or A D · dodge the red blocks</p>
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
              <p className="ra-gameover-sub">You hit an obstacle. Swim again?</p>
              <div className="ra-gameover-actions">
                <button type="button" className="ra-btn" onClick={() => setGameScreen('play')}>
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
                  There are no fixed difficulty presets. The longer you survive without a hit, the faster the swim
                  current runs: obstacle drift and your swim animation both scale up together.
                </p>
                <p>
                  Every <strong>45 seconds</strong> you cross a new <strong>depth mark</strong>, shown as Roman
                  numerals (<strong>I</strong>, <strong>II</strong>, <strong>III</strong>, <strong>IV</strong>,{' '}
                  <strong>V</strong> … <strong>X</strong> and beyond). The bar in the HUD is your progress through the
                  current 45-second bracket toward the next mark.
                </p>
              </>
            )}

            {modal === 'wallet' && (
              <>
                <h2>WALLET CONNECT</h2>
                <p>
                  Connect the same wallet you use on lawb.xyz. Your first connection adds{' '}
                  <strong>{WALLET_CONNECT_LEADERBOARD_BONUS} leaderboard points</strong> (same Firebase leaderboard as
                  Chess and profile holdings). Reef Run scores may tie to this address in a future update — play still
                  works offline without a wallet.
                </p>
                {isConnected && address ? (
                  <p className="ra-wallet-status">CONNECTED · {shortenAddress(address)}</p>
                ) : (
                  <p className="ra-wallet-status" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    NOT CONNECTED
                  </p>
                )}
                <div className="ra-panel-actions">
                  <button type="button" className="ra-btn" onClick={goConnect}>
                    {isConnected ? 'MANAGE WALLET' : 'CONNECT'}
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
