const newPath = 'client';

const fs = require('fs');
const childProcess = require('child_process')
const archiver = require('archiver');
const rimraf = require('rimraf');

// update package json homepage
console.log("Updating package.json...")
const packageJSON = JSON.parse(fs.readFileSync('./package.json').toString());
packageJSON["homepage"] = `/hellomunchkins/${newPath}/`;
fs.writeFileSync('./package.json', JSON.stringify(packageJSON, null, 4));

// update router subpath
console.log("Updating router subpath...")
const appTSX = fs.readFileSync('./src/App.tsx').toString();
const lines = appTSX.split('\n');
const lineIndex = lines.findIndex(line => line.includes('    path: '));
lines[lineIndex] = `    path: "/hellomunchkins/${newPath}",`;
const newSource = lines.join('\n');
fs.writeFileSync('./src/App.tsx', newSource);

// build react app
console.log("Building React app...")
childProcess.execSync(`npm run build`, {stdio: 'inherit'});

// rename and package zip for server upload
console.log("Packaging build into .zip for server...")
if(fs.existsSync('./build')) fs.renameSync('./build', `./${newPath}`);
const output = fs.createWriteStream(`./${newPath}.zip`);
output.on('finish', () => {
    console.log(`Finished custom build for ${newPath}\n -> ${newPath}.zip`);
    rimraf.rimrafSync(`./${newPath}`);
});

const archive = archiver('zip', {zlib: { level: 9 }});
archive.pipe(output);
archive.directory(`./${newPath}`, newPath);
archive.finalize();
