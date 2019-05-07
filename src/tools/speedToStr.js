const filesize = require('filesize');

function speedToStr(speed) {
  let speedText = null;
  if (!Number.isFinite(speed)) {
    speedText = '';
  } else {
    const [size, symbol] = filesize(speed, {
      output: 'array'
    });
    speedText = `${size} ${symbol}/s`;
  }
  return speedText;
}

export default speedToStr;