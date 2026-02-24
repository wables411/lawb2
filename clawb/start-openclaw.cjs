// Wrapper to start openclaw gateway via pm2
const { execSync } = require('child_process');
const { spawn } = require('child_process');

const child = spawn('openclaw', ['gateway', '--port', '18789'], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
