const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const NAME = 'auto-topbar';
const OUTPUT_DIR = path.join(__dirname, '..', 'dist', 'v4', 'install', NAME);
const PROJECT_DIR = path.join(__dirname, '..', 'packages', 'legacy-install', NAME);

const build = () => {
  try {
    const topbar = path.join(PROJECT_DIR, 'index.html');
    let contents = fs.readFileSync(topbar, 'utf8');

    // Substitute translations
    const translations = localize();
    contents = contents.replace(/#LOCALIZE_JS#/, translations);

    // Substitute styles
    const css = path.join(PROJECT_DIR, 'install.css');
    const styles = fs.readFileSync(css);
    contents = contents.replace(/#INSTALL_CSS#/, styles);

    // Substitute javascript
    const js = path.join(PROJECT_DIR, 'install.js');
    const code = fs.readFileSync(js);
    contents = contents.replace(/#INSTALL_JS#/, code);

    // Write contents to output
    const output = path.join(OUTPUT_DIR, 'index.html');
    fs.mkdir(OUTPUT_DIR, { recursive: true }, (err) => {
      if (err) throw err;
    });
    fs.writeFileSync(output, contents);

  } catch (err) {
    throw new Error(`Failed to build blue banner: ${err}`);
  }
};

const localize = () => {
  const localizeFile = path.join(PROJECT_DIR, 'localize-intro.js');

  let data = fs.readFileSync(localizeFile, 'utf8');

  ['en-US', 'es-ES', 'fr-FR', 'ja-JP', 'zh-CN', 'ko-KR', 'nl-NL'].forEach((locale, i) => {
    const regex = new RegExp(`#LOCALE_${locale.replace('-', '_').toUpperCase()}#`);
    const file = path.join(PROJECT_DIR, `localize-${locale}.js`);

    const translation = fs.readFileSync(file, 'utf8');
    data = data.replace(regex, translation);
  });

  return data;
};

const minify = () => {
  const minifier = path.join(__dirname, '..', 'scripts', '3rdparty', 'minifier', 'minify-tool.js');
  const source = path.join(OUTPUT_DIR, 'index.html');
  const output = path.join(OUTPUT_DIR, 'index.min.html');

  const child = child_process.exec(`node ${minifier} --html ${source} > ${output}`);
  child.on('exit', code => {
    console.log(`Minifier exited with code ${code}`);
  });
}

// Blue banner
build();
minify();
