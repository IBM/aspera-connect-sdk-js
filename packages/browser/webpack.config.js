const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const version = require('./package.json').version;

const commitHash = require('child_process')
  .execSync('git log --format=oneline --pretty=format:"%h" -1 .', { encoding: 'utf-8' })
  .trim();

const terserInstance = new TerserPlugin({
  cache: true,
  parallel: true,
  sourceMap: true
})

let bannerText = `  Revision: ${version}
  Revision date: ${new Date().toISOString().replace('T', ' ').substr(0, 19)}
  Git commit hash: ${commitHash}
  
  http://www.asperasoft.com
  Copyright IBM Corp. 2008, ${new Date().getFullYear()}`

const plugins = [
  new webpack.BannerPlugin({
    banner: () => { return bannerText }
  })
];

const bundleConfig = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'index'),
  resolve: {
    extensions: ['.js', '.ts']
  },
  output: {
    library: ['AW4'],
    libraryTarget: "window",
    // umdNamedDefine: true,
    globalObject: 'typeof self !== \'undefined\' ? self : this',
    path: path.join(__dirname, 'build'),
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
