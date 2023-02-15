const tsConfig = require('../../../tsconfig.base.json');
const tsConfigPaths = require('tsconfig-paths');
const strapi = require('@strapi/strapi');
const path = require('path');
const { buildAdmin } = require('@strapi/strapi/lib/commands/builders');
const tsUtils = require('@strapi/typescript-utils');
const { validateTSConfigPaths } = require('./shared');

const appName = 'strapi';
const strapiRoot = path.join(__dirname, '..');
const distDirRoot = path.join(strapiRoot, 'dist');
const distDirApp = path.join(distDirRoot, 'packages', appName);

const paths = tsConfig.compilerOptions.paths;
validateTSConfigPaths(paths);

tsConfigPaths.register({
  baseUrl: distDirRoot,
  paths,
});

(async () => {
  // TODO enable logic to restart upon code change
  // The app itself needs to be compiled first, as the admin build depends on e.g. the user config located at `config/plugins.js`
  await tsUtils.compile(strapiRoot, { watch: false });

  // TODO enable hot module reloading
  await buildAdmin({ forceBuild: true, buildDestDir: distDirApp, srcDir: strapiRoot });

  const app = strapi({ appDir: strapiRoot, distDir: distDirApp });
  app.start();
})();
