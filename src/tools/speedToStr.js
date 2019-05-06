const filesize = require('filesize');

function speedToStr(speed) {
  let speedText = null;
  if (speed < 0) {
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