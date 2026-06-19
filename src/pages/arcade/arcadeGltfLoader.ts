import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * GLTFLoader configured to decode the optimized arcade GLBs in
 * `public/arcade-assets/`. Those models are compressed with
 * EXT_meshopt_compression (geometry) + EXT_texture_webp (textures) via
 * `scripts/optimize-arcade-assets.mjs`. Without the meshopt decoder registered,
 * the loader throws on every arcade GLB. WebP textures and KHR_mesh_quantization
 * are handled by GLTFLoader natively, so no extra setup is needed for those.
 *
 * Always create arcade GLTFLoaders through this factory.
 */
export function createArcadeGltfLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}
