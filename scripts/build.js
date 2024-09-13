const { execSync } = require('child_process');
const fs = require('fs');

console.info('Cleaning build directories');
execSync('npm run clean', {stdio: 'inherit'});

console.info('Compiling');
execSync('npm run build:esm', {stdio: 'inherit'});

console.info('Building UI');
execSync('npm run build:ui', {stdio: 'inherit'});
const htmlText = fs.readFileSync('./ui/dist/inline/index.html', {encoding: 'utf8'});
fs.writeFileSync('./dist/esm/constants/banner.js', `export const connectInstallerBanner = \'${htmlText.replace(/\\/g, '\\\\').replace(/\'/g, '\\\'').replace(/\r?\n|\r/g, '')}\';`);

console.info('Building JS bundle');
execSync('npm run build:bundle', {stdio: 'inherit'});
