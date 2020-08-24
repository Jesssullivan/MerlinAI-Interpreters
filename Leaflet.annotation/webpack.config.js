const path = require("path");
const webpack = require("webpack");
const pkg = require('./package.json');
const libraryName= pkg.name;

module.exports = {
    entry: path.join(__dirname, "./src/Leaflet.annotation.js"),
    output: {
        path: path.resolve(__dirname, "dist/"),
        filename: "leaflet.annotation.js",
        library: libraryName,
        libraryTarget: 'umd',
        publicPath: '/dist/',
        umdNamedDefine: true
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
    devtool : 'inline-source-map',
    mode: "development",
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: { presets: ["@babel/preset-env", "@babel/preset-react"] }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'url-loader'
                ]
            }
        ]
    },
    resolve: {
        extensions: ["*", ".js", ".jsx"],
        alias: {
            'react': path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        }
    },
    externals: {
        // Don't bundle react or react-dom
        react: {
            commonjs: "react",
            commonjs2: "react",
            //amd: "React",
            root: "React"
        },
        "react-dom": {
            commonjs: "react-dom",
            commonjs2: "react-dom",
            //amd: "ReactDOM",
            root: "ReactDOM"
        }
    }
};