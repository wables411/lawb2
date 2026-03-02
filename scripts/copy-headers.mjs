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

