import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const NAVBAR_HEIGHT = 36;
const BUBBLE_ZONE_HEIGHT = 80;
const CANVAS_HEIGHT = 180;
const CONTAINER_HEIGHT = BUBBLE_ZONE_HEIGHT + CANVAS_HEIGHT;
const BUBBLE_TOP_OFFSET = 12;
const BUBBLE_MAX_WIDTH = 320;
const ROTATE_SENSITIVITY = 0.005;
const DRAG_THRESHOLD = 5;
const TYPING_SPEED_MS = 45;
const WALK_SPEED = 4;
const FACE_CAMERA = 0;
const FACE_LEFT = -Math.PI / 2;
const FACE_RIGHT = Math.PI / 2;
const MODEL_SCALE = 11;
const WALK_PADDING = 4;
const MODEL_POSITION_OFFSET = -1.5;  // Shift model left toward center (negative = left)
const CAMERA_HALF_HEIGHT = 4;

// Exact sequence: initial lawbidle, then clicks cycle through 1-9, wrapping to 1 after 9
const ANIMATION_SEQUENCE = [
  '/assets/lawbidle.fbx',      // 0 - initial load
  '/assets/lawbdance1.fbx',    // 1
  '/assets/lawbWalk.fbx',      // 2
  '/assets/lawbidle2.fbx',     // 3
  '/assets/lawbdance2.fbx',    // 4
  '/assets/lawbWalk.fbx',      // 5
  '/assets/lawbidle.fbx',      // 6
  '/assets/lawbWalk.fbx',      // 7
  '/assets/lawbdance3.fbx',    // 8
  '/assets/lawbidle2.fbx',     // 9
  '/assets/lawbdeath.fbx',     // 10
] as const;

const WALK_INDICES = new Set([2, 5, 7]);

const getBubbleText = (url: string): string | null => {
  if (url.includes('lawbidle.fbx') && !url.includes('lawbidle2')) {
    return 'Clawb loading, stand by . . . ';
  }
  if (url.includes('lawbdance1')) {
    return 'THERE IS NO MEME WE LAWB YOU';
  }
  if (url.includes('lawbdance3')) {
    return 'Lawbsters seem nice but a human controlled by a lobster will never amount to anything without a roadmap';
  }
  if (url.includes('lawbdeath')) {
    return 'i hate the antichrist';
  }
  return null;
};

export type EmoteAnimationId = 'idle' | 'dance1' | 'dance2' | 'dance3' | 'walk' | 'death';

/** Map emote IDs to animation sequence indices */
const EMOTE_INDEX_MAP: Record<EmoteAnimationId, number> = {
  idle: 0,
  dance1: 1,
  dance2: 4,
  dance3: 8,
  walk: 2,
  death: 10,
};

export interface ClawbHandle {
  cycleAnimation: () => void;
  playEmote: (emoteId: EmoteAnimationId) => void;
}

interface ClawbProps {
  /** Called when Clawb is clicked (non-drag) — receives screen position for emote wheel */
  onClawbClick?: (screenPos: { x: number; y: number }) => void;
}

