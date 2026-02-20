import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const normalizeBasePath = (value: string): string => {
  if (!value || value === '/') {
    return '/';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredBasePath = normalizeBasePath(env.REACT_APP_BASE_PATH || env.APP_BASE_PATH || '/');
  const useBaseInDev = env.REACT_APP_ENABLE_BASE_PATH_IN_DEV === 'true';

  return {
    plugins: [react(), tsconfigPaths()],
    envPrefix: ['VITE_', 'REACT_APP_', 'APP_'],
    base: command === 'serve' && !useBaseInDev ? '/' : configuredBasePath,
    build: {
      outDir: 'build',
      emptyOutDir: true,
      sourcemap: false,
    },
  };
});
