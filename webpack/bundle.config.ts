// @ts-ignore
const fs = require('fs');
const minimist = require('minimist');
const path = require('path');

const args = minimist(process.argv.slice(2));
const specified: string[] = args.demos ? args.demos.split(',') : [];

const getDemos = source => {
  return fs.readdirSync(source)
      .filter(name => path.extname(name) === '.html' && name !== 'index.html')
      .map(name => path.basename(name, '.html'))
      .filter(demo => specified.length ? specified.includes(demo) : true);
};

const entries = getDemos('./demos').reduce((obj, name) => {
  obj[name] = `./demos/${name}.ts`;
  return obj;
}, {});

module.exports = {
  node: {fs: 'empty'},
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: 'inline-source-map',
  mode: 'development',
  entry: {
    ...entries,
  },
  output: {
    filename: '[name]_bundle.js',
    path: path.resolve(__dirname, '../demos'),
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {loader: 'ts-loader', options: {configFile: 'tsconfig.json'}}
    }],
  },
  devServer: {
    contentBase: path.join(__dirname, '../demos'),
    port: 8080,
  },
};