/**
 * We cannot allow `.ts` file extensions being used in the paths (although that is allowed)
 * as those files have been transpiled and - at runtime - have the `.js` extension.
 */
function validateTSConfigPaths(paths) {
  for (const moduleName in paths) {
    paths[moduleName].forEach(entry => {
      const extensionRegex = /\.ts$/;
      if (extensionRegex.test(entry)) {
        throw new Error(
          `The tsconfig path entry "${moduleName}" points to a file ending in \`.ts\` (${entry}), please omit the file extension:
          ${entry} -> ${entry.replace(extensionRegex, '')}`
        );
      }
    });
  }
}

module.exports = {
  validateTSConfigPaths,
};
