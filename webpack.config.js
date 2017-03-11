const path = require('path');

module.exports = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'assets'),
    filename: 'bundle.js'
  },
  devtool: 'cheap-eval-source-map',
  resolve: {
    extensions: ['.js'],
    alias: {
      'vue': 'vue/dist/vue.common.js'
    }
  },

  devServer: {
    publicPath: '/assets/'
  }

};
