const { execSync } = require('child_process');

const env = {
  ...process.env,
  NODE_ENV: 'production',
  ELECTRON_DESKTOP: 'true',
  REACT_APP_BASE_PATH: '/',
};

console.log('Building desktop renderer (Electron mode)...');
execSync('vite build', {
  stdio: 'inherit',
  env,
});
