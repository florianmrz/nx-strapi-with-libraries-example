const tsConfig = require('../../../tsconfig.base.json');
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');
const { buildAdmin } = require('@strapi/strapi/lib/commands/builders');
const tsUtils = require('@strapi/typescript-utils');
const { validateTSConfigPaths } = require('./shared');

process.env.NODE_ENV = 'production';

const appName = 'strapi';
const strapiRoot = path.join(__dirname, '..');
const distDirRoot = path.join(strapiRoot, '../../dist/packages', appName);
const distDirApp = path.join(distDirRoot, 'packages', appName);

const paths = tsConfig.compilerOptions.paths;
validateTSConfigPaths(paths);

tsConfigPaths.register({
  baseUrl: distDirRoot,
  paths,
});

(async () => {
  // The app itself needs to be compiled first, as the admin build depends on e.g. the user config located at `config/plugins.js`
  await tsUtils.compile(strapiRoot, {
    watch: false,
    configOptions: {
      options: {
        outDir: distDirRoot,
      },
    },
  });

  await buildAdmin({ forceBuild: true, buildDestDir: distDirApp, srcDir: strapiRoot });
})();
