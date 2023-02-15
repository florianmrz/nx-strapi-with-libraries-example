const tsConfig = require('../tsconfig.base.json');
const tsConfigPaths = require('tsconfig-paths');
const { validateTSConfigPaths } = require('./shared');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
process.env.NX_STRAPI_SCRIPT = 'build';

const strapi = require('@strapi/strapi');
const path = require('path');

const appName = 'strapi';
const strapiRoot = path.join(__dirname, '..');
const distDirRoot = strapiRoot;
const distDirApp = path.join(distDirRoot, 'packages', appName);

const paths = tsConfig.compilerOptions.paths;
validateTSConfigPaths(paths);

tsConfigPaths.register({
  baseUrl: distDirRoot,
  paths,
});

(async () => {
  const app = strapi({ appDir: strapiRoot, distDir: distDirApp });
  app.start();
})();
