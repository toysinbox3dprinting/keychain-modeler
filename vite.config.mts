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
  const isElectronDesktopBuild = process.env.ELECTRON_DESKTOP === 'true';

  return {
    plugins: [react(), tsconfigPaths()],
    envPrefix: ['VITE_', 'REACT_APP_', 'APP_'],
    base: isElectronDesktopBuild ? './' : (command === 'serve' && !useBaseInDev ? '/' : configuredBasePath),
    build: {
      outDir: 'build',
      emptyOutDir: true,
      sourcemap: false,
      // Never inline font files as data URIs: they are fetched at runtime by
      // opentype.js (via XHR on the asset URL), which does not handle data: URIs.
      // Small fonts (e.g. the single-glyph dino) would otherwise be inlined and
      // fail to load in production while working in dev.
      assetsInlineLimit: (filePath: string) =>
        /\.(ttf|otf|woff2?)$/i.test(filePath) ? false : undefined,
    },
  };
});
