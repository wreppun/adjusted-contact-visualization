const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = function (env) {
  return {
    devtool: 'source-map',
    entry: ['./src/app.js', './src/lib/googleAnalytics.js'],
    output: {
      path: path.resolve(__dirname, '../public/assets'),
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new UglifyJSPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      })
    ],
    resolve: {
      extensions: ['.js'],
      alias: {
        'vue': 'vue/dist/vue.common.js'
      }
    },
    module: {
      rules: [{
        test: /\.md$/,
        use: [
          {
            loader: 'html-loader'
          },
          {
            loader: 'markdown-loader',
            options: {
                /* your options here */
            }
          }
        ]
      }]
    }
  };
};
