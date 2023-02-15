import { foo } from '@nx-strapi/example';

export default {
  register() {
    console.log(`The example plugin is running: ${foo}`);
  },
};
