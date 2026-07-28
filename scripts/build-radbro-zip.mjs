// Build the radbro.fun ZIP: vite build (relative paths) + copy the radbro-only asset subset
// + zip dist-radbro into reefrun-radbro.zip.
//
// Asset subset keeps the download light for an arcade portal:
// - radbro FBX only (treading = idle/menu, swimming = run clips); dance is skipped.
// - All GLB props EXCEPT the two heavyweights (coral2 7.3 MB, trash-cube 4.8 MB) — the
//   loaders fall back gracefully (corals rotate coral1/coral3; trash rotates trash1/trash2).
//
// Usage: npm run build:radbro   → dist-radbro/ (test locally) + reefrun-radbro.zip (upload)

import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, statSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist-radbro');
const ASSET_SRC = path.join(ROOT, 'public', 'arcade-assets');
const ASSET_DST = path.join(DIST, 'arcade-assets');
const ZIP = path.join(ROOT, 'reefrun-radbro.zip');

const ASSETS = [
  // characters (radbro only; swimming is clips-only via swimUsesIdleMesh)
  'radbrotreading.fbx',
  'radbroswimming.fbx',
  // obstacles + pickups (minus coral2 / trash-cube heavyweights)
  'coral1.glb',
  'coral3.glb',
  'cheese.glb',
  'coin.glb',
  'jellyfish.glb',
  'peptides.glb',
  'puffer-fish.glb',
  'reef-mine.glb',
  'reef-o2-tank.glb',
  'trash1.glb',
  'trash2.glb',
  'trash-cigpack.glb',
  'trash-energycan.glb',
  'trash-vape.glb',
  'trash-bag.glb',
  'trash-crt.glb',
  // scenery + showcases (all small)
  'seagrass.glb',
  'reef-rock.glb',
  'shipwreck-bow.glb',
  'anchor.glb',
  'ruin-columns.glb',
  'statue-head.glb',
  'arcade-cabinet.glb',
  'torii-gate.glb',
  'treasure-chest.glb',
];

console.log('[radbro] vite build…');
execSync('npx vite build --config vite.radbro.config.ts', { stdio: 'inherit' });

console.log('[radbro] copying assets…');
mkdirSync(ASSET_DST, { recursive: true });
let total = 0;
for (const name of ASSETS) {
  const src = path.join(ASSET_SRC, name);
  if (!existsSync(src)) {
    console.error(`[radbro] MISSING asset: ${name}`);
    process.exit(1);
  }
  cpSync(src, path.join(ASSET_DST, name));
  total += statSync(src).size;
}
console.log(`[radbro] ${ASSETS.length} assets, ${(total / 1024 / 1024).toFixed(1)} MB raw`);

console.log('[radbro] zipping…');
rmSync(ZIP, { force: true });
// PowerShell Compress-Archive: zip the CONTENTS of dist-radbro (index.html at ZIP root).
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${DIST.replace(/\\/g, '/')}/*' -DestinationPath '${ZIP.replace(/\\/g, '/')}' -Force"`,
  { stdio: 'inherit' },
);
const zipMb = (statSync(ZIP).size / 1024 / 1024).toFixed(1);

const distFiles = readdirSync(DIST, { recursive: true }).length;
console.log('-----');
console.log(`[radbro] dist-radbro/: ${distFiles} files`);
console.log(`[radbro] ${path.basename(ZIP)}: ${zipMb} MB — upload this to radbro.fun/create`);
