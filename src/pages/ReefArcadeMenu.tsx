import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKitSafe } from '../hooks/useAppKitSafe';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
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
  const [selectedCharacterId, setSelectedCharacterId] = useState<ArcadeCharacterId | null>(null);

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

  const goConnect = () => {
    void open({ view: isConnected ? 'Account' : 'Connect' });
  };

  const startRun = () => {
    if (selectedCharacterId) {
      setGameScreen('play');
    } else {
      setGameScreen('select');
    }
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
                DIFFICULTY
                <span className="ra-btn-badge">SOON</span>
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
                <button
                  type="button"
                  className="ra-btn"
                  disabled={!selectedCharacterId}
                  onClick={() => selectedCharacterId && setGameScreen('play')}
                >
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
            <p className="ra-play-hud-keys">← → or A D · dodge the red blocks</p>
          </div>
        )}

        {phase === 'menu' && gameScreen === 'gameover' && (
          <div className="ra-gameover-layer">
            <div className="ra-gameover-panel">
              <h2 className="ra-gameover-title">GAME OVER</h2>
              <p className="ra-gameover-sub">You hit an obstacle. Swim again?</p>
              <div className="ra-gameover-actions">
                <button
                  type="button"
                  className="ra-btn"
                  onClick={() => setGameScreen('play')}
                  disabled={!selectedCharacterId}
                >
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
                <span className="ra-soon-pill">COMING SOON</span>
                <h2>DIFFICULTY</h2>
                <p>
                  Planned: Casual · Reef · Abyss — faster currents, tighter gaps, juicier multipliers. Tuned after the
                  core loop feels right.
                </p>
              </>
            )}

            {modal === 'wallet' && (
              <>
                <h2>WALLET CONNECT</h2>
                <p>
                  Connect the same wallet you use on lawb.xyz. When leaderboards go live, signed runs will tie to this
                  address — play offline still works without it.
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
