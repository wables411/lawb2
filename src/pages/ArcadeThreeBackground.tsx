import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ArcadeCharacterId } from './arcade/arcadeAssetConfig';
import type { ReefRunHudPayload } from './arcade/arcadeDifficulty';
import type { ArcadeRunHudState, RunEndReason } from './arcade/arcadePickupKinds';
import {
  ArcadeSceneController,
  type ArcadeBootProgress,
  type ArcadeGameScreen,
} from './arcade/ArcadeSceneController';

export type ArcadeThreePhase = 'intro' | 'menu';

type Props = {
  phase: ArcadeThreePhase;
  /** Drives camera + interaction; `intro` uses cinematic zoom until user skips. */
  gameScreen: ArcadeGameScreen;
  selectedCharacterId: ArcadeCharacterId;
  onPickCharacter: (id: ArcadeCharacterId) => void;
  onGameOver: (survivalSec: number, reason: RunEndReason, finalHud?: ArcadeRunHudState) => void;
  /** Throttled (~5 Hz + on tier change) while the run clock is active. */
  onRunDifficulty?: (payload: ReefRunHudPayload) => void;
  /** O₂, armor, collectibles, speed (~7 Hz). */
  onRunHud?: (hud: ArcadeRunHudState) => void;
  /** Fired once the Three engine finishes bootstrap (scene + assets ready). */
  onEngineReady?: () => void;
  /** Fires as bootstrap milestones complete so the loading overlay can show % + label. */
  onBootProgress?: (p: ArcadeBootProgress) => void;
  /** Fired when bootstrap throws — engine is unusable and UI should show retry. */
  onBootError?: (err: unknown) => void;
};

export type ArcadePlayInputHandle = {
  nudgeLane: (delta: -1 | 1) => void;
  setVirtualThrottle: (opts: { forward: boolean; backward: boolean }) => void;
  clearVirtualThrottle: () => void;
};

/**
 * WebGL layer: tunnel, FBX characters from `/arcade-assets`, selection (idle/dance), swim gameplay.
 */
export const ArcadeThreeBackground = forwardRef<ArcadePlayInputHandle, Props>(function ArcadeThreeBackground({
  phase,
  gameScreen,
  selectedCharacterId,
  onPickCharacter,
  onGameOver,
  onRunDifficulty,
  onRunHud,
  onEngineReady,
  onBootProgress,
  onBootError,
}: Props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ArcadeSceneController | null>(null);
  const pickRef = useRef(onPickCharacter);
  const overRef = useRef(onGameOver);
  const diffRef = useRef(onRunDifficulty);
  const hudRef = useRef(onRunHud);
  const readyRef = useRef(onEngineReady);
  const bootProgressRef = useRef(onBootProgress);
  const bootErrorRef = useRef(onBootError);
  pickRef.current = onPickCharacter;
  overRef.current = onGameOver;
  diffRef.current = onRunDifficulty;
  hudRef.current = onRunHud;
  readyRef.current = onEngineReady;
  bootProgressRef.current = onBootProgress;
  bootErrorRef.current = onBootError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let disposed = false;

    const engine = new ArcadeSceneController(container, {
      onPickCharacter: (id) => pickRef.current(id),
      onGameOver: (sec, reason, finalHud) => overRef.current(sec, reason, finalHud),
      onRunDifficulty: (p) => diffRef.current?.(p),
      onRunHud: (h) => hudRef.current?.(h),
      onBootProgress: (p) => bootProgressRef.current?.(p),
    });
    engineRef.current = engine;
    void engine
      .bootstrap()
      .then(() => {
        if (!disposed) readyRef.current?.();
      })
      .catch((err) => {
        console.warn('[Arcade] bootstrap failed', err);
        if (!disposed) {
          // Surface the failure so the UI can show a retry button instead of
          // silently clearing the loading overlay with nothing behind it.
          bootErrorRef.current?.(err);
          readyRef.current?.();
        }
      });

    return () => {
      disposed = true;
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const engineScreen: ArcadeGameScreen = phase === 'intro' ? 'intro' : gameScreen;

  /**
   * Always push the React-selected character into the engine *before* changing screen.
   * Otherwise `setScreen('play')` can start async `enterPlay` while `selectedId` is still stale,
   * and `runState` created after `await` can disagree with the swimmer you see (e.g. Clawb mesh + Milady O₂).
   */
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setSelectedId(selectedCharacterId);
    eng.setScreen(engineScreen);
  }, [engineScreen, selectedCharacterId]);

  useImperativeHandle(
    ref,
    () => ({
      nudgeLane: (delta) => {
        engineRef.current?.nudgeLane(delta);
      },
      setVirtualThrottle: (opts) => {
        engineRef.current?.setVirtualThrottle(opts);
      },
      clearVirtualThrottle: () => {
        engineRef.current?.clearVirtualThrottle();
      },
    }),
    [],
  );

  return <div ref={containerRef} className="ra-three" aria-hidden />;
});
