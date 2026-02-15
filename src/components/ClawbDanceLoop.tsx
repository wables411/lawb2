/**
 * ClawbDanceLoop — Clawb 3D model looping dance only.
 * Used e.g. on chess PVP "waiting for opponent" screen (same character as lawb.xyz desktop).
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const CANVAS_HEIGHT = 200;
const CAMERA_HALF_HEIGHT = 4;
const MODEL_SCALE = 11;

const ClawbDanceLoop: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const frameIdRef = useRef<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const fixMaterials = useCallback((object: THREE.Group) => {
    object.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const newMaterials = materials.map((mat: THREE.Material) => {
          const replacement = mat.clone();
          replacement.side = THREE.DoubleSide;
          replacement.opacity = 1;
          replacement.transparent = false;
          mat.dispose();
          return replacement;
        });
        mesh.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials;
      }
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth || 400;
    const height = CANVAS_HEIGHT;
    const aspect = width / height;
    const halfHeight = CAMERA_HALF_HEIGHT;
    const halfWidth = halfHeight * aspect;

    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.OrthographicCamera(
      -halfWidth, halfWidth, halfHeight, -halfHeight, 0.1, 1000
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(1, 1, 1);
    scene.add(dir);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const loader = new FBXLoader();
    loader.load(
      '/assets/lawbdance1.fbx',
      (object: THREE.Group) => {
        fixMaterials(object);
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = MODEL_SCALE / maxDim;
        object.scale.setScalar(scale);
        object.position.sub(center.multiplyScalar(scale));
        object.rotation.y = 0;
        scene.add(object);
        modelRef.current = object;

        if (object.animations?.length > 0) {
          const mixer = new THREE.AnimationMixer(object);
          const action = mixer.clipAction(object.animations[0]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          mixerRef.current = mixer;
        }
      },
      undefined,
      () => setHasError(true)
    );

    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      const delta = Math.min(clockRef.current.getDelta(), 1 / 20);
      if (mixerRef.current) mixerRef.current.update(delta);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      frameIdRef.current = requestAnimationFrame(animate);
    };
    frameIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.offsetWidth || 400;
      const h = CANVAS_HEIGHT;
      const a = w / h;
      const hh = CAMERA_HALF_HEIGHT;
      const hw = hh * a;
      cameraRef.current.left = -hw;
      cameraRef.current.right = hw;
      cameraRef.current.top = hh;
      cameraRef.current.bottom = -hh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry?.dispose();
        });
      }
      mixerRef.current?.stopAllAction();
      rendererRef.current?.dispose();
    };
  }, [fixMaterials]);

  if (hasError) {
    return (
      <div className={className} style={{ ...style, textAlign: 'center', color: '#ff0000', padding: 20 }}>
        Clawb couldn’t load. Waiting for opponent…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: CANVAS_HEIGHT, position: 'relative', ...style }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: CANVAS_HEIGHT }} />
    </div>
  );
};

export default ClawbDanceLoop;
