import * as path from 'path';

module.exports = {
  resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  devtool: 'inline-source-map',
  mode: 'development',
  entry:'./src/annotator_tool.tsx',
  output: {
    filename: 'leaflet.annotation.js',
    path: path.resolve(__dirname, '../demos'),
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
  devServer: {
    contentBase: path.join(__dirname, '../demos'),
    port: 8080,
  }
};
