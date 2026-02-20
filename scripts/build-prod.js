const { execSync } = require('child_process');

const normalizeBasePath = (value) => {
    if (!value || value === '/') {
        return '/';
    }

    const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
};

const basePath = normalizeBasePath(process.env.APP_BASE_PATH || process.env.REACT_APP_BASE_PATH || '/');

const env = {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_BASE_PATH: basePath,
};

console.log(`Building production web app (basePath: ${basePath})...`);
execSync('vite build', {
    stdio: 'inherit',
    env,
});
