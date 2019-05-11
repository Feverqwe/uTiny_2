require('./defaultBuildEnv');
const path = require('path');
const zipDirectory = require('./zipDirectory');

const compressDist = () => {
  const ext = 'zip';
  const dist = BUILD_ENV.outputPath;
  const outputPath = path.join(BUILD_ENV.outputPath, '../');

  return zipDirectory({dirs: [dist]}, path.join(outputPath, `${BUILD_ENV.distName}.${ext}`));
};

compressDist();