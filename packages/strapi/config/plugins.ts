export default ({ env }) => {
  return {
    'example-plugin': {
      enabled: true,
      // The path to the plugin is different depending on whether or not we are running the production build or during local development
      resolve: `./${
        process.env.NX_STRAPI_SCRIPT === 'build' ? 'packages/strapi/' : ''
      }src/plugins/example-plugin`,
    },
  };
};
