module.exports = function(config) {
  config.set({
    basePath: process.cwd(),
    proxies: {
      "/src/": "http://localhost:8080/base/src"
    },
    customLaunchers: {
      ChromeCustom: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    frameworks: ['mocha'],
    files: [
      'test/integration/vendor/*.js',
      'test/integrationvendor/mocha.css',
      'dist/js/connect-sdk.js',
      'test/integration/shared/*.js',
      'test/integration/helper.js',
      'test/integration/connect.js',
      'test/integration/utils.js',
      'test/integration/logger.js'
    ],
    exclude: [],
	   client: {
	      mocha: {
          reporter: 'html'
        }
	   },
    browserNoActivityTimeout: 40000,
    reporters: ['progress', 'mocha'],
    port: 8080,
    colors: true,
    browserConsoleLogOptions: {
      terminal: false
    },
    logLevel: config.LOG_DISABLE,
    browsers: ['Chrome'],
    singleRun: true,
  });
};
