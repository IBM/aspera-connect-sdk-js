const child_process = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const version = require('../package.json').version;

const { env } = process;
const ARGS = process.argv.slice(2);
const BIN_DIR = path.join(__dirname, '..', ARGS[0], 'bin');
const INSTALLER_DIR = path.join(__dirname, '..', 'imports');

const INSTALLERS = [
  {
    installers: ['ibm-aspera-connect_*tar.gz'],
    src: getInstallerDir('linux')
  },
  {
    installers: ['ibm-aspera-connect_*.dmg'],
    src: getInstallerDir('macos')
  },
  {
    installers: ['ibm-aspera-connect_*.exe', 'IBMAsperaConnectSetup-ML-FIPS-*.exe'],
    src: getInstallerDir('windows')
  }
];

// Store installer filenames that were copied
let INSTALLER_NAMES = [];

function buildReferences () {
  const info = getInstallerInfo();

  const references = path.join(__dirname, '..', 'resources', 'connect_references.json');
  let contents = fs.readFileSync(references, 'utf8');

  // Substitute timestamp
  contents = contents.replace(/#TIMESTAMP#/g, new Date().toISOString());

  // Substitute release notes and html guides links
  const { htmlGuides, releaseNotes } = getDocumentation();
  contents = contents.replace(/#LINUX_DOCS_HTML_ENTRIES#/g, htmlGuides.linux);
  contents = contents.replace(/#MAC_DOCS_HTML_ENTRIES#/g, htmlGuides.macos);
  contents = contents.replace(/#WIN_DOCS_HTML_ENTRIES#/g, htmlGuides.windows);
  contents = contents.replace(/#RELEASE_NOTES_URL#/g, releaseNotes);

  // Substitute Linux installer info
  contents = contents.replace(/#LINUX64_CONNECT_VERSION#/g, info.linux.version);
  contents = contents.replace(/#LINUX64_CONNECT_INSTALLER#/g, info.linux.filename);

  // Substitute macOS installer info
  contents = contents.replace(/#MAC_CONNECT_VERSION#/g, info.macOS.version);
  contents = contents.replace(/#MAC_ONE_CLICK_INSTALLER#/g, info.macOS.filename);
  contents = contents.replace(/#MAC_INSTALLER#/g, info.macOS.filename);

  // Substitute Windows installer info
  contents = contents.replace(/#WIN_CONNECT_VERSION#/g, info.windows.version);
  contents = contents.replace(/#WIN_ONE_CLICK_INSTALLER#/g, info.windows.filename);
  contents = contents.replace(/#WIN_INSTALLER#/g, info.windows.filename);
  contents = contents.replace(/#WIN_FIPS_ONE_CLICK_INSTALLER#/g, info.windowsFips.filename);
  contents = contents.replace(/#WIN_FIPS_INSTALLER#/g, info.windowsFips.filename);

  const outputDir = path.join(BIN_DIR, '..');

  // Write contents to output
  const connectRefs = path.join(outputDir, 'connect_references.json');
  fs.writeFileSync(connectRefs, contents);
  // Minify
  const minifiedContents = JSON.stringify(JSON.parse(contents));
  const connectRefsMin = path.join(outputDir, 'connect_references.min.json');
  fs.writeFileSync(connectRefsMin, minifiedContents);

  // Build connect versions
  const connectVersions = path.join(__dirname, '..', 'resources', 'connectversions.js');
  let versContents = fs.readFileSync(connectVersions, 'utf8');
  versContents = versContents.replace(/#AS_CONNECT_REFERENCES#/g, contents);
  // Write contents
  let connectVersionsOutput = path.join(outputDir, 'connectversions.js')
  fs.writeFileSync(connectVersionsOutput, versContents);
  // Minify
  minify(connectVersionsOutput, path.join(outputDir, 'connectversions.min.js'))
}

async function copyInstallers () {
  if (env.SKIP_INSTALLERS) return;
  console.log('Bundling installers...');

  for (const platform of INSTALLERS) {
    const { installers, src } = platform;
    await copyByGlob(installers, src, BIN_DIR);
  };
}

// Copies installers matching the patterns to the destination directory
async function copyByGlob(patterns, src, dst) {
  for (const pattern of patterns) {
    const search = path.join(src, pattern);

    let matches = await findByGlob(search);
    if (matches.length === 0) {
        throw new Error(`Did not find any installers matching: ${search}`);
    }

    // Take the highest versioned installer if multiple matches exist
    const installer = matches[matches.length - 1];
    const name = path.basename(installer);
    const dir = path.join(dst, name);
    console.log(`Copying ${installer} to ${dir}`);
    fs.copyFileSync(installer, dir);

    INSTALLER_NAMES.push(name);
  };
}

// Returns array of matches
function findByGlob(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(files);
    });
  });
}

// Calculates installer source directory based on env variable options
function getInstallerDir (os) {
  let dir;

  if (env.OVERRIDE_INSTALLERS) dir = env.OVERRIDE_INSTALLERS;

  switch (os) {
    case 'linux':
      var { OVERRIDE_LINUX_INSTALLERS: override } = env;
      break;
    case 'macos':
      var { OVERRIDE_MAC_INSTALLERS: override } = env;
      break;
    case 'windows':
      var { OVERRIDE_WIN_INSTALLERS: override} = env;
      break;
    default:
  }

  if (override) dir = override;

  return dir || INSTALLER_DIR;
}

function getDocumentation () {
  const baseUrl = 'https://www.ibm.com/docs/en/aspera-connect';

  let versionArr = version.split('.');
  let short = `${versionArr[0]}.${versionArr[1]}`;
  let rnVer = `${versionArr[0]}${versionArr[1]}`;

  let releaseNotes = `${baseUrl}/${short}?topic=release-notes-aspera-connect-${rnVer}`;

  let htmlGuides = {};
  ['linux', 'macos', 'windows'].forEach((os) => {
    let link = `${baseUrl}/${short}?topic=aspera-connect-user-guide-${os}`;
    htmlGuides[os] = link;
  });

  return {
    htmlGuides,
    releaseNotes
  };
}

// Get installer name and version from copied installers
function getInstallerInfo () {
  // Check if we skipped packaging the installers
  if (INSTALLER_NAMES.length === 0) {
    INSTALLER_NAMES = ['', '', '', ''];
  }

  const info = {
    linux: getLinuxInstaller(),
    macOS: getMacInstaller(),
    windows: getWindowsInstaller(false),
    windowsFips: getWindowsInstaller(true)
  };
  // Output for easier debugging
  console.log(info);

  return info;
}

function getLinuxInstaller () {
  return {
    filename: INSTALLER_NAMES[0],
    version: getVersionFromString(INSTALLER_NAMES[0]),
    desc: 'Linux installer'
  };
}

function getMacInstaller () {
  return {
    filename: INSTALLER_NAMES[1],
    version: getVersionFromString(INSTALLER_NAMES[1]),
    desc: `macOS one click installer`
  };
}

function getWindowsInstaller (fips) {
    if (fips) {
      return {
        filename: INSTALLER_NAMES[3],
        version: getVersionFromString(INSTALLER_NAMES[3]),
        desc: `Windows FIPS-compliant one click installer`
      };
    }

    return {
      filename: INSTALLER_NAMES[2],
      version: getVersionFromString(INSTALLER_NAMES[2]),
      desc: `Windows one click installer`
    };
}

function getVersionFromString (s) {
  let match = s.match(/(\d+\.)(\d+\.)(\d+\.)(\d+)/g);
  if (match && match.length > 0) {
    return match[0];
  }

  return '';
}

function minify (src, dst) {
  const child = child_process.exec(`npx terser ${src} -m -c -o ${dst}`);
  child.on('exit', code => {
    console.log(`Terser exited with code ${code}`);
  });
}

// Create output directory if it does not exist
fs.mkdirSync(BIN_DIR, { recursive: true });

(async () => {
  try {
    await copyInstallers();
    await buildReferences();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();
