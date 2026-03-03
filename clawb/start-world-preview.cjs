const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { spawn, spawnSync } = require('child_process');

const CLAWB_WORLD_DIR = resolve(__dirname, '..', '..', 'clawb-world');
const DIST_INDEX = join(CLAWB_WORLD_DIR, 'dist', 'index.html');

function runBuildIfNeeded() {
  if (existsSync(DIST_INDEX)) return true;
  console.log('[world-preview] clawb-world dist missing. running npm run build...');
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: CLAWB_WORLD_DIR,
    stdio: 'inherit',
    shell: true,
  });
  return (build.status || 1) === 0;
}

if (!runBuildIfNeeded()) {
  console.error('[world-preview] clawb-world build failed. exiting.');
  process.exit(1);
}

const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  cwd: CLAWB_WORLD_DIR,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
