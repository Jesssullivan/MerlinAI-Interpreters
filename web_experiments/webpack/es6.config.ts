import * as glob from 'glob';
import * as path from 'path';
const Terser = require('terser-webpack-plugin');

const src = path.resolve(__dirname, '../src');
const matches = glob.sync('*.ts', {cwd: src});

const entries = matches.reduce((entries, entry) => {
  if (!entry.match(/test|\.d\./)) {
    // @ts-ignore
    entries[entry.replace(/\.ts$/, '')] = './' + entry;
  }
  return entries;
}, {});

module.exports = {
  mode: 'production',
  context: src,
  entry: entries,
  optimization: {
      minimize: true,
      minimizer: [new Terser({terserOptions: {ecma: 8}, parallel: true})]
  },
  node: {fs: 'empty'},
  resolve: {
      extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    chunkFilename: '_lib/[name].js',
    globalObject: 'self',
    library: '[name]',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, '../es6')
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {loader: 'ts-loader', options: {configFile: 'tsconfig.es6.json'}}
    },
    {
      test: /\.css$/,
      use: [
        'style-loader',
        'css-loader'
      ]
    }
    ],
  },
  // Don't package these huge dependencies with the bundles, since we'd
  // be downloading duplicates.
  externals: {

    '@tensorflow/tfjs': {commonjs: '@tensorflow/tfjs', commonjs2: '@tensorflow/tfjs', amd: 'tf', root: 'tf'}
  }
};
