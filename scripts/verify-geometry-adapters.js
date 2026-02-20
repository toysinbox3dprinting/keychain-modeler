const { execSync } = require('child_process');

const files = [
  'src/core/vendor/csg/dist/api.esm.js',
  'src/core/vendor/csg/dist/csg.esm.js',
  'src/core/geometry/earcut.esm.js',
];

const run = (command) => execSync(command, { stdio: 'inherit' });

try {
  run('npm run generate:adapters');
  run(`git diff --exit-code -- ${files.join(' ')}`);
  console.log('Adapter bundles are up to date.');
} catch (_error) {
  console.error('Adapter bundles are out of date. Run npm run generate:adapters and commit the changes.');
  process.exit(1);
}
