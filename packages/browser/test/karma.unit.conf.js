const path = require('path');
const webpackConfig = require('../webpack.config')[0];

module.exports = function(config) {
    config.set({
        basePath: process.cwd(),
        frameworks: ["mocha"],
        reporters: ["coverage-istanbul"],
        files: [
            "test/*.ts"
        ],
        plugins: [
          'karma-mocha',
          'karma-webpack',
          'karma-chrome-launcher',
          'karma-coverage-istanbul-reporter',
        ],
        preprocessors: {
            "./**/*.ts": ["webpack"]
        },
        mime: {
          "text/x-typescript": ["ts"],
        },
        webpack: {
          module: webpackConfig.module,
          resolve: webpackConfig.resolve,
          mode: 'production'
        },
        webpackMiddleware: {
          noInfo: true
        },
        coverageIstanbulReporter: {
          reports: ['html', 'lcovonly', 'text-summary'],
          dir: path.join(__dirname, 'coverage'),
          fixWebpackSourcePaths: true,
          'report-config': {
            html: {
              subdir: 'html'
            }
          }
        },
        browsers: ["ChromeHeadless"],
        colors: true,
        logLevel: config.LOG_INFO
    });
};