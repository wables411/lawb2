// DEV-ONLY tool: renders the arcade pickup GLBs to transparent sprite images for the
// diver's satchel (one-time asset generation — the shipped satchel uses the static
// sprites, never a live 3D viewer). Inert unless `vite dev` AND localStorage
// DEV_SPRITE_RENDERER is set. Absent from production bundles (compile-time DEV guard).
//
// Usage (browser console / automation on the dev server):
//   localStorage.setItem('DEV_SPRITE_RENDERER', '1'); reload
//   await window.__renderPickupSprites()  →  { [name]: dataUrl }  (image/webp, 128px)

if (import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('DEV_SPRITE_RENDERER')) {
  (window as any).__renderPickupSprites = async (size = 128): Promise<Record<string, string>> => {
    const THREE = await import('three');
    const { createArcadeGltfLoader } = await import('./pages/arcade/arcadeGltfLoader');

    const MODELS: Record<string, string> = {
      trash: '/arcade-assets/trash-cube.glb',
      coin: '/arcade-assets/coin.glb',
      cheese: '/arcade-assets/cheese.glb',
      peptides: '/arcade-assets/peptides.glb',
      air_tank: '/arcade-assets/reef-o2-tank.glb',
      jellyfish: '/arcade-assets/jellyfish.glb',
      pufferfish: '/arcade-assets/puffer-fish.glb',
      mine: '/arcade-assets/reef-mine.glb',
    };

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
    // Soft studio: key + fill + rim so the pastel UI gets readable, friendly sprites.
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.2, 3.0, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfe6f5, 0.9);
    rim.position.set(-2.4, 1.2, -2.0);
    scene.add(rim);

    const loader = createArcadeGltfLoader();
    const out: Record<string, string> = {};

    for (const [name, url] of Object.entries(MODELS)) {
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene;
      // Fit: center the model and frame it with a little margin.
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      root.position.sub(center);
      const holder = new THREE.Group();
      holder.add(root);
      // 3/4 hero angle, slight top-down — consistent across all sprites.
      holder.rotation.y = Math.PI / 5;
      holder.rotation.x = 0.12;
      scene.add(holder);

      const dist = (sphere.radius * 1.15) / Math.tan((camera.fov * Math.PI) / 360);
      // Authored scales vary wildly (coin.glb is ~30 units across, cheese ~0.5) — the
      // clip planes must track the framing distance or big models vanish entirely.
      camera.near = Math.max(dist / 100, 0.001);
      camera.far = dist + sphere.radius * 6;
      camera.updateProjectionMatrix();
      camera.position.set(0, sphere.radius * 0.28, dist);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      out[name] = renderer.domElement.toDataURL('image/webp', 0.92);
      scene.remove(holder);
    }

    renderer.dispose();
    window.console.log('[SPRITES] rendered', Object.keys(out).join(', '));
    return out;
  };

  /**
   * Rotation strips: N yaw frames per model laid out horizontally in one image,
   * for CSS steps() spin animation in the satchel (no runtime 3D).
   */
  (window as any).__renderPickupSpriteStrips = async (
    names: string[] = ['trash', 'coin', 'cheese', 'peptides'],
    frames = 12,
    size = 96,
  ): Promise<Record<string, string>> => {
    const THREE = await import('three');
    const { createArcadeGltfLoader } = await import('./pages/arcade/arcadeGltfLoader');
    const { TRASH_VARIANTS } = await import('./pages/arcade/arcadeTrashVariants');
    const MODELS: Record<string, string> = {
      trash: '/arcade-assets/trash-cube.glb',
      coin: '/arcade-assets/coin.glb',
      cheese: '/arcade-assets/cheese.glb',
      peptides: '/arcade-assets/peptides.glb',
      air_tank: '/arcade-assets/reef-o2-tank.glb',
    };
    // Dive-log strips: one per canonical trash variant (satchel key: trash_<id>).
    for (const v of TRASH_VARIANTS) MODELS[`trash_${v.id}`] = `/arcade-assets/${v.glb}`;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(2.2, 3.0, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfe6f5, 1.1);
    rim.position.set(-2.4, 1.2, -2.0);
    scene.add(rim);

    const strip = document.createElement('canvas');
    strip.width = size * frames;
    strip.height = size;
    const ctx = strip.getContext('2d')!;

    const loader = createArcadeGltfLoader();
    const out: Record<string, string> = {};
    for (const name of names) {
      const url = MODELS[name];
      if (!url) continue;
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      root.position.sub(box.getCenter(new THREE.Vector3()));
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const holder = new THREE.Group();
      holder.add(root);
      holder.rotation.x = 0.12;
      scene.add(holder);
      const dist = (sphere.radius * 1.15) / Math.tan((camera.fov * Math.PI) / 360);
      camera.near = Math.max(dist / 100, 0.001);
      camera.far = dist + sphere.radius * 6;
      camera.updateProjectionMatrix();
      camera.position.set(0, sphere.radius * 0.28, dist);
      camera.lookAt(0, 0, 0);

      ctx.clearRect(0, 0, strip.width, strip.height);
      for (let f = 0; f < frames; f++) {
        holder.rotation.y = (f / frames) * Math.PI * 2 + Math.PI / 5;
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, f * size, 0, size, size);
      }
      scene.remove(holder);
      out[name] = strip.toDataURL('image/webp', 0.85);
    }
    renderer.dispose();
    window.console.log('[SPRITES] strips rendered', Object.keys(out).join(', '));
    return out;
  };
  /**
   * Swimmer rotation strips: the three character FBX models in idle pose, full body,
   * studio-lit, N yaw frames — same steps() presentation as the satchel item strips.
   * Textures are awaited (FBX loader resolves before maps arrive → black renders).
   */
  (window as any).__renderSwimmerSpriteStrips = async (
    frames = 12,
    size = 96,
  ): Promise<Record<string, string>> => {
    const THREE = await import('three');
    const { ARCADE_CHARACTERS } = await import('./pages/arcade/arcadeAssetConfig');
    const { loadArcadeFbx, startLoopClip } = await import('./pages/arcade/loadArcadeFbx');

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(2.2, 3.0, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfe6f5, 1.1);
    rim.position.set(-2.4, 1.2, -2.0);
    scene.add(rim);

    const strip = document.createElement('canvas');
    strip.width = size * frames;
    strip.height = size;
    const ctx = strip.getContext('2d')!;
    const out: Record<string, string> = {};

    for (const def of ARCADE_CHARACTERS) {
      const { root, clips } = await loadArcadeFbx(def.idle, def.id);
      const { mixer } = startLoopClip(root, clips, { stripRootMotion: true, retarget: true });
      mixer?.update(1.7); // mid-idle pose, not bind/T-pose
      root.updateMatrixWorld(true);
      // Wait for every material map to have image data (max 10s).
      const pending = (): number => {
        let n = 0;
        root.traverse((o: any) => {
          if (!o.isMesh) return;
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            if (m.map && !(m.map.image && (m.map.image.width > 0 || m.map.image.complete))) n++;
          }
        });
        return n;
      };
      for (let i = 0; i < 100 && pending() > 0; i++) await new Promise((r) => setTimeout(r, 100));

      const box = new THREE.Box3().setFromObject(root);
      root.position.sub(box.getCenter(new THREE.Vector3()));
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const holder = new THREE.Group();
      holder.add(root);
      holder.rotation.x = 0.1;
      scene.add(holder);
      const dist = (sphere.radius * 1.15) / Math.tan((camera.fov * Math.PI) / 360);
      camera.near = Math.max(dist / 100, 0.001);
      camera.far = dist + sphere.radius * 6;
      camera.updateProjectionMatrix();
      camera.position.set(0, sphere.radius * 0.24, dist);
      camera.lookAt(0, 0, 0);

      ctx.clearRect(0, 0, strip.width, strip.height);
      for (let f = 0; f < frames; f++) {
        holder.rotation.y = (f / frames) * Math.PI * 2;
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, f * size, 0, size, size);
      }
      scene.remove(holder);
      out[def.id] = strip.toDataURL('image/webp', 0.85);
    }
    renderer.dispose();
    window.console.log('[SPRITES] swimmer strips rendered', Object.keys(out).join(', '));
    return out;
  };

  window.console.log('[SPRITES] dev sprite renderer armed — call window.__renderPickupSprites()');
}

export {};
