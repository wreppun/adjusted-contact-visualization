const path = require('path');

module.exports = function (env) {
  return {
    devtool: 'cheap-eval-source-map',
    entry: './src/app.js',
    output: {
      path: path.join(__dirname, '../public/assets'),
      filename: 'bundle.js'
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        'vue': 'vue/dist/vue.common.js'
      }
    },
    devServer: {
      // port: 8080,
      // host: 'localhost',
      noInfo: false,
      contentBase: './public',
      publicPath: '/assets/'
    }
  };
};
