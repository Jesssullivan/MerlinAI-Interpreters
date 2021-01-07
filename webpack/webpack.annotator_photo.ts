import * as path from 'path';

module.exports = {
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: 'inline-source-map',
  mode: 'development',
  entry:'./demos/annotator_photo.ts',
  output: {
    filename: 'annotator_photo_bundle.js',
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
