import { useEffect, useRef } from 'react';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import type { ReefRunHudPayload } from './arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from './arcade/arcadePickupKinds';
import { ArcadeSceneController, type ArcadeGameScreen } from './arcade/ArcadeSceneController';

export type ArcadeThreePhase = 'intro' | 'menu';

type Props = {
  phase: ArcadeThreePhase;
  /** Drives camera + interaction; `intro` uses cinematic zoom until user skips. */
  gameScreen: ArcadeGameScreen;
  selectedCharacterId: ArcadeCharacterId;
  onPickCharacter: (id: ArcadeCharacterId) => void;
  onGameOver: (survivalSec: number, reason: RunEndReason) => void;
  /** Throttled (~5 Hz + on tier change) while the run clock is active. */
  onRunDifficulty?: (payload: ReefRunHudPayload) => void;
  /** O₂, armor, collectibles, speed (~7 Hz). */
  onRunHud?: (hud: ArcadeRunHudState) => void;
};

/**
 * WebGL layer: tunnel, FBX characters from `/arcade-assets`, selection (idle/dance), swim gameplay.
 */
export function ArcadeThreeBackground({
  phase,
  gameScreen,
  selectedCharacterId,
  onPickCharacter,
  onGameOver,
  onRunDifficulty,
  onRunHud,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ArcadeSceneController | null>(null);
  const pickRef = useRef(onPickCharacter);
  const overRef = useRef(onGameOver);
  const diffRef = useRef(onRunDifficulty);
  const hudRef = useRef(onRunHud);
  pickRef.current = onPickCharacter;
  overRef.current = onGameOver;
  diffRef.current = onRunDifficulty;
  hudRef.current = onRunHud;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const engine = new ArcadeSceneController(container, {
      onPickCharacter: (id) => pickRef.current(id),
      onGameOver: (sec, reason) => overRef.current(sec, reason),
      onRunDifficulty: (p) => diffRef.current?.(p),
      onRunHud: (h) => hudRef.current?.(h),
    });
    engineRef.current = engine;
    void engine.bootstrap();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const engineScreen: ArcadeGameScreen = phase === 'intro' ? 'intro' : gameScreen;

  useEffect(() => {
    engineRef.current?.setScreen(engineScreen);
  }, [engineScreen]);

  useEffect(() => {
    engineRef.current?.setSelectedId(selectedCharacterId);
  }, [selectedCharacterId]);

  return <div ref={containerRef} className="ra-three" aria-hidden />;
}
