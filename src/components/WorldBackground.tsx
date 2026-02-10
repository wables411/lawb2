import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {
  renderWorldState,
  createSandFloor,
  setupUnderwaterLighting,
  setupUnderwaterFog,
  createBubbleParticles,
  animateBubbles,
  type WorldState,
} from '../utils/worldObjects';

const CAMERA_DRIFT_SPEED = 0.03;
const CLAWB_WALK_SPEED = 1.2;
const CLAWB_PATROL_RANGE = 4;
const CLAWB_SCALE = 0.08; // Distant Clawb — smaller than the foreground one

const WorldBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const frameIdRef = useRef<number | null>(null);
  const bubblesRef = useRef<THREE.Points | null>(null);
  const clawbModelRef = useRef<THREE.Group | null>(null);
  const clawbMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clawbWalkDirRef = useRef(1);
  const clawbPosXRef = useRef(0);
  const lightRefs = useRef<{ ambient: THREE.AmbientLight; directional: THREE.DirectionalLight } | null>(null);
  const cameraAngleRef = useRef(0);

  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' &&
    (document.body.classList.contains('lawb-app-dark-mode') ||
      document.documentElement.classList.contains('lawb-app-dark-mode'))
  );

  // Dark mode observer
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

  // Update lighting/fog on dark mode change
  useEffect(() => {
    if (!sceneRef.current || !lightRefs.current) return;
    const scene = sceneRef.current;
    const { ambient, directional } = lightRefs.current;

    // Update fog
    const fogColor = isDarkMode ? '#0a1628' : '#1a3a5c';
    scene.fog = new THREE.FogExp2(fogColor, 0.04);
    scene.background = new THREE.Color(fogColor);

    // Update lighting
    ambient.color.set(isDarkMode ? '#1a2a44' : '#4466aa');
    ambient.intensity = isDarkMode ? 0.4 : 0.6;
    directional.color.set(isDarkMode ? '#88aacc' : '#ffffee');
    directional.intensity = isDarkMode ? 0.5 : 0.8;
  }, [isDarkMode]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const delta = Math.min(clockRef.current.getDelta(), 1 / 20);

    // Animate bubbles
    if (bubblesRef.current) {
      animateBubbles(bubblesRef.current, delta);
    }

    // Animate Clawb walking
    if (clawbModelRef.current && clawbMixerRef.current) {
      clawbMixerRef.current.update(delta);
      clawbPosXRef.current += CLAWB_WALK_SPEED * delta * clawbWalkDirRef.current;
      if (clawbPosXRef.current > CLAWB_PATROL_RANGE) {
        clawbPosXRef.current = CLAWB_PATROL_RANGE;
        clawbWalkDirRef.current = -1;
        clawbModelRef.current.rotation.y = Math.PI / 2;
      } else if (clawbPosXRef.current < -CLAWB_PATROL_RANGE) {
        clawbPosXRef.current = -CLAWB_PATROL_RANGE;
        clawbWalkDirRef.current = 1;
        clawbModelRef.current.rotation.y = -Math.PI / 2;
      }
      clawbModelRef.current.position.x = clawbPosXRef.current;
    }

    // Slowly drift camera
    cameraAngleRef.current += CAMERA_DRIFT_SPEED * delta;
    const cam = cameraRef.current;
    const radius = 12;
    const baseAngle = cameraAngleRef.current;
    cam.position.x = Math.sin(baseAngle) * radius * 0.3;
    cam.position.z = Math.cos(baseAngle) * radius * 0.3 + 6;
    cam.lookAt(0, -2, 0);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Init scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Fog + background
    setupUnderwaterFog(scene, isDarkMode);

    // Camera — overhead ~35 degree angle
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8, 8);
    camera.lookAt(0, -2, 0);
    cameraRef.current = camera;

    // Lighting
    lightRefs.current = setupUnderwaterLighting(scene, isDarkMode);

    // Sand floor
    const floor = createSandFloor(30);
    floor.position.y = -3;
    scene.add(floor);

    // Bubble particles
    const bubbles = createBubbleParticles(80);
    scene.add(bubbles);
    bubblesRef.current = bubbles;

    // Load world state
    fetch('/world/world-state-main.json')
      .then((res) => res.json())
      .then((data: WorldState) => {
        renderWorldState(scene, data);
      })
      .catch((err) => {
        console.warn('[WorldBackground] Failed to load world state:', err);
      });

    // Load Clawb FBX for patrolling
    const loader = new FBXLoader();
    loader.load(
      '/assets/lawbWalk.fbx',
      (object) => {
        object.scale.setScalar(CLAWB_SCALE);
        object.position.set(0, -2.8, 0);
        object.rotation.y = -Math.PI / 2;

        // Fix materials
        object.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              m.side = THREE.DoubleSide;
              (m as THREE.MeshStandardMaterial).opacity = 1;
              m.transparent = false;
            });
          }
        });

        scene.add(object);
        clawbModelRef.current = object;

        // Play walk animation
        if (object.animations?.length > 0) {
          const mixer = new THREE.AnimationMixer(object);
          const clip = object.animations[0].clone();
          // Filter root motion
          clip.tracks = clip.tracks.filter((t) => !t.name.toLowerCase().includes('.position'));
          if (clip.tracks.length > 0) clip.resetDuration();
          const action = mixer.clipAction(clip);
          action.play();
          clawbMixerRef.current = mixer;
        }
      },
      undefined,
      (err) => console.warn('[WorldBackground] Failed to load Clawb FBX:', err)
    );

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Start render loop
    clockRef.current = new THREE.Clock();
    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
      renderer.dispose();
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};

export default WorldBackground;
