const fs = require('fs-extra');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const version = require('./package.json').version;

const outputDir = 'dist';

const hash = require('child_process')
  .execSync('git log --format=oneline --pretty=format:"%h" -1 .', { encoding: 'utf-8' })
  .trim();

const branch = require('child_process')
  .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' })
  .trim();

const terserInstance = new TerserPlugin({
  cache: true,
  parallel: true,
  sourceMap: true
});

const suffix = `-${branch !== 'main' ? branch : ''}`;
const date = new Date().toISOString().replace('T', ' ').substr(0, 19);
const year = new Date().getFullYear();
const banner = `Connect SDK v${version}${suffix} (${hash})\n${date}\nCopyright IBM Corp. 2008, ${year}`;

const emptyFileText = `/*\nDEPRECATED: This file should no longer be included and will be removed in a future release. Functionality has been bundled into asperaweb-4.js and asperaweb-4.min.js.\n*/`;
// For backwards-compatibility
['connectinstaller-4.js', 'connectinstaller-4.min.js'].forEach(filename => {
  fs.outputFile(path.join(__dirname, outputDir, 'js', filename), emptyFileText);
});

const plugins = [
  new webpack.BannerPlugin(banner)
];

const bundleConfig = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'index'),
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    alias: {
      lib: path.resolve(__dirname, 'src/')
    },
    extensions: ['.js', '.ts']
  },
  output: {
    path: path.join(__dirname, outputDir, 'js'),
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        include: [path.resolve(__dirname, "./src")],
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          transpileOnly: false
        }
      }
    ]
  },
  plugins: [
    ...plugins
  ]
}

module.exports = [
  {
    ...bundleConfig,
    output: {
      ...bundleConfig.output,
      filename: 'asperaweb-4.js'
    },
    devtool: 'source-map'
  },
  {
    ...bundleConfig,
    mode: "production",
    output: {
      ...bundleConfig.output,
      filename: 'asperaweb-4.min.js'
    },
    plugins: [
      ...plugins,
      terserInstance
    ]
  }
];
