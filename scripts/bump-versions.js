const child_process = require('child_process');
const replace = require('replace-in-file');

const ARGS = process.argv.slice(2);
let version;

switch (ARGS[0]) {
  case '--release-as':
    console.log(`using version: ${ARGS[1]}`);
    version = ARGS[1];
    break;
  default:
    console.log('Expected --release-as');
    process.exit(1);
}

if (version) {
  // Change the version used throughout all package.json files
  const child = child_process.exec(`standard-version --no-verify --skip.{changelog,commit,tag}=true --release-as ${version}`, { encoding: 'utf8' });
  child.stdout.on('data', (data) => {
    console.log(data);
  });
  child.on('exit', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  // Change the version used by AW4.__VERSION__ and docs
  files = ['packages/browser/src/version.ts', 'packages/browser/config/jsdoc.config.js', 'packages/browser/GettingStarted.md'];
  replace({
    files: files,
    from: /\d+\.\d+.\d+(?:-\w+(?:\.\w+)?)?/g,
    to: version
  })
    .then(results => {
      console.log(`Modified ${results[0].file} : ${results[0].hasChanged}`);
    })
    .catch(error => {
      console.log(`Error: ${error}`);
      process.exit(1);
    })
} else {
  throw new Error(`Must provide version. Given: ${version}`);
}
