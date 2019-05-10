const getArgvValue = require('./getArgvValue');
const path = require('path');

const mode = getArgvValue('--mode') || 'development';

const version = require('../src/manifest').version;

const browser = getArgvValue('--BROWSER') || 'Chrome';

let targets = null;
let distName = null;
let outputPath = null;
if (browser === 'Firefox') {
  distName = `uTiny-ff-${version}`;
  outputPath = path.join(__dirname, '../dist/firefox');
  targets = {
    firefox: '48',
  };
} else {
  distName = `uTiny-${version}`;
  outputPath = path.join(__dirname, '../dist/src');
  targets = {
    chrome: mode === 'development' ? '74' : '49',
  };
}

global.BUILD_ENV = {
  distName: distName,
  outputPath: outputPath,
  mode: mode,
  devtool: mode === 'development' ? 'inline-source-map' : 'none',
  version: version,
  browser: browser,
  babelEnvOptions: {
    targets: targets,
    useBuiltIns: mode === 'development' ? false : 'usage',
  },
  FLAG_ENABLE_LOGGER: true,
};