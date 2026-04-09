import { useEffect, useRef } from 'react';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import type { ReefRunHudPayload } from './arcade/arcadeDifficulty';
import { ArcadeSceneController, type ArcadeGameScreen } from './arcade/ArcadeSceneController';

export type ArcadeThreePhase = 'intro' | 'menu';

type Props = {
  phase: ArcadeThreePhase;
  /** Drives camera + interaction; `intro` uses cinematic zoom until user skips. */
  gameScreen: ArcadeGameScreen;
  selectedCharacterId: ArcadeCharacterId;
  onPickCharacter: (id: ArcadeCharacterId) => void;
  onGameOver: () => void;
  /** Throttled (~5 Hz + on tier change) while the run clock is active. */
  onRunDifficulty?: (payload: ReefRunHudPayload) => void;
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ArcadeSceneController | null>(null);
  const pickRef = useRef(onPickCharacter);
  const overRef = useRef(onGameOver);
  const diffRef = useRef(onRunDifficulty);
  pickRef.current = onPickCharacter;
  overRef.current = onGameOver;
  diffRef.current = onRunDifficulty;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const engine = new ArcadeSceneController(container, {
      onPickCharacter: (id) => pickRef.current(id),
      onGameOver: () => overRef.current(),
      onRunDifficulty: (p) => diffRef.current?.(p),
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
