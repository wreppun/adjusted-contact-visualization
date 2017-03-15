const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = function (env) {
  return {
    devtool: 'source-map',
    entry: './src/app.js',
    output: {
      path: path.resolve(__dirname, '../public/assets'),
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new UglifyJSPlugin()
    ],
    resolve: {
      extensions: ['.js'],
      alias: {
        'vue': 'vue/dist/vue.common.js'
      }
    }
  };
};
