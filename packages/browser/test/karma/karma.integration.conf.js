const puppeteer = require('puppeteer');
process.env.CHROME_BIN = puppeteer.executablePath();

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
      'build/asperaweb-4.js',
      'test/integration/shared/*.js',
      'test/integration/helper.js',
      'test/integration/connect.js',
      'test/integration/dragndrop.js',
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
    logLevel: config.LOG_DISABLE,
    browsers: ['Chrome'],
    singleRun: true,
  });
};
