module.exports = {
  version: '4.0.1',
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
