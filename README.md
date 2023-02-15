# Making Strapi work with nx libraries

## What is this about?

This repo includes an example setup to get [Strapi](https://github.com/strapi/strapi) to work with nx libraries.

When starting the project, you can see the log
```
Strapi is starting: bar
```
to demonstrate server-side import of nx libraries and
```
The example plugin is running: bar
```
to demonstrate the import inside of a admin panel plugin.

More information about the issue at hand can be found in [this Github issue](https://github.com/TriPSs/nx-extend/issues/49).

There are a few issues when trying to get this to work, mainly because Strapi expects a specific folder structure to exist at various points during the build time and during runtime.

I've decided to create scripts to get this to work with an nx setup.
One is responsible for serving the project locally, one is to build it and one to run the built output in production.

More on the scripts below.

---

There are two key components to get Strapi to work with nx libraries:

## 1. Handle the new folder structure due to the compiled libraries

Before, the dist folder looked like this:
```
dist/
├─ src/ (server-side code)
├─ config/ (various config files)
├─ build/ (admin panel)
```

Now, since we include the libraries, this folder structure changes to:
```
dist/
├─ packages/
│  ├─ my-app/
│  │  ├─ src/ (server-side code)
│  │  ├─ config/ (various config files)
│  │  ├─ build/ (admin panel)
│  ├─ my-lib/
```

This needs to be accounted for in various places, e.g. when resolving local plugins:

```ts
// config/plugins.ts
// ...
    'my-plugin': {
      enabled: true,
      resolve: `./${isRunningInServeMode ? '' : 'packages/my-app/'}src/plugins/my-plugin`,
    },
// ...
```


## 2. Use of tsconfig-paths

I'm making heavy use of the [tsconfig-paths](https://www.npmjs.com/package/tsconfig-paths) plugin in order to make the imports of the nx libraries map to the respective files.
It will patch the `require()` calls to resolve the nx library imports to their actual files. This is needed as the compiled code of Strapi will still include imports such as `require('@my-project/my-lib')` that need to be resolved to the correct library.

For admin panel plugins to access nx libraries, we need to include the [tsconfig-paths-webpack-plugin](https://www.npmjs.com/package/tsconfig-paths-webpack-plugin) plugin in the admin webpack configuration.

```js
// packages/my-app/src/admin/webpack.config.js
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (config, webpack) => {
  config.resolve.plugins = [
    new TsconfigPathsPlugin({
      configFile: 'tsconfig.base.json',
      baseUrl: process.env.NODE_ENV === 'production' ? 'dist/packages/cms' : 'packages/cms/dist',
      extensions: ['.ts', '.js'],
    }),
  ];
  return config;
};
```

⚠️**Important note**: Make sure that the path entries in your base TS config don't use a file extension such as `.ts`. Because the transpiled files will end in `.js`, those imports will fail!

Simply omit the extension, e.g.:
```js
// tsconfig.base.json
"@my-project/shared/example": ["packages/shared/src/example.ts"] // fails
"@my-project/shared/example": ["packages/shared/src/example"]    // works
```

We also need to update the tsconfig files for both the admin panel as well as the server-side one.
They need to extend our base tsconfig file that includes our `paths` options resolving to our libraries.

```js
// packages/my-app/tsconfig.json
{
  // We need to extend our base tsconfig file
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    // "outDir": "dist",
    // add all other compilerOptions from https://github.com/strapi/strapi/blob/main/packages/utils/typescript/tsconfigs/server.json
    // ...
  },
}
```
```js
// packages/my-app/src/admin/tsconfig.json
{
  // We need to extend our base tsconfig file
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    // "module": "ES2020",
    // add all other compilerOptions from https://github.com/strapi/strapi/blob/main/packages/utils/typescript/tsconfigs/admin.json
    // ...
  },
}
```

## Scripts to serve, build and start (a production build)

To serve and build the project using the local script, I updated the project configuration:
```js
// packages/my-app/project.json
// ...
"targets": {
  "serve": {
    "executor": "nx:run-commands",
    "options": {
      "command": "node packages/my-app/scripts/serve.js",
      "envFile": "packages/my-app/.env"
    }
  },
  "build": {
    "executor": "nx:run-commands",
    "options": {
      "command": "node packages/my-app/scripts/build.js",
      "envFile": "packages/my-app/.env"
    }
  }
}
// ...
```

## Running in production

A few things need to copied to the dist folder `dist/packages/my-app` (in my case, this is done in a Dockerfile):
- `/tsconfig.base.json` -> `dist/packages/my-app/tsconfig.base.json` (required for the `tsconfig-paths` plugin to work)
- `packages/my-app/src/plugins/my-plugin/strapi-server.js` -> `dist/packages/my-app/packages/my-app/src/plugins/my-plugin/strapi-server.js` (omitted during build)
- `packages/my-app/assets` -> `dist/packages/my-app/assets`
- `packages/my-app/database` -> `dist/packages/my-app/database`
- `packages/my-app/public` -> `dist/packages/my-app/public`
- `packages/my-app/favicon.ico` -> `dist/packages/my-app/favicon.ico`
- `packages/my-app/package.json` -> `dist/packages/my-app/package.json`
- A custom script that acts as the entrypoint for the app (see the script snippet `start.js` above)


## Caveats:
- I haven't figured out how to make the Strapi app restart upon a file being changed
- I haven't figured out how to properly run the admin panel in watch mode
