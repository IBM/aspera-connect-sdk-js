const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { version } = require('./package.json');

const branch = require('child_process')
  .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' })
  .trim();

const suffix = branch === 'main' ? '' : `-${branch}`;
const date = new Date().toISOString().replace('T', ' ').substr(0, 19);
const year = new Date().getFullYear();
const banner = `@banner\nConnect SDK v${version}${suffix}\n${date}\nCopyright IBM Corp. 2008, ${year}`;

const bundleConfig = {
  entry: './src/index.ts',
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, 'ui/build/inline/')
    },
    extensions: ['.js', '.ts']
  },
  output: {
    path: path.resolve(__dirname, 'dist/js'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.html$/i,
        type: 'asset/source'
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: /@banner/i,
          }
        }
      })
    ]
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  plugins: [
    new webpack.BannerPlugin(banner)
  ]
}

module.exports = [
  {
    ...bundleConfig,
    output: {
      ...bundleConfig.output,
      filename: 'connect-sdk.js'
    },
    devtool: 'source-map'
  },
  {
    ...bundleConfig,
    output: {
      ...bundleConfig.output,
      filename: 'connect-sdk.min.js'
    }
  }
];
