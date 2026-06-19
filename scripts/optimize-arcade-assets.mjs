// Optimize Reef Run arcade GLBs for the web, in place.
//
// Why: the source GLBs ship raw multi-million-triangle sculpts with 2K textures
// (trash-cube.glb was 189 MB / 5M triangles). One Reef Run session pulled ~714 MB,
// which burns Netlify bandwidth credits and pauses the site. This pass applies
// meshopt geometry compression + WebP textures + light decimation, typically a
// 20-40x reduction, with no visible change at gameplay distance.
//
// Loader requirement: the app must decode EXT_meshopt_compression. That is wired
// up in src/pages/arcade/arcadeGltfLoader.ts (loader.setMeshoptDecoder). WebP and
// KHR_mesh_quantization are handled by three's GLTFLoader natively.
//
// Usage:  npm run assets:optimize
// Stable filenames are kept, so the long-lived _headers cache rule still applies;
// bust the cache by renaming a file (e.g. coral2_v2.glb) when you replace art.

import { execSync } from 'node:child_process';
import { readdirSync, statSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ASSET_DIR = path.join(process.cwd(), 'public', 'arcade-assets');
// Run the CLI on demand via npx so it does NOT need to be a project dependency
// (keeping it out of the app's install/build tree). First run downloads it.
const CLI_PKG = '@gltf-transform/cli@^4.4.0';

// Geometry: meshopt compression (needs MeshoptDecoder in the loader).
// Textures: WebP, capped at 1024px — plenty for fast-moving reef props.
// Simplify: 3% extent error — invisible at gameplay distance, but meshopt does
// most of the work so we stay conservative to protect silhouettes.
const OPT_ARGS = [
  '--compress', 'meshopt',
  '--texture-compress', 'webp',
  '--texture-size', '1024',
  '--simplify-error', '0.03',
];

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

const glbs = readdirSync(ASSET_DIR).filter((f) => f.toLowerCase().endsWith('.glb'));
if (glbs.length === 0) {
  console.error(`[optimize] No .glb files found in ${ASSET_DIR}`);
  process.exit(1);
}

let beforeTotal = 0;
let afterTotal = 0;
const failures = [];

for (const name of glbs) {
  const src = path.join(ASSET_DIR, name);
  const tmp = path.join(ASSET_DIR, `.opt-${name}`);
  const before = statSync(src).size;
  beforeTotal += before;

  try {
    const args = ['optimize', src, tmp, ...OPT_ARGS].map((a) => `"${a}"`).join(' ');
    // execSync uses the shell, so npx's platform shim (npx.cmd on Windows) resolves.
    execSync(`npx --yes ${CLI_PKG} ${args}`, { stdio: 'pipe' });
    const after = statSync(tmp).size;
    // Only replace if the optimized file is actually smaller.
    if (after < before) {
      rmSync(src, { force: true });
      renameSync(tmp, src);
      afterTotal += after;
      console.log(`  ${name}: ${mb(before)} MB -> ${mb(after)} MB  (${(before / after).toFixed(1)}x)`);
    } else {
      rmSync(tmp, { force: true });
      afterTotal += before;
      console.log(`  ${name}: kept original (${mb(before)} MB; optimized was larger)`);
    }
  } catch (err) {
    rmSync(tmp, { force: true });
    afterTotal += before;
    failures.push(name);
    console.error(`  ${name}: FAILED — ${err.message.split('\n')[0]}`);
  }
}

console.log('-----');
console.log(`TOTAL: ${mb(beforeTotal)} MB -> ${mb(afterTotal)} MB  (${(beforeTotal / afterTotal).toFixed(1)}x smaller)`);
if (failures.length) {
  console.error(`Failed: ${failures.join(', ')}`);
  process.exit(1);
}
