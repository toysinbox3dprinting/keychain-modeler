const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const buildDir = process.env.BUILD_OUTPUT_DIR || 'build';
const artifactFileName = process.env.BUILD_ARTIFACT_NAME || 'client.zip';
const artifactRootDir = process.env.BUILD_ARTIFACT_DIR_NAME || 'client';
const skipBuild = process.env.SKIP_PROD_BUILD === '1';

const projectRoot = process.cwd();
const buildDirPath = path.join(projectRoot, buildDir);
const artifactPath = path.join(projectRoot, artifactFileName);

if (!skipBuild) {
    console.log('Running production build before artifact packaging...');
    execSync('npm run build:prod', { stdio: 'inherit' });
}

if (!fs.existsSync(buildDirPath)) {
    throw new Error(`Build output directory not found: ${buildDirPath}`);
}

if (fs.existsSync(artifactPath)) {
    fs.unlinkSync(artifactPath);
}

console.log(`Creating artifact ${artifactFileName} from ./${buildDir}...`);
const output = fs.createWriteStream(artifactPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`Artifact ready: ${artifactFileName} (${archive.pointer()} bytes)`);
});

archive.on('error', (error) => {
    throw error;
});

archive.pipe(output);
archive.directory(buildDirPath, artifactRootDir);
archive.finalize();
