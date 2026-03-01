const fs = require('fs');
const path = require('path');
const https = require('https');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const AGENT_TOOLS_DIR = path.resolve(WORKSPACE_ROOT, '..', '.cursor', 'projects', 'c-Users-wable-lawb2', 'agent-tools');

const MANIFESTS = {
  dry_branches_medium_01: '6d983d54-6004-448b-91a2-75c80b9fb142',
  rock_moss_set_01: '67dd9dd2-0090-408b-ae79-44797e887139',
  flower_heliophila: '0eaf6658-2e3c-405f-a744-8109056d2a43',
  crystalline_iceplant: 'f0d5d3da-bce7-42e6-8f67-8d8aa2984561',
  dead_quiver_branch_01: '0440f4c2-0e3b-412e-8bb8-f46a91bc8bc4',
};

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, outPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    });
    req.on('error', reject);
  });
}

function readManifest(manifestId) {
  const manifestPath = path.join(AGENT_TOOLS_DIR, `${manifestId}.txt`);
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function pickGltf(filesJson) {
  if (!filesJson.gltf) return null;
  return (
    (filesJson.gltf['1k'] && filesJson.gltf['1k'].gltf) ||
    (filesJson.gltf['2k'] && filesJson.gltf['2k'].gltf) ||
    (filesJson.gltf['4k'] && filesJson.gltf['4k'].gltf) ||
    null
  );
}

async function main() {
  for (const [assetId, manifestId] of Object.entries(MANIFESTS)) {
    const filesJson = readManifest(manifestId);
    const gltf = pickGltf(filesJson);
    if (!gltf) {
      console.log(`skip ${assetId} (no gltf)`);
      continue;
    }
    const dstBase = path.join(WORKSPACE_ROOT, 'public', 'models', 'polyhaven', assetId);
    const gltfName = path.basename(new URL(gltf.url).pathname);
    await download(gltf.url, path.join(dstBase, gltfName));
    const include = gltf.include || {};
    for (const [relPath, fileInfo] of Object.entries(include)) {
      const normalized = relPath.replace(/\\/g, '/');
      await download(fileInfo.url, path.join(dstBase, normalized));
    }
    console.log(`downloaded ${assetId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
