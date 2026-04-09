import { useEffect, useRef } from 'react';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import { ArcadeSceneController, type ArcadeGameScreen } from './arcade/ArcadeSceneController';

export type ArcadeThreePhase = 'intro' | 'menu';

type Props = {
  phase: ArcadeThreePhase;
  /** Drives camera + interaction; `intro` uses cinematic zoom until user skips. */
  gameScreen: ArcadeGameScreen;
  selectedCharacterId: ArcadeCharacterId;
  onPickCharacter: (id: ArcadeCharacterId) => void;
  onGameOver: () => void;
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ArcadeSceneController | null>(null);
  const pickRef = useRef(onPickCharacter);
  const overRef = useRef(onGameOver);
  pickRef.current = onPickCharacter;
  overRef.current = onGameOver;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const engine = new ArcadeSceneController(container, {
      onPickCharacter: (id) => pickRef.current(id),
      onGameOver: () => overRef.current(),
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
