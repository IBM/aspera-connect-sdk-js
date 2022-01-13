const version = require('../package.json').version;

module.exports = {
  version: version,
  opts: {
      destination: 'dist/docs',
      readme: 'docs/GettingStarted.md',
      recurse: true,
      template: 'template'
  },
  plugins: ['plugins/markdown'],
  source: {
    includePattern: '.+\\.js(doc|x)?$'
  },
  templates: {
    default: {
      outputSourceFiles: false,
    },
    collapse: false,
    disableSort: false,
    referenceTitle: 'IBM Aspera Connect SDK'
  }
}
