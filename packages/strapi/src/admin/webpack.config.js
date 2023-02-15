const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = (config, _webpack) => {
  config.resolve.plugins = [
    new TsconfigPathsPlugin({
      configFile: 'tsconfig.base.json',
      baseUrl: path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist/packages/strapi' : 'packages/strapi/dist'),
      extensions: ['.ts', '.js'],
    }),
  ];
  return config;
};
