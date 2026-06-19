import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createArcadeGltfLoader } from './arcadeGltfLoader';

const loader = createArcadeGltfLoader();

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const mat = m as THREE.Material | undefined;
      if (!mat) continue;
      const texMat = mat as THREE.MeshStandardMaterial & { [key: string]: unknown };
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']) {
        const tex = texMat[key] as THREE.Texture | undefined;
        tex?.dispose?.();
      }
      mat.dispose();
    }
  });
}

function normalizeModelPlacement(root: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.0001);
  const targetExtent = 1.05;
  const scale = targetExtent / maxAxis;
  root.scale.setScalar(scale);
  root.position.sub(center.multiplyScalar(scale));
  const post = new THREE.Box3().setFromObject(root);
  root.position.y += -0.44 - post.min.y;
}

/**
 * Small Three canvas used by the loading overlay.
 * Renders the real in-game `reef-o2-tank.glb` with a gentle idle spin.
 */
export function ArcadeLoadingPeptides() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 24);
    camera.position.set(0, 0.22, 4.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(host.clientWidth || 132, host.clientHeight || 132, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xbfefff, 0x123447, 1.2);
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.5, 2.2, 3);
    const fill = new THREE.PointLight(0x6fe8ff, 14, 8, 1.8);
    fill.position.set(-1.4, 1.2, 2.2);
    scene.add(hemi, key, fill);

    let disposed = false;
    let root: THREE.Object3D | null = null;

    loader
      .loadAsync('/arcade-assets/reef-o2-tank.glb')
      .then((gltf) => {
        if (disposed) {
          disposeObject3D(gltf.scene);
          return;
        }
        root = gltf.scene;
        normalizeModelPlacement(root);
        scene.add(root);
      })
      .catch((e) => {
        console.warn('[Arcade] loading O2 tank preview failed', e);
      });

    const resize = () => {
      const w = host.clientWidth || 132;
      const h = host.clientHeight || 132;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      if (root) {
        root.rotation.y = t * 0.65;
        root.rotation.z = Math.sin(t * 1.05) * 0.05;
        root.position.y = -0.44 + Math.sin(t * 1.8) * 0.05;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (root) disposeObject3D(root);
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="ra-loading-model" aria-hidden />;
}

