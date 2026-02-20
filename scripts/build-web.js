const { execSync } = require('child_process');

const env = {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_BASE_PATH: '/',
};

console.log('Building web app...');
execSync('vite build', {
    stdio: 'inherit',
    env,
});
