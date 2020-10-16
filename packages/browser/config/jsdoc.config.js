module.exports = {
    version: '3.10.1',
    opts: {
        destination: 'docs',
        readme: 'GettingStarted.md',
        recurse: true,
        template: "jsdoc-template"
    },
    plugins: ["plugins/markdown"],
    templates: {
      default: {
        outputSourceFiles: false,
      },
      collapse: false,
      disableSort: false,
      referenceTitle: "IBM Aspera Connect SDK"
    }
}
