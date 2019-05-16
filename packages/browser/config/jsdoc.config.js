module.exports = {
    opts: {
        destination: 'docs',
        readme: 'README.md',
        recurse: true,
        template: "jsdoc-template",
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
