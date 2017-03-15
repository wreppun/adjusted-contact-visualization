function buildConfig (env) {
  return require('./config/webpack.config.' + env + '.js')({ env: env });
}

module.exports = buildConfig;
