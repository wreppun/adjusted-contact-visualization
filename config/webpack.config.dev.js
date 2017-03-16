const path = require('path');

module.exports = function (env) {
  return {
    devtool: 'eval-source-map',
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
    }
  };
};
