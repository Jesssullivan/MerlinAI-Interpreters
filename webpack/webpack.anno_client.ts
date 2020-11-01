import * as path from 'path';

// @ts-ignore
const args = (process.argv.slice(2));
// @ts-ignore
const specified: string[] = args.demos ? args.demos.split(',') : [];

module.exports = {
  node: {fs: 'empty'},
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: 'inline-source-map',
  mode: 'development',
  entry:'./src/annotator_client.js',
  output: {
    filename: 'annotator_client_bundle.js',
    path: path.resolve(__dirname, '../demos'),
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {loader: 'ts-loader', options: {configFile: 'tsconfig.es6.json'}}
    }],
  },
  devServer: {
    contentBase: path.join(__dirname, '../demos'),
    port: 8080,
  },
};
