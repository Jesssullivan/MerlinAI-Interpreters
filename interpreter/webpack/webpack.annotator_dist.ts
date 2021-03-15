import * as path from 'path';
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// const thisBuild = new Date().toISOString().split('T', 1);

module.exports = {
  resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  entry: {
    import: './src/annotator_tool.tsx',
  },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist'),
    chunkFilename: '[id].[hash:16].js',
    filename: 'leaflet.annotation.js'
  },
  module: {
    rules: [
              {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.tsx?$/,
        exclude: /'node_modules'/,
        use: {
          loader: 'ts-loader', options: {configFile: 'tsconfig.es6.json'}
        }
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