const Clawb = forwardRef<ClawbHandle, ClawbProps>(({ onClawbClick }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationIndexRef = useRef(0);
  const frameIdRef = useRef<number | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' &&
    (document.body.classList.contains('lawb-app-dark-mode') ||
      document.documentElement.classList.contains('lawb-app-dark-mode'))
  );
  const [bubbleText, setBubbleText] = useState<string | null>('Clawb loading, stand by . . . ');
  const [displayedBubbleText, setDisplayedBubbleText] = useState('');
  const bubbleTextRef = useRef<string | null>('Clawb loading, stand by . . . ');
  const bubbleRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(5);
  const containerWidthRef = useRef(400);

  const setBubbleTextAndRef = useCallback((text: string | null) => {
    setBubbleText(text);
    bubbleTextRef.current = text;
  }, []);

  const isWalkingRef = useRef(false);
  const walkDirectionRef = useRef(1);
  const walkBoundLeftRef = useRef(-5);
  const walkBoundRightRef = useRef(5);
  const walkPositionXRef = useRef(5);  // Our controlled X - overwrites animation root motion
  const walkModelCacheRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);

  const pointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const rotationYRef = useRef(FACE_CAMERA);

  const loadModel = useCallback(async (url: string) => {
    return new Promise<THREE.Group>((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(
        url,
        (object: THREE.Group) => resolve(object),
        undefined,
        (error: unknown) => reject(error)
      );
    });
  }, []);

  const initScene = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth || window.innerWidth;
    const height = CANVAS_HEIGHT;
    const aspect = width / height;

    const scene = new THREE.Scene();
    scene.background = null;

    const halfHeight = CAMERA_HALF_HEIGHT;
    const halfWidth = halfHeight * aspect;
    const camera = new THREE.OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1, 0.5, 1);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    walkBoundLeftRef.current = -halfWidth + WALK_PADDING;
    walkBoundRightRef.current = halfWidth - WALK_PADDING;
    halfWidthRef.current = halfWidth;
    containerWidthRef.current = width;
  }, []);

  const fixMaterials = useCallback((object: THREE.Group) => {
    object.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        const newMaterials = materials.map((mat: THREE.Material) => {
          const replacement = mat.clone();
          replacement.side = THREE.DoubleSide;
          replacement.opacity = 1;
          replacement.transparent = false;
          mat.dispose();
          return replacement;
        });
        mesh.material =
          newMaterials.length === 1 ? newMaterials[0] : newMaterials;
      }
    });
  }, []);

  const applyModelTransform = useCallback(
    (object: THREE.Group, options: { positionX: number; faceDirection: number }) => {
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(1);
      object.position.set(0, 0, 0);
      object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = MODEL_SCALE / maxDim;
      object.scale.setScalar(scale);
      object.position.sub(center.multiplyScalar(scale));
      object.rotation.y = options.faceDirection;
      object.position.x = options.positionX;
    },
    []
  );

  const setupModel = useCallback(
    (object: THREE.Group, options?: { isWalkModel?: boolean; positionX?: number; faceDirection?: number; skipMaterialFix?: boolean }) => {
      if (!sceneRef.current) return;

      if (!options?.isWalkModel && !options?.skipMaterialFix) {
        fixMaterials(object);
      }

      const faceDir = options?.faceDirection ?? FACE_CAMERA;
      const posX = options?.positionX ?? walkBoundRightRef.current + MODEL_POSITION_OFFSET;
      applyModelTransform(object, { positionX: posX, faceDirection: faceDir });

      if (!options?.isWalkModel) {
        sceneRef.current.add(object);
        modelRef.current = object;
      }
    },
    [fixMaterials, applyModelTransform]
  );

  const playAnimation = useCallback(
    (object: THREE.Group, loop = true, filterRootMotion = false) => {
      if (object.animations && object.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(object);
        let clip = object.animations[0];
        if (filterRootMotion) {
          const filtered = clip.clone();
          filtered.tracks = filtered.tracks.filter((t) => !t.name.toLowerCase().includes('.position'));
          if (filtered.tracks.length > 0) {
            filtered.resetDuration();
            clip = filtered;
          }
        }
        const action = mixer.clipAction(clip);
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        action.clampWhenFinished = !loop;
        action.play();
        mixerRef.current = mixer;
        actionRef.current = action;
      }
    },
    []
  );

  const displayModel = useCallback(
    async (object: THREE.Group, options?: { isWalkModel?: boolean; positionX?: number; bubbleText?: string | null }) => {
      if (!sceneRef.current) return;

      if (modelRef.current && !options?.isWalkModel) {
        sceneRef.current.remove(modelRef.current);
        disposeModel(modelRef.current);
        modelRef.current = null;
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      if (actionRef.current) {
        actionRef.current.stop();
        actionRef.current = null;
      }

      const posX = options?.positionX ?? walkBoundRightRef.current + MODEL_POSITION_OFFSET;
      setupModel(object, options?.isWalkModel ? { isWalkModel: true } : { positionX: posX, faceDirection: rotationYRef.current });
      if (!options?.isWalkModel) {
        playAnimation(object);
      }
      if (options?.bubbleText !== undefined) {
        setBubbleTextAndRef(options.bubbleText);
      }
    },
    [setupModel, playAnimation, setBubbleTextAndRef]
  );

  const disposeModel = (object: THREE.Object3D) => {
    object.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  };

  const startWalkMode = useCallback(async () => {
    try {
      let walkObject = walkModelCacheRef.current;
      if (!walkObject) {
        walkObject = await loadModel('/assets/lawbWalk.fbx');
        fixMaterials(walkObject);
        walkModelCacheRef.current = walkObject;
      }
      if (!sceneRef.current) return;

      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
        disposeModel(modelRef.current);
        modelRef.current = null;
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      if (actionRef.current) {
        actionRef.current.stop();
        actionRef.current = null;
      }

      setupModel(walkObject, {
        isWalkModel: false,
        positionX: walkBoundRightRef.current + MODEL_POSITION_OFFSET,
        faceDirection: FACE_LEFT,
        skipMaterialFix: true,
      });
      sceneRef.current.add(walkObject);
      modelRef.current = walkObject;
      walkPositionXRef.current = walkBoundRightRef.current + MODEL_POSITION_OFFSET;
      playAnimation(walkObject, true, true);
      isWalkingRef.current = true;
      walkDirectionRef.current = -1;
      clockRef.current = new THREE.Clock();
      setBubbleTextAndRef(null);
    } catch (err) {
      console.warn('[Clawb] Failed to load walk:', err);
    }
  }, [loadModel, setupModel, playAnimation, fixMaterials, setBubbleTextAndRef]);

  const stopWalkAndLoadNext = useCallback(async (nextIndex: number) => {
    isWalkingRef.current = false;
    const positionX = walkPositionXRef.current;
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      if (modelRef.current !== walkModelCacheRef.current) {
        disposeModel(modelRef.current);
      }
      modelRef.current = null;
    }
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    actionRef.current = null;

    const nextUrl = ANIMATION_SEQUENCE[nextIndex];
    const bubbleText = getBubbleText(nextUrl);
    try {
      const object = await loadModel(nextUrl);
      await displayModel(object, { positionX, bubbleText });
      animationIndexRef.current = nextIndex;
    } catch (err) {
      console.warn('[Clawb] Failed to load:', nextUrl, err);
    }
  }, [loadModel, displayModel]);

  const cycleAnimation = useCallback(async () => {
    const currentIndex = animationIndexRef.current;

    if (isWalkingRef.current) {
      const nextIndex = currentIndex >= 10 ? 1 : currentIndex + 1;
      await stopWalkAndLoadNext(nextIndex);
      return;
    }

    const nextIndex = currentIndex >= 10 ? 1 : currentIndex + 1;
    const nextUrl = ANIMATION_SEQUENCE[nextIndex];

    if (WALK_INDICES.has(nextIndex)) {
      animationIndexRef.current = nextIndex;
      startWalkMode();
      return;
    }

    const stayX = modelRef.current?.position.x;
    const bubbleText = getBubbleText(nextUrl);
    try {
      const object = await loadModel(nextUrl);
      await displayModel(object, {
        ...(stayX !== undefined ? { positionX: stayX } : {}),
        bubbleText,
      });
      animationIndexRef.current = nextIndex;
    } catch (err) {
      console.warn('[Clawb] Failed to load animation:', nextUrl, err);
    }
  }, [loadModel, displayModel, startWalkMode, stopWalkAndLoadNext]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerDownRef.current = true;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    lastPointerXRef.current = e.clientX;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      const deltaX = e.clientX - lastPointerXRef.current;
      rotationYRef.current += deltaX * ROTATE_SENSITIVITY;
      lastPointerXRef.current = e.clientX;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const wasDragging = isDraggingRef.current;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    pointerDownRef.current = false;
    isDraggingRef.current = false;

    // Non-drag click → open emote wheel at Clawb's position
    if (!wasDragging && onClawbClick) {
      // Calculate screen position of the model's head
      if (modelRef.current && cameraRef.current && containerRef.current) {
        const headPos = new THREE.Vector3(
          modelRef.current.position.x,
          modelRef.current.position.y + 2,
          0
        );
        headPos.project(cameraRef.current);
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = ((headPos.x + 1) / 2) * rect.width + rect.left;
        const screenY = ((-headPos.y + 1) / 2) * rect.height + rect.top;
        onClawbClick({ x: screenX, y: screenY });
      } else {
        // Fallback: use pointer position
        onClawbClick({ x: e.clientX, y: e.clientY - 120 });
      }
    }
  }, [onClawbClick]);

  const playEmote = useCallback(async (emoteId: EmoteAnimationId) => {
    const targetIndex = EMOTE_INDEX_MAP[emoteId];
    if (targetIndex === undefined) return;

    // If it's a walk animation, start walk mode
    if (WALK_INDICES.has(targetIndex)) {
      animationIndexRef.current = targetIndex;
      startWalkMode();
      return;
    }

    // Otherwise load and play the specific animation
    const url = ANIMATION_SEQUENCE[targetIndex];
    const stayX = modelRef.current?.position.x;
    const bubbleTextVal = getBubbleText(url);
    try {
      const object = await loadModel(url);
      await displayModel(object, {
        ...(stayX !== undefined ? { positionX: stayX } : {}),
        bubbleText: bubbleTextVal,
      });
      animationIndexRef.current = targetIndex;
    } catch (err) {
      console.warn('[Clawb] Failed to play emote:', emoteId, err);
    }
  }, [loadModel, displayModel, startWalkMode]);

  useImperativeHandle(ref, () => ({
    cycleAnimation,
    playEmote,
  }), [cycleAnimation, playEmote]);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const rawDelta = clockRef.current.getDelta();
    const delta = Math.min(rawDelta, 1 / 20);

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (isWalkingRef.current && modelRef.current && mixerRef.current) {
      const model = modelRef.current;
      walkPositionXRef.current += WALK_SPEED * delta * walkDirectionRef.current;

      if (walkPositionXRef.current >= walkBoundRightRef.current) {
        walkPositionXRef.current = walkBoundRightRef.current;
        walkDirectionRef.current = -1;
        model.rotation.y = FACE_LEFT;
      } else if (walkPositionXRef.current <= walkBoundLeftRef.current) {
        walkPositionXRef.current = walkBoundLeftRef.current;
        walkDirectionRef.current = 1;
        model.rotation.y = FACE_RIGHT;
      }

      model.position.x = walkPositionXRef.current;
    }

    if (modelRef.current) {
      if (isWalkingRef.current) {
        modelRef.current.rotation.y = walkDirectionRef.current === 1 ? FACE_RIGHT : FACE_LEFT;
      } else {
        modelRef.current.rotation.y = rotationYRef.current;
      }
      if (bubbleRef.current && bubbleTextRef.current && modelRef.current) {
        const hw = halfWidthRef.current;
        const cw = containerWidthRef.current;
        const modelX = modelRef.current.position.x;
        const leftPx = ((modelX + hw) / (2 * hw)) * cw;
        bubbleRef.current.style.left = `${leftPx}px`;
        bubbleRef.current.style.transform = 'translateX(-50%)';
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    initScene();

    const loadInitial = async () => {
      try {
        const walkModel = await loadModel('/assets/lawbWalk.fbx');
        fixMaterials(walkModel);
        walkModelCacheRef.current = walkModel;

        const idleObject = await loadModel('/assets/lawbidle.fbx');
        await displayModel(idleObject, { bubbleText: 'Clawb loading, stand by . . . ' });
        if (modelRef.current) {
          modelRef.current.position.x = walkBoundRightRef.current + MODEL_POSITION_OFFSET;
        }
        animationIndexRef.current = 0;
        setIsLoaded(true);
      } catch (err) {
        console.error('[Clawb] Failed to load model:', err);
        setHasError(true);
      }
    };

    loadInitial();

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current || !cameraRef.current)
        return;
      const width = containerRef.current.offsetWidth || window.innerWidth;
      const height = CANVAS_HEIGHT;
      const aspect = width / height;
      const halfHeight = CAMERA_HALF_HEIGHT;
      const halfWidth = halfHeight * aspect;
      cameraRef.current.left = -halfWidth;
      cameraRef.current.right = halfWidth;
      cameraRef.current.top = halfHeight;
      cameraRef.current.bottom = -halfHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current?.setSize(width, height);
      walkBoundLeftRef.current = -halfWidth + WALK_PADDING;
      walkBoundRightRef.current = halfWidth - WALK_PADDING;
      halfWidthRef.current = halfWidth;
      containerWidthRef.current = width;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        if (modelRef.current !== walkModelCacheRef.current) {
          disposeModel(modelRef.current);
        }
      }
      mixerRef.current?.stopAllAction();
      rendererRef.current?.dispose();
    };
  }, [initScene, loadModel, displayModel, fixMaterials]);

  useEffect(() => {
    if (isLoaded && !hasError) {
      animate();
    }
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isLoaded, hasError, animate]);

  useEffect(() => {
    const checkDarkMode = () => {
      const dark =
        document.body.classList.contains('lawb-app-dark-mode') ||
        document.documentElement.classList.contains('lawb-app-dark-mode');
      setIsDarkMode(dark);
    };
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (document.documentElement !== document.body) {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    checkDarkMode();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ambientLightRef.current || !directionalLightRef.current || !fillLightRef.current) return;
    if (isDarkMode) {
      ambientLightRef.current.intensity = 1.0;
      directionalLightRef.current.intensity = 0.7;
      fillLightRef.current.intensity = 0.5;
    } else {
      ambientLightRef.current.intensity = 0.8;
      directionalLightRef.current.intensity = 0.6;
      fillLightRef.current.intensity = 0.4;
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!bubbleText) {
      setDisplayedBubbleText('');
      return;
    }
    setDisplayedBubbleText('');
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setDisplayedBubbleText((prev) => bubbleText.slice(0, index));
      if (index >= bubbleText.length) {
        clearInterval(interval);
      }
    }, TYPING_SPEED_MS);
    return () => clearInterval(interval);
  }, [bubbleText]);

  if (hasError) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: NAVBAR_HEIGHT + 8,
        left: 24,
        right: 24,
        width: 'calc(100% - 48px)',
        height: CONTAINER_HEIGHT,
        zIndex: 999998,
        overflow: 'hidden',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          height: BUBBLE_ZONE_HEIGHT,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        {bubbleText && (
          <div
            ref={bubbleRef}
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: `min(${BUBBLE_MAX_WIDTH}px, calc(100% - 24px))`,
              maxHeight: BUBBLE_ZONE_HEIGHT - 8,
              overflowY: 'auto',
              padding: '6px 12px',
              background: isDarkMode
                ? 'linear-gradient(to bottom, #2d3748, #1a202c)'
                : 'linear-gradient(to bottom, #4a5568, #2d3748)',
              border: isDarkMode ? '1px solid #4a5568' : '1px solid #1a202c',
              borderRadius: '6px',
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0, 0, 0, 0.5)'
                : '0 2px 8px rgba(0, 0, 0, 0.3)',
              fontFamily: '"Orbitron", "Share Tech Mono", "Liberation Mono", "DejaVu Sans Mono", monospace',
              fontSize: '11px',
              color: '#e2e8f0',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              lineHeight: 1.4,
              pointerEvents: 'none',
              zIndex: 999999,
            }}
          >
            {displayedBubbleText}
            {displayedBubbleText.length < bubbleText.length && (
              <span className="lawb-bubble-cursor">|</span>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          flexShrink: 0,
          height: CANVAS_HEIGHT,
          width: '100%',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Clawb - click to open emote wheel, drag to rotate"
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'grab',
            pointerEvents: 'auto',
          }}
        />
      </div>
    </div>
  );
});

Clawb.displayName = 'Clawb';

export default Clawb;
