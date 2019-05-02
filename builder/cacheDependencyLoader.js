const loaderUtils = require('loader-utils');

function cacheDependencyLoader(source, map, meta) {
  const {dependencies = [], contextDependencies = []} = loaderUtils.getOptions(this);
  dependencies.forEach((filename) => {
    this.addDependency(filename);
  });
  contextDependencies.forEach((filename) => {
    this.addContextDependency(filename);
  });
  this.callback(null, source, map, meta);
  return;
}

module.exports = cacheDependencyLoader;