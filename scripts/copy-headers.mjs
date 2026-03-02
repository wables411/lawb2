import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';

// Cross-platform replacement for: cp _headers dist/
const root = process.cwd();
const src = path.join(root, '_headers');
const distDir = path.join(root, 'dist');
const dest = path.join(distDir, '_headers');

if (!existsSync(src)) {
  console.error(`[postbuild] Missing file: ${src}`);
  process.exit(1);
}

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

copyFileSync(src, dest);
console.log(`[postbuild] Copied _headers -> dist/_headers`);

// Prevent accidental high-bandwidth uploads of source asset archives.
const distZipAssets = path.join(distDir, 'world-assets', 'zips');
if (existsSync(distZipAssets)) {
  rmSync(distZipAssets, { recursive: true, force: true });
  console.log('[postbuild] Pruned dist/world-assets/zips (local source archives)');
}

// When VITE_EXCLUDE_WORLD (Netlify): remove world-only assets to save deploy size & credits.
// WorldBackground (desktop) keeps world-assets, models, world-state-main.json.
const excludeWorld = process.env.VITE_EXCLUDE_WORLD === 'true' || process.env.VITE_EXCLUDE_WORLD === '1';
if (excludeWorld) {
  const toRemove = [
    path.join(distDir, 'local-world-assets'),
    path.join(distDir, 'world', 'world-state-bedroom.json'),
    path.join(distDir, 'world', 'world-state-workshop.json'),
    path.join(distDir, 'world', 'world-state-vault.json'),
  ];
  for (const p of toRemove) {
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
      console.log(`[postbuild] Pruned ${path.relative(distDir, p)} (world-only, excluded from Netlify)`);
    }
  }
}

