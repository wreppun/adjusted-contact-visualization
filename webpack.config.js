const path = require('path');

module.exports = {
  entry: './app.js',
  output: {
    path: path.resolve(__dirname, 'assets'),
    filename: 'bundle.js',
    library: 'BipCartographer'
  },
  devtool: 'cheap-eval-source-map'
};
