module.exports = {
    version: '4.0.1',
    opts: {
        destination: 'build/docs',
        readme: 'docs/GettingStarted.md',
        recurse: true,
        template: "template"
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
