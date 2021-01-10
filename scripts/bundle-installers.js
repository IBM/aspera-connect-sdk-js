const child_process = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const version = require('../package.json').version;

const { env } = process;
const ARGS = process.argv.slice(2);
const OUTPUT_DIR = path.join(__dirname, '..', ARGS[0], 'bin');
const INSTALLER_DIR = path.join(__dirname, '..', 'imports');

const INSTALLERS = [
  {
    installers: ['ibm-aspera-connect-*-linux-g2.12-64.tar.gz'],
    src: getInstallerDir('linux')
  },
  {
    installers: ['IBMAsperaConnectInstallerOneClick-*.dmg', 'IBMAsperaConnectInstaller-*.dmg'],
    src: getInstallerDir('macos')
  },
  {
    installers: ['IBMAsperaConnectSetup-ML-!(FIPS)*.exe', 'IBMAsperaConnect-ML-!(FIPS)*.msi', 'IBMAsperaConnectSetup-ML-FIPS-*.exe', 'IBMAsperaConnect-ML-FIPS-*.msi'],
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
  contents = contents.replace(/#MAC_DOCS_HTML_ENTRIES#/g, htmlGuides.osx);
  contents = contents.replace(/#WIN_DOCS_HTML_ENTRIES#/g, htmlGuides.win);
  contents = contents.replace(/#RELEASE_NOTES_URL#/g, releaseNotes);

  // Substitute Linux installer info
  contents = contents.replace(/#LINUX64_CONNECT_VERSION#/g, info.linux.version);
  contents = contents.replace(/#LINUX64_CONNECT_INSTALLER#/g, info.linux.filename);

  // Substitute macOS installer info
  contents = contents.replace(/#MAC_CONNECT_VERSION#/g, info.macOS.oneClick.version);
  contents = contents.replace(/#MAC_ONE_CLICK_INSTALLER#/g, info.macOS.oneClick.filename);
  contents = contents.replace(/#MAC_INSTALLER#/g, info.macOS.dmg.filename);

  // Substitute Windows installer info
  contents = contents.replace(/#WIN_CONNECT_VERSION#/g, info.windows.oneClick.version);
  contents = contents.replace(/#WIN_ONE_CLICK_INSTALLER#/g, info.windows.oneClick.filename);
  contents = contents.replace(/#WIN_INSTALLER#/g, info.windows.msi.filename);
  contents = contents.replace(/#WIN_FIPS_ONE_CLICK_INSTALLER#/g, info.windowsFips.oneClick.filename);
  contents = contents.replace(/#WIN_FIPS_INSTALLER#/g, info.windowsFips.msi.filename);

  // Write contents to output and minify
  const output = path.join(OUTPUT_DIR, '..', 'connect_references.json');
  fs.writeFileSync(output, contents);
  minify('json', output, path.join(OUTPUT_DIR, '..', 'connect_references.min.json'))

  // Build and write contents to connectversions.js and minify
  const versJs = path.join(__dirname, '..', 'resources', 'connectversions.js');
  let versContents = fs.readFileSync(versJs, 'utf8');
  versContents = versContents.replace(/#AS_CONNECT_REFERENCES#/g, contents);
  const versJsOutput = path.join(OUTPUT_DIR, '..', 'connectversions.js');
  fs.writeFileSync(versJsOutput, versContents);
  minify('js', versJsOutput, path.join(OUTPUT_DIR, '..', 'connectversions.min.js'))
}

async function copyInstallers () {
  if (env.SKIP_INSTALLERS) return;
  console.log('Bundling installers...');

  for (const platform of INSTALLERS) {
    const { installers, src } = platform;
    await copyByGlob(installers, src, OUTPUT_DIR);
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
  const baseUrl = 'https://www.ibm.com/support/knowledgecenter';
  let short = version.split('.');
  short = `${short[0]}.${short[1]}`;

  // XXX 3.11.1 RN will be appended to 3.11.0 RN
  let pinned = '3.11.0'
  let releaseNotes = `${baseUrl}/SSXMX3_${short}/connect_relnotes/${pinned}.html`;

  let htmlGuides = {};
  ['linux', 'osx', 'win'].forEach((os) => {
    let link = `${baseUrl}/SSXMX3_${short}/connect_user_${os}/guide.html`;
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
    INSTALLER_NAMES = ['', '', '', '', '', '', ''];
  }

  const info = {
    linux: getLinuxInstaller(),
    macOS: {
      oneClick: getMacInstaller(true),
      dmg: getMacInstaller(false)
    },
    windows: {
      oneClick: getWindowsInstaller(true, false),
      msi: getWindowsInstaller(false, false)
    },
    windowsFips: {
      oneClick: getWindowsInstaller(true, true),
      msi: getWindowsInstaller(false, true)
    }
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

function getMacInstaller (oneClick) {
  return {
    filename: INSTALLER_NAMES[oneClick ? 1 : 2],
    version: getVersionFromString(INSTALLER_NAMES[oneClick ? 1 : 2]),
    desc: `macOS ${oneClick ? 'one click' : 'regular'} installer`
  };
}

function getWindowsInstaller (oneClick, fips) {
    if (fips) {
      return {
        filename: INSTALLER_NAMES[oneClick ? 5 : 6],
        version: getVersionFromString(INSTALLER_NAMES[oneClick ? 5 : 6]),
        desc: `Windows FIPS-compliant ${oneClick ? 'one click' : 'regular'} installer`
      };
    }

    return {
      filename: INSTALLER_NAMES[oneClick ? 3 : 4],
      version: getVersionFromString(INSTALLER_NAMES[oneClick ? 3 : 4]),
      desc: `Windows ${oneClick ? 'one click' : 'regular'} installer`
    };
}

function getVersionFromString (s) {
  let match = s.match(/(\d+\.)(\d+\.)(\d+\.)(\d+)/g);
  if (match && match.length > 0) {
    return match[0];
  }

  return '';
}

function minify (type, src, dst) {
  const minifier = path.join(__dirname, '..', 'scripts', '3rdparty', 'minifier', 'minify-tool.js');
  const child = child_process.exec(`node ${minifier} --${type} ${src} > ${dst}`);
  child.on('exit', code => {
    console.log(`Minifier exited with code ${code}`);
  });
}

// Create output directory if it does not exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  try {
    await copyInstallers();
    await buildReferences();
  } catch (err) {
    throw new Error(`Could not bundle installers: ${err}`);
  }
})();
