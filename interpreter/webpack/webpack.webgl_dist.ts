
import * as path from 'path';
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  entry: {
    import :'./demos/webgl_float_test.ts',
  },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../demos'),
    chunkFilename: '[id].[hash:16].js',
    filename: 'webgl_float_test_bundle.js'
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {loader: 'ts-loader', options: {configFile: 'tsconfig.es6.json'}}
    },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }],
  },
   optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        include: /\/includes/,
      }),
    new TerserPlugin()]
  }
};
