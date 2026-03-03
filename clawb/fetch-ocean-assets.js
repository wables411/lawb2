#!/usr/bin/env node
/**
 * fetch-ocean-assets.js — Download CC0 ocean models for Clawb World.
 * Output: public/local-world-assets/models/ (gitignored)
 *
 * Sources:
 * - Poly Haven API (CC0): rocks, shells, plants
 * - Quaternius (CC0): fish, turtle — manual download from quaternius.com
 *
 * Usage:
 *   node clawb/fetch-ocean-assets.js              # fetch from Poly Haven
 *   node clawb/fetch-ocean-assets.js --manifest   # create manifest.json
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LAWB_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(LAWB_ROOT, 'public', 'local-world-assets', 'models');
const MANIFEST_PATH = path.join(LAWB_ROOT, 'public', 'local-world-assets', 'manifest.json');

// Poly Haven model IDs that work well underwater
const POLYHAVEN_OCEAN_IDS = [
  'coast_rocks_01',
  'coast_rocks_02',
  'lambis_shell',
  'rock_moss_set_01',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'lawb-clawb/1.0' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchPolyHavenFiles(assetId) {
  const url = `https://api.polyhaven.com/files/${assetId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const gltf = data?.gltf?.['1k']?.gltf;
  if (!gltf?.url) return null;
  const include = gltf.include || {};
  const files = [{ url: gltf.url, path: `${assetId}_1k.gltf` }];
  for (const [relPath, info] of Object.entries(include)) {
    if (info?.url) files.push({ url: info.url, path: path.join(assetId, relPath) });
  }
  return files;
}

async function fetchPolyHavenAsset(assetId) {
  const files = await fetchPolyHavenFiles(assetId);
  if (!files?.length) return false;
  ensureDir(path.join(OUT_DIR, assetId));
  for (const { url, path: relPath } of files) {
    const outPath = path.join(OUT_DIR, relPath);
    ensureDir(path.dirname(outPath));
    try {
      const buf = await download(url);
      fs.writeFileSync(outPath, buf);
      console.log(`  [OK] ${relPath}`);
    } catch (e) {
      console.warn(`  [FAIL] ${relPath}:`, e.message);
    }
  }
  return true;
}

async function createManifest() {
  const manifest = {
    entries: [
      {
        id: 'reef_turtle',
        model: '/local-world-assets/models/reef_turtle.glb',
        position: [6, -1.2, -8],
        scale: 0.9,
        behavior: 'swim_circle',
        speed: 0.22,
        radius: 3.2,
        verticalAmplitude: 0.25,
      },
      {
        id: 'anglerfish',
        model: '/local-world-assets/models/anglerfish.glb',
        position: [-7, -1.5, -12],
        scale: 0.7,
        behavior: 'swim_figure8',
        speed: 0.34,
        radius: 2.2,
        verticalAmplitude: 0.3,
      },
      {
        id: 'shipwreck_main',
        model: '/local-world-assets/models/shipwreck_main.glb',
        position: [0, -2.65, -26],
        rotation: [0, 1.1, 0],
        scale: 2.6,
        behavior: 'static',
      },
    ],
  };
  // Add all entries; LocalWorldFauna skips failed loads
  const modelsDir = path.join(LAWB_ROOT, 'public', 'local-world-assets', 'models');
  ensureDir(path.dirname(MANIFEST_PATH));
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest.json with ${manifest.entries.length} entries`);
  console.log('Add reef_turtle.glb, anglerfish.glb, shipwreck_main.glb from quaternius.com (CC0)');
}

async function main() {
  const args = process.argv.slice(2);
  const doManifest = args.includes('--manifest');

  if (doManifest) {
    ensureDir(path.dirname(MANIFEST_PATH));
    await createManifest();
    return;
  }

  ensureDir(OUT_DIR);
  console.log('Fetching Poly Haven ocean assets...');
  for (const id of POLYHAVEN_OCEAN_IDS) {
    console.log(`\n${id}:`);
    try {
      await fetchPolyHavenAsset(id);
    } catch (e) {
      console.warn(`  Error:`, e.message);
    }
  }
  console.log('\nDone. For fish/turtle: download from quaternius.com (CC0) and place in models/');
  console.log('Then run: node clawb/fetch-ocean-assets.js --manifest');
}

main().catch(console.error);
