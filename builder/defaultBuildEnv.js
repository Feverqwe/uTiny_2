const getArgvValue = require('./getArgvValue');
const path = require('path');

const mode = getArgvValue('--mode') || 'development';

const version = require('../src/manifest').version;

global.BUILD_ENV = {
  distName: `uTiny-${version}`,
  outputPath: path.join(__dirname, '../dist/'),
  mode: mode,
  devtool: mode === 'development' ? 'source-map' : 'none',
  version: version,
  babelEnvOptions: {
    targets: {
      chrome: mode === 'development' ? '74' : '49',
    },
    useBuiltIns: mode === 'development' ? false : 'usage',
  },
  FLAG_ENABLE_LOGGER: true,
};