import * as fs from 'fs';
// @ts-ignore
import * as minimist from 'minimist';
import * as path from 'path';

//import {baseConfig} from './es6.base.config';

// Allow for specific demos to built with a --demos=<someName>,<someOtherName>
// CLI format.

// @ts-ignore
const args =   (process.argv.slice(2));
// @ts-ignore
const specified: string[] = args.demos ? args.demos.split(',') : [];

const getDemos = (source: fs.PathLike) => {
  return fs.readdirSync(source)
      .filter(name => path.extname(name) === '.ts')
      .map(name => path.basename(name, '.ts'))
      .filter(demo => specified.length ? specified.includes(demo) : true);
};

const entries = getDemos('./production').reduce((obj, name) => {
  // @ts-ignore
  obj[name] = `./production/${name}.ts`;
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
    path: path.resolve(__dirname, '../production'),
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {loader: 'ts-loader', options: {configFile: 'tsconfig.es6.json'}}
    }],
  },
  devServer: {
    contentBase: path.join(__dirname, '../production'),
    port: 8080,
  },
};