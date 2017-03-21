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
