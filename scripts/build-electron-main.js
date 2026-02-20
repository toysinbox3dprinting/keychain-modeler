const esbuild = require('esbuild');

const watchMode = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['electron/main.ts', 'electron/preload.ts'],
  outdir: 'dist-electron',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: true,
  external: ['electron'],
  logLevel: 'info',
};

const run = async () => {
  if (watchMode) {
    const context = await esbuild.context(buildOptions);
    await context.watch();
    console.log('Watching electron/main.ts and electron/preload.ts');
    return;
  }

  await esbuild.build(buildOptions);
  console.log('Built Electron main/preload to dist-electron/');
};

run().catch((error) => {
  console.error('Failed to build Electron main/preload.');
  console.error(error);
  process.exit(1);
});
