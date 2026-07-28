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
import { cpSync, mkdirSync, rmSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { RADBRO_OMITTED_ASSETS } from './radbro-omit.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist-radbro');
const ASSET_SRC = path.join(ROOT, 'public', 'arcade-assets');
const ASSET_DST = path.join(DIST, 'arcade-assets');
const ZIP = path.join(ROOT, 'reefrun-radbro.zip');

// Ship EVERYTHING in public/arcade-assets except the omit list. Derived rather than
// hand-listed so new art is picked up automatically — an include list silently dropped
// each new asset until someone noticed the 404s in the console.
const OMIT = new Set(RADBRO_OMITTED_ASSETS);

console.log('[radbro] vite build…');
execSync('npx vite build --config vite.radbro.config.ts', { stdio: 'inherit' });

console.log('[radbro] copying assets…');
mkdirSync(ASSET_DST, { recursive: true });
const assets = readdirSync(ASSET_SRC).filter((f) => !OMIT.has(f));
let total = 0;
for (const name of assets) {
  const src = path.join(ASSET_SRC, name);
  cpSync(src, path.join(ASSET_DST, name));
  total += statSync(src).size;
}
console.log(
  `[radbro] ${assets.length} assets, ${(total / 1024 / 1024).toFixed(1)} MB raw ` +
    `(omitted ${RADBRO_OMITTED_ASSETS.length}: ${RADBRO_OMITTED_ASSETS.join(', ')})`,
);

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
